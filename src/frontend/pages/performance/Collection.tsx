import React from 'react';
import { Wallet } from 'lucide-react';

export default function Collection() {
  return (
    <div className="page-container">
      <h1 className="page-title">수금 관리</h1>
      <p className="page-description">수금 내역을 관리하고 미수금을 추적합니다.</p>

      <div className="card">
        <div className="flex flex-col items-center justify-center py-20 text-gray-text">
          <Wallet className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg mb-2">이 페이지는 준비 중입니다.</p>
          <p className="text-sm">수금 관리 기능이 곧 추가됩니다.</p>
        </div>
      </div>
    </div>
  );
}
