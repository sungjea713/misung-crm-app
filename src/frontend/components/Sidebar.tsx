import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Calendar,
  CalendarDays,
  Users,
  FileCheck,
  Wallet,
  TrendingUp,
  Target,
  CreditCard,
  DollarSign,
  Activity,
  ChevronDown,
  ChevronRight,
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  userRole?: 'admin' | 'user';
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    id: 'performance',
    label: '실적 입력',
    icon: FileText,
    children: [
      {
        id: 'weekly-plan',
        label: '주간 업무 계획',
        icon: Calendar,
        path: '/performance/weekly-plan',
      },
      {
        id: 'daily-plan',
        label: '일일 업무 일지',
        icon: CalendarDays,
        path: '/performance/daily-plan',
      },
      {
        id: 'sales-activity',
        label: '영업 활동',
        icon: Users,
        path: '/performance/sales-activity',
      },
      {
        id: 'invoice',
        label: '계산서 발행',
        icon: FileCheck,
        path: '/performance/invoice',
      },
      {
        id: 'collection',
        label: '수금 관리',
        icon: Wallet,
        path: '/performance/collection',
      },
    ],
  },
  {
    id: 'analytics',
    label: '분석 / 대시보드',
    icon: BarChart3,
    children: [
      {
        id: 'activity-status',
        label: '영업/현장 관리 실행',
        icon: Activity,
        path: '/analytics/activity-status',
      },
      {
        id: 'monthly-sales',
        label: '월별매출 및 목표달성',
        icon: TrendingUp,
        path: '/analytics/monthly-sales',
      },
      {
        id: 'order-achievement',
        label: '수주 실적 및 목표달성률',
        icon: Target,
        path: '/analytics/order-achievement',
      },
      {
        id: 'cost-efficiency',
        label: '원가 투입 효율 관리',
        icon: DollarSign,
        path: '/analytics/cost-efficiency',
      },
      {
        id: 'collection-status',
        label: '수금 실적 및 미수금',
        icon: CreditCard,
        path: '/analytics/collection-status',
      },
    ],
  },
  {
    id: 'admin',
    label: '관리자 입력',
    icon: Shield,
    children: [
      {
        id: 'over-investment',
        label: '월별 과투입 현황',
        icon: AlertTriangle,
        path: '/admin/over-investment',
      },
      {
        id: 'confirmed-collection',
        label: '월별 확정 수금',
        icon: CheckCircle,
        path: '/admin/confirmed-collection',
      },
      {
        id: 'outstanding-balance',
        label: '월별 미수금 누계',
        icon: TrendingDown,
        path: '/admin/outstanding-balance',
      },
    ],
  },
];

export default function Sidebar({ currentPath, onNavigate, userRole }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['performance', 'analytics']);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return currentPath === path;
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else if (item.path) {
              onNavigate(item.path);
            }
          }}
          className={`
            w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
            ${level === 0 ? 'text-base' : 'text-sm pl-12'}
            ${
              active
                ? 'bg-primary/10 text-primary border-r-2 border-primary'
                : 'text-text-secondary hover:bg-bg-card hover:text-white'
            }
          `}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1">{item.label}</span>
          {hasChildren && (
            <div className="text-gray-text">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </button>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="bg-bg-darker">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-bg-dark h-full border-r border-gray-border flex flex-col">
      {/* Logo / Brand */}
      <div className="px-4 py-6 border-b border-gray-border">
        <h2 className="text-xl font-bold text-primary">미성 E&C</h2>
        <p className="text-sm text-gray-text mt-1">CRM System</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems
          .filter((item) => item.id !== 'admin' || userRole === 'admin')
          .map((item) => renderMenuItem(item))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-border">
        <p className="text-xs text-gray-text text-center">v1.0.0</p>
      </div>
    </div>
  );
}
