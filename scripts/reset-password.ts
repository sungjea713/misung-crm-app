import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword(email: string) {
  console.log(`🔄 Resetting password for ${email}...`);

  // 1234의 해시 생성
  const newPasswordHash = await Bun.password.hash('1234');

  // 데이터베이스에서 비밀번호 업데이트
  const { error } = await supabase
    .from('users')
    .update({
      password_hash: newPasswordHash,
      is_initial_password: true  // 초기 비밀번호 플래그도 다시 설정
    })
    .eq('email', email);

  if (error) {
    console.error('❌ Failed to reset password:', error);
    return false;
  }

  console.log(`✅ Password reset successfully for ${email}`);
  console.log('📌 New password: 1234');
  console.log('📌 User will be prompted to change password on next login');
  return true;
}

// jaykim713@gmail.com 비밀번호 초기화
resetPassword('jaykim713@gmail.com');