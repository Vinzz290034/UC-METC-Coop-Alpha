import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/authContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { ToastContainer } from './components/Toast';

// Guard that redirects non-admin users to the dashboard
const AdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// Guard that allows admin and user, but blocks staff
const NotStaff: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role === 'staff') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

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
import { SettingsPage } from './pages/SettingsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { getMaintenanceState, MaintenanceState, setMaintenanceState, syncMaintenanceStateFromBackend } from './utils/maintenanceManager';
import { Wrench } from 'lucide-react';


function AppContent() {
  const { user, isAuthenticated, isValidating } = useAuth();
  const navigate = useNavigate();
  const prevAuthRef = useRef<boolean | null>(null);
  
  // ── Maintenance Mode State Listener & Global Backend Sync ──
  const [maintenanceState, setMaintenanceStateState] = useState<MaintenanceState>(getMaintenanceState);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<MaintenanceState>;
      if (customEvent.detail) {
        setMaintenanceStateState(customEvent.detail);
      } else {
        setMaintenanceStateState(getMaintenanceState());
      }
    };

    window.addEventListener('silms_maintenance_updated', handleUpdate);

    // Initial backend global sync check on page load
    syncMaintenanceStateFromBackend().then(synced => {
      if (synced) setMaintenanceStateState(synced);
    });

    // Check when user switches tabs, refocuses window, or unlocks phone screen
    const handleFocus = () => {
      syncMaintenanceStateFromBackend().then(synced => {
        if (synced) setMaintenanceStateState(synced);
      });
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // Periodic global sync polling every 10 seconds across all active sessions
    const pollInterval = setInterval(() => {
      syncMaintenanceStateFromBackend().then(synced => {
        if (synced) setMaintenanceStateState(synced);
      });
    }, 10000);

    return () => {
      window.removeEventListener('silms_maintenance_updated', handleUpdate);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      clearInterval(pollInterval);
    };
  }, []);

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
      console.log('[APP] Logout detected! Checking maintenance state before navigating');
      // Await backend sync so we have accurate maintenance state before deciding redirect
      syncMaintenanceStateFromBackend().then((currentMaint) => {
        if (!currentMaint.enabled) {
          navigate('/', { replace: true });
        }
        // If maintenance is ON, stay on MaintenancePage — do NOT redirect to login
      });
    }

    // Update ref for next comparison
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, isValidating, navigate]);

  // Show blank screen while validating to prevent any cached state from flashing
  if (isValidating) {
    return <div className="w-full h-screen bg-white flex items-center justify-center" />;
  }

  // ── MAINTENANCE MODE GUARD ──
  // If maintenance mode is ON and user is NOT an admin, block access and show MaintenancePage
  const isAdmin = user && user.role === 'admin';
  
  if (maintenanceState.enabled && !isAdmin) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<MaintenancePage />} />
      </Routes>
    );
  }

  return (
    <>
      <ScrollToTop />
      {/* Persistent Banner for Admin when Maintenance Mode is ON */}
      {maintenanceState.enabled && isAdmin && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between shadow-md z-[9999] relative border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="animate-bounce text-amber-200" />
            <span>
              <strong>MAINTENANCE MODE IS ACTIVE:</strong> Public portal and non-admin access are restricted. You are viewing in Admin Bypass mode.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setMaintenanceState(false);
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer"
            >
              Turn Off Maintenance Mode
            </button>
            <button 
              onClick={() => navigate('/settings')} 
              className="bg-slate-900/60 hover:bg-slate-900 text-amber-200 px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer"
            >
              System Settings
            </button>
          </div>
        </div>
      )}

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
                <Route path="/feedback" element={<NotStaff><FeedbackPage /></NotStaff>} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/lockers" element={<LockerManagementPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/members" element={<MembersPage />} />
                <Route path="/user-management" element={<UserManagementPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/announcements-management" element={<AdminOnly><AnnouncementsManagementPage /></AdminOnly>} />
                <Route path="/account-settings" element={<AccountSettingsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
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
