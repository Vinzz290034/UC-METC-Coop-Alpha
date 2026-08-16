import React, { useState, useEffect } from 'react';
import { 
  Menu,
  Settings as SettingsIcon, 
  Clock, 
  ShieldCheck, 
  Bell, 
  User, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Smartphone, 
  Mail, 
  Key, 
  Cpu, 
  Eye, 
  Sparkles,
  Info,
  History,
  Globe,
  Laptop,
  ChevronLeft,
  ChevronRight,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../store/authContext';
import { useUIStore } from '../store/uiStore';
import { formatFullName } from '../utils/nameFormatter';
import { getAuditLogs, AuditSessionEntry } from '../utils/sessionAuditTracker';
import { getMaintenanceState, setMaintenanceState, MaintenanceState } from '../utils/maintenanceManager';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { setSidebarOpen, showNotification } = useUIStore();

  // ── System Maintenance Mode State ──
  const [maintState, setMaintState] = useState<MaintenanceState>(getMaintenanceState);
  const [maintMessage, setMaintMessage] = useState<string>(maintState.message);
  const [maintEta, setMaintEta] = useState<string>(maintState.eta);
  const [isMaintSaved, setIsMaintSaved] = useState<boolean>(false);

  // Keep SettingsPage UI in sync with maintenance state events instantly
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<MaintenanceState>;
      if (customEvent.detail) {
        setMaintState(customEvent.detail);
        if (customEvent.detail.message) setMaintMessage(customEvent.detail.message);
        if (customEvent.detail.eta !== undefined) setMaintEta(customEvent.detail.eta);
      } else {
        const current = getMaintenanceState();
        setMaintState(current);
        if (current.message) setMaintMessage(current.message);
        if (current.eta !== undefined) setMaintEta(current.eta);
      }
    };

    window.addEventListener('silms_maintenance_updated', handleUpdate);
    return () => window.removeEventListener('silms_maintenance_updated', handleUpdate);
  }, []);

  const handleMaintenanceToggle = () => {
    const nextEnabled = !maintState.enabled;
    // Immediate optimistic state update
    setMaintState(prev => ({ ...prev, enabled: nextEnabled }));
    const updated = setMaintenanceState(nextEnabled, maintMessage, maintEta);
    setMaintState(updated);
    showNotification(
      nextEnabled ? 'Maintenance Mode ENABLED & synced globally!' : 'Maintenance Mode DISABLED — Portal is back online!',
      'success'
    );
  };

  const handleSaveMaintenanceInfo = () => {
    const updated = setMaintenanceState(maintState.enabled, maintMessage, maintEta);
    setMaintState(updated);
    setIsMaintSaved(true);
    showNotification('Maintenance announcement saved and synced globally across all devices!', 'success');
    setTimeout(() => setIsMaintSaved(false), 3500);
  };

  // ── Session Timeout State ──
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState<boolean>(() => {
    const userKey = user ? `silms_session_timeout_enabled_${user.id}` : 'silms_session_timeout_enabled';
    const savedUser = localStorage.getItem(userKey);
    if (savedUser !== null) return savedUser === 'true';
    const savedGlobal = localStorage.getItem('silms_session_timeout_enabled');
    return savedGlobal !== null ? savedGlobal === 'true' : true;
  });

  const [sessionDuration, setSessionDuration] = useState<string>(() => {
    const durationUserKey = user ? `silms_session_timeout_duration_${user.id}` : 'silms_session_timeout_duration';
    return localStorage.getItem(durationUserKey) || localStorage.getItem('silms_session_timeout_duration') || '30';
  });

  // Re-sync session timeout preferences whenever user profile loads/switches
  useEffect(() => {
    if (!user) return;
    const userKey = `silms_session_timeout_enabled_${user.id}`;
    const savedUser = localStorage.getItem(userKey);
    if (savedUser !== null) {
      setSessionTimeoutEnabled(savedUser === 'true');
    } else {
      const savedGlobal = localStorage.getItem('silms_session_timeout_enabled');
      setSessionTimeoutEnabled(savedGlobal !== null ? savedGlobal === 'true' : true);
    }

    const durationUserKey = `silms_session_timeout_duration_${user.id}`;
    const savedDurationUser = localStorage.getItem(durationUserKey);
    if (savedDurationUser) {
      setSessionDuration(savedDurationUser);
    } else {
      const savedDurationGlobal = localStorage.getItem('silms_session_timeout_duration');
      setSessionDuration(savedDurationGlobal || '30');
    }
  }, [user]);

  // ── Audit Logs Pagination State ──
  const [auditCurrentPage, setAuditCurrentPage] = useState<number>(1);
  const AUDIT_LOGS_PER_PAGE = 4;

  // ── Other Preferences States ──
  const [emailReceiptsEnabled, setEmailReceiptsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('silms_email_receipts_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [lockerWarningsEnabled, setLockerWarningsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('silms_locker_warnings_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [announcementAlertsEnabled, setAnnouncementAlertsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('silms_announcements_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [compactViewEnabled, setCompactViewEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('silms_compact_view');
    return saved !== null ? saved === 'true' : false;
  });

  // Save settings on changes
  const handleSessionTimeoutToggle = () => {
    const newValue = !sessionTimeoutEnabled;
    setSessionTimeoutEnabled(newValue);
    if (user) {
      localStorage.setItem(`silms_session_timeout_enabled_${user.id}`, String(newValue));
    }
    localStorage.setItem('silms_session_timeout_enabled', String(newValue));
    window.dispatchEvent(new Event('silms_settings_updated'));
  };

  const handleDurationChange = (duration: string) => {
    setSessionDuration(duration);
    if (user) {
      localStorage.setItem(`silms_session_timeout_duration_${user.id}`, duration);
    }
    localStorage.setItem('silms_session_timeout_duration', duration);
    window.dispatchEvent(new Event('silms_settings_updated'));
  };

  const handleEmailReceiptsToggle = () => {
    const newValue = !emailReceiptsEnabled;
    setEmailReceiptsEnabled(newValue);
    localStorage.setItem('silms_email_receipts_enabled', String(newValue));
    window.dispatchEvent(new Event('silms_settings_updated'));
  };

  const handleLockerWarningsToggle = () => {
    const newValue = !lockerWarningsEnabled;
    setLockerWarningsEnabled(newValue);
    localStorage.setItem('silms_locker_warnings_enabled', String(newValue));
    window.dispatchEvent(new Event('silms_settings_updated'));
  };

  const handleAnnouncementsToggle = () => {
    const newValue = !announcementAlertsEnabled;
    setAnnouncementAlertsEnabled(newValue);
    localStorage.setItem('silms_announcements_enabled', String(newValue));
    window.dispatchEvent(new Event('silms_settings_updated'));
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-8 space-y-8 animate-slide-in-right">
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden flex items-center gap-3 mb-2">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center bg-white border border-purple-100 rounded-xl shadow-sm hover:bg-purple-50 hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-purple-600" />
        </button>
        <span className="font-extrabold text-slate-900 text-lg">Settings</span>
      </div>

      {/* ── Top Header Banner ── */}
      <div className="bg-[#166534] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-emerald-200 border border-white/20 uppercase tracking-wider">
              <SettingsIcon size={14} className="text-emerald-300 animate-spin-slow" /> User Preferences & Security
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">System Settings</h1>
            <p className="text-emerald-100 text-sm max-w-xl">
              Configure your session timeout preferences, notification alerts, security policies, and application settings.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── LEFT COLUMN (Main Settings) ── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ── SYSTEM MAINTENANCE MODE CONTROL CARD (ADMIN ONLY) ── */}
          {user && user.role === 'admin' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold flex-shrink-0 mt-0.5 sm:mt-0">
                  <Wrench size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-slate-900 text-base sm:text-lg leading-tight">System Maintenance Mode</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900">
                      Admin Tool
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Lock public portal access and display a customized maintenance notice to non-admin visitors.
                  </p>
                </div>
              </div>

              {/* Sliding Toggle Switch */}
              <button
                type="button"
                onClick={handleMaintenanceToggle}
                style={{ minHeight: '28px', height: '28px', minWidth: '48px', width: '48px' }}
                className={`no-min-target relative inline-flex h-7 w-12 p-0.5 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  maintState.enabled ? 'bg-amber-600 shadow-md' : 'bg-slate-300'
                }`}
                aria-label="Toggle System Maintenance Mode"
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 flex-shrink-0 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    maintState.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Status Details Box */}
            <div className={`p-4 rounded-2xl border transition-all duration-300 ${
              maintState.enabled 
                ? 'bg-amber-50 border-amber-300 text-amber-950' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-start gap-3">
                {maintState.enabled ? (
                  <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5 animate-bounce" />
                ) : (
                  <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-extrabold text-sm">
                    {maintState.enabled ? 'SYSTEM MAINTENANCE MODE IS CURRENTLY ACTIVE' : 'Portal is Operating Normally (Maintenance Mode OFF)'}
                  </p>
                  <p className="text-xs leading-relaxed opacity-90">
                    {maintState.enabled 
                      ? 'Users will see the maintenance screen when accessing the site. Administrators and Staff can continue using the portal.'
                      : 'All users have normal access to online ordering, lockers, transactions, and portal features.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Config Inputs & Actions */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Custom Maintenance Notice / Message
                </label>
                <textarea
                  rows={2}
                  value={maintMessage}
                  onChange={(e) => setMaintMessage(e.target.value)}
                  placeholder="Explain why the system is under maintenance..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Estimated Completion / Uptime (Optional)
                </label>
                <input
                  type="text"
                  value={maintEta}
                  onChange={(e) => setMaintEta(e.target.value)}
                  placeholder="e.g. Expected back at 3:00 PM today"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveMaintenanceInfo}
                  className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-2 ${
                    isMaintSaved
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                  }`}
                >
                  {isMaintSaved ? (
                    <>
                      <CheckCircle2 size={16} className="animate-bounce text-white" />
                      ✓ Announcement Saved & Synced!
                    </>
                  ) : (
                    'Save Maintenance Announcement'
                  )}
                </button>
              </div>
            </div>
          </div>
          )}

          {/* ── SESSION TIMEOUT CARD ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold flex-shrink-0 mt-0.5 sm:mt-0">
                  <Clock size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-black text-slate-900 text-base sm:text-lg leading-tight">Session Timeout Settings</h2>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Manage auto-logout behavior during periods of user inactivity.</p>
                </div>
              </div>

              {/* Sliding Toggle Switch */}
              <button
                type="button"
                onClick={handleSessionTimeoutToggle}
                style={{ minHeight: '28px', height: '28px', minWidth: '48px', width: '48px' }}
                className={`no-min-target relative inline-flex h-7 w-12 p-0.5 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  sessionTimeoutEnabled ? 'bg-emerald-600 shadow-md' : 'bg-slate-300'
                }`}
                aria-label="Toggle Session Timeout"
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 flex-shrink-0 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    sessionTimeoutEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Status Details */}
            <div className={`p-4 rounded-2xl border transition-all duration-300 ${
              sessionTimeoutEnabled 
                ? 'bg-purple-50/70 border-purple-200 text-purple-950' 
                : 'bg-slate-100/70 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-start gap-3">
                {sessionTimeoutEnabled ? (
                  <CheckCircle2 size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="text-slate-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-extrabold text-sm">
                    {sessionTimeoutEnabled ? 'Session Timeout is ACTIVE' : 'Session Timeout is DISABLED'}
                  </p>
                  <p className="text-xs leading-relaxed opacity-90">
                    {sessionTimeoutEnabled 
                      ? `Your session will automatically lock and log out after ${sessionDuration} minutes of zero mouse or keyboard activity to protect your account.`
                      : 'You will remain signed into SILMS continuously without automatic idle timeouts. Ensure you manually log out on shared computers.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeout Duration Selector (Enabled when ON) */}
            {sessionTimeoutEnabled && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Select Inactivity Period Before Auto-Logout
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: '15 Mins', value: '15' },
                    { label: '30 Mins', value: '30' },
                    { label: '1 Hour', value: '60' },
                    { label: '2 Hours', value: '120' },
                  ].map((dur) => (
                    <button
                      key={dur.value}
                      type="button"
                      onClick={() => handleDurationChange(dur.value)}
                      className={`py-3 px-4 rounded-2xl font-bold text-xs border transition-all cursor-pointer ${
                        sessionDuration === dur.value
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-[1.02]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RECENT LOGIN ACTIVITY & AUDIT LOGS CARD ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                <History size={20} />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-base sm:text-lg">Recent Login Activity & Audit Logs</h2>
                <p className="text-xs text-slate-500">Track active session connections, IP locations, and security authentication logs.</p>
              </div>
            </div>

            {(() => {
              const allAuditLogs = getAuditLogs(user?.id || '');
              const totalAuditPages = Math.ceil(allAuditLogs.length / AUDIT_LOGS_PER_PAGE) || 1;
              const currentPageEffective = Math.min(auditCurrentPage, totalAuditPages);
              const paginatedLogs = allAuditLogs.slice(
                (currentPageEffective - 1) * AUDIT_LOGS_PER_PAGE,
                currentPageEffective * AUDIT_LOGS_PER_PAGE
              );

              return (
                <>
                  <div className="space-y-3">
                    {paginatedLogs.map((log: AuditSessionEntry, idx: number) => {
                      const isActive = log.status === 'active';
                      const isVerified = log.status === 'verified';
                      return (
                        <div 
                          key={log.id || idx}
                          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            isActive 
                              ? 'bg-emerald-50/70 border-emerald-200/80 shadow-xs' 
                              : isVerified 
                              ? 'bg-purple-50/50 border-purple-200/70' 
                              : 'bg-slate-50 border-slate-200/70'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 font-bold ${
                              isActive ? 'bg-emerald-100 text-emerald-800' : isVerified ? 'bg-purple-100 text-purple-700' : 'bg-slate-200/80 text-slate-700'
                            }`}>
                              {isActive ? <Laptop size={18} /> : isVerified ? <Key size={18} /> : <Globe size={18} />}
                            </div>
                            <div className="min-w-0 space-y-1 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-extrabold text-slate-900 text-sm leading-snug">{log.device}</p>
                                {isActive && (
                                  <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-full text-[9px] font-black uppercase tracking-wider whitespace-nowrap shadow-xs flex-shrink-0">
                                    Active Now
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 font-mono break-all leading-normal">{log.ipMasked}</p>
                              <p className={`text-[11px] font-medium leading-tight ${isActive ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                                {isActive ? `Session Started: ${log.timestamp}` : `Log Timestamp: ${log.timestamp}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end sm:justify-start flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 sm:border-none">
                            <span className={`text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-lg ${
                              isActive 
                                ? 'text-emerald-700 bg-emerald-100/90 inline-flex items-center gap-1.5' 
                                : isVerified 
                                ? 'text-purple-700 bg-purple-100/70' 
                                : 'text-slate-500 bg-slate-200/60'
                            }`}>
                              {isActive ? (
                                <>
                                  <CheckCircle2 size={13} /> Verified Session
                                </>
                              ) : isVerified ? (
                                'Authenticated'
                              ) : (
                                'Signed Out'
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Audit Logs Pagination Controls */}
                  {allAuditLogs.length > AUDIT_LOGS_PER_PAGE && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">
                        Showing <span className="font-bold text-slate-800">{(currentPageEffective - 1) * AUDIT_LOGS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-800">{Math.min(currentPageEffective * AUDIT_LOGS_PER_PAGE, allAuditLogs.length)}</span> of <span className="font-bold text-slate-800">{allAuditLogs.length}</span> security entries
                      </p>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={currentPageEffective === 1}
                          onClick={() => setAuditCurrentPage(prev => Math.max(1, prev - 1))}
                          className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed border border-slate-200"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        {Array.from({ length: totalAuditPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setAuditCurrentPage(pageNum)}
                            className={`w-7 h-7 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              currentPageEffective === pageNum
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-purple-50 border border-slate-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        <button
                          type="button"
                          disabled={currentPageEffective === totalAuditPages}
                          onClick={() => setAuditCurrentPage(prev => Math.min(totalAuditPages, prev + 1))}
                          className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed border border-slate-200"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* ── NOTIFICATIONS PREFERENCES CARD (For Regular Users) ── */}
          {user?.role === 'user' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-base sm:text-lg">Notifications & Email Alerts</h2>
                  <p className="text-xs text-slate-500">Configure receipt deliveries and operational notification preferences.</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Option 1: Email Purchase Receipts */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/70 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail size={18} className="text-purple-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm">Automatic Email Receipts</p>
                      <p className="text-xs text-slate-500 leading-relaxed">Send instant digital receipts to your email upon completed purchases.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleEmailReceiptsToggle}
                    style={{ minHeight: '28px', height: '28px', minWidth: '48px', width: '48px' }}
                    className={`no-min-target relative inline-flex h-7 w-12 p-0.5 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                      emailReceiptsEnabled ? 'bg-emerald-600 shadow-xs' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 flex-shrink-0 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        emailReceiptsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Option 2: Locker Expiry Reminders */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/70 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Lock size={18} className="text-emerald-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm">Locker Expiry Warnings</p>
                      <p className="text-xs text-slate-500 leading-relaxed">Receive alert notifications 30 days prior to locker term expiration dates.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLockerWarningsToggle}
                    style={{ minHeight: '28px', height: '28px', minWidth: '48px', width: '48px' }}
                    className={`no-min-target relative inline-flex h-7 w-12 p-0.5 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                      lockerWarningsEnabled ? 'bg-emerald-600 shadow-xs' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 flex-shrink-0 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        lockerWarningsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Option 3: Announcements */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/70 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Sparkles size={18} className="text-amber-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm">Coop Event & Announcement Alerts</p>
                      <p className="text-xs text-slate-500 leading-relaxed">Get notified when new announcements or campus events are published.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnnouncementsToggle}
                    style={{ minHeight: '28px', height: '28px', minWidth: '48px', width: '48px' }}
                    className={`no-min-target relative inline-flex h-7 w-12 p-0.5 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                      announcementAlertsEnabled ? 'bg-emerald-600 shadow-xs' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 flex-shrink-0 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        announcementAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (Profile Summary & System Info) ── */}
        <div className="space-y-8">
          
          {/* ── USER ACCOUNT SUMMARY CARD ── */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <User size={20} />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-base">Account Overview</h2>
                <p className="text-xs text-slate-500">Your profile details & metadata.</p>
              </div>
            </div>

            {user ? (
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-medium">Full Name:</span>
                  <strong className="text-slate-900 font-bold">{formatFullName(user.first_name, user.last_name)}</strong>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-medium">Email Address:</span>
                  <strong className="text-slate-900 font-mono text-[11px] truncate max-w-[150px]">{user.email}</strong>
                </div>

                {user.role === 'user' && (
                  <>
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-500 font-medium">Student / ID No.:</span>
                      <strong className="text-purple-700 font-mono font-extrabold">{user.id_number || 'N/A'}</strong>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-500 font-medium">Course & Year:</span>
                      <strong className="text-slate-900 font-bold">
                        {user.course && user.year ? `${user.course} (${user.year})` : 'N/A'}
                      </strong>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-medium">Account Role:</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-black text-[10px] uppercase">
                    {user.role}
                  </span>
                </div>

                {/* Info Note - Only show for regular users */}
                {user?.role === 'user' && (
                  <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-start gap-3 mt-4">
                    <span className="text-base flex-shrink-0 mt-0.5">💡</span>
                    <p className="text-xs text-purple-800 font-medium leading-relaxed">
                      Your account details are managed directly by the UC Coop Administration. If you need to update any information, please proceed to the UC Coop Office.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">User session information unavailable.</p>
            )}
          </div>

          {/* ── SYSTEM & METRICS INFO CARD ── */}
          <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 border border-purple-800/40 shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-purple-800/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                  <Cpu size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">System Information</h3>
                  <p className="text-[10px] text-purple-300">UC METC SILMS Core Platform</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-purple-900/60 border border-purple-500/30 text-purple-200 font-mono text-[11px] font-bold rounded-lg shadow-xs">
                v2.4.0
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-purple-200">
              <div className="flex justify-between items-center bg-purple-900/20 p-2.5 rounded-xl border border-purple-800/30">
                <span className="flex items-center gap-2 text-purple-300">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Connection Status
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Operational
                </span>
              </div>

              <div className="flex justify-between items-center bg-purple-900/20 p-2.5 rounded-xl border border-purple-800/30">
                <span className="flex items-center gap-2 text-purple-300">
                  <Smartphone size={14} className="text-purple-400" /> Client Environment
                </span>
                <strong className="text-purple-200 text-[11px]">Web Application</strong>
              </div>

              <div className="flex justify-between items-center bg-purple-900/20 p-2.5 rounded-xl border border-purple-800/30">
                <span className="flex items-center gap-2 text-purple-300">
                  <RefreshCw size={14} className="text-emerald-400" /> Data Synchronization
                </span>
                <strong className="text-emerald-300 text-[11px] font-bold">Real-time Sync</strong>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
