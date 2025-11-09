import React from 'react';
import { Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CollectionRecord } from '../types';

interface CollectionRecordTableProps {
  records: CollectionRecord[];
  onEdit: (record: CollectionRecord) => void;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export function CollectionRecordTable({ records, onEdit, pagination, onPageChange }: CollectionRecordTableProps) {
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

  // 숫자를 천 단위 쉼표 형식으로 변환
  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString('ko-KR');
  };

  if (records.length === 0) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-20 text-gray-text">
          <p className="text-lg mb-2">등록된 수금 기록이 없습니다.</p>
          <p className="text-sm">"새로 작성" 버튼을 눌러 수금을 등록하세요.</p>
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
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">수금일</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">CMS코드</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">현장명</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">수금 금액</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">미수금 잔액</th>
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
                <td className="px-4 py-3 text-sm text-white font-medium">{formatDate(record.collection_date)}</td>
                <td className="px-4 py-3 text-sm text-primary font-medium">{record.cms_code || '-'}</td>
                <td className="px-4 py-3 text-sm text-white max-w-xs truncate">{record.site_name || '-'}</td>
                <td className="px-4 py-3 text-sm text-white text-right font-mono">
                  {formatNumber(record.collection_amount)}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-mono font-semibold ${
                  (record.outstanding_balance || 0) < 0 ? 'text-red-500' : 'text-primary'
                }`}>
                  {formatNumber(record.outstanding_balance)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-text">{record.created_by || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-text">{formatDateTime(record.created_at)}</td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(record);
                    }}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="card">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm text-gray-text">
              총 {pagination.total}건 ({pagination.page}/{pagination.totalPages} 페이지)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg hover:bg-bg-lighter disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      page === pagination.page
                        ? 'bg-primary text-white'
                        : 'text-gray-text hover:bg-bg-lighter'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg hover:bg-bg-lighter disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
