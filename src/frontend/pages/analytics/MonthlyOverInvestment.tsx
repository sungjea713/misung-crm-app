import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, FileSpreadsheet, Trash2, Edit } from 'lucide-react';
import MonthlyOverInvestmentUpload from '../../components/MonthlyOverInvestmentUpload';
import type { User, MonthlyOverInvestmentRow, MonthlyOverInvestment } from '../../types';

interface MonthlyOverInvestmentPageProps {
  user: User;
}

export default function MonthlyOverInvestmentPage({ user }: MonthlyOverInvestmentPageProps) {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [error, setError] = useState('');
  const [data, setData] = useState<MonthlyOverInvestment[]>([]);
  const [editingYear, setEditingYear] = useState<number | null>(null);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);

  // 필터 상태
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // 연도 옵션 (2020년부터 현재 연도까지)
  const yearOptions = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchData();
    }
  }, [year, month, viewMode]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('crm_token');
      const params = new URLSearchParams({
        year: year.toString(),
        month: month.toString(),
      });

      const response = await fetch(`/api/monthly-over-investment?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setData(result.data || []);
      } else {
        setError(result.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewForm = () => {
    setEditingYear(year);
    setEditingMonth(month);
    setViewMode('form');
  };

  const handleDataParsed = async (parsedData: MonthlyOverInvestmentRow[]) => {
    if (!editingYear || !editingMonth) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/monthly-over-investment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          year: editingYear,
          month: editingMonth,
          rows: parsedData,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setViewMode('list');
        setEditingYear(null);
        setEditingMonth(null);
        await fetchData();
      } else {
        setError(result.message || '저장에 실패했습니다.');
      }
    } catch (error: any) {
      setError('저장에 실패했습니다.');
      console.error('Error saving data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingYear(null);
    setEditingMonth(null);
  };

  const handleDelete = async () => {
    if (!confirm(`${year}년 ${month}월 데이터를 삭제하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('crm_token');
      const params = new URLSearchParams({
        year: year.toString(),
        month: month.toString(),
      });

      const response = await fetch(`/api/monthly-over-investment?${params}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        await fetchData();
      } else {
        setError(result.message || '삭제에 실패했습니다.');
      }
    } catch (error: any) {
      setError('삭제에 실패했습니다.');
      console.error('Error deleting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return Math.round(amount).toLocaleString('ko-KR');
  };

  // 합계 계산
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="page-container">
      {viewMode === 'list' ? (
        <>
          <div className="mb-6">
            <h1 className="page-title mb-2">월별 과투입 현황</h1>
            <p className="page-description">월별 과투입 현황을 관리합니다.</p>
          </div>

          {/* 필터 및 액션 영역 */}
          <div className="card mb-6">
            <div className="flex flex-wrap items-end gap-4">
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

              {/* 월 선택 */}
              <div className="w-32">
                <label className="block text-sm font-medium text-white mb-2">월</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} className="bg-bg-darker text-white">
                      {m}월
                    </option>
                  ))}
                </select>
              </div>

              {/* 새로고침 버튼 */}
              <div>
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="btn-secondary flex items-center space-x-2 h-[42px]"
                >
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                  <span>새로고침</span>
                </button>
              </div>

              {/* 새로 작성 버튼 (관리자만) */}
              {user.role === 'admin' && (
                <div className="ml-auto">
                  <button
                    onClick={handleNewForm}
                    className="btn-primary flex items-center space-x-2 h-[42px]"
                  >
                    <Plus size={20} />
                    <span>새로 작성</span>
                  </button>
                </div>
              )}
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
          ) : data.length === 0 ? (
            <div className="card">
              <div className="flex flex-col items-center justify-center py-20 text-gray-text">
                <FileSpreadsheet size={48} className="mb-4 opacity-50" />
                <p className="text-lg mb-2">등록된 데이터가 없습니다</p>
                <p className="text-sm">새로 작성 버튼을 눌러 데이터를 등록하세요.</p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  {year}년 {month}월 과투입 현황
                </h2>
                {user.role === 'admin' && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleNewForm}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Edit size={18} />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="btn-danger flex items-center space-x-2"
                    >
                      <Trash2 size={18} />
                      <span>삭제</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-border">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">번호</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">담당자</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">금액 (원)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => (
                      <tr key={row.id} className="border-b border-gray-border hover:bg-bg-lighter transition-colors">
                        <td className="px-4 py-3 text-sm text-white">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-white">{row.manager_name}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-white">
                          {formatAmount(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-bg-lighter border-t-2 border-primary">
                      <td colSpan={2} className="px-4 py-4 text-sm text-white font-bold">합계</td>
                      <td className="px-4 py-4 text-sm text-right font-mono font-bold text-white">
                        {formatAmount(total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <MonthlyOverInvestmentUpload
          year={editingYear!}
          month={editingMonth!}
          onDataParsed={handleDataParsed}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
