import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { SiteSearchInput } from './SiteSearchInput';
import type { User, ConstructionSite, WeeklyPlan, WeeklyPlanFormData } from '../types';

interface WeeklyPlanFormProps {
  user: User;
  plan?: WeeklyPlan;
  onClose: () => void;
  onSave: (data: WeeklyPlanFormData) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export function WeeklyPlanForm({ user, plan, onClose, onSave, onDelete }: WeeklyPlanFormProps) {
  const isEdit = !!plan;
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<WeeklyPlanFormData>({
    cms_id: plan?.cms_id,
    cms_code: plan?.cms_code || '',
    site_name: plan?.site_name || '',
    site_address: plan?.site_address || '',
    sales_manager: plan?.sales_manager || '',
    construction_manager: plan?.construction_manager || '',
    activity_construction_sales: plan?.activity_construction_sales || false,
    activity_site_additional_sales: plan?.activity_site_additional_sales || false,
    activity_site_support: plan?.activity_site_support || false,
  });

  // Update formData when plan prop changes (for edit mode)
  useEffect(() => {
    if (plan) {
      setFormData({
        cms_id: plan.cms_id,
        cms_code: plan.cms_code || '',
        site_name: plan.site_name || '',
        site_address: plan.site_address || '',
        sales_manager: plan.sales_manager || '',
        construction_manager: plan.construction_manager || '',
        activity_construction_sales: plan.activity_construction_sales || false,
        activity_site_additional_sales: plan.activity_site_additional_sales || false,
        activity_site_support: plan.activity_site_support || false,
      });
    } else {
      // Reset form for new entry
      setFormData({
        cms_id: undefined,
        cms_code: '',
        site_name: '',
        site_address: '',
        sales_manager: '',
        construction_manager: '',
        activity_construction_sales: false,
        activity_site_additional_sales: false,
        activity_site_support: false,
      });
    }
  }, [plan]);

  const handleSiteSelect = (site: ConstructionSite) => {
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

  const handleCheckboxChange = (field: keyof WeeklyPlanFormData) => {
    setFormData({
      ...formData,
      [field]: !formData[field],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사 - cms_id 또는 cms_code와 site_name이 있어야 함
    if (!formData.cms_id && !formData.cms_code && !formData.site_name) {
      setError('현장을 선택해주세요.');
      return;
    }

    if (
      !formData.activity_construction_sales &&
      !formData.activity_site_additional_sales &&
      !formData.activity_site_support
    ) {
      setError('최소 하나의 활동 구분을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (err: any) {
      setError(err.message || '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!plan || !onDelete) return;

    setLoading(true);
    try {
      await onDelete(plan.id);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      setError(err.message || '삭제에 실패했습니다.');
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* 헤더 */}
      <div className="mb-6">
        {/* 목록으로 버튼 */}
        <div className="mb-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex items-center space-x-2"
            disabled={loading}
          >
            <ArrowLeft size={20} />
            <span>목록으로</span>
          </button>
        </div>

        {/* 제목과 삭제 버튼 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title mb-1">
              {isEdit ? '주간 업무 계획 수정' : '주간 업무 계획 작성'}
            </h1>
            <p className="page-description">현장과 활동 정보를 입력해주세요.</p>
          </div>
          {/* 삭제 버튼 (수정 모드일 때만) */}
          {isEdit && onDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2 bg-red-500 bg-opacity-10 border-red-500 text-red-500 hover:bg-red-500 hover:bg-opacity-20"
            >
              <Trash2 size={20} />
              <span>삭제</span>
            </button>
          )}
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* 자동 입력 필드 (읽기 전용) */}
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-gray-border pb-3">
            작성자 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-text mb-2">
                이름
              </label>
              <input
                type="text"
                value={user.name}
                disabled
                className="input-field bg-bg-darker text-gray-text cursor-not-allowed opacity-75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-text mb-2">
                부서
              </label>
              <input
                type="text"
                value={user.department}
                disabled
                className="input-field bg-bg-darker text-gray-text cursor-not-allowed opacity-75"
              />
            </div>
          </div>
        </div>

        {/* 현장 검색 */}
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-gray-border pb-3">
            현장 정보
          </h3>

          <SiteSearchInput onSelect={handleSiteSelect} disabled={loading} />

          {/* 선택된 현장 정보 (읽기 전용) */}
          {(formData.cms_id || formData.cms_code || formData.site_name) && (
            <div className="bg-gradient-to-br from-primary from-opacity-5 to-bg-darker p-5 rounded-xl border-2 border-primary border-opacity-30 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">선택된 현장</span>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-bg-card bg-opacity-50 p-3 rounded-lg">
                    <label className="block text-xs font-medium text-primary mb-1.5">
                      CMS 코드
                    </label>
                    <div className="text-base font-semibold text-white">{formData.cms_code}</div>
                  </div>
                  <div className="bg-bg-card bg-opacity-50 p-3 rounded-lg">
                    <label className="block text-xs font-medium text-primary mb-1.5">
                      현장명
                    </label>
                    <div className="text-base font-semibold text-white">{formData.site_name}</div>
                  </div>
                </div>
                <div className="bg-bg-card bg-opacity-50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-primary mb-1.5">
                    현장 주소
                  </label>
                  <div className="text-sm text-white">{formData.site_address}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-bg-card bg-opacity-50 p-3 rounded-lg">
                    <label className="block text-xs font-medium text-primary mb-1.5">
                      영업 담당
                    </label>
                    <div className="text-sm text-white">{formData.sales_manager || '-'}</div>
                  </div>
                  <div className="bg-bg-card bg-opacity-50 p-3 rounded-lg">
                    <label className="block text-xs font-medium text-primary mb-1.5">
                      시공 담당
                    </label>
                    <div className="text-sm text-white">{formData.construction_manager || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 활동 구분 */}
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-gray-border pb-3">
            활동 구분 * (중복 선택 가능)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 건설사 영업 */}
            <label className={`
              relative flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all
              ${formData.activity_construction_sales
                ? 'bg-primary bg-opacity-10 border-primary shadow-md'
                : 'bg-bg-darker border-gray-border hover:border-primary hover:border-opacity-50'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
                <input
                  type="checkbox"
                  checked={formData.activity_construction_sales}
                  onChange={() => handleCheckboxChange('activity_construction_sales')}
                  disabled={loading}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-5 h-5 rounded flex items-center justify-center border-2 transition-all
                    ${formData.activity_construction_sales
                      ? 'bg-primary border-primary'
                      : 'border-gray-border'
                    }
                  `}>
                    {formData.activity_construction_sales && (
                      <svg className="w-3 h-3 text-bg-darker" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                  <span className={`font-medium ${formData.activity_construction_sales ? 'text-primary' : 'text-white'}`}>
                    건설사 영업
                  </span>
                </div>
            </label>

            {/* 현장 추가 영업 */}
            <label className={`
              relative flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all
              ${formData.activity_site_additional_sales
                ? 'bg-primary bg-opacity-10 border-primary shadow-md'
                : 'bg-bg-darker border-gray-border hover:border-primary hover:border-opacity-50'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
                <input
                  type="checkbox"
                  checked={formData.activity_site_additional_sales}
                  onChange={() => handleCheckboxChange('activity_site_additional_sales')}
                  disabled={loading}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-5 h-5 rounded flex items-center justify-center border-2 transition-all
                    ${formData.activity_site_additional_sales
                      ? 'bg-primary border-primary'
                      : 'border-gray-border'
                    }
                  `}>
                    {formData.activity_site_additional_sales && (
                      <svg className="w-3 h-3 text-bg-darker" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                  <span className={`font-medium ${formData.activity_site_additional_sales ? 'text-primary' : 'text-white'}`}>
                    현장 추가 영업
                  </span>
                </div>
            </label>

            {/* 현장 지원 */}
            <label className={`
              relative flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all
              ${formData.activity_site_support
                ? 'bg-primary bg-opacity-10 border-primary shadow-md'
                : 'bg-bg-darker border-gray-border hover:border-primary hover:border-opacity-50'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
                <input
                  type="checkbox"
                  checked={formData.activity_site_support}
                  onChange={() => handleCheckboxChange('activity_site_support')}
                  disabled={loading}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-5 h-5 rounded flex items-center justify-center border-2 transition-all
                    ${formData.activity_site_support
                      ? 'bg-primary border-primary'
                      : 'border-gray-border'
                    }
                  `}>
                    {formData.activity_site_support && (
                      <svg className="w-3 h-3 text-bg-darker" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                <span className={`font-medium ${formData.activity_site_support ? 'text-primary' : 'text-white'}`}>
                  현장 지원
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="card">
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <Save size={18} />
              <span>{loading ? '저장 중...' : '저장'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bg-card border border-gray-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">삭제 확인</h3>
            <p className="text-gray-text mb-6">
              정말로 이 주간 계획을 삭제하시겠습니까?<br />
              <span className="text-primary font-medium">{formData.cms_code} - {formData.site_name}</span><br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="btn-secondary"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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