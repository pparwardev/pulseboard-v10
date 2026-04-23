import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { SessionProvider } from './contexts/SessionContext';
import { MetricsProvider } from './contexts/MetricsContext';
import LandingPage from './pages/LandingPage';
import RegisterPageNew from './pages/RegisterPageNew';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardLayout from './layouts/DashboardLayout';
import ManagerDashboardV2 from './pages/ManagerDashboardV2';
import MemberDashboardV2 from './pages/MemberDashboardV2';
import ProfilePageNew from './pages/ProfilePageNew';
import MembersPage from './pages/MembersPage';
import RegistrationApprovalsPage from './pages/RegistrationApprovalsPage';
import PollPage from './pages/PollPage';
import WallOfFamePage from './pages/WallOfFamePage';
import OTLeaveTrackerPage from './pages/OTLeaveTrackerPage';
import LeaveCalendarPage from './pages/LeaveCalendarPage';
import TeamUpdatesPage from './pages/TeamUpdatesPage';
import PerformanceAnalyticsPage from './pages/PerformanceAnalyticsPageNew';
import PublishedMetricPage from './pages/PublishedMetricPage';
import PerformancePage from './pages/PerformancePage';
import FileManagerPage from './pages/FileManagerPage';
import FileManagerV2Page from './pages/FileManagerV2Page';
import MetricsConfigPage from './pages/MetricsConfigPage';
import MetricDetailPage from './pages/MetricDetailPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const path = window.location.pathname;

  if (path === '/dashboard') {
    if (user.role === 'specialist') return <Navigate to="/member-dashboard" replace />;
    if (user.role === 'manager') return <Navigate to="/manager-dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <MetricsProvider>
      <BrowserRouter>
        <SessionProvider>
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`star star-${i + 1}`}></div>
          ))}
          <Toaster
            position="top-right"
            toastOptions={{ duration: 3000, style: { borderRadius: '12px', padding: '12px 16px' } }}
          />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPageNew />} />

            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Navigate to="/manager-dashboard" replace />} />
              <Route path="/manager-dashboard" element={<ManagerDashboardV2 />} />
              <Route path="/member-dashboard" element={<MemberDashboardV2 />} />
              <Route path="/profile" element={<ProfilePageNew />} />
              <Route path="/profile/:memberId" element={<ProfilePageNew />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/registrations" element={<RegistrationApprovalsPage />} />
              <Route path="/polls" element={<PollPage />} />
              <Route path="/wall-of-fame" element={<WallOfFamePage />} />
              <Route path="/ot" element={<OTLeaveTrackerPage />} />
              <Route path="/leave-calendar" element={<LeaveCalendarPage />} />
              <Route path="/team-updates" element={<TeamUpdatesPage />} />
              <Route path="/performance" element={<PerformanceAnalyticsPage />} />
              <Route path="/performance-analytics" element={<PerformanceAnalyticsPage />} />
              <Route path="/performance/:memberId" element={<PerformancePage />} />
              <Route path="/published-metric/:metricCode" element={<PublishedMetricPage />} />
              <Route path="/file-manager" element={<FileManagerPage />} />
              <Route path="/file-manager-v2" element={<FileManagerV2Page />} />
              <Route path="/metrics-config" element={<MetricsConfigPage />} />
              <Route path="/my-performance" element={<PerformancePage />} />
              <Route path="/my-performance/:memberId" element={<PerformancePage />} />
              <Route path="/metric-detail/:memberId/:metricName" element={<MetricDetailPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SessionProvider>
      </BrowserRouter>
      </MetricsProvider>
    </ThemeProvider>
  );
}
