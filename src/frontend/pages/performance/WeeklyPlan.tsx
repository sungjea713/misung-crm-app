import React from 'react';
import { Calendar } from 'lucide-react';

export default function WeeklyPlan() {
  return (
    <div className="page-container">
      <h1 className="page-title">주간 업무 계획 작성</h1>
      <p className="page-description">주간 단위 업무 계획을 작성하고 관리합니다.</p>

      <div className="card">
        <div className="flex flex-col items-center justify-center py-20 text-gray-text">
          <Calendar className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg mb-2">이 페이지는 준비 중입니다.</p>
          <p className="text-sm">주간 업무 계획 기능이 곧 추가됩니다.</p>
        </div>
      </div>
    </div>
  );
}
