import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Users } from 'lucide-react';
import type { Construction, Item, ConstructionSalesDetail } from '../types';

interface ConstructionSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: ConstructionSalesDetail) => void;
  initialDetails?: ConstructionSalesDetail;
}

export default function ConstructionSalesModal({
  isOpen,
  onClose,
  onSave,
  initialDetails
}: ConstructionSalesModalProps) {
  const [constructions, setConstructions] = useState<Construction[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedConstruction, setSelectedConstruction] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [hasQuoteSubmitted, setHasQuoteSubmitted] = useState(false);
  const [hasMeetingConducted, setHasMeetingConducted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 초기값 설정
  useEffect(() => {
    if (initialDetails) {
      setSelectedConstruction(initialDetails.construction_id);
      setSelectedItem(initialDetails.item_id);
      setHasQuoteSubmitted(initialDetails.has_quote_submitted);
      setHasMeetingConducted(initialDetails.has_meeting_conducted);
    } else {
      // 초기화
      setSelectedConstruction(null);
      setSelectedItem(null);
      setHasQuoteSubmitted(false);
      setHasMeetingConducted(false);
      setSearchTerm('');
    }
  }, [initialDetails, isOpen]);

  // 건설사 및 품목 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadMasterData();
    }
  }, [isOpen]);

  const loadMasterData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');

      // 건설사 목록 로드
      const constructionsRes = await fetch('/api/constructions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!constructionsRes.ok) throw new Error('건설사 목록을 불러오는데 실패했습니다.');
      const constructionsData = await constructionsRes.json();

      // 품목 목록 로드
      const itemsRes = await fetch('/api/items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!itemsRes.ok) throw new Error('품목 목록을 불러오는데 실패했습니다.');
      const itemsData = await itemsRes.json();

      setConstructions(constructionsData.data || []);
      setItems(itemsData.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedConstruction) {
      setError('건설사를 선택해주세요.');
      return;
    }
    if (!selectedItem) {
      setError('품목을 선택해주세요.');
      return;
    }

    const detail: ConstructionSalesDetail = {
      construction_id: selectedConstruction,
      item_id: selectedItem,
      has_quote_submitted: hasQuoteSubmitted,
      has_meeting_conducted: hasMeetingConducted,
      construction: constructions.find(c => c.id === selectedConstruction),
      item: items.find(i => i.id === selectedItem)
    };

    onSave(detail);
  };

  // 건설사 필터링
  const filteredConstructions = constructions.filter(c =>
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* 배경 오버레이 */}
        <div
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* 모달 */}
        <div className="inline-block align-bottom bg-bg-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-bg-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-text-primary">
                건설사 영업 상세 정보
              </h3>
              <button
                onClick={onClose}
                className="text-gray-text hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="py-8 text-center text-gray-text">
                데이터를 불러오는 중...
              </div>
            ) : (
              <div className="space-y-4">
                {/* 건설사 선택 */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    건설사 선택 <span className="text-red-400">*</span>
                  </label>

                  {/* 검색 입력 */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-text" />
                    <input
                      type="text"
                      placeholder="건설사명 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-10"
                    />
                  </div>

                  {/* 건설사 목록 */}
                  <select
                    value={selectedConstruction || ''}
                    onChange={(e) => setSelectedConstruction(Number(e.target.value))}
                    className="input-field"
                    size={5}
                  >
                    <option value="" disabled>건설사를 선택하세요</option>
                    {filteredConstructions.map(construction => (
                      <option key={construction.id} value={construction.id}>
                        {construction.company_name}
                      </option>
                    ))}
                  </select>
                  {selectedConstruction && (
                    <div className="mt-2 text-sm text-primary">
                      선택됨: {constructions.find(c => c.id === selectedConstruction)?.company_name}
                    </div>
                  )}
                </div>

                {/* 품목 선택 */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    품목 선택 <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={selectedItem || ''}
                    onChange={(e) => setSelectedItem(Number(e.target.value))}
                    className="input-field"
                  >
                    <option value="">품목을 선택하세요</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.item_id} - {item.item_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 체크박스 */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasQuoteSubmitted}
                      onChange={(e) => setHasQuoteSubmitted(e.target.checked)}
                      className="w-4 h-4 text-primary bg-gray-input border-gray-border rounded focus:ring-primary focus:ring-offset-0 focus:ring-offset-bg-card"
                    />
                    <span className="text-text-primary flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-text" />
                      견적 제출
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasMeetingConducted}
                      onChange={(e) => setHasMeetingConducted(e.target.checked)}
                      className="w-4 h-4 text-primary bg-gray-input border-gray-border rounded focus:ring-primary focus:ring-offset-0 focus:ring-offset-bg-card"
                    />
                    <span className="text-text-primary flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-text" />
                      미팅 진행
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="bg-bg-darker px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedConstruction || !selectedItem}
              className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              확인
            </button>
            <button
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto mt-2 sm:mt-0"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}