/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SessionEvent {
  id: string;
  timestamp: string;
  username: string;
  nameAr: string;
  role: string;
  action: 'دخول' | 'خروج';
  siteName: string;
}

const STORAGE_KEY = 'bunyan_session_logs';

export function getSessionLogs(): SessionEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse session logs', e);
    return [];
  }
}

export function appendSessionLog(user: { username: string; nameAr: string; role: string }, action: 'دخول' | 'خروج', siteName: string = 'لم يحدد بعد'): SessionEvent[] {
  try {
    const logs = getSessionLogs();
    
    // Format the current timestamp nicely in Arabic layout
    const formattedTime = new Date().toLocaleString('ar-EG', {
      hour12: true,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newEvent: SessionEvent = {
      id: `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: formattedTime,
      username: user.username,
      nameAr: user.nameAr.replace(/\s*\(?مدير التكاليف\)?/g, ''),
      role: getRoleLabelStr(user.role),
      action,
      siteName
    };

    // Save only the latest 150 entries to keep local storage clean
    const updated = [newEvent, ...logs].slice(0, 150);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save session log', e);
    return [];
  }
}

export function clearSessionLogs(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function getRoleLabelStr(role: string): string {
  switch (role) {
    case 'admin': return 'مدير البرنامج';
    case 'projects_manager': return 'مدير مشروعات';
    case 'site_manager': return 'مدير موقع';
    case 'site_engineer': return 'مهندس موقع';
    case 'tech_office': return 'مهندس مكتب فني';
    case 'accountant': return 'محاسب مالي';
    case 'supervisor': return 'مشرف موقع';
    case 'dc': return 'DC';
    case 'viewer': return 'مراقب مشاهدة';
    default: return role;
  }
}
