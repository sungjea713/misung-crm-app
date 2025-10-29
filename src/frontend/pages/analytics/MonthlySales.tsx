import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function MonthlySales() {
  return (
    <div className="page-container">
      <h1 className="page-title">월별매출 및 목표달성 현황</h1>
      <p className="page-description">월별 매출 현황과 목표 달성률을 확인합니다.</p>

      <div className="card">
        <div className="flex flex-col items-center justify-center py-20 text-gray-text">
          <TrendingUp className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg mb-2">이 페이지는 준비 중입니다.</p>
          <p className="text-sm">월별매출 및 목표달성 데이터가 곧 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}
