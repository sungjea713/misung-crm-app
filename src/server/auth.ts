import { supabase } from './db/init';

interface LoginRequest {
  email: string;
  password: string;
  auto_login?: boolean;
}

interface ChangePasswordRequest {
  user_id: string;
  new_password: string;
}

// Simple JWT token generation (for demo purposes)
function generateToken(userId: string): string {
  const payload = { userId, timestamp: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export async function handleLogin(request: LoginRequest) {
  try {
    const { email, password, auto_login } = request;

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return {
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      };
    }

    // Verify password
    const isValid = await Bun.password.verify(password, user.password_hash);

    if (!isValid) {
      return {
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      };
    }

    // Update auto_login setting if changed
    if (auto_login !== undefined && auto_login !== user.auto_login) {
      await supabase
        .from('users')
        .update({ auto_login })
        .eq('id', user.id);

      user.auto_login = auto_login;
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token,
      requires_password_change: user.is_initial_password,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
    };
  }
}

export async function handleChangePassword(request: ChangePasswordRequest) {
  try {
    const { user_id, new_password } = request;

    // Validate password
    if (new_password.length < 4) {
      return {
        success: false,
        message: '비밀번호는 최소 4자 이상이어야 합니다.',
      };
    }

    if (new_password === '1234') {
      return {
        success: false,
        message: '초기 비밀번호(1234)는 사용할 수 없습니다.',
      };
    }

    // Hash new password
    const newPasswordHash = await Bun.password.hash(new_password);

    // Update user password
    const { error } = await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        is_initial_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    if (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        message: '비밀번호 변경에 실패했습니다.',
      };
    }

    return {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    };
  } catch (error: any) {
    console.error('Password change error:', error);
    return {
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.',
    };
  }
}

export async function handleGetCurrentUser(token: string) {
  try {
    // Decode token (simple base64 decode)
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    const userId = payload.userId;

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return {
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      };
    }

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
    };
  } catch (error: any) {
    console.error('Get current user error:', error);
    return {
      success: false,
      message: '사용자 정보를 가져오는 중 오류가 발생했습니다.',
    };
  }
}
