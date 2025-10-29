import React from 'react';
import { Activity } from 'lucide-react';

export default function ActivityStatus() {
  return (
    <div className="page-container">
      <h1 className="page-title">영업 및 현장 관리 실행 현황</h1>
      <p className="page-description">영업 및 현장 관리 활동 실행 현황을 확인합니다.</p>

      <div className="card">
        <div className="flex flex-col items-center justify-center py-20 text-gray-text">
          <Activity className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg mb-2">이 페이지는 준비 중입니다.</p>
          <p className="text-sm">영업 및 현장 관리 데이터가 곧 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}
