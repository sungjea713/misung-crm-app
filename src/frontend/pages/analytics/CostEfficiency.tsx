import React from 'react';
import { DollarSign } from 'lucide-react';

export default function CostEfficiency() {
  return (
    <div className="page-container">
      <h1 className="page-title">원가 투입 효율 관리 실적 및 과투입 관리 현황</h1>
      <p className="page-description">원가 투입 효율과 과투입 관리 현황을 확인합니다.</p>

      <div className="card">
        <div className="flex flex-col items-center justify-center py-20 text-gray-text">
          <DollarSign className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg mb-2">이 페이지는 준비 중입니다.</p>
          <p className="text-sm">원가 투입 효율 데이터가 곧 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}
