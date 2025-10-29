import React from 'react';
import { CalendarDays } from 'lucide-react';

export default function DailyPlan() {
  return (
    <div className="page-container">
      <h1 className="page-title">일일 업무 일지</h1>
      <p className="page-description">일일 업무 내용을 기록하고 관리합니다.</p>

      <div className="card">
        <div className="flex flex-col items-center justify-center py-20 text-gray-text">
          <CalendarDays className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg mb-2">이 페이지는 준비 중입니다.</p>
          <p className="text-sm">일일 업무 일지 기능이 곧 추가됩니다.</p>
        </div>
      </div>
    </div>
  );
}
