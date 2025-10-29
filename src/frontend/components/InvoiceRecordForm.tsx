import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { SiteSearchInput } from './SiteSearchInput';
import type { User, ConstructionSite, InvoiceRecord, InvoiceRecordFormData, SiteSummary } from '../types';

interface InvoiceRecordFormProps {
  user: User;
  record?: InvoiceRecord;
  onClose: () => void;
  onSave: (data: InvoiceRecordFormData) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export function InvoiceRecordForm({ user, record, onClose, onSave, onDelete }: InvoiceRecordFormProps) {
  const isEdit = !!record;
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  // 매출/매입 자동 계산 필드
  const [salesAmount, setSalesAmount] = useState<string>('');
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [profitDifference, setProfitDifference] = useState<number>(0);
  const [isOverInvested, setIsOverInvested] = useState<boolean>(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<InvoiceRecordFormData>({
    invoice_date: record?.invoice_date || getTodayDate(),
    cms_id: record?.cms_id,
    cms_code: record?.cms_code || '',
    site_name: record?.site_name || '',
    site_address: record?.site_address || '',
    sales_manager: record?.sales_manager || '',
    construction_manager: record?.construction_manager || '',
    invoice_amount: record?.invoice_amount,
  });

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (record) {
      setFormData({
        invoice_date: record.invoice_date,
        cms_id: record.cms_id,
        cms_code: record.cms_code || '',
        site_name: record.site_name || '',
        site_address: record.site_address || '',
        sales_manager: record.sales_manager || '',
        construction_manager: record.construction_manager || '',
        invoice_amount: record.invoice_amount,
      });
      setSalesAmount(record.sales_amount || '0');
      setPurchaseAmount(record.purchase_amount || '0');
      setProfitDifference(record.profit_difference || 0);
      setIsOverInvested(record.is_over_invested || false);
    } else {
      // Reset form for new entry
      setFormData({
        invoice_date: getTodayDate(),
        cms_id: undefined,
        cms_code: '',
        site_name: '',
        site_address: '',
        sales_manager: '',
        construction_manager: '',
        invoice_amount: undefined,
      });
      setSalesAmount('');
      setPurchaseAmount('');
      setProfitDifference(0);
      setIsOverInvested(false);
    }
  }, [record]);

  // 현장 선택 시 site_summary에서 매출/매입 금액 가져오기
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

    // site_summary 조회
    if (site.cms) {
      try {
        const response = await fetch(`/api/invoice-records/site-summary?cms=${site.cms}`);
        const result = await response.json();

        if (result.success && result.data) {
          const summary: SiteSummary = result.data;
          const sales = summary.sales_amount || '0';
          const purchase = summary.purchase_amount || '0';

          setSalesAmount(sales);
          setPurchaseAmount(purchase);

          // 차액 계산
          const salesNum = parseAmountString(sales);
          const purchaseNum = parseAmountString(purchase);
          const diff = salesNum - purchaseNum;

          setProfitDifference(diff);
          setIsOverInvested(diff < 0);
        } else {
          // site_summary에 데이터 없음
          setSalesAmount('0');
          setPurchaseAmount('0');
          setProfitDifference(0);
          setIsOverInvested(false);
        }
      } catch (err) {
        console.error('Error fetching site summary:', err);
        setSalesAmount('0');
        setPurchaseAmount('0');
        setProfitDifference(0);
        setIsOverInvested(false);
      }
    }
  };

  // 쉼표 제거 후 숫자 변환
  const parseAmountString = (amountStr: string): number => {
    if (!amountStr) return 0;
    const cleaned = amountStr.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // 숫자를 천 단위 쉼표 형식으로 변환
  const formatNumber = (num: number | string): string => {
    if (typeof num === 'string') {
      num = parseAmountString(num);
    }
    return num.toLocaleString('ko-KR');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검증
    if (!formData.invoice_date) {
      setError('계산서 발행일을 입력해주세요.');
      return;
    }

    if (!formData.cms_code || !formData.site_name) {
      setError('현장을 선택해주세요.');
      return;
    }

    if (!formData.invoice_amount || formData.invoice_amount <= 0) {
      setError('계산서 금액을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
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
            {isEdit ? '계산서 발행 수정' : '계산서 발행 등록'}
          </h2>
        </div>
        {isEdit && onDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-danger flex items-center gap-2"
            disabled={loading}
          >
            <Trash2 className="h-5 w-5" />
            삭제
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* 작성자 정보 (읽기 전용) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">작성자</label>
            <input type="text" value={user.name} className="input-field" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">부서</label>
            <input type="text" value={user.department} className="input-field" readOnly />
          </div>
        </div>

        {/* 계산서 발행일 */}
        <div>
          <label className="block text-sm font-medium text-gray-text mb-2">
            계산서 발행일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.invoice_date}
            onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
            className="input-field"
            required
          />
        </div>

        {/* 현장 검색 */}
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">
              현장 검색 <span className="text-red-500">*</span>
            </label>
            <SiteSearchInput
              onSelect={handleSiteSelect}
              apiEndpoint="/api/invoice-records/construction-sites/search"
            />
          </div>
        )}

        {/* 선택된 현장 정보 */}
        {formData.cms_code && formData.site_name && (
          <div className="bg-bg-lighter rounded-lg p-4 space-y-3">
            <h3 className="text-white font-semibold mb-3">현장 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-text mb-1">CMS 코드</label>
                <div className="text-white">{formData.cms_code}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-text mb-1">현장명</label>
                <div className="text-white">{formData.site_name}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-text mb-1">현장 주소</label>
                <div className="text-white">{formData.site_address || '-'}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-text mb-1">영업 담당자</label>
                <div className="text-white">{formData.sales_manager || '-'}</div>
              </div>
            </div>

            {/* 매출/매입 정보 (자동 계산) */}
            <div className="border-t border-gray-border pt-4 mt-4">
              <h4 className="text-white font-medium mb-3">매출/매입 정보 (자동 계산)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-text mb-1">매출금액</label>
                  <div className="text-white font-mono">{formatNumber(salesAmount)} 원</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-text mb-1">매입금액</label>
                  <div className="text-white font-mono">{formatNumber(purchaseAmount)} 원</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-text mb-1">차액 (매출-매입)</label>
                  <div
                    className={`font-mono font-semibold ${
                      profitDifference < 0 ? 'text-red-500' : 'text-green-500'
                    }`}
                  >
                    {formatNumber(profitDifference)} 원
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-text mb-1">과투입 여부</label>
                  <div className={`font-semibold ${isOverInvested ? 'text-red-500' : 'text-green-500'}`}>
                    {isOverInvested ? '과투입' : '부'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 계산서 금액 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-text mb-2">
            계산서 금액 (원) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.invoice_amount || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                invoice_amount: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            className="input-field"
            placeholder="계산서 금액을 입력하세요"
            step="1000"
            min="0"
            required
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
            <Save className="h-5 w-5" />
            {loading ? '저장 중...' : '저장'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            취소
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-bg-lighter rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">계산서 발행 삭제</h3>
            <p className="text-gray-text mb-6">정말로 이 계산서 발행 기록을 삭제하시겠습니까?</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="btn-danger flex-1" disabled={loading}>
                {loading ? '삭제 중...' : '삭제'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
