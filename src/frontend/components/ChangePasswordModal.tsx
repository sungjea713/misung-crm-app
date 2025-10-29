import React, { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import type { ChangePasswordData } from '../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  isInitialPassword?: boolean;
  onClose: () => void;
  onSubmit: (data: ChangePasswordData) => Promise<void>;
  loading?: boolean;
}

export default function ChangePasswordModal({
  isOpen,
  isInitialPassword = false,
  onClose,
  onSubmit,
  loading,
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword === '1234') {
      setError('초기 비밀번호(1234)는 사용할 수 없습니다.');
      return;
    }

    try {
      await onSubmit({ new_password: newPassword, confirm_password: confirmPassword });
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    } catch (err: any) {
      setError(err.message || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleClose = () => {
    if (isInitialPassword) {
      // 초기 비밀번호인 경우 변경 강제 (닫기 불가)
      setError('보안을 위해 비밀번호를 변경해야 합니다.');
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card rounded-lg border border-gray-border w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-border">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-white">
              {isInitialPassword ? '비밀번호 변경 필수' : '비밀번호 변경'}
            </h2>
          </div>
          {!isInitialPassword && (
            <button
              onClick={handleClose}
              className="text-gray-text hover:text-white transition-colors"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Warning for initial password */}
          {isInitialPassword && (
            <div className="bg-yellow-900/20 border border-yellow-500 text-yellow-400 px-4 py-3 rounded flex gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">초기 비밀번호를 사용 중입니다.</p>
                <p className="mt-1">보안을 위해 비밀번호를 변경해주세요.</p>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-text-secondary mb-2">
              새 비밀번호
            </label>
            <input
              id="new-password"
              type="password"
              placeholder="새 비밀번호를 입력하세요"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              required
              disabled={loading}
              minLength={4}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-text-secondary mb-2">
              비밀번호 확인
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              required
              disabled={loading}
              minLength={4}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Password Requirements */}
          <div className="text-sm text-gray-text">
            <p className="font-medium mb-1">비밀번호 요구사항:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>최소 4자 이상</li>
              <li>초기 비밀번호(1234) 사용 불가</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full btn-primary py-3"
            disabled={loading}
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  );
}
