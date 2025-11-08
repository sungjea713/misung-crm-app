import React from 'react';
import { LogOut, User, Menu } from 'lucide-react';
import type { User as UserType } from '../types';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  onMenuToggle?: () => void;
}

export default function Header({ user, onLogout, onMenuToggle }: HeaderProps) {
  return (
    <header className="h-16 bg-bg-dark border-b border-gray-border">
      <div className="h-full flex items-center justify-between px-4 sm:px-6">
        {/* Left side - Menu button (mobile) and Title */}
        <div className="flex items-center gap-3">
          {/* 모바일 메뉴 버튼 */}
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="p-2 text-gray-text hover:text-white lg:hidden"
              aria-label="메뉴 열기"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}

          {/* Logo */}
          <img src="/misung-logo.png" alt="미성 E&C" className="h-8 sm:h-10" />
        </div>

        {/* Right side - User Info */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* User Details - 모바일에서 간소화 */}
          <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 bg-bg-card rounded-lg border border-gray-border">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <div className="text-xs sm:text-sm hidden sm:block">
              <p className="text-white font-medium">{user.name}</p>
              <p className="text-gray-text text-xs">{user.department}</p>
            </div>
            {/* 모바일에서는 이름만 표시 */}
            <span className="text-white text-sm sm:hidden">{user.name}</span>
            {user.role === 'admin' && (
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">
                관리자
              </span>
            )}
          </div>

          {/* Logout Button - 모바일에서 아이콘만 표시 */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 bg-bg-card hover:bg-gray-border text-text-secondary hover:text-white rounded-lg border border-gray-border transition-colors"
            aria-label="로그아웃"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">로그아웃</span>
          </button>
        </div>
      </div>
    </header>
  );
}