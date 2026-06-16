import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ForceResetModal from './components/ForceResetModal';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import ClientDashboard from './components/ClientDashboard';
import DeveloperDashboard from './components/DeveloperDashboard';
import ManagerDashboard from './components/ManagerDashboard';

// ── Protect Route Wrapper ──
const ProtectedRoute = ({ children, requiredLevel }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Strictly enforce that the user's access level matches the required level for the dashboard
  if (user.access_level !== requiredLevel) {
    if (user.access_level === 90) return <Navigate to="/dashboard/admin" replace />;
    if (user.access_level === 70) return <Navigate to="/dashboard/manager" replace />;
    if (user.access_level === 55) return <Navigate to="/dashboard/developer" replace />;
    return <Navigate to="/dashboard/client" replace />;
  }

  return children;
};

// ── Authenticated Layout ──
const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-canvas font-sans">
      <ForceResetModal />
      
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-text-primary tracking-tight leading-none">
                  Mentis
                </h1>
                <p className="text-[11px] text-text-muted font-medium tracking-wide uppercase mt-0.5">
                  Command Center
                </p>
              </div>
            </div>

            {/* Nav Links based on Role */}
            <div className="flex items-center gap-6">
              <nav className="hidden sm:flex items-center gap-1">
                {user?.access_level === 90 && (
                  <button
                    onClick={() => navigate('/dashboard/admin')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      location.pathname.includes('/admin') ? 'bg-surface text-accent shadow-sm' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Admin Setup
                  </button>
                )}
                {user?.access_level === 70 && (
                  <button
                    onClick={() => navigate('/dashboard/manager')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      location.pathname.includes('/manager') ? 'bg-surface text-accent shadow-sm' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Analytics
                  </button>
                )}
                {user?.access_level === 55 && (
                  <button
                    onClick={() => navigate('/dashboard/developer')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      location.pathname.includes('/developer') ? 'bg-surface text-accent shadow-sm' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Kanban
                  </button>
                )}
                {user?.access_level === 25 && (
                  <button
                    onClick={() => navigate('/dashboard/client')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      location.pathname.includes('/client') ? 'bg-surface text-accent shadow-sm' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    My Tickets
                  </button>
                )}
              </nav>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-3 border-l border-border pl-6">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-text-primary leading-none">{user?.real_name}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Level {user?.access_level}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-text-muted hover:text-status-new-text hover:bg-status-new-bg rounded-lg transition-colors"
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1440px] mx-auto px-6 lg:px-8 py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
};

function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard/client" replace /> : <Login />} />
      
      {/* ── Client Route (Lowest Tier - 25) ── */}
      <Route path="/dashboard/client" element={
        <ProtectedRoute requiredLevel={25}>
          <DashboardLayout><ClientDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ── Developer Route (Tier - 55) ── */}
      <Route path="/dashboard/developer" element={
        <ProtectedRoute requiredLevel={55}>
          <DashboardLayout><DeveloperDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ── Manager Route (Tier - 70) ── */}
      <Route path="/dashboard/manager" element={
        <ProtectedRoute requiredLevel={70}>
          <DashboardLayout><ManagerDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ── Admin Route (Tier - 90) ── */}
      <Route path="/dashboard/admin" element={
        <ProtectedRoute requiredLevel={90}>
          <DashboardLayout><AdminPanel /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Default Fallback */}
      <Route path="*" element={<Navigate to={user ? "/dashboard/client" : "/login"} replace />} />
    </Routes>
  );
}

export default App;