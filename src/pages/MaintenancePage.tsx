// UC-METC SILMS Maintenance Page (Clean Light Design System)
import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Clock, 
  Lock, 
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { getMaintenanceState, MaintenanceState } from '../utils/maintenanceManager';
import { useAuth } from '../store/authContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface MaintenancePageProps {
  onBypass?: () => void;
  isPreview?: boolean;
}

// Helper: Parse user typed ETA text into target epoch timestamp based on updatedAt ISO timestamp
const calculateTargetEpoch = (etaText: string, updatedAtIso: string): number | null => {
  if (!etaText) return null;
  const startMs = updatedAtIso ? new Date(updatedAtIso).getTime() : Date.now();
  if (isNaN(startMs)) return null;

  const raw = etaText
    .replace(/^Expected completion:\s*/i, '')
    .replace(/^Estimated completion:\s*/i, '')
    .replace(/^Estimated uptime:\s*/i, '')
    .trim();

  // Pattern: "3 days", "1 day", "3d"
  const daysMatch = raw.match(/^(\d+(?:\.\d+)?)\s*(?:days?|d)$/i);
  if (daysMatch) {
    return startMs + parseFloat(daysMatch[1]) * 86400 * 1000;
  }

  // Pattern: "2 hours", "1.5 hrs", "2h"
  const hoursMatch = raw.match(/^(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)$/i);
  if (hoursMatch) {
    return startMs + parseFloat(hoursMatch[1]) * 3600 * 1000;
  }

  // Pattern: "30 minutes", "45 mins", "30m"
  const minsMatch = raw.match(/^(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)$/i);
  if (minsMatch) {
    return startMs + parseFloat(minsMatch[1]) * 60 * 1000;
  }

  // Pattern: "1 day 4 hours", "2h 30m"
  const dhmsMatch = raw.match(/^(?:(\d+)\s*d(?:ays?)?)?\s*(?:(\d+)\s*h(?:ours?|rs?)?)?\s*(?:(\d+)\s*m(?:ins?|inutes?)?)?$/i);
  if (dhmsMatch && (dhmsMatch[1] || dhmsMatch[2] || dhmsMatch[3])) {
    const d = parseInt(dhmsMatch[1] || '0', 10);
    const h = parseInt(dhmsMatch[2] || '0', 10);
    const m = parseInt(dhmsMatch[3] || '0', 10);
    const totalMs = (d * 86400 + h * 3600 + m * 60) * 1000;
    if (totalMs > 0) return startMs + totalMs;
  }

  return null;
};

const formatRemainingTime = (diffMs: number): string => {
  if (diffMs <= 0) return 'Finishing Up... Portal Returning Online Soon';
  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  parts.push(`${secs}s`);

  return parts.join(' ') + ' Remaining';
};

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ onBypass, isPreview = false }) => {
  const [state, setState] = useState<MaintenanceState>(getMaintenanceState);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Ticking 1-second interval for real-time live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Admin bypass modal state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state changes from local storage events
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<MaintenanceState>;
      if (customEvent.detail) {
        setState(customEvent.detail);
      } else {
        setState(getMaintenanceState());
      }
    };

    window.addEventListener('silms_maintenance_updated', handleUpdate);
    return () => window.removeEventListener('silms_maintenance_updated', handleUpdate);
  }, []);

  // Industry Best Practice: Auto-open login if URL has ?admin=true or ?login=true
  useEffect(() => {
    if (searchParams.get('admin') === 'true' || searchParams.get('login') === 'true' || searchParams.get('bypass') === 'true') {
      setShowAdminLogin(true);
    }
  }, [searchParams]);

  // ── Secret Keyboard Shortcuts for Admin Maintenance Bypass ──
  // 1. Combinations: Ctrl+Shift+A, Ctrl+Shift+M, Cmd+Shift+A, Cmd+Shift+M, Alt+L
  // 2. Secret Word Sequence: Typing "admin" or "bypass" anywhere on the screen
  useEffect(() => {
    let keyBuffer = '';
    let resetTimer: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when user is already typing inside an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      const key = e.key.toLowerCase();

      // Check key combinations
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (
        (isCmdOrCtrl && e.shiftKey && (key === 'a' || key === 'm')) || 
        (e.altKey && key === 'l')
      ) {
        e.preventDefault();
        setShowAdminLogin(true);
        return;
      }

      // Track single character keypresses for "admin" or "bypass" typing sequence
      if (key.length === 1 && /[a-z0-9]/i.test(key)) {
        keyBuffer += key;
        
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => { keyBuffer = ''; }, 2000);

        if (keyBuffer.endsWith('admin') || keyBuffer.endsWith('bypass')) {
          keyBuffer = '';
          setShowAdminLogin(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(resetTimer);
    };
  }, []);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.user.role === 'admin') {
        setShowAdminLogin(false);
        if (onBypass) onBypass();
        navigate('/dashboard', { replace: true });
      } else {
        setLoginError('Access denied: Only Administrators can bypass Maintenance Mode.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Invalid credentials. Please verify your Email and Password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format state.eta cleanly and calculate real-time live countdown if relative duration is present
  const rawEta = state.eta || '';
  const cleanedEta = rawEta
    .replace(/^Expected completion:\s*/i, '')
    .replace(/^Estimated completion:\s*/i, '')
    .replace(/^Estimated uptime:\s*/i, '')
    .trim();

  const targetEpoch = calculateTargetEpoch(cleanedEta, state.updatedAt);
  const remainingMs = targetEpoch ? targetEpoch - nowMs : null;

  let displayEtaText = cleanedEta;
  let isLiveCountdown = false;
  if (remainingMs !== null) {
    displayEtaText = formatRemainingTime(remainingMs);
    isLiveCountdown = true;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Background Dot Grid */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.18) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Ambient Brand Color Glows */}
      <div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />

      {/* Main Content Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-8">
        <div className="max-w-2xl w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden text-center space-y-6">
          
          {/* Maintenance Icon Graphic */}
          <div className="flex justify-center pt-2">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shadow-inner">
                <Wrench className="w-10 h-10 text-amber-600 animate-bounce" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center shadow-md">
                <Lock className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          {/* Headline & Announcement Text */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              System Under Maintenance
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-medium">
              {state.message || 'The UC-METC SILMS portal is currently undergoing scheduled maintenance to upgrade our system services. We apologize for any inconvenience.'}
            </p>
          </div>

          {/* Clean Estimated Completion Banner / Live Countdown */}
          {displayEtaText && (
            <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 flex items-center justify-center gap-2.5 text-xs sm:text-sm text-purple-950 font-semibold max-w-lg mx-auto shadow-xs">
              <Clock className="w-4 h-4 text-purple-600 shrink-0 animate-pulse" />
              <span>
                <strong className="text-purple-700">Estimated Completion:</strong>{' '}
                <span className={isLiveCountdown ? 'font-mono text-purple-900 font-bold' : ''}>
                  {displayEtaText}
                </span>
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Admin Bypass Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAdminLogin(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-extrabold text-base text-slate-900">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  Admin Maintenance Bypass
                </div>
                <button
                  onClick={() => setShowAdminLogin(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                If you are an authorized Administrator, sign in to bypass Maintenance Mode and access management controls.
              </p>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ucmetccoop.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdminLogin(false)}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-purple-600/30 cursor-pointer transition-all active:scale-95"
                  >
                    {isSubmitting ? 'Verifying...' : 'Sign In & Bypass'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
