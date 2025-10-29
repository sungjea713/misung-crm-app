import React from 'react';
import { Target } from 'lucide-react';

export default function OrderAchievement() {
  return (
    <div className="page-container">
      <h1 className="page-title">수주 실적 및 목표 달성률 통합</h1>
      <p className="page-description">수주 실적과 목표 달성률을 통합 관리합니다.</p>

      <div className="card">
        <div className="flex flex-col items-center justify-center py-20 text-gray-text">
          <Target className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg mb-2">이 페이지는 준비 중입니다.</p>
          <p className="text-sm">수주 실적 및 목표달성률 데이터가 곧 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}
