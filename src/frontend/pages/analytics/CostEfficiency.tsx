import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import type { User, MonthlyCostEfficiency, CostEfficiencySummary } from '../../types';

interface CostEfficiencyProps {
  user: User;
}

export default function CostEfficiency({ user }: CostEfficiencyProps) {
  const [data, setData] = useState<{
    monthly: MonthlyCostEfficiency[];
    summary: CostEfficiencySummary;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 필터 상태
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedUser, setSelectedUser] = useState(user.name);
  const [users, setUsers] = useState<Array<{ id: string; name: string; department: string }>>([]);

  // 사용자 목록 로드 (관리자만)
  useEffect(() => {
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, [user.role]);

  // 통계 데이터 로드
  useEffect(() => {
    fetchStats();
  }, [year, selectedUser]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('crm_token');
      const params = new URLSearchParams({
        year: year.toString(),
        user_name: selectedUser,
      });

      const response = await fetch(`/api/cost-efficiency-stats?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Error fetching cost efficiency stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 연도 선택 옵션 생성 (최근 6년)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  // 금액 포맷팅 (천 단위 쉼표)
  const formatAmount = (amount: number) => {
    return Math.round(amount).toLocaleString('ko-KR');
  };

  return (
    <div className="page-container">
      <h1 className="page-title">원가 투입 효율 관리</h1>
      <p className="page-description">월별 과투입 현황 및 확정 매출을 확인합니다.</p>

      {/* 필터 영역 */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* 관리자일 경우 사용자 선택 */}
          {user.role === 'admin' && users.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-text mb-2">사용자 선택</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="input-field"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 연도 선택 */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-text mb-2">연도</label>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="input-field">
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>

          {/* 새로고침 버튼 */}
          <div>
            <button onClick={fetchStats} className="btn-secondary flex items-center gap-2" disabled={loading}>
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* 로딩 중 */}
      {loading && (
        <div className="card">
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          </div>
        </div>
      )}

      {/* 데이터 테이블 */}
      {!loading && data && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-border">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">월</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">과투입 현황 (원)</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">월별 확정 매출 (원)</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">편차 (원)</th>
              </tr>
            </thead>
            <tbody>
              {data.monthly.map((monthData) => (
                <tr key={monthData.month} className="border-b border-gray-border hover:bg-bg-darker transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-medium">{monthData.month}월</td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-red-500">
                    {formatAmount(monthData.overInvestment)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-white">
                    {formatAmount(monthData.confirmedRevenue)}
                  </td>
                  <td
                    className={`px-4 py-3 text-sm text-right font-mono font-semibold ${
                      monthData.difference < 0 ? 'text-red-500' : 'text-green-500'
                    }`}
                  >
                    {formatAmount(monthData.difference)}
                  </td>
                </tr>
              ))}

              {/* 누계 행 */}
              <tr className="bg-bg-lighter border-t-2 border-primary">
                <td className="px-4 py-4 text-sm text-white font-bold">누계</td>
                <td className="px-4 py-4 text-sm text-right font-mono font-bold text-red-500">
                  {formatAmount(data.summary.totalOverInvestment)}
                </td>
                <td className="px-4 py-4 text-sm text-right font-mono font-bold text-white">
                  {formatAmount(data.summary.totalConfirmedRevenue)}
                </td>
                <td
                  className={`px-4 py-4 text-sm text-right font-mono font-bold ${
                    data.summary.totalDifference < 0 ? 'text-red-500' : 'text-green-500'
                  }`}
                >
                  {formatAmount(data.summary.totalDifference)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 데이터 없음 */}
      {!loading && !error && !data && (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-20 text-gray-text">
            <p className="text-lg mb-2">데이터가 없습니다.</p>
            <p className="text-sm">다른 연도를 선택하거나 새로고침을 시도해주세요.</p>
          </div>
        </div>
      )}
    </div>
  );
}
