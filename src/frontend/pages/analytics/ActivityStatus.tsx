import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Building2, MapPin, Wrench } from 'lucide-react';
import type { User, MonthlyActivityStats, ActivitySummary } from '../../types';

interface ActivityStatusProps {
  user: User;
}

export default function ActivityStatus({ user }: ActivityStatusProps) {
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<string>(user.id);
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string>(''); // For multi-branch users
  const [selectedBranch, setSelectedBranch] = useState<'all' | '본점' | '인천'>('all'); // For multi-branch users filtering their own data
  const [users, setUsers] = useState<any[]>([]); // Changed to any[] to accommodate expanded structure
  const [monthlyData, setMonthlyData] = useState<MonthlyActivityStats[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [error, setError] = useState('');

  // Check if current user is multi-branch
  const isMultiBranchUser = user.name === '송기정' || user.name === '김태현';

  // 사용자 목록 불러오기 (admin만)
  useEffect(() => {
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, []);

  useEffect(() => {
    fetchActivityStats();
  }, [year, selectedUserId, selectedCreatedBy, selectedBranch]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setUsers(data.data);
        // Set first user as default if admin and no user selected
        if (user.role === 'admin' && !selectedUserId && !selectedCreatedBy && data.data.length > 0) {
          const firstUser = data.data[0];
          setSelectedUserId(firstUser.id);
          if (firstUser.created_by) {
            setSelectedCreatedBy(firstUser.created_by);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchActivityStats = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('crm_token');
      const params = new URLSearchParams({ year: year.toString() });

      // Admin: use selectedCreatedBy if set, otherwise selectedUserId
      // Multi-branch user (non-admin): filter by branch selection
      // Regular user: filter by user_id
      if (user.role === 'admin') {
        if (selectedCreatedBy) {
          params.append('created_by', selectedCreatedBy);
        } else if (selectedUserId) {
          params.append('user_id', selectedUserId);
        }
      } else if (isMultiBranchUser && selectedBranch !== 'all') {
        // Multi-branch user filtering their own data by branch
        const createdByValue = selectedBranch === '인천' ? `${user.name}(In)` : user.name;
        params.append('created_by', createdByValue);
      } else {
        // Regular user or multi-branch user viewing all branches
        params.append('user_id', user.id);
      }

      const response = await fetch(`/api/activity-stats?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success && data.data) {
        setMonthlyData(data.data.monthly);
        setSummary(data.data.summary);
      } else {
        setError(data.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Error fetching activity stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 년도 옵션 (현재 년도부터 5년 전까지)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  // 최대값 계산 (차트 스케일링용)
  const maxValue = Math.max(
    ...monthlyData.flatMap((m) => [
      m.plan.construction,
      m.plan.additional,
      m.plan.support,
      m.actual.construction,
      m.actual.additional,
      m.actual.support,
    ]),
    10 // 최소 10으로 설정
  );

  // 달성률 색상
  const getAchievementColor = (rate: number) => {
    if (rate >= 100) return 'text-green-400';
    if (rate >= 80) return 'text-blue-400';
    if (rate >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // 달성률 배경 색상
  const getAchievementBgColor = (rate: number) => {
    if (rate >= 100) return 'bg-green-500 bg-opacity-20';
    if (rate >= 80) return 'bg-blue-500 bg-opacity-20';
    if (rate >= 60) return 'bg-yellow-500 bg-opacity-20';
    return 'bg-red-500 bg-opacity-20';
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title mb-2">영업/현장관리 실행 현황</h1>
          <p className="page-description">주간 계획 대비 일일 실행 현황을 확인합니다.</p>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="card mb-6">
        <div className="flex items-end gap-4">
          {/* 년도 선택 */}
          <div className="w-40">
            <label className="block text-sm font-medium text-white mb-2">년도</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y} className="bg-bg-darker text-white">
                  {y}년
                </option>
              ))}
            </select>
          </div>

          {/* 사용자 선택 (admin만) */}
          {user.role === 'admin' && users.length > 0 && (
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-white mb-2">사용자</label>
              <select
                value={selectedCreatedBy || selectedUserId}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  const selectedUserData = users.find(u =>
                    u.created_by ? u.created_by === selectedValue : u.id === selectedValue
                  );

                  if (selectedUserData) {
                    setSelectedUserId(selectedUserData.id);
                    setSelectedCreatedBy(selectedUserData.created_by || '');
                  }
                }}
                className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                {users.map((u, index) => (
                  <option key={`${u.id}-${index}`} value={u.created_by || u.id} className="bg-bg-darker text-white">
                    {u.display_name || `${u.name} (${u.department})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 다중 지점 사용자: 지점 선택 */}
          {user.role !== 'admin' && isMultiBranchUser && (
            <div className="w-40">
              <label className="block text-sm font-medium text-white mb-2">지점</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value as 'all' | '본점' | '인천')}
                className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="all" className="bg-bg-darker text-white">전체</option>
                <option value="본점" className="bg-bg-darker text-white">본점</option>
                <option value="인천" className="bg-bg-darker text-white">인천</option>
              </select>
            </div>
          )}

          {/* 새로고침 버튼 */}
          <div>
            <button
              onClick={fetchActivityStats}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2 h-[42px]"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              <span>새로고침</span>
            </button>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-20 text-gray-text">
            <RefreshCw size={48} className="animate-spin mb-4 opacity-50" />
            <p className="text-lg">데이터를 불러오는 중...</p>
          </div>
        </div>
      ) : monthlyData.length === 0 ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-20 text-gray-text">
            <TrendingUp size={48} className="mb-4 opacity-50" />
            <p className="text-lg">데이터가 없습니다.</p>
            <p className="text-sm mt-2">주간 계획과 일일 업무를 작성하면 통계가 표시됩니다.</p>
          </div>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* 건설사 영업 */}
              <div className="card bg-gradient-to-br from-blue-500/10 to-bg-lighter border border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Building2 size={20} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">건설사 영업</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-text">계획</span>
                    <span className="text-white font-medium">{summary.plan.construction}건</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-text">실행</span>
                    <span className="text-white font-medium">{summary.actual.construction}건</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-border">
                    <span className="text-gray-text">달성률</span>
                    <span className={`font-bold ${getAchievementColor(summary.achievement.construction)}`}>
                      {summary.achievement.construction}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 현장 추가 영업 */}
              <div className="card bg-gradient-to-br from-purple-500/10 to-bg-lighter border border-purple-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <MapPin size={20} className="text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">현장 추가 영업</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-text">계획</span>
                    <span className="text-white font-medium">{summary.plan.additional}건</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-text">실행</span>
                    <span className="text-white font-medium">{summary.actual.additional}건</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-border">
                    <span className="text-gray-text">달성률</span>
                    <span className={`font-bold ${getAchievementColor(summary.achievement.additional)}`}>
                      {summary.achievement.additional}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 현장 지원 */}
              <div className="card bg-gradient-to-br from-green-500/10 to-bg-lighter border border-green-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Wrench size={20} className="text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">현장 지원</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-text">계획</span>
                    <span className="text-white font-medium">{summary.plan.support}건</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-text">실행</span>
                    <span className="text-white font-medium">{summary.actual.support}건</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-border">
                    <span className="text-gray-text">달성률</span>
                    <span className={`font-bold ${getAchievementColor(summary.achievement.support)}`}>
                      {summary.achievement.support}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 월별 차트 */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">월별 활동 현황</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"></div>
                  <span className="text-gray-text">계획</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500"></div>
                  <span className="text-gray-text">실행</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[900px] space-y-6">
                {monthlyData.map((month, index) => (
                  <div
                    key={`${month.year}-${month.month}`}
                    className="group"
                  >
                    {/* 월 헤더 */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                          <span className="text-sm font-bold text-primary">{month.month}</span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-text">
                            계획 {month.plan.total}건 / 실행 {month.actual.total}건
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-darker">
                        <span className="text-xs text-gray-text">달성률</span>
                        <span className={`text-lg font-bold ${getAchievementColor(month.achievement.total)}`}>
                          {month.achievement.total}%
                        </span>
                      </div>
                    </div>

                    {/* 차트 바들 */}
                    <div className="space-y-4 pl-2">
                      {/* 건설사 영업 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 w-36">
                            <Building2 size={16} className="text-blue-400" />
                            <span className="text-sm font-medium text-white">건설사 영업</span>
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            {/* 계획 */}
                            <div className="relative">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-blue-400">계획</span>
                                <span className="text-xs text-gray-text">{month.plan.construction}건</span>
                              </div>
                              <div className="h-7 bg-bg-darker rounded-lg overflow-hidden border border-gray-border/30">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-700 ease-out flex items-center justify-end px-2 shadow-lg shadow-blue-500/20"
                                  style={{
                                    width: `${month.plan.construction > 0 ? Math.max((month.plan.construction / maxValue) * 100, 8) : 0}%`
                                  }}
                                >
                                  {month.plan.construction > 0 && (
                                    <span className="text-xs font-bold text-white drop-shadow-lg">
                                      {month.plan.construction}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* 실행 */}
                            <div className="relative">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-emerald-400">실행</span>
                                <span className="text-xs text-gray-text">{month.actual.construction}건</span>
                              </div>
                              <div className="h-7 bg-bg-darker rounded-lg overflow-hidden border border-gray-border/30">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-700 ease-out flex items-center justify-end px-2 shadow-lg shadow-emerald-500/20"
                                  style={{
                                    width: `${month.actual.construction > 0 ? Math.max((month.actual.construction / maxValue) * 100, 8) : 0}%`
                                  }}
                                >
                                  {month.actual.construction > 0 && (
                                    <span className="text-xs font-bold text-white drop-shadow-lg">
                                      {month.actual.construction}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className={`text-sm font-bold w-16 text-right ml-3 ${getAchievementColor(month.achievement.construction)}`}>
                            {month.achievement.construction}%
                          </span>
                        </div>
                      </div>

                      {/* 현장 추가 영업 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 w-36">
                            <MapPin size={16} className="text-purple-400" />
                            <span className="text-sm font-medium text-white">현장 추가 영업</span>
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            {/* 계획 */}
                            <div className="relative">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-purple-400">계획</span>
                                <span className="text-xs text-gray-text">{month.plan.additional}건</span>
                              </div>
                              <div className="h-7 bg-bg-darker rounded-lg overflow-hidden border border-gray-border/30">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700 ease-out flex items-center justify-end px-2 shadow-lg shadow-purple-500/20"
                                  style={{
                                    width: `${month.plan.additional > 0 ? Math.max((month.plan.additional / maxValue) * 100, 8) : 0}%`
                                  }}
                                >
                                  {month.plan.additional > 0 && (
                                    <span className="text-xs font-bold text-white drop-shadow-lg">
                                      {month.plan.additional}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* 실행 */}
                            <div className="relative">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-emerald-400">실행</span>
                                <span className="text-xs text-gray-text">{month.actual.additional}건</span>
                              </div>
                              <div className="h-7 bg-bg-darker rounded-lg overflow-hidden border border-gray-border/30">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-700 ease-out flex items-center justify-end px-2 shadow-lg shadow-emerald-500/20"
                                  style={{
                                    width: `${month.actual.additional > 0 ? Math.max((month.actual.additional / maxValue) * 100, 8) : 0}%`
                                  }}
                                >
                                  {month.actual.additional > 0 && (
                                    <span className="text-xs font-bold text-white drop-shadow-lg">
                                      {month.actual.additional}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className={`text-sm font-bold w-16 text-right ml-3 ${getAchievementColor(month.achievement.additional)}`}>
                            {month.achievement.additional}%
                          </span>
                        </div>
                      </div>

                      {/* 현장 지원 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 w-36">
                            <Wrench size={16} className="text-orange-400" />
                            <span className="text-sm font-medium text-white">현장 지원</span>
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            {/* 계획 */}
                            <div className="relative">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-orange-400">계획</span>
                                <span className="text-xs text-gray-text">{month.plan.support}건</span>
                              </div>
                              <div className="h-7 bg-bg-darker rounded-lg overflow-hidden border border-gray-border/30">
                                <div
                                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-700 ease-out flex items-center justify-end px-2 shadow-lg shadow-orange-500/20"
                                  style={{
                                    width: `${month.plan.support > 0 ? Math.max((month.plan.support / maxValue) * 100, 8) : 0}%`
                                  }}
                                >
                                  {month.plan.support > 0 && (
                                    <span className="text-xs font-bold text-white drop-shadow-lg">
                                      {month.plan.support}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* 실행 */}
                            <div className="relative">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-emerald-400">실행</span>
                                <span className="text-xs text-gray-text">{month.actual.support}건</span>
                              </div>
                              <div className="h-7 bg-bg-darker rounded-lg overflow-hidden border border-gray-border/30">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-700 ease-out flex items-center justify-end px-2 shadow-lg shadow-emerald-500/20"
                                  style={{
                                    width: `${month.actual.support > 0 ? Math.max((month.actual.support / maxValue) * 100, 8) : 0}%`
                                  }}
                                >
                                  {month.actual.support > 0 && (
                                    <span className="text-xs font-bold text-white drop-shadow-lg">
                                      {month.actual.support}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className={`text-sm font-bold w-16 text-right ml-3 ${getAchievementColor(month.achievement.support)}`}>
                            {month.achievement.support}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 구분선 */}
                    {index !== monthlyData.length - 1 && (
                      <div className="mt-6 border-t border-gray-border/30"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 월별 누계 현황 */}
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-6">월별 누계 현황</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 좌측: 계획 테이블 */}
              <div>
                <h4 className="text-lg font-semibold text-blue-400 mb-3">계획</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-border">
                        <th className="text-left py-3 px-4 text-gray-text font-medium">월</th>
                        <th className="text-right py-3 px-4 text-gray-text font-medium">건설사 영업</th>
                        <th className="text-right py-3 px-4 text-gray-text font-medium">현장 추가</th>
                        <th className="text-right py-3 px-4 text-gray-text font-medium">현장 지원</th>
                        <th className="text-right py-3 px-4 text-gray-text font-medium">합계</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((month) => (
                        <tr key={`plan-${month.year}-${month.month}`} className="border-b border-gray-border hover:bg-bg-lighter transition-colors">
                          <td className="py-3 px-4 text-white font-medium">{month.month}월</td>
                          <td className="py-3 px-4 text-right text-white">{month.plan.construction}건</td>
                          <td className="py-3 px-4 text-right text-white">{month.plan.additional}건</td>
                          <td className="py-3 px-4 text-right text-white">{month.plan.support}건</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">{month.plan.total}건</td>
                        </tr>
                      ))}
                      {/* 누적 계획 */}
                      {summary && (
                        <tr className="border-t-2 border-gray-border bg-bg-darker">
                          <td className="py-3 px-4 text-white font-bold">누적</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">{summary.plan.construction}건</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">{summary.plan.additional}건</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">{summary.plan.support}건</td>
                          <td className="py-3 px-4 text-right text-white font-bold">{summary.plan.total}건</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 달성률 (좌측 하단) - 도넛 그래프 */}
                {summary && (
                  <div className="mt-4 p-4 bg-bg-darker rounded-lg">
                    <h5 className="text-sm font-semibold text-yellow-400 mb-4">달성률</h5>
                    <div className="grid grid-cols-2 gap-6">
                      {/* 좌측: 도넛 그래프들 */}
                      <div className="space-y-4">
                        {/* 건설사 영업 도넛 */}
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              {/* 배경 원 */}
                              <circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-gray-700"
                              />
                              {/* 진행률 원 */}
                              <circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${Math.min(summary.achievement.construction, 100)} 100`}
                                className={summary.achievement.construction >= 100 ? 'text-green-400' : summary.achievement.construction >= 80 ? 'text-blue-400' : summary.achievement.construction >= 60 ? 'text-yellow-400' : 'text-red-400'}
                                strokeLinecap="round"
                              />
                            </svg>
                            {/* 중앙 텍스트 */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-xs font-bold ${getAchievementColor(summary.achievement.construction)}`}>
                                {summary.achievement.construction}%
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-text">건설사 영업</div>
                            <div className="text-xs text-gray-text mt-1">
                              {summary.actual.construction} / {summary.plan.construction}건
                            </div>
                          </div>
                        </div>

                        {/* 현장 추가 영업 도넛 */}
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-gray-700"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${Math.min(summary.achievement.additional, 100)} 100`}
                                className={summary.achievement.additional >= 100 ? 'text-green-400' : summary.achievement.additional >= 80 ? 'text-blue-400' : summary.achievement.additional >= 60 ? 'text-yellow-400' : 'text-red-400'}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-xs font-bold ${getAchievementColor(summary.achievement.additional)}`}>
                                {summary.achievement.additional}%
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-text">현장 추가 영업</div>
                            <div className="text-xs text-gray-text mt-1">
                              {summary.actual.additional} / {summary.plan.additional}건
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 우측: 도넛 그래프들 */}
                      <div className="space-y-4">
                        {/* 현장 지원 도넛 */}
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-gray-700"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${Math.min(summary.achievement.support, 100)} 100`}
                                className={summary.achievement.support >= 100 ? 'text-green-400' : summary.achievement.support >= 80 ? 'text-blue-400' : summary.achievement.support >= 60 ? 'text-yellow-400' : 'text-red-400'}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-xs font-bold ${getAchievementColor(summary.achievement.support)}`}>
                                {summary.achievement.support}%
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-text">현장 지원</div>
                            <div className="text-xs text-gray-text mt-1">
                              {summary.actual.support} / {summary.plan.support}건
                            </div>
                          </div>
                        </div>

                        {/* 전체 달성률 도넛 (큰 사이즈) */}
                        <div className="flex items-center gap-3 pt-2 border-t border-gray-border">
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-gray-700"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray={`${Math.min(summary.achievement.total, 100)} 100`}
                                className={summary.achievement.total >= 100 ? 'text-green-400' : summary.achievement.total >= 80 ? 'text-blue-400' : summary.achievement.total >= 60 ? 'text-yellow-400' : 'text-red-400'}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-sm font-bold ${getAchievementColor(summary.achievement.total)}`}>
                                {summary.achievement.total}%
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-white">전체 달성률</div>
                            <div className="text-xs text-gray-text mt-1">
                              {summary.actual.total} / {summary.plan.total}건
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 우측: 실행 테이블 */}
              <div>
                <h4 className="text-lg font-semibold text-green-400 mb-3">실행</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-border">
                        <th className="text-left py-3 px-4 text-gray-text font-medium">월</th>
                        <th className="text-right py-3 px-4 text-gray-text font-medium">건설사 영업</th>
                        <th className="text-right py-3 px-4 text-gray-text font-medium">현장 추가</th>
                        <th className="text-right py-3 px-4 text-gray-text font-medium">현장 지원</th>
                        <th className="text-right py-3 px-4 text-gray-text font-medium">합계</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((month) => (
                        <tr key={`actual-${month.year}-${month.month}`} className="border-b border-gray-border hover:bg-bg-lighter transition-colors">
                          <td className="py-3 px-4 text-white font-medium">{month.month}월</td>
                          <td className="py-3 px-4 text-right text-white">{month.actual.construction}건</td>
                          <td className="py-3 px-4 text-right text-white">{month.actual.additional}건</td>
                          <td className="py-3 px-4 text-right text-white">{month.actual.support}건</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">{month.actual.total}건</td>
                        </tr>
                      ))}
                      {/* 누적 실행 */}
                      {summary && (
                        <tr className="border-t-2 border-gray-border bg-bg-darker">
                          <td className="py-3 px-4 text-white font-bold">누적</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">{summary.actual.construction}건</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">{summary.actual.additional}건</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">{summary.actual.support}건</td>
                          <td className="py-3 px-4 text-right text-white font-bold">{summary.actual.total}건</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
