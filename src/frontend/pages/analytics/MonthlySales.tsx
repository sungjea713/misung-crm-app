import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, DollarSign } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { User, MonthlySalesStats, SalesSummary } from '../../types';

interface MonthlySalesProps {
  user: User;
}

export default function MonthlySales({ user }: MonthlySalesProps) {
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedUserName, setSelectedUserName] = useState<string>(user.name);
  const [users, setUsers] = useState<User[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlySalesStats[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [error, setError] = useState('');

  // 사용자 목록 불러오기 (admin만)
  useEffect(() => {
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, []);

  useEffect(() => {
    fetchSalesStats();
  }, [year, selectedUserName]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSalesStats = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('crm_token');
      const params = new URLSearchParams({
        year: year.toString(),
        user_name: selectedUserName
      });

      const response = await fetch(`/api/sales-stats?${params.toString()}`, {
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
      console.error('Error fetching sales stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 년도 옵션 (현재 년도부터 5년 전까지)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  // 천원 단위로 변환 및 포맷팅
  const formatAmount = (amount: number): string => {
    const inThousands = Math.round(amount / 1000);
    return inThousands.toLocaleString();
  };

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-lighter border border-gray-border rounded-lg p-4 shadow-xl">
          <p className="text-white font-semibold mb-2">{label}월</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatAmount(entry.value)}천원
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 차트 데이터 준비 (천원 단위로 변환)
  const chartData = monthlyData.map((month) => ({
    month: `${month.month}월`,
    확정매출: Math.round(month.revenue / 1000),
    확정매입: Math.round(month.cost / 1000),
    매출이익: Math.round(month.profit / 1000),
  }));

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title mb-2">월별 매출 및 목표달성</h1>
          <p className="page-description">월별 확정 매출, 매입, 이익 현황을 확인합니다.</p>
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
          {user.role === 'admin' && (
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-white mb-2">사용자</label>
              <select
                value={selectedUserName}
                onChange={(e) => setSelectedUserName(e.target.value)}
                className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                {users.length === 0 ? (
                  <option value="" className="bg-bg-darker text-white">
                    로딩 중...
                  </option>
                ) : (
                  users.map((u) => (
                    <option key={u.id} value={u.name} className="bg-bg-darker text-white">
                      {u.name} ({u.department})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* 새로고침 버튼 */}
          <div>
            <button
              onClick={fetchSalesStats}
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
            <p className="text-sm mt-2">매출/매입 데이터가 있으면 통계가 표시됩니다.</p>
          </div>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* 확정 매출 */}
              <div className="card bg-gradient-to-br from-green-500/10 to-bg-lighter border border-green-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <DollarSign size={20} className="text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">확정 매출</h3>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatAmount(summary.revenue)} <span className="text-sm text-gray-text">천원</span>
                </div>
              </div>

              {/* 확정 매입 */}
              <div className="card bg-gradient-to-br from-red-500/10 to-bg-lighter border border-red-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <DollarSign size={20} className="text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">확정 매입</h3>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatAmount(summary.cost)} <span className="text-sm text-gray-text">천원</span>
                </div>
              </div>

              {/* 매출 이익 */}
              <div className="card bg-gradient-to-br from-blue-500/10 to-bg-lighter border border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp size={20} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">매출 이익</h3>
                </div>
                <div className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-white' : 'text-red-400'}`}>
                  {formatAmount(summary.profit)} <span className="text-sm text-gray-text">천원</span>
                </div>
              </div>
            </div>
          )}

          {/* 월별 추이 차트 */}
          {monthlyData.length > 0 && (
            <div className="card mb-6">
              <h3 className="text-xl font-bold text-white mb-6">월별 매출/매입 추이</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    stroke="#9ca3af"
                    style={{ fontSize: '14px', fontWeight: '500' }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    style={{ fontSize: '14px', fontWeight: '500' }}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                    label={{
                      value: '(천원)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: '#9ca3af', fontSize: '12px' },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="확정매출"
                    fill="url(#colorRevenue)"
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                  />
                  <Bar
                    dataKey="확정매입"
                    fill="url(#colorCost)"
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                  />
                  <Line
                    type="monotone"
                    dataKey="매출이익"
                    stroke="#60a5fa"
                    strokeWidth={3}
                    dot={{ fill: '#60a5fa', r: 5 }}
                    activeDot={{ r: 7, stroke: '#60a5fa', strokeWidth: 2 }}
                    animationDuration={1000}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 월별 데이터 테이블 */}
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-6">월별 누계 현황</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-border">
                    <th className="text-left py-3 px-4 text-gray-text font-medium">월</th>
                    <th className="text-right py-3 px-4 text-gray-text font-medium">확정 매출</th>
                    <th className="text-right py-3 px-4 text-gray-text font-medium">확정 매입</th>
                    <th className="text-right py-3 px-4 text-gray-text font-medium">매출 이익</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((month) => (
                    <tr key={month.month} className="border-b border-gray-border hover:bg-bg-lighter transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{month.month}월</td>
                      <td className="py-3 px-4 text-right text-white">
                        {formatAmount(month.revenue)}천원
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {formatAmount(month.cost)}천원
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${month.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatAmount(month.profit)}천원
                      </td>
                    </tr>
                  ))}

                  {/* 누적 합계 */}
                  {summary && (
                    <tr className="border-t-2 border-gray-border bg-bg-darker">
                      <td className="py-3 px-4 text-white font-bold">누적</td>
                      <td className="py-3 px-4 text-right text-white font-bold">
                        {formatAmount(summary.revenue)}천원
                      </td>
                      <td className="py-3 px-4 text-right text-white font-bold">
                        {formatAmount(summary.cost)}천원
                      </td>
                      <td className={`py-3 px-4 text-right font-bold text-lg ${summary.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatAmount(summary.profit)}천원
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
