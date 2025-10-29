import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dmyhhbvhbpwwtrmequop.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'jaykim713@gmail.com')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('User data:', data);

  // Test password
  const testPassword = '1234';
  const isValid = await Bun.password.verify(testPassword, data.password_hash);
  console.log('Password "1234" is valid:', isValid);
}

checkUser();
