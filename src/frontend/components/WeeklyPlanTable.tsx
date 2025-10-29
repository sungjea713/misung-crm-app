import React from 'react';
import { Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { WeeklyPlan } from '../types';

interface WeeklyPlanTableProps {
  plans: WeeklyPlan[];
  onEdit: (plan: WeeklyPlan) => void;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export function WeeklyPlanTable({ plans, onEdit, pagination, onPageChange }: WeeklyPlanTableProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityBadges = (plan: WeeklyPlan) => {
    const activities = [];
    if (plan.activity_construction_sales) activities.push('건설사 영업');
    if (plan.activity_site_additional_sales) activities.push('현장 추가 영업');
    if (plan.activity_site_support) activities.push('현장 지원');
    return activities;
  };

  if (plans.length === 0) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-20 text-gray-text">
          <p className="text-lg mb-2">등록된 주간 계획이 없습니다.</p>
          <p className="text-sm">"새로 작성" 버튼을 눌러 계획을 등록하세요.</p>
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
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">CMS코드</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">현장명</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">현장주소</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">영업담당</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">시공담당</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">활동구분</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">생성날짜</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">수정날짜</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">액션</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr
                key={plan.id}
                className="border-b border-gray-border hover:bg-bg-darker transition-colors cursor-pointer"
                onClick={() => onEdit(plan)}
              >
                <td className="px-4 py-3 text-sm text-primary font-medium">
                  {plan.cms_code || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-white">
                  {plan.site_name || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-text max-w-xs truncate">
                  {plan.site_address || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-text">
                  {plan.sales_manager || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-text">
                  {plan.construction_manager || '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {getActivityBadges(plan).map((activity) => (
                      <span
                        key={activity}
                        className="px-2 py-1 bg-primary bg-opacity-20 text-primary text-xs rounded"
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-text">
                  {formatDate(plan.created_at)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-text">
                  {formatDate(plan.updated_at)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(plan);
                    }}
                    className="p-2 hover:bg-gray-border rounded transition-colors"
                    title="수정"
                  >
                    <Edit2 size={16} className="text-primary" />
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
            총 {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded hover:bg-gray-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>

            {/* 페이지 번호 */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // 현재 페이지 주변 5개만 표시
                  return (
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= pagination.page - 2 && page <= pagination.page + 2)
                  );
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-text">...</span>
                    )}
                    <button
                      onClick={() => onPageChange(page)}
                      className={`px-3 py-1 rounded transition-colors ${
                        page === pagination.page
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-border text-gray-text'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>

            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded hover:bg-gray-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}