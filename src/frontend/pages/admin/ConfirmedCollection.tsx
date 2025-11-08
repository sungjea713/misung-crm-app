import React from 'react';
import { CheckCircle } from 'lucide-react';
import type { User } from '../../types';

interface ConfirmedCollectionProps {
  user: User;
}

export default function ConfirmedCollection({ user }: ConfirmedCollectionProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <h1 className="text-2xl font-bold text-white">월별 확정 수금</h1>
        </div>
      </div>

      <div className="bg-bg-card rounded-lg border border-gray-border p-12 text-center">
        <CheckCircle className="h-16 w-16 text-gray-text mx-auto mb-4" />
        <p className="text-xl text-gray-text mb-2">이 페이지는 준비 중입니다.</p>
        <p className="text-gray-text">확정 수금 관리 기능이 곧 추가됩니다.</p>
      </div>
    </div>
  );
}
