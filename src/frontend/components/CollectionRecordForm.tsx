import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { SiteSearchInput } from './SiteSearchInput';
import type { User, ConstructionSite, CollectionRecord, CollectionRecordFormData } from '../types';

interface CollectionRecordFormProps {
  user: User;
  record?: CollectionRecord;
  onClose: () => void;
  onSave: (data: CollectionRecordFormData) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export function CollectionRecordForm({ user, record, onClose, onSave, onDelete }: CollectionRecordFormProps) {
  const isEdit = !!record;
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  // Check if user is multi-branch (송기정 or 김태현)
  const isMultiBranchUser = user.name === '송기정' || user.name === '김태현';

  // 초기 지점 설정: 수정 모드일 경우 created_by에서 판단, 아니면 user.branch 또는 기본값 '인천'
  const getInitialBranch = (): '본점' | '인천' => {
    if (record && isMultiBranchUser) {
      // created_by에 (In) suffix가 있으면 인천, 없으면 본점
      return record.created_by?.includes('(In)') ? '인천' : '본점';
    }
    return user.branch || '인천';
  };

  const [selectedBranch, setSelectedBranch] = useState<'본점' | '인천'>(getInitialBranch());

  // 미수금 관련 상태
  const [monthlyOutstanding, setMonthlyOutstanding] = useState<number>(0);  // 관리자 업로드 미수금
  const [outstandingBalance, setOutstandingBalance] = useState<number>(0);  // 미수금 잔액 (자동 계산)

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<CollectionRecordFormData>({
    collection_date: record?.collection_date || getTodayDate(),
    cms_id: record?.cms_id,
    cms_code: record?.cms_code || '',
    site_name: record?.site_name || '',
    site_address: record?.site_address || '',
    sales_manager: record?.sales_manager || '',
    construction_manager: record?.construction_manager || '',
    collection_amount: record?.collection_amount,
  });

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (record) {
      setFormData({
        collection_date: record.collection_date,
        cms_id: record.cms_id,
        cms_code: record.cms_code || '',
        site_name: record.site_name || '',
        site_address: record.site_address || '',
        sales_manager: record.sales_manager || '',
        construction_manager: record.construction_manager || '',
        collection_amount: record.collection_amount,
      });

      // Update selected branch based on created_by suffix
      if (isMultiBranchUser) {
        const branch = record.created_by?.includes('(In)') ? '인천' : '본점';
        setSelectedBranch(branch);
      }
    } else {
      // Reset form for new entry
      setFormData({
        collection_date: getTodayDate(),
        cms_id: undefined,
        cms_code: '',
        site_name: '',
        site_address: '',
        sales_manager: '',
        construction_manager: '',
        collection_amount: undefined,
      });

      // Reset branch to default for new entry
      if (isMultiBranchUser) {
        setSelectedBranch(user.branch || '인천');
      }
    }
  }, [record, isMultiBranchUser, user.branch]);

  // 수금일 변경 시 관리자 업로드 미수금 조회
  useEffect(() => {
    const fetchMonthlyOutstanding = async () => {
      if (!formData.collection_date) return;

      const date = new Date(formData.collection_date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      try {
        const token = localStorage.getItem('crm_token');
        const params = new URLSearchParams({
          year: year.toString(),
          month: month.toString(),
        });

        const response = await fetch(`/api/monthly-collection?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await response.json();
        if (result.success && result.data) {
          // 현재 사용자의 미수금 찾기
          const userOutstanding = result.data.find((item: any) => item.manager_name === user.name);
          if (userOutstanding) {
            setMonthlyOutstanding(userOutstanding.outstanding_amount || 0);
          } else {
            setMonthlyOutstanding(0);
          }
        } else {
          setMonthlyOutstanding(0);
        }
      } catch (err) {
        console.error('Error fetching monthly outstanding:', err);
        setMonthlyOutstanding(0);
      }
    };

    fetchMonthlyOutstanding();
  }, [formData.collection_date, user.name]);

  // 수금 금액 변경 시 미수금 잔액 자동 계산
  useEffect(() => {
    const collectionAmount = formData.collection_amount || 0;
    const balance = monthlyOutstanding - collectionAmount;
    setOutstandingBalance(balance);
  }, [monthlyOutstanding, formData.collection_amount]);

  // 현장 선택 시
  const handleSiteSelect = async (site: ConstructionSite) => {
    setFormData({
      ...formData,
      cms_id: site.id,
      cms_code: site.cms,
      site_name: site.site_name,
      site_address: site.site_address,
      sales_manager: site.sales_manager,
      construction_manager: site.construction_manager,
    });
    setError('');
  };

  // 수금 금액 입력 처리 (천 단위 콤마 표시)
  const handleCollectionAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const numberValue = numericValue === '' ? undefined : parseFloat(numericValue);
    setFormData({ ...formData, collection_amount: numberValue });
  };

  // 수금 금액 포맷 (빈 값은 빈 문자열로 표시)
  const formatCollectionAmount = (value: number | undefined): string => {
    if (!value) return '';
    return value.toLocaleString('ko-KR');
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: number): string => {
    return num.toLocaleString('ko-KR');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검증
    if (!formData.collection_date) {
      setError('수금일을 입력해주세요.');
      return;
    }

    if (!formData.cms_code || !formData.site_name) {
      setError('현장을 선택해주세요.');
      return;
    }

    if (!formData.collection_amount || formData.collection_amount <= 0) {
      setError('수금 금액을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const dataToSave: any = { ...formData };

      // 다중 지점 사용자인 경우 branch 정보 추가
      if (isMultiBranchUser) {
        dataToSave.branch = selectedBranch;
      }

      await onSave(dataToSave);
      onClose();
    } catch (err: any) {
      setError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!record || !onDelete) return;

    setLoading(true);
    try {
      await onDelete(record.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      setError(err.message || '삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            목록으로
          </button>
          <h2 className="text-2xl font-bold text-white">
            {isEdit ? '수금 관리 수정' : '수금 관리 등록'}
          </h2>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          {/* Branch Selection for Multi-Branch Users */}
          {isMultiBranchUser && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-text mb-2">
                지점 구분 *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedBranch('본점')}
                  disabled={loading}
                  className={`
                    p-3 rounded-lg border-2 transition-all font-medium
                    ${selectedBranch === '본점'
                      ? 'bg-primary bg-opacity-10 border-primary text-primary'
                      : 'bg-bg-darker border-gray-border text-white hover:border-primary hover:border-opacity-50'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  본점
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBranch('인천')}
                  disabled={loading}
                  className={`
                    p-3 rounded-lg border-2 transition-all font-medium
                    ${selectedBranch === '인천'
                      ? 'bg-primary bg-opacity-10 border-primary text-primary'
                      : 'bg-bg-darker border-gray-border text-white hover:border-primary hover:border-opacity-50'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  인천
                </button>
              </div>
            </div>
          )}

          {/* 수금일 */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                수금일 *
              </label>
              <input
                type="date"
                value={formData.collection_date}
                onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })}
                className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* 현장 검색 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              현장 검색 *
            </label>
            <SiteSearchInput
              value={formData.cms_code || ''}
              onSelect={handleSiteSelect}
              placeholder="CMS 코드 또는 현장명으로 검색"
            />
          </div>

          {/* 선택된 현장 정보 */}
          {formData.cms_code && (
            <div className="mb-6 p-4 bg-bg-lighter rounded-lg border border-gray-border">
              <h3 className="text-sm font-semibold text-white mb-3">선택된 현장</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-text">CMS 코드:</span>
                  <span className="ml-2 text-white">{formData.cms_code}</span>
                </div>
                <div>
                  <span className="text-gray-text">현장명:</span>
                  <span className="ml-2 text-white">{formData.site_name}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-text">현장 주소:</span>
                  <span className="ml-2 text-white">{formData.site_address}</span>
                </div>
                <div>
                  <span className="text-gray-text">영업 담당자:</span>
                  <span className="ml-2 text-white">{formData.sales_manager}</span>
                </div>
                <div>
                  <span className="text-gray-text">시공 담당자:</span>
                  <span className="ml-2 text-white">{formData.construction_manager}</span>
                </div>
              </div>
            </div>
          )}

          {/* 수금 금액 입력 */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                수금 금액 (원) *
              </label>
              <input
                type="text"
                value={formatCollectionAmount(formData.collection_amount)}
                onChange={(e) => handleCollectionAmountChange(e.target.value)}
                className="w-full px-4 py-2 bg-bg-darker text-white border border-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* 미수금 정보 (읽기 전용) */}
          <div className="p-4 bg-bg-lighter rounded-lg border border-gray-border">
            <h3 className="text-sm font-semibold text-white mb-3">미수금 정보</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-text">관리자 업로드 미수금:</span>
                <span className="ml-2 text-white font-mono">{formatNumber(monthlyOutstanding)} 원</span>
              </div>
              <div>
                <span className="text-gray-text">미수금 잔액:</span>
                <span className={`ml-2 font-mono font-bold ${
                  outstandingBalance < 0 ? 'text-red-500' : 'text-primary'
                }`}>
                  {formatNumber(outstandingBalance)} 원
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-text">
              * 미수금 잔액 = 관리자 업로드 미수금 - 수금 금액
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div>
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-danger flex items-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                삭제
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={loading}
            >
              <Save className="h-5 w-5" />
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-dark border border-gray-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">삭제 확인</h3>
            <p className="text-gray-text mb-6">
              이 수금 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
                disabled={loading}
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
                disabled={loading}
              >
                {loading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
