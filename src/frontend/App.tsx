import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import ChangePasswordModal from './components/ChangePasswordModal';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import { InstallPrompt } from './components/InstallPrompt';
import WeeklyPlan from './pages/performance/WeeklyPlan';
import DailyPlan from './pages/performance/DailyPlan';
import SalesActivity from './pages/performance/SalesActivity';
import Invoice from './pages/performance/Invoice';
import CollectionManagement from './pages/performance/CollectionManagement';
import MonthlySales from './pages/analytics/MonthlySales';
import OrderAchievement from './pages/analytics/OrderAchievement';
import CollectionStatus from './pages/analytics/CollectionStatus';
import CostEfficiency from './pages/analytics/CostEfficiency';
import ActivityStatus from './pages/analytics/ActivityStatus';
import ConstructionSalesScore from './pages/analytics/ConstructionSalesScore';
import ConfirmedCollection from './pages/admin/ConfirmedCollection';
import OutstandingBalance from './pages/admin/OutstandingBalance';
import MonthlyOverInvestment from './pages/analytics/MonthlyOverInvestment';
import MonthlyCollection from './pages/admin/MonthlyCollection';
import type { User, LoginCredentials, ChangePasswordData } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isInitialPassword, setIsInitialPassword] = useState(false);

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('crm_user');
    const savedToken = localStorage.getItem('crm_token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem('crm_user');
        localStorage.removeItem('crm_token');
      }
    }
  }, []);

  const handleLogin = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError('');

    try {
      // Call API to login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success && data.user) {
        setUser(data.user);

        // Always save token in localStorage for API calls
        if (data.token) {
          localStorage.setItem('crm_token', data.token);
        }

        // Save user info if auto_login is enabled
        if (credentials.auto_login) {
          localStorage.setItem('crm_user', JSON.stringify(data.user));
        }

        // Check if password change is required
        if (data.user.is_initial_password) {
          setIsInitialPassword(true);
          setShowPasswordModal(true);
        }
      }
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (data: ChangePasswordData) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('crm_token')}`,
        },
        body: JSON.stringify({
          user_id: user?.id,
          new_password: data.new_password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Password change failed');
      }

      if (result.success) {
        // Update user state
        if (user) {
          const updatedUser = { ...user, is_initial_password: false };
          setUser(updatedUser);

          // Update localStorage if auto_login is enabled
          if (localStorage.getItem('crm_user')) {
            localStorage.setItem('crm_user', JSON.stringify(updatedUser));
          }
        }

        setShowPasswordModal(false);
        setIsInitialPassword(false);
      }
    } catch (err: any) {
      throw new Error(err.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPath('/');
    localStorage.removeItem('crm_user');
    localStorage.removeItem('crm_token');
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  // Render current page based on path
  const renderPage = () => {
    if (!user) return null;

    switch (currentPath) {
      case '/':
        return <Dashboard user={user} />;
      case '/performance/weekly-plan':
        return <WeeklyPlan user={user} />;
      case '/performance/daily-plan':
        return <DailyPlan user={user} />;
      case '/performance/sales-activity':
        return <SalesActivity user={user} />;
      case '/performance/invoice':
        return <Invoice user={user} />;
      case '/performance/collection':
        return <CollectionManagement user={user} />;
      case '/analytics/monthly-sales':
        return <MonthlySales user={user} />;
      case '/analytics/order-achievement':
        return <OrderAchievement user={user} />;
      case '/analytics/collection-status':
        return <CollectionStatus user={user} />;
      case '/analytics/cost-efficiency':
        return <CostEfficiency user={user} />;
      case '/analytics/activity-status':
        return <ActivityStatus user={user} />;
      case '/analytics/construction-sales-score':
        return <ConstructionSalesScore user={user} />;
      case '/admin/over-investment':
        return user.role === 'admin' ? <MonthlyOverInvestment user={user} /> : <Dashboard user={user} />;
      case '/admin/monthly-collection':
        return user.role === 'admin' ? <MonthlyCollection user={user} /> : <Dashboard user={user} />;
      case '/admin/confirmed-collection':
        return user.role === 'admin' ? <ConfirmedCollection user={user} /> : <Dashboard user={user} />;
      case '/admin/outstanding-balance':
        return user.role === 'admin' ? <OutstandingBalance user={user} /> : <Dashboard user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  // If not logged in, show login form
  if (!user) {
    return (
      <LoginForm
        onLogin={handleLogin}
        loading={loading}
        error={error}
      />
    );
  }

  // If logged in, show main app
  return (
    <>
      <Layout
        user={user}
        currentPath={currentPath}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        {renderPage()}
      </Layout>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        isInitialPassword={isInitialPassword}
        onClose={() => !isInitialPassword && setShowPasswordModal(false)}
        onSubmit={handleChangePassword}
        loading={loading}
      />

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </>
  );
}
