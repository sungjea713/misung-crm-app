import React, { useState, useEffect } from 'react';
import { CheckCircle, Save } from 'lucide-react';
import type { User } from '../../types';

interface ConfirmedCollectionProps {
  user: User;
}

interface MonthlyData {
  month: number;
  amount: number;
}

export default function ConfirmedCollection({ user }: ConfirmedCollectionProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize empty data for 12 months
  useEffect(() => {
    const initialData: MonthlyData[] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      amount: 0,
    }));
    setMonthlyData(initialData);
  }, [year]);

  const handleAmountChange = (month: number, value: string) => {
    const amount = value === '' ? 0 : parseInt(value.replace(/,/g, ''));
    setMonthlyData((prev) =>
      prev.map((data) => (data.month === month ? { ...data, amount } : data))
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: API 호출로 데이터 저장
      // const response = await fetch('/api/admin/confirmed-collection', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${localStorage.getItem('crm_token')}`,
      //   },
      //   body: JSON.stringify({ year, data: monthlyData }),
      // });

      setSuccess('저장되었습니다.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  const totalAmount = monthlyData.reduce((sum, data) => sum + data.amount, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <h1 className="text-2xl font-bold text-white">월별 확정 수금</h1>
        </div>
        <p className="text-gray-text">매월 확정된 수금 금액을 입력하세요.</p>
      </div>

      {/* Year Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-text mb-2">연도</label>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="input-field w-48"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-500">
          {success}
        </div>
      )}

      {/* Monthly Data Table */}
      <div className="bg-bg-card rounded-lg border border-gray-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-darker border-b border-gray-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-text uppercase tracking-wider">
                  월
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-text uppercase tracking-wider">
                  확정 수금 (원)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border">
              {monthlyData.map((data) => (
                <tr key={data.month} className="hover:bg-bg-darker">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {data.month}월
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <input
                      type="text"
                      value={data.amount === 0 ? '' : formatNumber(data.amount)}
                      onChange={(e) => handleAmountChange(data.month, e.target.value)}
                      className="input-field text-right w-48"
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="bg-bg-darker font-bold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">합계</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-primary">
                  {formatNumber(totalAmount)} 원
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
