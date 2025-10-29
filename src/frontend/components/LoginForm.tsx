import React, { useState } from 'react';
import { Mail, Lock, Fingerprint } from 'lucide-react';
import type { LoginCredentials } from '../types';

interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export default function LoginForm({ onLogin, loading, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin({ email, password, auto_login: autoLogin });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-darker p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">로그인</h1>
          <p className="text-gray-text">미성 E&C CRM</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                이메일 주소
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-text" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="example@misung.co.kr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-text" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Auto Login Checkbox */}
            <div className="flex items-center">
              <input
                id="auto-login"
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
                className="h-4 w-4 rounded border-gray-border bg-gray-input text-primary focus:ring-primary focus:ring-offset-0"
                disabled={loading}
              />
              <label htmlFor="auto-login" className="ml-2 block text-sm text-text-secondary">
                <span className="mr-1">🔒</span>
                로그인 정보 저장 (자동 로그인)
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-3">
              {/* Login Button */}
              <button
                type="submit"
                className="w-full btn-primary py-3 text-lg"
                disabled={loading}
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>

              {/* Fingerprint Button (UI only) */}
              <button
                type="button"
                className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
                disabled
              >
                <Fingerprint className="h-5 w-5 text-gray-text" />
                <span className="text-gray-text">지문 인식</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-text">
          <p>초기 비밀번호: 1234</p>
          <p className="mt-1">문의: IT 지원팀</p>
        </div>
      </div>
    </div>
  );
}
