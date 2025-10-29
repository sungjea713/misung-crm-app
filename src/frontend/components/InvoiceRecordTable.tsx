import React from 'react';
import { Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { InvoiceRecord } from '../types';

interface InvoiceRecordTableProps {
  records: InvoiceRecord[];
  onEdit: (record: InvoiceRecord) => void;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export function InvoiceRecordTable({ records, onEdit, pagination, onPageChange }: InvoiceRecordTableProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 쉼표 제거 후 숫자 변환
  const parseAmountString = (amountStr: string | undefined | null): number => {
    if (!amountStr) return 0;
    const cleaned = amountStr.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // 숫자를 천 단위 쉼표 형식으로 변환
  const formatNumber = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) return '-';
    if (typeof num === 'string') {
      num = parseAmountString(num);
    }
    return num.toLocaleString('ko-KR');
  };

  if (records.length === 0) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-20 text-gray-text">
          <p className="text-lg mb-2">등록된 계산서 발행 기록이 없습니다.</p>
          <p className="text-sm">"새로 작성" 버튼을 눌러 계산서를 등록하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 테이블 */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-border">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">발행일</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">CMS코드</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">현장명</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">매출금액</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">매입금액</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">차액</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-text">과투입</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">계산서금액</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">작성자</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">등록일시</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">액션</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.id}
                className="border-b border-gray-border hover:bg-bg-darker transition-colors cursor-pointer"
                onClick={() => onEdit(record)}
              >
                <td className="px-4 py-3 text-sm text-white font-medium">{formatDate(record.invoice_date)}</td>
                <td className="px-4 py-3 text-sm text-primary font-medium">{record.cms_code || '-'}</td>
                <td className="px-4 py-3 text-sm text-white max-w-xs truncate">{record.site_name || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-text text-right font-mono">
                  {formatNumber(record.sales_amount)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-text text-right font-mono">
                  {formatNumber(record.purchase_amount)}
                </td>
                <td
                  className={`px-4 py-3 text-sm text-right font-mono font-semibold ${
                    (record.profit_difference || 0) < 0 ? 'text-red-500' : 'text-green-500'
                  }`}
                >
                  {formatNumber(record.profit_difference)}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      record.is_over_invested
                        ? 'bg-red-500/20 text-red-500'
                        : 'bg-green-500/20 text-green-500'
                    }`}
                  >
                    {record.is_over_invested ? '과투입' : '부'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-white text-right font-mono font-semibold">
                  {formatNumber(record.invoice_amount)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-text">
                  {record.users?.name || record.created_by || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-text whitespace-nowrap">
                  {formatDateTime(record.created_at)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(record);
                    }}
                    className="p-2 hover:bg-bg-lighter rounded-lg transition-colors"
                    title="수정"
                  >
                    <Edit2 className="h-4 w-4 text-primary" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-text">
            전체 {pagination.total}건 (페이지 {pagination.page} / {pagination.totalPages})
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
