import React, { useState, useEffect } from 'react';
import { Target, RefreshCw, TrendingUp } from 'lucide-react';
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
import type { User, MonthlyOrderStats, OrderSummary } from '../../types';

interface OrderAchievementProps {
  user: User;
}

interface OrderStatsData {
  monthly: MonthlyOrderStats[];
  summary: OrderSummary;
}

export default function OrderAchievement({ user }: OrderAchievementProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedUser, setSelectedUser] = useState<string>(user.role === 'admin' ? '' : user.name);
  const [users, setUsers] = useState<User[]>([]);
  const [data, setData] = useState<OrderStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch users for admin
  useEffect(() => {
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, [user.role]);

  // Fetch data when filters change
  useEffect(() => {
    if (selectedUser) {
      fetchOrderStats();
    }
  }, [year, selectedUser]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/sales-activities/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 403) {
        return;
      }

      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
        // Set first user as default
        if (!selectedUser && result.data.length > 0) {
          setSelectedUser(result.data[0].name);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchOrderStats = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('crm_token');
      const params = new URLSearchParams({
        year: year.toString(),
        user_name: selectedUser,
      });

      const response = await fetch(`/api/order-stats?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || '데이터를 불러오지 못했습니다.');
      }

      setData(result.data);
    } catch (err: any) {
      console.error('Error fetching order stats:', err);
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return Math.round(amount).toLocaleString('ko-KR');
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = 2020; y <= currentYear; y++) {
      years.push(y);
    }
    return years;
  };

  const getMonthName = (month: number) => {
    return `${month}월`;
  };

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-lighter border border-gray-border rounded-lg p-4 shadow-xl">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatAmount(entry.value * 1000)}원
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 차트 데이터 준비
  const chartData = data
    ? data.monthly.map((monthData) => ({
        month: `${monthData.month}월`,
        매출확정수주: monthData.salesContribution.order / 1000,
        매출실행: monthData.salesContribution.execution / 1000,
        이익확정수주: monthData.profitContribution.order / 1000,
        이익실행: monthData.profitContribution.execution / 1000,
        총예정이익: monthData.total.profit / 1000,
      }))
    : [];

  if (loading && !data) {
    return (
      <div className="page-container">
        <h1 className="page-title">수주 실적 및 목표 달성률</h1>
        <div className="card">
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">수주 실적 및 목표 달성률</h1>
          <p className="page-description">월별 수주 실적을 확인합니다.</p>
        </div>
        <button
          onClick={fetchOrderStats}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">년도</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="input-field"
            >
              {getYearOptions().map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>

          {user.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-text mb-2">사용자</label>
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
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card bg-red-500/10 border-red-500/20 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {data && (
        <>
          {/* 목표 수주 카드 (첫 번째 행) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 목표 매출 기여 */}
            <div className="card bg-gradient-to-br from-amber-500/10 to-bg-lighter border border-amber-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Target size={20} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">목표 매출 기여</h3>
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {formatAmount(data.summary.targetSalesContribution)} <span className="text-sm text-gray-text">원</span>
              </div>
            </div>

            {/* 목표 이익 기여 */}
            <div className="card bg-gradient-to-br from-amber-500/10 to-bg-lighter border border-amber-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Target size={20} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">목표 이익 기여</h3>
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {formatAmount(data.summary.targetProfitContribution)} <span className="text-sm text-gray-text">원</span>
              </div>
            </div>

            {/* 목표 합계 */}
            <div className="card bg-gradient-to-br from-amber-500/10 to-bg-lighter border border-amber-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Target size={20} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">목표 합계</h3>
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {formatAmount(data.summary.targetTotal)} <span className="text-sm text-gray-text">원</span>
              </div>
            </div>
          </div>

          {/* 실적 카드 (두 번째 행) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* 매출 기여 */}
            <div className="card bg-gradient-to-br from-blue-500/10 to-bg-lighter border border-blue-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp size={20} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">매출 기여</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-text">확정 수주</span>
                  <span className="text-white font-semibold">
                    {formatAmount(data.summary.salesContribution.order)}원
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-text">예정 이익</span>
                  <span className="text-blue-400 font-semibold">
                    {formatAmount(data.summary.salesContribution.profit)}원
                  </span>
                </div>
              </div>
            </div>

            {/* 이익 기여 */}
            <div className="card bg-gradient-to-br from-green-500/10 to-bg-lighter border border-green-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TrendingUp size={20} className="text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">이익 기여</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-text">확정 수주</span>
                  <span className="text-white font-semibold">
                    {formatAmount(data.summary.profitContribution.order)}원
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-text">예정 이익</span>
                  <span className="text-green-400 font-semibold">
                    {formatAmount(data.summary.profitContribution.profit)}원
                  </span>
                </div>
              </div>
            </div>

            {/* 합계 */}
            <div className="card bg-gradient-to-br from-purple-500/10 to-bg-lighter border border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Target size={20} className="text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">합계</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-text">총 확정 수주</span>
                  <span className="text-white font-semibold">
                    {formatAmount(data.summary.total.order)}원
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-text">총 예정 이익</span>
                  <span className="text-purple-400 font-bold text-lg">
                    {formatAmount(data.summary.total.profit)}원
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="card mb-6">
              <h3 className="text-xl font-bold text-white mb-6">월별 수주 실적 추이</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorSalesOrder" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="colorSalesExec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="colorProfitOrder" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="colorProfitExec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3} />
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
                      value: '(원)',
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
                    dataKey="매출확정수주"
                    fill="url(#colorSalesOrder)"
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                  />
                  <Bar
                    dataKey="이익확정수주"
                    fill="url(#colorProfitOrder)"
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                  />
                  <Line
                    type="monotone"
                    dataKey="총예정이익"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{ fill: '#a855f7', r: 5 }}
                    activeDot={{ r: 7, stroke: '#a855f7', strokeWidth: 2 }}
                    animationDuration={1000}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Data Table */}
      {data && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-border">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">월</th>
                <th colSpan={4} className="px-4 py-3 text-center text-sm font-semibold text-blue-400 border-l border-gray-border">
                  매출 기여 (실행율 90%▲)
                </th>
                <th colSpan={4} className="px-4 py-3 text-center text-sm font-semibold text-green-400 border-l border-gray-border">
                  이익 기여 (실행율 90%▼)
                </th>
                <th colSpan={4} className="px-4 py-3 text-center text-sm font-semibold text-purple-400 border-l border-gray-border">
                  합계
                </th>
              </tr>
              <tr className="border-b border-gray-border">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-text"></th>
                <th className="px-4 py-2 text-center text-xs font-medium text-amber-400 border-l border-gray-border">목표 수주</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-text">확정 수주</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-text">실행</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-text">예정 이익</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-amber-400 border-l border-gray-border">목표 수주</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-text">확정 수주</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-text">실행</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-text">예정 이익</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-amber-400 border-l border-gray-border">목표 합계</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-text">확정 수주</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-text">실행</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-text">예정 이익</th>
              </tr>
            </thead>
            <tbody>
              {data.monthly.map((monthData) => (
                <tr key={monthData.month} className="border-b border-gray-border hover:bg-bg-card transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-text">{getMonthName(monthData.month)}</td>

                  {/* 매출 기여 */}
                  <td className="px-4 py-3 text-sm text-right border-l border-gray-border text-amber-400">
                    {formatAmount(monthData.targetSalesContribution)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatAmount(monthData.salesContribution.order)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatAmount(monthData.salesContribution.execution)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatAmount(monthData.salesContribution.profit)}
                  </td>

                  {/* 이익 기여 */}
                  <td className="px-4 py-3 text-sm text-right border-l border-gray-border text-amber-400">
                    {formatAmount(monthData.targetProfitContribution)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatAmount(monthData.profitContribution.order)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatAmount(monthData.profitContribution.execution)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatAmount(monthData.profitContribution.profit)}
                  </td>

                  {/* 합계 */}
                  <td className="px-4 py-3 text-sm text-right border-l border-gray-border text-amber-400 font-semibold">
                    {formatAmount(monthData.targetTotal)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">
                    {formatAmount(monthData.total.order)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">
                    {formatAmount(monthData.total.execution)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">
                    {formatAmount(monthData.total.profit)}
                  </td>
                </tr>
              ))}

              {/* 누계 행 */}
              <tr className="border-t-2 border-gray-border bg-bg-card">
                <td className="px-4 py-3 text-sm font-bold text-gray-text">누계</td>

                {/* 매출 기여 누계 */}
                <td className="px-4 py-3 text-sm text-right font-bold border-l border-gray-border text-amber-400">
                  {formatAmount(data.summary.targetSalesContribution)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold text-blue-400">
                  {formatAmount(data.summary.salesContribution.order)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold text-blue-400">
                  {formatAmount(data.summary.salesContribution.execution)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold text-blue-400">
                  {formatAmount(data.summary.salesContribution.profit)}
                </td>

                {/* 이익 기여 누계 */}
                <td className="px-4 py-3 text-sm text-right font-bold border-l border-gray-border text-amber-400">
                  {formatAmount(data.summary.targetProfitContribution)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold text-green-400">
                  {formatAmount(data.summary.profitContribution.order)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold text-green-400">
                  {formatAmount(data.summary.profitContribution.execution)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold text-green-400">
                  {formatAmount(data.summary.profitContribution.profit)}
                </td>

                {/* 합계 누계 */}
                <td className="px-4 py-3 text-sm text-right font-bold border-l border-gray-border text-amber-400">
                  {formatAmount(data.summary.targetTotal)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold text-purple-400">
                  {formatAmount(data.summary.total.order)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold text-purple-400">
                  {formatAmount(data.summary.total.execution)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold text-purple-400">
                  {formatAmount(data.summary.total.profit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
