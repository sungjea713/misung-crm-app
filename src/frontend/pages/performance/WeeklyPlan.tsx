import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { WeeklyPlanForm } from '../../components/WeeklyPlanForm';
import { WeeklyPlanTable } from '../../components/WeeklyPlanTable';
import type { User, WeeklyPlan, WeeklyPlanFormData } from '../../types';

interface WeeklyPlanPageProps {
  user: User;
}

export default function WeeklyPlanPage({ user }: WeeklyPlanPageProps) {
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'activity-form' | 'target-form'>('list');
  const [editingPlan, setEditingPlan] = useState<WeeklyPlan | undefined>();
  const [error, setError] = useState('');

  // 필터 상태
  const [selectedUser, setSelectedUser] = useState<string>(user.id);
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string>(''); // For multi-branch users
  const [selectedBranch, setSelectedBranch] = useState<'all' | '본점' | '인천'>('all'); // For multi-branch users filtering their own data
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  // Check if current user is multi-branch
  const isMultiBranchUser = user.name === '송기정' || user.name === '김태현';

  // 관리자인 경우 사용자 목록
  const [users, setUsers] = useState<any[]>([]); // Changed to any[] to accommodate expanded structure

  // 사용자 목록 로드 (관리자만)
  useEffect(() => {
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, [user.role]);

  // 주간 계획 목록 로드
  useEffect(() => {
    fetchPlans();
  }, [selectedUser, selectedCreatedBy, selectedBranch, year, month, page]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        // Set first user as default if admin and no user selected
        if (user.role === 'admin' && !selectedUser && !selectedCreatedBy && data.data.length > 0) {
          const firstUser = data.data[0];
          setSelectedUser(firstUser.id);
          if (firstUser.created_by) {
            setSelectedCreatedBy(firstUser.created_by);
          }
        }
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
        year: year.toString(),
        month: month.toString(),
        page: page.toString(),
        limit: '20',
      });

      // Admin: use selectedCreatedBy if set, otherwise selectedUser
      // Multi-branch user (non-admin): filter by branch selection
      // Regular user: filter by user_id
      if (user.role === 'admin') {
        if (selectedCreatedBy) {
          params.append('created_by', selectedCreatedBy);
        } else if (selectedUser) {
          params.append('user_id', selectedUser);
        }
      } else if (isMultiBranchUser && selectedBranch !== 'all') {
        // Multi-branch user filtering their own data by branch
        const createdByValue = selectedBranch === '인천' ? `${user.name}(In)` : user.name;
        params.append('created_by', createdByValue);
      } else {
        // Regular user or multi-branch user viewing all branches
        params.append('user_id', user.id);
      }

      const response = await fetch(`/api/weekly-plans?${params}`, {
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

  const handleSave = async (formData: WeeklyPlanFormData) => {
    const token = localStorage.getItem('crm_token');
    const url = editingPlan ? `/api/weekly-plans/${editingPlan.id}` : '/api/weekly-plans';
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
    const response = await fetch(`/api/weekly-plans/${id}`, {
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

  const handleEdit = async (plan: WeeklyPlan) => {
    setLoading(true);
    try {
      // 편집 시 서버에서 상세 정보를 다시 조회
      const token = localStorage.getItem('crm_token');
      const response = await fetch(`/api/weekly-plans/${plan.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setEditingPlan(data.data);
        // plan_type에 따라 올바른 폼 모드 설정
        if (data.data.plan_type === 'target') {
          setViewMode('target-form');
        } else {
          // 'activity' 또는 'both'인 경우 activity-form으로
          setViewMode('activity-form');
        }
      } else {
        setError(data.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setViewMode('list');
    setEditingPlan(undefined);
  };

  const handleNewActivityForm = () => {
    setEditingPlan(undefined);
    setViewMode('activity-form');
  };

  const handleNewTargetForm = () => {
    setEditingPlan(undefined);
    setViewMode('target-form');
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
          <div className="mb-6">
            <h1 className="page-title mb-2">주간 업무 계획</h1>
            <p className="page-description">주간 단위 업무 계획을 작성하고 관리합니다.</p>
          </div>

          {/* 필터 영역 */}
          <div className="card mb-6">
            <div className="flex flex-wrap items-end gap-4">
              {/* 관리자만: 사용자 선택 */}
              {user.role === 'admin' && users.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-white mb-2">사용자</label>
                  <select
                    value={selectedCreatedBy || selectedUser}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      const selectedUserData = users.find(u =>
                        u.created_by ? u.created_by === selectedValue : u.id === selectedValue
                      );

                      if (selectedUserData) {
                        setSelectedUser(selectedUserData.id);
                        setSelectedCreatedBy(selectedUserData.created_by || '');
                      }
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  >
                    {users.map((u, index) => (
                      <option key={`${u.id}-${index}`} value={u.created_by || u.id} className="bg-bg-darker text-white">
                        {u.display_name || `${u.name} (${u.department})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 다중 지점 사용자: 지점 선택 */}
              {user.role !== 'admin' && isMultiBranchUser && (
                <div className="w-40">
                  <label className="block text-sm font-medium text-white mb-2">지점</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => {
                      setSelectedBranch(e.target.value as 'all' | '본점' | '인천');
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  >
                    <option value="all" className="bg-bg-darker text-white">전체</option>
                    <option value="본점" className="bg-bg-darker text-white">본점</option>
                    <option value="인천" className="bg-bg-darker text-white">인천</option>
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

          {loading ? (
            <div className="card">
              <div className="flex flex-col items-center justify-center py-20 text-gray-text">
                <RefreshCw size={48} className="animate-spin mb-4 opacity-50" />
                <p className="text-lg">데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 목표 활동 계획 섹션 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">목표 활동 계획</h2>
                  <button onClick={handleNewActivityForm} className="btn-primary flex items-center space-x-2">
                    <Plus size={20} />
                    <span>새로 작성</span>
                  </button>
                </div>
                <WeeklyPlanTable
                  plans={plans}
                  onEdit={handleEdit}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  showOnlyActivities={true}
                />
              </div>

              {/* 목표 금액 계획 섹션 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">목표 금액 계획</h2>
                  <button onClick={handleNewTargetForm} className="btn-primary flex items-center space-x-2">
                    <Plus size={20} />
                    <span>새로 작성</span>
                  </button>
                </div>
                <WeeklyPlanTable
                  plans={plans}
                  onEdit={handleEdit}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  showOnlyTargets={true}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <WeeklyPlanForm
          user={user}
          plan={editingPlan}
          onClose={handleCloseForm}
          onSave={handleSave}
          onDelete={editingPlan ? handleDelete : undefined}
          formType={viewMode === 'activity-form' ? 'activity' : 'target'}
        />
      )}
    </div>
  );
}
