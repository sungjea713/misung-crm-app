import React from 'react';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import type { User } from '../types';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  return (
    <div className="page-container">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="page-title">안녕하세요, {user.name}님</h1>
        <p className="page-description">
          {user.department} · {user.position}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-text text-sm mb-1">월별 매출</p>
              <p className="text-2xl font-bold text-white">준비중</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-text text-sm mb-1">목표 달성률</p>
              <p className="text-2xl font-bold text-white">준비중</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-text text-sm mb-1">영업 활동</p>
              <p className="text-2xl font-bold text-white">준비중</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-text text-sm mb-1">수금 현황</p>
              <p className="text-2xl font-bold text-white">준비중</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">최근 활동</h2>
          <div className="text-center py-12 text-gray-text">
            <p>데이터가 없습니다.</p>
            <p className="text-sm mt-2">실적 입력 후 확인할 수 있습니다.</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">빠른 메뉴</h2>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 bg-bg-darker hover:bg-gray-border rounded transition-colors text-text-secondary hover:text-white">
              일일 업무 계획 작성
            </button>
            <button className="w-full text-left px-4 py-3 bg-bg-darker hover:bg-gray-border rounded transition-colors text-text-secondary hover:text-white">
              영업 활동 입력
            </button>
            <button className="w-full text-left px-4 py-3 bg-bg-darker hover:bg-gray-border rounded transition-colors text-text-secondary hover:text-white">
              수금 관리
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
