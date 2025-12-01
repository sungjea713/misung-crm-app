import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, CircleDollarSign } from 'lucide-react';
import { CollectionRecordForm } from '../../components/CollectionRecordForm';
import { CollectionRecordTable } from '../../components/CollectionRecordTable';
import type { User, CollectionRecord, CollectionRecordFormData, CollectionRecordFilters } from '../../types';

interface CollectionManagementProps {
  user: User;
}

export default function CollectionManagement({ user }: CollectionManagementProps) {
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingRecord, setEditingRecord] = useState<CollectionRecord | undefined>();
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(user.id);

  // Check if user is multi-branch (송기정 or 김태현)
  const isMultiBranchUser = user.name === '송기정' || user.name === '김태현';
  const [selectedBranch, setSelectedBranch] = useState<'all' | '본점' | '인천'>('all');

  // 현재 날짜를 기준으로 년도와 월 설정
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  // 연도 옵션 (2020년부터 현재 연도까지)
  const yearOptions = Array.from({ length: currentDate.getFullYear() - 2019 }, (_, i) => 2020 + i);

  // 관리자인 경우 사용자 목록 가져오기
  useEffect(() => {
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, [user.role]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchRecords();
    }
  }, [year, month, page, viewMode, selectedUserId, selectedBranch]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('/api/collections/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('crm_token');

      const params = new URLSearchParams();
      params.append('user_id', user.role === 'admin' ? selectedUserId : user.id);

      // For multi-branch users, filter by branch if not 'all'
      if (isMultiBranchUser && selectedBranch !== 'all') {
        const createdByFilter = selectedBranch === '인천' ? `${user.name}(In)` : user.name;
        params.append('created_by', createdByFilter);
      }
      params.append('year', year.toString());
      params.append('month', month.toString());
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/collections?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setRecords(result.data || []);
        setPagination(result.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
      } else {
        setError(result.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRecord = () => {
    setEditingRecord(undefined);
    setViewMode('form');
  };

  const handleEditRecord = (record: CollectionRecord) => {
    setEditingRecord(record);
    setViewMode('form');
  };

  const handleSaveRecord = async (data: CollectionRecordFormData) => {
    const token = localStorage.getItem('crm_token');
    const url = editingRecord
      ? `/api/collections/${editingRecord.id}`
      : '/api/collections';
    const method = editingRecord ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || '저장에 실패했습니다.');
    }

    await fetchRecords();
  };

  const handleDeleteRecord = async (id: number) => {
    const token = localStorage.getItem('crm_token');
    const response = await fetch(`/api/collections/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || '삭제에 실패했습니다.');
    }

    await fetchRecords();
  };

  const handleCloseForm = () => {
    setViewMode('list');
    setEditingRecord(undefined);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="page-container">
      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="page-title flex items-center gap-2">
                <CircleDollarSign className="h-6 w-6" />
                수금 현황
              </h1>
              <p className="page-description">수금 내역을 등록하고 미수금 잔액을 관리합니다.</p>
            </div>
            <button onClick={handleNewRecord} className="btn-primary flex items-center gap-2">
              <Plus className="h-5 w-5" />
              새 수금 등록
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
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  ))}
                </select>
              </div>

              {/* User (Admin only) */}
              {user.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-text mb-2">사용자</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value);
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

              {/* Branch (Multi-branch users only) */}
              {user.role !== 'admin' && isMultiBranchUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-text mb-2">지점</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => {
                      setSelectedBranch(e.target.value as 'all' | '본점' | '인천');
                      setPage(1);
                    }}
                    className="input-field"
                  >
                    <option value="all">전체</option>
                    <option value="본점">본점</option>
                    <option value="인천">인천</option>
                  </select>
                </div>
              )}

              {/* Refresh Button */}
              <div className="flex items-end">
                <button
                  onClick={() => fetchRecords()}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  새로고침
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
            <CollectionRecordTable
              records={records}
              onEdit={handleEditRecord}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <CollectionRecordForm
          user={user}
          record={editingRecord}
          onClose={handleCloseForm}
          onSave={handleSaveRecord}
          onDelete={editingRecord ? handleDeleteRecord : undefined}
        />
      )}
    </div>
  );
}
