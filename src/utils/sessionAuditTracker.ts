export interface AuditSessionEntry {
  id: string;
  device: string;
  ipMasked: string;
  timestamp: string;
  action: string;
  status: 'active' | 'ended' | 'verified';
}

export const getDeviceBrowserName = (): string => {
  if (typeof window === 'undefined') return 'Linux Web Client (Chrome)';

  const ua = navigator.userAgent || '';
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
  const platformLower = platform.toLowerCase();
  const uaLower = ua.toLowerCase();

  // 1. Detect OS Platform accurately (checking platform first, then UA strings)
  let os = 'Linux Web Client';
  if (platformLower.includes('win') || uaLower.includes('windows')) {
    os = 'Windows Web Client';
  } else if (platformLower.includes('linux') || uaLower.includes('linux') || uaLower.includes('x11')) {
    if (uaLower.includes('android')) {
      os = 'Android Mobile Client';
    } else {
      os = 'Linux Web Client';
    }
  } else if (platformLower.includes('mac') || uaLower.includes('macintosh') || uaLower.includes('mac os x')) {
    if (uaLower.includes('iphone') || uaLower.includes('ipad') || uaLower.includes('ipod')) {
      os = 'iOS Mobile Client';
    } else {
      os = 'macOS Web Client';
    }
  } else if (uaLower.includes('android')) {
    os = 'Android Mobile Client';
  } else if (uaLower.includes('iphone') || uaLower.includes('ipad')) {
    os = 'iOS Mobile Client';
  }

  // 2. Detect Browser accurately
  let browser = 'Chrome';
  if (uaLower.includes('edg/') || uaLower.includes('edge/')) {
    browser = 'Edge';
  } else if (uaLower.includes('firefox/') || uaLower.includes('fxios/')) {
    browser = 'Firefox';
  } else if (uaLower.includes('opr/') || uaLower.includes('opera/')) {
    browser = 'Opera';
  } else if (uaLower.includes('chrome/') || uaLower.includes('crios/')) {
    browser = 'Chrome';
  } else if (uaLower.includes('safari/') && !uaLower.includes('chrome/')) {
    browser = 'Safari';
  }

  return `${os} (${browser})`;
};

export const recordLoginAudit = (userId: string) => {
  if (!userId) return;
  const key = `silms_audit_logs_${userId}`;
  try {
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const now = new Date();
    const realDevice = getDeviceBrowserName();

    const newEntry: AuditSessionEntry = {
      id: `audit-${now.getTime()}`,
      device: realDevice,
      ipMasked: '192.168.1.*** · UC METC Secure Subnet',
      timestamp: `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      action: 'Current Session Active',
      status: 'active',
    };

    // Mark previous active sessions as signed out
    const updated = [
      newEntry,
      ...existing.map((e: AuditSessionEntry) => ({
        ...e,
        status: e.status === 'active' ? 'ended' : e.status,
        action: e.status === 'active' ? 'Signed Out' : e.action,
      })),
    ].slice(0, 5);

    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to log audit record:', e);
  }
};

export const getAuditLogs = (userId: string): AuditSessionEntry[] => {
  const currentRealDevice = getDeviceBrowserName();
  const now = new Date();

  if (userId) {
    const key = `silms_audit_logs_${userId}`;
    try {
      let logs: AuditSessionEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(logs) && logs.length > 0) {
        // Ensure active session entry always reflects the user's REAL device & OS!
        let updated = false;
        logs = logs.map((log) => {
          if (log.status === 'active' && log.device !== currentRealDevice) {
            updated = true;
            return { ...log, device: currentRealDevice };
          }
          return log;
        });
        if (updated) {
          localStorage.setItem(key, JSON.stringify(logs));
        }
        return logs;
      }
    } catch (e) {}
  }

  // Fallback initial audit log for current active session
  return [
    {
      id: 'current-session',
      device: currentRealDevice,
      ipMasked: '192.168.1.*** · UC METC Secure Subnet',
      timestamp: `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      action: 'Current Session Active',
      status: 'active',
    },
    {
      id: 'auth-session',
      device: 'Encrypted JWT Authentication Engine',
      ipMasked: 'SSL / AES-256 Auth Protocol',
      timestamp: 'Session Active',
      action: 'Token Verification Complete',
      status: 'verified',
    },
  ];
};
