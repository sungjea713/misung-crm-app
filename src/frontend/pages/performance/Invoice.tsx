import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, FileCheck } from 'lucide-react';
import { InvoiceRecordForm } from '../../components/InvoiceRecordForm';
import { InvoiceRecordTable } from '../../components/InvoiceRecordTable';
import type { User, InvoiceRecord, InvoiceRecordFormData } from '../../types';

interface InvoicePageProps {
  user: User;
}

export default function Invoice({ user }: InvoicePageProps) {
  const [records, setRecords] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingRecord, setEditingRecord] = useState<InvoiceRecord | undefined>();
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

  // Check if user is multi-branch (송기정 or 김태현)
  const isMultiBranchUser = user.name === '송기정' || user.name === '김태현';
  const [selectedBranch, setSelectedBranch] = useState<'all' | '본점' | '인천'>('all');

  // 관리자인 경우 사용자 목록
  const [users, setUsers] = useState<Array<{ id: string; name: string; department: string }>>([]);

  // 사용자 목록 로드 (관리자만)
  useEffect(() => {
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, [user.role]);

  // 계산서 발행 목록 로드
  useEffect(() => {
    fetchRecords();
  }, [selectedUser, selectedBranch, year, month, page]);

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

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('crm_token');
      const params = new URLSearchParams();
      params.append('user_id', selectedUser);

      // For multi-branch users, filter by branch if not 'all'
      if (isMultiBranchUser && selectedBranch !== 'all') {
        const createdByFilter = selectedBranch === '인천' ? `${user.name}(In)` : user.name;
        params.append('created_by', createdByFilter);
      }

      params.append('year', year.toString());
      params.append('month', month.toString());
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/invoice-records?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setRecords(data.data || []);
        setPagination(data.pagination);
      } else {
        setError(data.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Error fetching invoice records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: InvoiceRecordFormData) => {
    const token = localStorage.getItem('crm_token');
    const url = editingRecord ? `/api/invoice-records/${editingRecord.id}` : '/api/invoice-records';
    const method = editingRecord ? 'PUT' : 'POST';

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
    await fetchRecords();
    setViewMode('list');
    setEditingRecord(undefined);
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('crm_token');
    const response = await fetch(`/api/invoice-records/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }

    // 성공 시 목록 새로고침 및 폼 닫기
    await fetchRecords();
    setViewMode('list');
    setEditingRecord(undefined);
  };

  const handleEdit = (record: InvoiceRecord) => {
    setEditingRecord(record);
    setViewMode('form');
  };

  const handleCloseForm = () => {
    setViewMode('list');
    setEditingRecord(undefined);
  };

  const handleNewForm = () => {
    setEditingRecord(undefined);
    setViewMode('form');
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // 연도 선택 옵션 생성 (최근 6년)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  // 월 선택 옵션 생성
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="page-container">
      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="page-title flex items-center gap-2">
                <FileCheck className="h-6 w-6" />
                계산서 발행
              </h1>
              <p className="page-description">계산서를 발행하고 관리합니다.</p>
            </div>
            <button onClick={handleNewForm} className="btn-primary flex items-center gap-2">
              <Plus className="h-5 w-5" />
              새 계산서 발행
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

              {/* User (Admin only) */}
              {user.role === 'admin' && users.length > 0 && (
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
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* 테이블 */}
          {loading ? (
            <div className="card">
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              </div>
            </div>
          ) : (
            <InvoiceRecordTable
              records={records}
              onEdit={handleEdit}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <InvoiceRecordForm
          user={user}
          record={editingRecord}
          onClose={handleCloseForm}
          onSave={handleSave}
          onDelete={editingRecord ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
