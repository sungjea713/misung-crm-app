import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Edit2, Building2 } from 'lucide-react';
import { SiteSearchInput } from './SiteSearchInput';
import ConstructionSalesModal from './ConstructionSalesModal';
import type { User, ConstructionSite, WeeklyPlan, WeeklyPlanFormData, ConstructionSalesDetail } from '../types';

interface WeeklyPlanFormProps {
  user: User;
  plan?: WeeklyPlan;
  onClose: () => void;
  onSave: (data: WeeklyPlanFormData) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  formType?: 'activity' | 'target';
}

export function WeeklyPlanForm({ user, plan, onClose, onSave, onDelete, formType = 'activity' }: WeeklyPlanFormProps) {
  const isEdit = !!plan;
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  // 건설사 영업 모달 상태
  const [showConstructionSalesModal, setShowConstructionSalesModal] = useState(false);
  const [constructionSalesDetail, setConstructionSalesDetail] = useState<ConstructionSalesDetail | undefined>(undefined);

  // Check if user is multi-branch (송기정 or 김태현)
  const isMultiBranchUser = user.name === '송기정' || user.name === '김태현';

  // 초기 지점 설정: 수정 모드일 경우 created_by에서 판단, 아니면 user.branch 또는 기본값 '인천'
  const getInitialBranch = (): '본점' | '인천' => {
    if (plan && isMultiBranchUser) {
      // created_by에 (In) suffix가 있으면 인천, 없으면 본점
      return plan.created_by?.includes('(In)') ? '인천' : '본점';
    }
    return user.branch || '인천';
  };

  const [selectedBranch, setSelectedBranch] = useState<'본점' | '인천'>(getInitialBranch());

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
    target_sales: plan?.target_sales || 0,
    target_order_sales_contribution: plan?.target_order_sales_contribution || 0,
    target_order_profit_contribution: plan?.target_order_profit_contribution || 0,
    target_order_total: plan?.target_order_total || 0,
    target_collection: plan?.target_collection || 0,
    construction_sales_details: plan?.construction_sales_details || undefined,
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
        target_sales: plan.target_sales || 0,
        target_order_sales_contribution: plan.target_order_sales_contribution || 0,
        target_order_profit_contribution: plan.target_order_profit_contribution || 0,
        target_order_total: plan.target_order_total || 0,
        target_collection: plan.target_collection || 0,
        construction_sales_details: plan.construction_sales_details || undefined,
      });

      // Update selected branch based on created_by suffix
      if (isMultiBranchUser) {
        setSelectedBranch(plan.created_by?.includes('(In)') ? '인천' : '본점');
      }

      // 건설사 영업 상세 정보 설정
      if (plan.construction_sales_details && plan.construction_sales_details.length > 0) {
        setConstructionSalesDetail(plan.construction_sales_details[0]);
      }
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
        target_sales: 0,
        target_order_sales_contribution: 0,
        target_order_profit_contribution: 0,
        target_order_total: 0,
        target_collection: 0,
        construction_sales_details: undefined,
      });

      // Reset branch to default for new entry
      if (isMultiBranchUser) {
        setSelectedBranch(user.branch || '인천');
      }

      // 건설사 영업 상세 정보 초기화
      setConstructionSalesDetail(undefined);
    }
  }, [plan, isMultiBranchUser, user.branch]);

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
    const newValue = !formData[field];

    // 건설사 영업 체크박스 처리
    if (field === 'activity_construction_sales') {
      if (newValue) {
        // 체크 시 모달 열기
        setShowConstructionSalesModal(true);
      } else {
        // 체크 해제 시 상세 정보 삭제
        setConstructionSalesDetail(undefined);
        setFormData({
          ...formData,
          [field]: newValue,
          construction_sales_details: undefined,
        });
        return;
      }
    }

    // 다른 활동 구분 체크박스 처리
    const updatedFormData = {
      ...formData,
      [field]: newValue,
    };

    // 현장 추가 영업과 현장 지원이 모두 해제되면 현장 정보 초기화
    if (field === 'activity_site_additional_sales' || field === 'activity_site_support') {
      if (!newValue) {
        const otherField = field === 'activity_site_additional_sales'
          ? 'activity_site_support'
          : 'activity_site_additional_sales';

        // 둘 다 false인 경우 현장 정보 초기화
        if (!updatedFormData[otherField]) {
          updatedFormData.cms_id = undefined;
          updatedFormData.cms_code = '';
          updatedFormData.site_name = '';
          updatedFormData.site_address = '';
          updatedFormData.sales_manager = '';
          updatedFormData.construction_manager = '';
        }
      }
    }

    setFormData(updatedFormData);
  };

  // 목표 금액 입력 처리 (천 단위 콤마 표시)
  const handleTargetAmountChange = (field: keyof WeeklyPlanFormData, value: string) => {
    // 숫자만 추출
    const numericValue = value.replace(/[^\d]/g, '');
    const numberValue = numericValue === '' ? 0 : parseInt(numericValue, 10);

    const updatedData = {
      ...formData,
      [field]: numberValue,
    };

    // 목표 수주 합계 자동 계산
    if (field === 'target_order_sales_contribution' || field === 'target_order_profit_contribution') {
      const salesContribution = field === 'target_order_sales_contribution'
        ? numberValue
        : (updatedData.target_order_sales_contribution || 0);
      const profitContribution = field === 'target_order_profit_contribution'
        ? numberValue
        : (updatedData.target_order_profit_contribution || 0);

      updatedData.target_order_total = salesContribution + profitContribution;
    }

    setFormData(updatedData);
  };

  // 천 단위 콤마 포맷
  const formatNumber = (value: number | undefined): string => {
    if (!value) return '0';
    return value.toLocaleString('ko-KR');
  };

  // 건설사 영업 상세 정보 저장
  const handleConstructionSalesDetailSave = (detail: ConstructionSalesDetail) => {
    setConstructionSalesDetail(detail);
    setFormData({
      ...formData,
      activity_construction_sales: true,
      construction_sales_details: [detail],
    });
    setShowConstructionSalesModal(false);
  };

  // 건설사 영업 모달 닫기 (취소)
  const handleConstructionSalesModalClose = () => {
    // 상세 정보가 없으면 체크 해제
    if (!constructionSalesDetail) {
      setFormData({
        ...formData,
        activity_construction_sales: false,
        construction_sales_details: undefined,
      });
    }
    setShowConstructionSalesModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // formType에 따른 유효성 검사
    if (formType === 'activity') {
      // 활동 구분 필수
      if (
        !formData.activity_construction_sales &&
        !formData.activity_site_additional_sales &&
        !formData.activity_site_support
      ) {
        setError('최소 하나의 활동 구분을 선택해주세요.');
        return;
      }

      // 건설사 영업이 아닌 다른 활동이 선택된 경우에만 현장 정보 필수
      if (
        (formData.activity_site_additional_sales || formData.activity_site_support) &&
        !formData.cms_id && !formData.cms_code && !formData.site_name
      ) {
        setError('현장 추가 영업 또는 현장 지원을 선택한 경우 현장을 선택해주세요.');
        return;
      }
    } else {
      // 목표 금액 계획: 금액 정보 필수
      // 모든 금액이 0이면 에러
      if (
        !formData.target_sales &&
        !formData.target_order_sales_contribution &&
        !formData.target_order_profit_contribution &&
        !formData.target_collection
      ) {
        setError('최소 하나의 목표 금액을 입력해주세요.');
        return;
      }
    }

    setLoading(true);
    try {
      // plan_type 설정 - 수정 모드가 아니면 formType에 따라 설정
      const dataToSave: any = {
        ...formData,
        plan_type: isEdit ? plan.plan_type : formType as 'activity' | 'target',
      };

      // 다중 지점 사용자인 경우 branch 정보 추가
      if (isMultiBranchUser) {
        dataToSave.branch = selectedBranch;
      }

      await onSave(dataToSave);
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
              {formType === 'activity'
                ? (isEdit ? '목표 활동 계획 수정' : '목표 활동 계획 작성')
                : (isEdit ? '목표 금액 계획 수정' : '목표 금액 계획 작성')
              }
            </h1>
            <p className="page-description">
              {formType === 'activity'
                ? '현장과 활동 정보를 입력해주세요.'
                : '목표 금액 정보를 입력해주세요.'
              }
            </p>
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

          {/* 지점 구분 (송기정, 김태현만 표시) */}
          {isMultiBranchUser && (
            <div>
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
        </div>

        {/* 활동 구분 (활동 계획일 때만) */}
        {formType === 'activity' && (
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
        )}

        {/* 건설사 영업 상세 정보 (활동 계획이고 건설사 영업이 체크되고 상세 정보가 있을 때만 표시) */}
        {formType === 'activity' && formData.activity_construction_sales && constructionSalesDetail && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-gray-border pb-3">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-primary" />
                건설사 영업 정보
              </h3>
              <button
                type="button"
                onClick={() => setShowConstructionSalesModal(true)}
                disabled={loading}
                className="btn-secondary flex items-center space-x-2 text-sm"
              >
                <Edit2 className="h-4 w-4" />
                <span>편집</span>
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-bg-darker p-4 rounded-lg border border-blue-500/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-text mb-1">건설사</label>
                  <div className="text-white font-medium">
                    {constructionSalesDetail.construction?.company_name || ''}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-text mb-1">품목</label>
                  <div className="text-white font-medium">
                    {constructionSalesDetail.item?.item_id} - {constructionSalesDetail.item?.item_name || ''}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-text mb-1">활동 내역</label>
                  <div className="flex space-x-3">
                    {constructionSalesDetail.has_quote_submitted && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        견적 제출
                      </span>
                    )}
                    {constructionSalesDetail.has_meeting_conducted && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        미팅 진행
                      </span>
                    )}
                    {!constructionSalesDetail.has_quote_submitted && !constructionSalesDetail.has_meeting_conducted && (
                      <span className="text-xs text-gray-text">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 현장 검색 (활동 계획이고 현장 추가 영업 또는 현장 지원이 체크된 경우에만) */}
        {formType === 'activity' && (formData.activity_site_additional_sales || formData.activity_site_support) && (
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-border pb-3">
              현장 정보
            </h3>

            <SiteSearchInput onSelect={handleSiteSelect} disabled={loading} />

            {/* 선택된 현장 정보 (읽기 전용) */}
            {(formData.cms_id || formData.cms_code || formData.site_name) && (
              <div className="bg-gradient-to-br from-green-900/10 to-bg-darker p-5 rounded-xl border-2 border-green-600/20 shadow-lg">
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
        )}

        {/* 목표 금액 설정 (금액 계획일 때만) */}
        {formType === 'target' && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-gray-border pb-3">
            목표 금액 설정
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-border">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-text">항목</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-text">금액 (원)</th>
                </tr>
              </thead>
              <tbody>
                {/* 목표 매출 */}
                <tr className="border-b border-gray-border hover:bg-bg-darker transition-colors">
                  <td className="px-4 py-3 text-sm text-white">목표 매출</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="text"
                      value={formatNumber(formData.target_sales)}
                      onChange={(e) => handleTargetAmountChange('target_sales', e.target.value)}
                      disabled={loading}
                      className="input-field text-right w-full"
                      placeholder="0"
                    />
                  </td>
                </tr>

                {/* 목표 수주 - 매출 기여 */}
                <tr className="border-b border-gray-border hover:bg-bg-darker transition-colors">
                  <td className="px-4 py-3 text-sm text-white">목표 수주 - 매출 기여</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="text"
                      value={formatNumber(formData.target_order_sales_contribution)}
                      onChange={(e) => handleTargetAmountChange('target_order_sales_contribution', e.target.value)}
                      disabled={loading}
                      className="input-field text-right w-full"
                      placeholder="0"
                    />
                  </td>
                </tr>

                {/* 목표 수주 - 이익 기여 */}
                <tr className="border-b border-gray-border hover:bg-bg-darker transition-colors">
                  <td className="px-4 py-3 text-sm text-white">목표 수주 - 이익 기여</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="text"
                      value={formatNumber(formData.target_order_profit_contribution)}
                      onChange={(e) => handleTargetAmountChange('target_order_profit_contribution', e.target.value)}
                      disabled={loading}
                      className="input-field text-right w-full"
                      placeholder="0"
                    />
                  </td>
                </tr>

                {/* 목표 수주 - 합계 (자동 계산) */}
                <tr className="border-b-2 border-gray-border bg-bg-darker opacity-60">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-text">
                    목표 수주 - 합계 <span className="text-xs font-normal">(자동계산)</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="px-3 py-2 bg-bg-card bg-opacity-50 text-gray-text font-semibold text-right rounded">
                      {formatNumber(formData.target_order_total)}
                    </div>
                  </td>
                </tr>

                {/* 목표 수금 */}
                <tr className="hover:bg-bg-darker transition-colors">
                  <td className="px-4 py-3 text-sm text-white">목표 수금</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="text"
                      value={formatNumber(formData.target_collection)}
                      onChange={(e) => handleTargetAmountChange('target_collection', e.target.value)}
                      disabled={loading}
                      className="input-field text-right w-full"
                      placeholder="0"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        )}

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

      {/* 건설사 영업 상세 정보 모달 */}
      <ConstructionSalesModal
        isOpen={showConstructionSalesModal}
        onClose={handleConstructionSalesModalClose}
        onSave={handleConstructionSalesDetailSave}
        initialDetails={constructionSalesDetail}
      />
    </div>
  );
}