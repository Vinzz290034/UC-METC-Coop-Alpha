import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/authContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { ToastContainer } from './components/Toast';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LearnMorePage } from './pages/LearnMorePage';
import { DashboardPage } from './pages/DashboardPage';
import { LockerManagementPage } from './pages/LockerManagementPage';
import { SalesInventoryPage } from './pages/SalesInventoryPage';
import { KeyDuplicationPage } from './pages/KeyDuplicationPage';
import { MembersPage } from './pages/MembersPage';
import { BillingPage } from './pages/BillingPage';
import { ReportsPage } from './pages/ReportsPage';
import { DTRPage } from './pages/DTRPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { CommunityPage } from './pages/CommunityPage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { MerchandisePage } from './pages/MerchandisePage';
import { CartPage } from './pages/CartPage';
import { LockerPage } from './pages/LockerPage';
import { TransactionPage } from './pages/TransactionPage';
import { BillingHistoryPage } from './pages/BillingHistoryPage';
import { EventsPage } from './pages/EventsPage';
import { InboxPage } from './pages/InboxPage';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <ScrollToTop />
      {!isAuthenticated ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/learn-more" element={<LearnMorePage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/merchandise" element={<MerchandisePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/locker" element={<LockerPage />} />
            <Route path="/transaction" element={<TransactionPage />} />
            <Route path="/billing-history" element={<BillingHistoryPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/lockers" element={<LockerManagementPage />} />
            <Route path="/sales" element={<SalesInventoryPage />} />
            <Route path="/keys" element={<KeyDuplicationPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/dtr" element={<DTRPage />} />
            <Route path="/account-settings" element={<AccountSettingsPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastContainer />
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
