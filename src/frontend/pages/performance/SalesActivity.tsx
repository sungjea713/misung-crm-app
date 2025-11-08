import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { SalesActivityForm } from '../../components/SalesActivityForm';
import { SalesActivityTable } from '../../components/SalesActivityTable';
import type { User, SalesActivity, SalesActivityFormData } from '../../types';

interface SalesActivityProps {
  user: User;
}

export default function SalesActivity({ user }: SalesActivityProps) {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [selectedUser, setSelectedUser] = useState<string>(user.role === 'admin' ? '' : user.id);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [activityType, setActivityType] = useState<string>('all');
  const [siteType, setSiteType] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Data
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  // Edit mode
  const [editingActivity, setEditingActivity] = useState<SalesActivity | undefined>();

  // Fetch users (for admin)
  useEffect(() => {
    console.log('User role:', user.role);
    if (user.role === 'admin') {
      console.log('Fetching users...');
      fetchUsers();
    }
  }, [user.role]);

  // Fetch activities when filters change
  useEffect(() => {
    if (viewMode === 'list') {
      // Admin: wait until selectedUser is set before fetching
      if (user.role === 'admin' && !selectedUser) {
        return;
      }
      fetchActivities();
    }
  }, [selectedUser, year, month, activityType, siteType, page, viewMode]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/sales-activities/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Fetch users response status:', response.status);

      // Ignore 403 errors - user is not admin
      if (response.status === 403) {
        console.log('User is not admin, skipping user list');
        return;
      }

      const result = await response.json();
      console.log('Fetch users result:', result);
      if (result.success) {
        setUsers(result.data);
        console.log('Users set:', result.data);
        // Set first user as default if admin and no user selected
        if (user.role === 'admin' && !selectedUser && result.data.length > 0) {
          setSelectedUser(result.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('crm_token');
      const params = new URLSearchParams({
        year: year.toString(),
        month: month.toString(),
        page: page.toString(),
        limit: '20',
      });

      // Admin: filter by selected user, User: only show own activities
      if (user.role === 'admin') {
        if (selectedUser) {
          params.append('user_id', selectedUser);
        }
      } else {
        params.append('user_id', user.id);
      }

      if (activityType !== 'all') {
        params.append('activity_type', activityType);
      }

      if (siteType !== 'all') {
        params.append('site_type', siteType);
      }

      const response = await fetch(`/api/sales-activities?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setActivities(result.data);
        setPagination(result.pagination);
      } else {
        setError(result.message || '영업 활동 목록을 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('영업 활동 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingActivity(undefined);
    setViewMode('form');
  };

  const handleEdit = (activity: SalesActivity) => {
    setEditingActivity(activity);
    setViewMode('form');
  };

  const handleSave = async (data: SalesActivityFormData) => {
    const token = localStorage.getItem('crm_token');
    console.log('handleSave - data:', data);

    if (editingActivity) {
      // Update
      const response = await fetch(`/api/sales-activities/${editingActivity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('Update response:', result);

      if (!result.success) {
        throw new Error(result.message || '수정에 실패했습니다.');
      }
    } else {
      // Create
      const response = await fetch('/api/sales-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('Create response:', result);

      if (!result.success) {
        throw new Error(result.message || '등록에 실패했습니다.');
      }
    }

    // Refresh list
    await fetchActivities();
    setViewMode('list');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 삭제하시겠습니까?')) {
      return;
    }

    const token = localStorage.getItem('crm_token');
    const response = await fetch(`/api/sales-activities/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '삭제에 실패했습니다.');
    }

    // Refresh list
    await fetchActivities();
  };

  const handleClose = () => {
    setEditingActivity(undefined);
    setViewMode('list');
  };

  // Year/Month options
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  if (viewMode === 'form') {
    return (
      <SalesActivityForm
        user={user}
        activity={editingActivity}
        onClose={handleClose}
        onSave={handleSave}
        onDelete={editingActivity ? handleDelete : undefined}
      />
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">영업 활동</h1>
          <p className="page-description">영업 활동 내역을 관리합니다</p>
        </div>
        <button onClick={handleCreateNew} className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          새 활동 등록
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">연도</label>
            <select
              value={year}
              onChange={(e) => {
                setYear(parseInt(e.target.value));
                setPage(1);
              }}
              className="input-field"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">월</label>
            <select
              value={month}
              onChange={(e) => {
                setMonth(parseInt(e.target.value));
                setPage(1);
              }}
              className="input-field"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </div>

          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">활동 구분</label>
            <select
              value={activityType}
              onChange={(e) => {
                setActivityType(e.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="all">전체</option>
              <option value="estimate">견적</option>
              <option value="contract">계약</option>
            </select>
          </div>

          {/* Site Type */}
          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">현장 구분</label>
            <select
              value={siteType}
              onChange={(e) => {
                setSiteType(e.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="all">전체</option>
              <option value="existing">기존</option>
              <option value="new">신규</option>
            </select>
          </div>

          {/* User (Admin only) */}
          {user.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-text mb-2">사용자</label>
              <select
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  setPage(1);
                }}
                className="input-field"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={() => fetchActivities()}
              className="btn-secondary w-full flex items-center justify-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-text">로딩 중...</p>
          </div>
        ) : (
          <>
            <SalesActivityTable
              activities={activities}
              user={user}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-border">
                <p className="text-sm text-gray-text">
                  전체 {pagination.total}개 중 {(page - 1) * pagination.limit + 1}-
                  {Math.min(page * pagination.limit, pagination.total)}개 표시
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-white">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
