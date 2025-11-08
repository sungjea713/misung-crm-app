import React from 'react';
import { TrendingDown } from 'lucide-react';
import type { User } from '../../types';

interface OutstandingBalanceProps {
  user: User;
}

export default function OutstandingBalance({ user }: OutstandingBalanceProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <TrendingDown className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-bold text-white">월별 미수금 누계</h1>
        </div>
      </div>

      <div className="bg-bg-card rounded-lg border border-gray-border p-12 text-center">
        <TrendingDown className="h-16 w-16 text-gray-text mx-auto mb-4" />
        <p className="text-xl text-gray-text mb-2">이 페이지는 준비 중입니다.</p>
        <p className="text-gray-text">미수금 누계 관리 기능이 곧 추가됩니다.</p>
      </div>
    </div>
  );
}
