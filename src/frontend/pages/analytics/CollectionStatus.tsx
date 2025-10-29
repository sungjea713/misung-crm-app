import React from 'react';
import { CreditCard } from 'lucide-react';

export default function CollectionStatus() {
  return (
    <div className="page-container">
      <h1 className="page-title">수금 실적 및 미수금 관리 현황</h1>
      <p className="page-description">수금 실적과 미수금 현황을 관리합니다.</p>

      <div className="card">
        <div className="flex flex-col items-center justify-center py-20 text-gray-text">
          <CreditCard className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg mb-2">이 페이지는 준비 중입니다.</p>
          <p className="text-sm">수금 실적 및 미수금 데이터가 곧 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}
