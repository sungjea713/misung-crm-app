import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fillMissingSiteInfo() {
  console.log('🔍 Finding weekly_plans with missing site information...\n');

  // cms_code는 있지만 site_name이나 다른 정보가 비어있는 레코드 찾기
  const { data: plans, error: fetchError } = await supabase
    .from('weekly_plans')
    .select('id, cms_id, cms_code, site_name, site_address, sales_manager, construction_manager')
    .not('cms_code', 'is', null);

  if (fetchError) {
    console.error('Error fetching plans:', fetchError);
    return;
  }

  if (!plans || plans.length === 0) {
    console.log('✅ No plans found!');
    return;
  }

  console.log(`Found ${plans.length} plans with cms_code. Checking for missing info...\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const plan of plans) {
    // 정보가 비어있는지 확인
    const hasMissingInfo = !plan.site_name || !plan.site_address || !plan.sales_manager || !plan.construction_manager;

    if (!hasMissingInfo && plan.cms_id) {
      skipped++;
      continue;
    }

    console.log(`Plan ID ${plan.id}: cms_code="${plan.cms_code}"`);
    console.log(`  Current: site_name="${plan.site_name || '(empty)'}", cms_id=${plan.cms_id || 'null'}`);

    // cms_code로 construction_management에서 찾기
    const { data: sites, error: searchError } = await supabase
      .from('construction_management')
      .select('id, cms, site_name, site_address, sales_manager, construction_manager')
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
    console.log(`  ✅ Found site: ID=${matchedSite.id}, Name=${matchedSite.site_name}`);

    // 업데이트할 데이터 준비 (기존 값이 없는 경우만 채움)
    const updateData: any = {};

    if (!plan.cms_id) {
      updateData.cms_id = matchedSite.id;
    }
    if (!plan.site_name) {
      updateData.site_name = matchedSite.site_name;
    }
    if (!plan.site_address) {
      updateData.site_address = matchedSite.site_address;
    }
    if (!plan.sales_manager) {
      updateData.sales_manager = matchedSite.sales_manager;
    }
    if (!plan.construction_manager) {
      updateData.construction_manager = matchedSite.construction_manager;
    }

    if (Object.keys(updateData).length === 0) {
      console.log(`  ℹ️  No updates needed`);
      skipped++;
      continue;
    }

    // 업데이트
    const { error: updateError } = await supabase
      .from('weekly_plans')
      .update(updateData)
      .eq('id', plan.id);

    if (updateError) {
      console.error(`  ❌ Error updating: ${updateError.message}`);
    } else {
      console.log(`  ✅ Updated: ${Object.keys(updateData).join(', ')}`);
      updated++;
    }

    console.log('');
  }

  console.log('\n📊 Summary:');
  console.log(`   Total plans checked: ${plans.length}`);
  console.log(`   Successfully updated: ${updated}`);
  console.log(`   Skipped (no updates needed): ${skipped}`);
  console.log(`   Not found in construction_management: ${notFound}`);
}

fillMissingSiteInfo()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
