import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { DailyPlanForm } from '../../components/DailyPlanForm';
import { DailyPlanTable } from '../../components/DailyPlanTable';
import type { User, DailyPlan, DailyPlanFormData } from '../../types';

interface DailyPlanPageProps {
  user: User;
}

export default function DailyPlanPage({ user }: DailyPlanPageProps) {
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingPlan, setEditingPlan] = useState<DailyPlan | undefined>();
  const [error, setError] = useState('');

  // 필터 상태
  const [selectedUser, setSelectedUser] = useState<string>(user.id);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  // 관리자인 경우 사용자 목록
  const [users, setUsers] = useState<Array<{ id: string; name: string; department: string }>>([]);

  // 사용자 목록 로드 (관리자만)
  useEffect(() => {
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, [user.role]);

  // 일일 일지 목록 로드
  useEffect(() => {
    fetchPlans();
  }, [selectedUser, year, month, page]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('crm_token');
      const params = new URLSearchParams({
        user_id: selectedUser,
        year: year.toString(),
        month: month.toString(),
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/daily-plans?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setPlans(data.data || []);
        setPagination(data.pagination);
      } else {
        setError(data.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: DailyPlanFormData) => {
    const token = localStorage.getItem('crm_token');
    const url = editingPlan ? `/api/daily-plans/${editingPlan.id}` : '/api/daily-plans';
    const method = editingPlan ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }

    // 성공 시 목록 새로고침
    await fetchPlans();
    setViewMode('list');
    setEditingPlan(undefined);
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('crm_token');
    const response = await fetch(`/api/daily-plans/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }

    // 성공 시 목록 새로고침 및 폼 닫기
    await fetchPlans();
    setViewMode('list');
    setEditingPlan(undefined);
  };

  const handleEdit = (plan: DailyPlan) => {
    setEditingPlan(plan);
    setViewMode('form');
  };

  const handleCloseForm = () => {
    setViewMode('list');
    setEditingPlan(undefined);
  };

  const handleNewForm = () => {
    setEditingPlan(undefined);
    setViewMode('form');
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // 년도 옵션 (현재 년도부터 5년 전까지)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="page-container">
      {viewMode === 'list' ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="page-title mb-2">일일 업무 일지</h1>
              <p className="page-description">주간 단위 업무 계획을 작성하고 관리합니다.</p>
            </div>
            <button onClick={handleNewForm} className="btn-primary flex items-center space-x-2">
              <Plus size={20} />
              <span>새로 작성</span>
            </button>
          </div>

          {/* 필터 영역 */}
          <div className="card mb-6">
            <div className="flex flex-wrap items-end gap-4">
              {/* 관리자만: 사용자 선택 */}
              {user.role === 'admin' && users.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-white mb-2">사용자</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => {
                      setSelectedUser(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id} className="bg-bg-darker text-white">
                        {u.name} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 년도 선택 */}
              <div className="w-40">
                <label className="block text-sm font-medium text-white mb-2">년도</label>
                <select
                  value={year}
                  onChange={(e) => {
                    setYear(parseInt(e.target.value));
                    setPage(1);
                  }}
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
                  onChange={(e) => {
                    setMonth(parseInt(e.target.value));
                    setPage(1);
                  }}
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
                  onClick={fetchPlans}
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

          {/* 테이블 */}
          {loading ? (
            <div className="card">
              <div className="flex flex-col items-center justify-center py-20 text-gray-text">
                <RefreshCw size={48} className="animate-spin mb-4 opacity-50" />
                <p className="text-lg">데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : (
            <DailyPlanTable
              plans={plans}
              onEdit={handleEdit}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <DailyPlanForm
          user={user}
          plan={editingPlan}
          onClose={handleCloseForm}
          onSave={handleSave}
          onDelete={editingPlan ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
