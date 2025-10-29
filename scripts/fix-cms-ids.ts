import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCmsIds() {
  console.log('🔍 Finding weekly_plans with null cms_id...\n');

  // cms_id가 null이고 cms_code가 있는 모든 레코드 찾기
  const { data: plans, error: fetchError } = await supabase
    .from('weekly_plans')
    .select('id, cms_code, site_name')
    .is('cms_id', null)
    .not('cms_code', 'is', null);

  if (fetchError) {
    console.error('Error fetching plans:', fetchError);
    return;
  }

  if (!plans || plans.length === 0) {
    console.log('✅ No plans with null cms_id found!');
    return;
  }

  console.log(`Found ${plans.length} plans with null cms_id:\n`);

  let fixed = 0;
  let notFound = 0;

  for (const plan of plans) {
    console.log(`Plan ID ${plan.id}: cms_code="${plan.cms_code}", site_name="${plan.site_name}"`);

    // cms_code로 construction_management에서 찾기
    const { data: sites, error: searchError } = await supabase
      .from('construction_management')
      .select('id, cms, site_name')
      .eq('cms', plan.cms_code);

    if (searchError) {
      console.error(`  ❌ Error searching: ${searchError.message}`);
      continue;
    }

    if (!sites || sites.length === 0) {
      console.log(`  ⚠️  No matching site found in construction_management`);
      notFound++;
      continue;
    }

    if (sites.length > 1) {
      console.log(`  ⚠️  Multiple sites found (${sites.length}), using first one`);
    }

    const matchedSite = sites[0];
    console.log(`  ✅ Found site: ID=${matchedSite.id}, CMS=${matchedSite.cms}, Name=${matchedSite.site_name}`);

    // cms_id 업데이트
    const { error: updateError } = await supabase
      .from('weekly_plans')
      .update({ cms_id: matchedSite.id })
      .eq('id', plan.id);

    if (updateError) {
      console.error(`  ❌ Error updating: ${updateError.message}`);
    } else {
      console.log(`  ✅ Updated cms_id to ${matchedSite.id}`);
      fixed++;
    }

    console.log('');
  }

  console.log('\n📊 Summary:');
  console.log(`   Total plans checked: ${plans.length}`);
  console.log(`   Successfully fixed: ${fixed}`);
  console.log(`   Not found in construction_management: ${notFound}`);
}

fixCmsIds()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
