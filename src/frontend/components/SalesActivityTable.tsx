import React from 'react';
import { Edit2, Trash2, Image as ImageIcon, FileText } from 'lucide-react';
import type { SalesActivity, User } from '../types';

interface SalesActivityTableProps {
  activities: SalesActivity[];
  user: User;
  onEdit: (activity: SalesActivity) => void;
  onDelete: (id: number) => void;
}

export function SalesActivityTable({ activities, user, onEdit, onDelete }: SalesActivityTableProps) {
  const formatAmount = (amount?: number) => {
    if (!amount) return '-';
    return `${amount.toLocaleString()}원`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getActivityTypeBadge = (type: 'estimate' | 'contract') => {
    if (type === 'estimate') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          견적
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
        계약
      </span>
    );
  };

  const getSiteTypeBadge = (type: 'existing' | 'new') => {
    if (type === 'existing') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
          기존
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
        신규
      </span>
    );
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-text mx-auto mb-4" />
        <p className="text-gray-text">등록된 영업 활동이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-border">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">활동 날짜</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">활동 구분</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">현장 구분</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">현장명</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">고객사</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">금액</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-text">실행률</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-text">사진</th>
            {user.role === 'admin' && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">작성자</th>
            )}
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-text">액션</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr
              key={activity.id}
              onClick={() => onEdit(activity)}
              className="border-b border-gray-border hover:bg-bg-card transition-colors cursor-pointer"
            >
              <td className="px-4 py-4 text-sm text-white whitespace-nowrap">
                {formatDate(activity.activity_date)}
              </td>
              <td className="px-4 py-4 text-sm">
                {getActivityTypeBadge(activity.activity_type)}
              </td>
              <td className="px-4 py-4 text-sm">
                {getSiteTypeBadge(activity.site_type)}
              </td>
              <td className="px-4 py-4 text-sm text-white">
                {activity.site_type === 'new'
                  ? (activity.new_site_name || '-')
                  : (activity.site_name || '-')}
              </td>
              <td className="px-4 py-4 text-sm text-white">
                {activity.site_type === 'new'
                  ? (activity.new_client || '-')
                  : (activity.client || '-')}
              </td>
              <td className="px-4 py-4 text-sm text-white text-right font-medium">
                {formatAmount(activity.amount)}
              </td>
              <td className="px-4 py-4 text-sm text-white text-center">
                {activity.execution_rate !== undefined && activity.execution_rate !== null
                  ? `${activity.execution_rate}%`
                  : '-'}
              </td>
              <td className="px-4 py-4 text-sm text-center">
                {activity.attachments && activity.attachments.length > 0 ? (
                  <div className="flex items-center justify-center gap-1">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <span className="text-primary font-medium">
                      {activity.attachments.length}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-text">-</span>
                )}
              </td>
              {user.role === 'admin' && (
                <td className="px-4 py-4 text-sm text-white">
                  <div>
                    <p className="font-medium">{activity.users?.name || activity.created_by}</p>
                    <p className="text-xs text-gray-text">{activity.users?.department}</p>
                  </div>
                </td>
              )}
              <td className="px-4 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center gap-2">
                  {(user.role === 'admin' || activity.user_id === user.id) && (
                    <button
                      onClick={() => onDelete(activity.id)}
                      className="p-1.5 hover:bg-red-500/10 text-red-400 rounded transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
