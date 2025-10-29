import React from 'react';
import { Users } from 'lucide-react';

export default function SalesActivity() {
  return (
    <div className="page-container">
      <h1 className="page-title">영업 활동</h1>
      <p className="page-description">영업 활동 내역을 기록하고 관리합니다.</p>

      <div className="card">
        <div className="flex flex-col items-center justify-center py-20 text-gray-text">
          <Users className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg mb-2">이 페이지는 준비 중입니다.</p>
          <p className="text-sm">영업 활동 기능이 곧 추가됩니다.</p>
        </div>
      </div>
    </div>
  );
}
