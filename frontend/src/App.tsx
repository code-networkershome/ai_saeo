import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { useAuth } from './contexts/AuthContext';
import { AEODashboard } from './pages/dashboard/AEODashboard';
import { SEOAudit } from './pages/dashboard/SEOAudit';
import { KeywordTools } from './pages/dashboard/KeywordTools';
import { ContentLab } from './pages/dashboard/ContentLab';
import { CompetitorTools } from './pages/dashboard/CompetitorTools';
import { AnalyticsDashboard } from './pages/dashboard/AnalyticsDashboard';

import { DashboardProvider } from './contexts/DashboardContext';


function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          user ? (
            <DashboardProvider>
              <DashboardLayout />
            </DashboardProvider>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="aeo" element={<AEODashboard />} />
        <Route path="audit" element={<SEOAudit />} />
        <Route path="keywords" element={<KeywordTools />} />
        <Route path="content" element={<ContentLab />} />
        <Route path="competitors" element={<CompetitorTools />} />
        <Route path="settings" element={<div>User Settings - Coming Soon</div>} />

      </Route>

      {/* Auth Callback Route */}
      <Route path="/auth/callback" element={<Navigate to="/dashboard" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
