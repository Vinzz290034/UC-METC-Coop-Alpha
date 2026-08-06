import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/authContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { ToastContainer } from './components/Toast';
import { useEffect, useRef } from 'react';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LearnMorePage } from './pages/LearnMorePage';
import { DashboardPage } from './pages/DashboardPage';
import { LockerManagementPage } from './pages/LockerManagementPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesPage } from './pages/SalesPage';
import { MembersPage } from './pages/MembersPage';
import { ReportsPage } from './pages/ReportsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { AnnouncementsManagementPage } from './pages/AnnouncementsManagementPage';
import { CommunityPage } from './pages/CommunityPage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { MerchandisePage } from './pages/MerchandisePage';
import { CartPage } from './pages/CartPage';
import { LockerPage } from './pages/LockerPage';
import { TransactionPage } from './pages/TransactionPage';
import { BillingHistoryPage } from './pages/BillingHistoryPage';
import { InboxPage } from './pages/InboxPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { KioskPage } from './pages/KioskPage';
import { PublicReceiptPage } from './pages/PublicReceiptPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { FeedbackPage } from './pages/FeedbackPage';


function AppContent() {
  const { isAuthenticated, isValidating } = useAuth();
  const navigate = useNavigate();
  const prevAuthRef = useRef<boolean | null>(null);

  // Track authentication state changes and redirect on logout
  useEffect(() => {
    console.log('[APP] Auth state:', { isAuthenticated, isValidating, prevAuth: prevAuthRef.current });
    
    // Skip during initial validation
    if (isValidating) {
      return;
    }

    // Initialize the ref on first render after validation
    if (prevAuthRef.current === null) {
      console.log('[APP] Initializing prevAuthRef to:', isAuthenticated);
      prevAuthRef.current = isAuthenticated;
      return;
    }

    // Detect logout: was authenticated, now not authenticated
    if (prevAuthRef.current === true && isAuthenticated === false) {
      console.log('[APP] Logout detected! Navigating to landing page');
      navigate('/', { replace: true });
    }

    // Update ref for next comparison
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, isValidating, navigate]);

  // Show blank screen while validating to prevent any cached state from flashing
  if (isValidating) {
    return <div className="w-full h-screen bg-white flex items-center justify-center" />;
  }

  return (
    <>
      <ScrollToTop />
      {!isAuthenticated ? (
        <Routes key="unauthenticated">
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/learn-more" element={<LearnMorePage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/receipt/:receiptNo" element={<PublicReceiptPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Routes key="authenticated">
          {/* Render Kiosk page directly, without the Layout wrapper */}
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="/receipt/:receiptNo" element={<PublicReceiptPage />} />
          
          {/* Other admin/user pages are wrapped inside the Layout */}
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/merchandise" element={<MerchandisePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/locker" element={<LockerPage />} />
                <Route path="/transaction" element={<TransactionPage />} />
                <Route path="/billing-history" element={<BillingHistoryPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/lockers" element={<LockerManagementPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/members" element={<MembersPage />} />
                <Route path="/user-management" element={<UserManagementPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/announcements-management" element={<AnnouncementsManagementPage />} />
                <Route path="/account-settings" element={<AccountSettingsPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          } />
        </Routes>
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
