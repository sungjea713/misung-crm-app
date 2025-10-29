import React from 'react';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function MobileSidebar({ isOpen, onClose, currentPath, onNavigate }: MobileSidebarProps) {
  const handleNavigate = (path: string) => {
    onNavigate(path);
    onClose(); // 네비게이션 후 자동으로 사이드바 닫기
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* 사이드바 슬라이드 패널 */}
      <div className={`
        fixed top-0 left-0 h-full z-50 lg:hidden
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="relative h-full bg-bg-dark">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-text hover:text-white p-2 z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* 사이드바 컨텐츠 */}
          <div className="h-full overflow-y-auto">
            <Sidebar currentPath={currentPath} onNavigate={handleNavigate} />
          </div>
        </div>
      </div>
    </>
  );
}