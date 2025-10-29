import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dmyhhbvhbpwwtrmequop.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

interface UserCSV {
  name: string;
  dept: string;
  site: string;
  position: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
}

export async function initializeUsers() {
  console.log('🔄 Initializing users from users.csv...');

  try {
    // Read users.csv
    const csvFile = Bun.file('./users.csv');
    const csvContent = await csvFile.text();

    // Parse CSV (simple parser)
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');

    const users: UserCSV[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const user: any = {};

      headers.forEach((header, index) => {
        user[header.trim()] = values[index]?.trim() || '';
      });

      users.push(user as UserCSV);
    }

    console.log(`📊 Found ${users.length} users in CSV`);

    // Hash the initial password (1234)
    const initialPasswordHash = await Bun.password.hash('1234');

    // Insert users into Supabase
    let inserted = 0;
    let skipped = 0;

    for (const user of users) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (existingUser) {
        skipped++;
        continue;
      }

      // Insert new user
      const { error } = await supabase.from('users').insert({
        email: user.email,
        password_hash: initialPasswordHash,
        name: user.name,
        department: user.dept,
        site: user.site,
        position: user.position,
        phone: user.phone,
        role: user.role,
        is_initial_password: true,
        auto_login: false,
      });

      if (error) {
        console.error(`❌ Failed to insert user ${user.email}:`, error.message);
      } else {
        inserted++;
      }
    }

    console.log(`✅ Users initialized: ${inserted} inserted, ${skipped} skipped`);
    return { inserted, skipped, total: users.length };
  } catch (error: any) {
    console.error('❌ Error initializing users:', error.message);
    throw error;
  }
}
