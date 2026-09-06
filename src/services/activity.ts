// Service to track legitimate user login and session activity

const STORAGE_PREFIX = 'reflect_user_activity_';

export interface DayActivity {
  date: string; // YYYY-MM-DD
  logins: number;
  lastLoginTime?: string;
}

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateToKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function recordUserLogin(userId: string = 'current_user'): void {
  try {
    const key = `${STORAGE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    const data: Record<string, DayActivity> = raw ? JSON.parse(raw) : {};

    const today = getTodayKey();
    const existing = data[today] || { date: today, logins: 0 };
    existing.logins = (existing.logins || 0) + 1;
    existing.lastLoginTime = new Date().toISOString();
    data[today] = existing;

    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to record user activity:', err);
  }
}

export function getUserLogins(userId: string = 'current_user'): Record<string, DayActivity> {
  try {
    const key = `${STORAGE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    const data: Record<string, DayActivity> = raw ? JSON.parse(raw) : {};

    // Ensure today has at least one active login session if the user is actively in the app
    const today = getTodayKey();
    if (!data[today]) {
      data[today] = {
        date: today,
        logins: 1,
        lastLoginTime: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(data));
    }

    return data;
  } catch {
    return {
      [getTodayKey()]: {
        date: getTodayKey(),
        logins: 1,
        lastLoginTime: new Date().toISOString()
      }
    };
  }
}
