import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { SiteSearchInput } from './SiteSearchInput';
import { supabase } from '../lib/supabase';
import type { User, ConstructionSite, SalesActivity, SalesActivityFormData } from '../types';

interface SalesActivityFormProps {
  user: User;
  activity?: SalesActivity;
  onClose: () => void;
  onSave: (data: SalesActivityFormData) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export function SalesActivityForm({ user, activity, onClose, onSave, onDelete }: SalesActivityFormProps) {
  const isEdit = !!activity;
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [originalAttachments, setOriginalAttachments] = useState<string[]>([]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<SalesActivityFormData>({
    activity_date: activity?.activity_date || getTodayDate(),
    activity_type: activity?.activity_type || 'estimate',
    site_type: activity?.site_type || 'existing',
    cms_id: activity?.cms_id,
    cms_code: activity?.cms_code || '',
    site_name: activity?.site_name || '',
    site_address: activity?.site_address || '',
    client: activity?.client || '',
    amount: activity?.amount,
    execution_rate: activity?.execution_rate,
    attachments: activity?.attachments || [],
  });

  // Store original attachments on mount
  useEffect(() => {
    setOriginalAttachments(activity?.attachments || []);
  }, []);

  // Update formData when activity prop changes (for edit mode)
  useEffect(() => {
    if (activity) {
      setFormData({
        activity_date: activity.activity_date,
        activity_type: activity.activity_type,
        site_type: activity.site_type,
        cms_id: activity.cms_id,
        cms_code: activity.cms_code || '',
        site_name: activity.site_name || '',
        site_address: activity.site_address || '',
        client: activity.client || '',
        amount: activity.amount,
        execution_rate: activity.execution_rate,
        attachments: activity.attachments || [],
      });
    } else {
      // Reset form for new entry
      setFormData({
        activity_date: getTodayDate(),
        activity_type: 'estimate',
        site_type: 'existing',
        cms_id: undefined,
        cms_code: '',
        site_name: '',
        site_address: '',
        client: '',
        amount: undefined,
        execution_rate: undefined,
        attachments: [],
      });
    }
  }, [activity]);

  const handleSiteSelect = (site: ConstructionSite) => {
    setFormData({
      ...formData,
      cms_id: site.id,
      cms_code: site.cms,
      site_name: site.site_name,
      site_address: site.site_address,
      client: site.client,
    });
    setError('');
  };

  // 금액 입력 처리 (천 단위 콤마 표시)
  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const numberValue = numericValue === '' ? undefined : parseFloat(numericValue);
    setFormData({ ...formData, amount: numberValue });
  };

  // 천 단위 콤마 포맷
  const formatNumber = (value: number | undefined): string => {
    if (!value) return '';
    return value.toLocaleString('ko-KR');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name}은(는) 이미지 파일이 아닙니다.`);
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          throw new Error(`${file.name}의 크기가 5MB를 초과합니다.`);
        }

        // Generate unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('sales-activity-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('sales-activity-images')
          .getPublicUrl(filePath);

        console.log('Uploaded file path:', filePath);
        console.log('Public URL:', urlData.publicUrl);

        return urlData.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      setFormData({
        ...formData,
        attachments: [...(formData.attachments || []), ...uploadedUrls],
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err.message || '파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const removeAttachment = async (index: number) => {
    const attachmentUrl = formData.attachments?.[index];
    if (!attachmentUrl) return;

    // Extract file path from URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/sales-activity-images/{path}
    const urlParts = attachmentUrl.split('/sales-activity-images/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];

      // Delete from Supabase Storage
      try {
        const { error } = await supabase.storage
          .from('sales-activity-images')
          .remove([filePath]);

        if (error) {
          console.error('Error deleting file from storage:', error);
          // Continue anyway - don't block UI
        }
      } catch (err) {
        console.error('Error deleting file from storage:', err);
        // Continue anyway - don't block UI
      }
    }

    const newAttachments = formData.attachments?.filter((_, i) => i !== index) || [];
    setFormData({
      ...formData,
      attachments: newAttachments,
    });
  };

  // Cleanup newly uploaded images when canceling
  const cleanupNewAttachments = async () => {
    const newAttachments = formData.attachments?.filter(
      url => !originalAttachments.includes(url)
    ) || [];

    if (newAttachments.length === 0) return;

    const filePaths = newAttachments
      .map((url: string) => {
        const urlParts = url.split('/sales-activity-images/');
        return urlParts.length > 1 ? urlParts[1] : null;
      })
      .filter((path): path is string => path !== null);

    if (filePaths.length > 0) {
      try {
        await supabase.storage
          .from('sales-activity-images')
          .remove(filePaths);
        console.log(`Cleaned up ${filePaths.length} unsaved images`);
      } catch (err) {
        console.error('Error cleaning up unsaved images:', err);
      }
    }
  };

  const handleCancel = async () => {
    await cleanupNewAttachments();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.activity_date) {
      setError('활동 날짜를 선택해주세요.');
      return;
    }

    // If site_type is existing, require site selection
    if (formData.site_type === 'existing' && !formData.cms_id && !formData.cms_code) {
      setError('기존 현장을 선택해주세요.');
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
    if (!activity || !onDelete) return;

    setLoading(true);
    try {
      await onDelete(activity.id);
      onClose();
    } catch (err: any) {
      setError(err.message || '삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="page-container">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              목록으로
            </button>
            <h2 className="text-2xl font-bold text-white">
              {isEdit ? '영업 활동 수정' : '영업 활동 등록'}
            </h2>
          </div>
          <div className="flex gap-2">
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-secondary text-red-400 hover:bg-red-400/10 flex items-center gap-2"
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </button>
            )}
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="card space-y-6">
          {/* Activity Date */}
          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">
              활동 날짜 <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={formData.activity_date}
              onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          {/* Activity Type (견적/계약) */}
          <div>
            <label className="block text-sm font-medium text-gray-text mb-3">
              활동 구분 <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="activity_type"
                  value="estimate"
                  checked={formData.activity_type === 'estimate'}
                  onChange={(e) => setFormData({ ...formData, activity_type: 'estimate' })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-white">견적</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="activity_type"
                  value="contract"
                  checked={formData.activity_type === 'contract'}
                  onChange={(e) => setFormData({ ...formData, activity_type: 'contract' })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-white">계약</span>
              </label>
            </div>
          </div>

          {/* Site Type (기존/신규) */}
          <div>
            <label className="block text-sm font-medium text-gray-text mb-3">
              현장 구분 <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="site_type"
                  value="existing"
                  checked={formData.site_type === 'existing'}
                  onChange={(e) => setFormData({
                    ...formData,
                    site_type: 'existing',
                    // Clear site info when switching to existing
                    cms_id: undefined,
                    cms_code: '',
                    site_name: '',
                    site_address: '',
                    client: '',
                  })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-white">기존</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="site_type"
                  value="new"
                  checked={formData.site_type === 'new'}
                  onChange={(e) => setFormData({
                    ...formData,
                    site_type: 'new',
                    // Clear site info when switching to new
                    cms_id: undefined,
                    cms_code: '',
                    site_name: '',
                    site_address: '',
                    client: '',
                  })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-white">신규</span>
              </label>
            </div>
          </div>

          {/* Construction Site Search (only for existing) */}
          {formData.site_type === 'existing' && (
            <div>
              <label className="block text-sm font-medium text-gray-text mb-2">
                현장 검색 <span className="text-red-400">*</span>
              </label>
              <SiteSearchInput
                onSelect={handleSiteSelect}
                apiEndpoint="/api/sales-activities/construction-sites/search"
              />
              <p className="mt-1 text-sm text-gray-text">
                CMS번호, 현장명, 주소, 고객사로 검색하세요
              </p>

              {/* Selected Site Display */}
              {formData.cms_id && (
                <div className="mt-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-text">CMS 번호</label>
                          <p className="text-white font-medium">{formData.cms_code}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-text">현장명</label>
                          <p className="text-white font-medium">{formData.site_name}</p>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-text">현장 주소</label>
                          <p className="text-white">{formData.site_address}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-text">고객사</label>
                          <p className="text-white">{formData.client}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">
              금액 (원)
            </label>
            <input
              type="text"
              value={formatNumber(formData.amount)}
              onChange={(e) => handleAmountChange(e.target.value)}
              disabled={loading}
              className="input-field text-right"
              placeholder="0"
            />
          </div>

          {/* Execution Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">
              실행률 (%)
            </label>
            <input
              type="number"
              value={formData.execution_rate || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                if (value !== undefined && (value < 0 || value > 100)) return;
                setFormData({ ...formData, execution_rate: value });
              }}
              className="input-field"
              placeholder="0-100 사이의 숫자를 입력하세요"
              min="0"
              max="100"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-text mb-2">
              사진 첨부
            </label>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="btn-secondary cursor-pointer flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  사진 업로드
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-gray-text">
                  {formData.attachments && formData.attachments.length > 0
                    ? `${formData.attachments.length}개의 사진`
                    : '사진을 선택하세요'}
                </span>
              </div>

              {/* Image Preview */}
              {formData.attachments && formData.attachments.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.attachments.map((attachment, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={attachment}
                        alt={`첨부 이미지 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-card border border-gray-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">영업 활동 삭제</h3>
            <p className="text-gray-text mb-6">정말로 이 영업 활동을 삭제하시겠습니까?</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
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
