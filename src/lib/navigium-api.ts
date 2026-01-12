import { encrypt, decrypt, encryptObject, decryptObject } from "./crypto";
import { supabase } from "@/integrations/supabase/client";

const N8N_BASE_URL = "https://n8n.nemserver.duckdns.org/webhook/navigium";
const INTERNAL_KEY = "BANANA";

// Default app password (can be changed in admin panel)
const DEFAULT_APP_PASSWORD = "cheater2025";

export interface LoginResponse {
  username: string;
  aktuellerKarteikasten: string;
  gesamtpunkteKarteikasten: number;
  greeting?: string;
}

export interface SetPointsResponse {
  aktuellerKarteikasten: string;
  gesamtpunkteKarteikasten: number;
}

export interface UserSession {
  username: string;
  password: string;
  lang: string;
  aktuellerKarteikasten: string;
  gesamtpunkteKarteikasten: number;
}

export interface UserGreeting {
  username: string;
  greeting: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'login' | 'setpoints' | 'points' | 'db_read' | 'db_write';
  request: {
    url: string;
    headers: Record<string, string>;
  };
  response: {
    status: number;
    data: unknown;
  } | null;
  error: string | null;
}

// In-memory log storage
const logs: LogEntry[] = [];
const MAX_LOGS = 100;

// Generate unique ID without crypto.randomUUID (compatibility fix)
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): LogEntry {
  const logEntry: LogEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date(),
  };
  logs.unshift(logEntry);
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }
  console.log(`[${logEntry.type.toUpperCase()}]`, logEntry);
  return logEntry;
}

export function getLogs(): LogEntry[] {
  return [...logs];
}

export function clearLogs(): void {
  logs.length = 0;
}

async function makeRequest(
  endpoint: string,
  headers: Record<string, string>,
  type: LogEntry['type']
): Promise<{ data: unknown; status: number }> {
  const url = `${N8N_BASE_URL}/${endpoint}`;
  const requestHeaders = {
    'x-internal-key': INTERNAL_KEY,
    ...headers,
  };

  const logEntry: Omit<LogEntry, 'id' | 'timestamp'> = {
    type,
    request: { url, headers: requestHeaders },
    response: null,
    error: null,
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
    });

    const text = await response.text();
    let data: unknown;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    logEntry.response = { status: response.status, data };
    addLog(logEntry);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return { data, status: response.status };
  } catch (error) {
    logEntry.error = error instanceof Error ? error.message : 'Unknown error';
    addLog(logEntry);
    throw error;
  }
}

function logDbOperation(operation: string, table: string, data: unknown, error?: string) {
  addLog({
    type: error ? 'db_write' : 'db_read',
    request: { url: `supabase://${table}/${operation}`, headers: {} },
    response: error ? null : { status: 200, data },
    error: error || null,
  });
}

export async function login(
  user: string,
  password: string,
  lang: string = "LA"
): Promise<LoginResponse> {
  const { data } = await makeRequest('login', { user, password, lang }, 'login');
  const response = data as Record<string, unknown>;

  // Add known user to database
  await addKnownUser(user);

  return {
    username: (response?.username as string) || user,
    aktuellerKarteikasten: String(response?.aktuellerKarteikasten ?? ""),
    gesamtpunkteKarteikasten: Number.parseInt(String(response?.gesamtpunkteKarteikasten ?? "0"), 10) || 0,
  };
}

export async function setPoints(
  name: string,
  diff: number,
  lang: string = "LA"
): Promise<SetPointsResponse> {
  const { data } = await makeRequest('setpoints', { name, diff: String(diff), lang }, 'setpoints');
  const response = data as Record<string, unknown>;

  return {
    aktuellerKarteikasten: String(response?.aktuellerKarteikasten ?? ""),
    gesamtpunkteKarteikasten: Number.parseInt(String(response?.gesamtpunkteKarteikasten ?? "0"), 10) || 0,
  };
}

export async function getPoints(
  name: string,
  lang: string = "LA"
): Promise<SetPointsResponse> {
  const { data } = await makeRequest('points', { name, lang }, 'points');
  const response = data as Record<string, unknown>;

  return {
    aktuellerKarteikasten: String(response?.aktuellerKarteikasten ?? ""),
    gesamtpunkteKarteikasten: Number.parseInt(String(response?.gesamtpunkteKarteikasten ?? "0"), 10) || 0,
  };
}

// Encrypted session management
export function getSession(): UserSession | null {
  const encrypted = localStorage.getItem("navigium_session_v2");
  if (encrypted) {
    return decryptObject<UserSession>(encrypted);
  }
  // Migrate from old unencrypted session
  const oldSession = localStorage.getItem("navigium_session");
  if (oldSession) {
    try {
      const session = JSON.parse(oldSession) as UserSession;
      saveSession(session);
      localStorage.removeItem("navigium_session");
      return session;
    } catch {
      return null;
    }
  }
  return null;
}

export function saveSession(session: UserSession): void {
  const encrypted = encryptObject(session);
  localStorage.setItem("navigium_session_v2", encrypted);
}

export function clearSession(): void {
  localStorage.removeItem("navigium_session_v2");
  localStorage.removeItem("navigium_session");
}

// Re-login function to refresh session
export async function refreshLogin(): Promise<LoginResponse | null> {
  const session = getSession();
  if (!session) return null;

  try {
    const response = await login(session.username, session.password, session.lang);
    saveSession({
      ...session,
      aktuellerKarteikasten: response.aktuellerKarteikasten,
      gesamtpunkteKarteikasten: response.gesamtpunkteKarteikasten,
    });
    return response;
  } catch (error) {
    console.error('Refresh login failed:', error);
    return null;
  }
}

// ===============================
// App Password Functions (Database)
// ===============================

export async function getAppPassword(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'app_password')
      .single();
    
    logDbOperation('select', 'app_settings', data, error?.message);
    
    if (error || !data) {
      return DEFAULT_APP_PASSWORD;
    }
    
    return data.value || DEFAULT_APP_PASSWORD;
  } catch (error) {
    console.error('Failed to get app password:', error);
    return DEFAULT_APP_PASSWORD;
  }
}

export async function setAppPassword(password: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'app_password', value: password }, { onConflict: 'key' });
    
    logDbOperation('upsert', 'app_settings', { key: 'app_password' }, error?.message);
    
    if (error) {
      console.error('Failed to set app password:', error);
    }
  } catch (error) {
    console.error('Failed to set app password:', error);
  }
}

export async function checkAppPassword(): Promise<boolean> {
  return localStorage.getItem("app_authenticated") === "true";
}

export async function authenticateApp(password: string): Promise<boolean> {
  const correctPassword = await getAppPassword();
  if (password === correctPassword) {
    localStorage.setItem("app_authenticated", "true");
    return true;
  }
  return false;
}

export function clearAppAuth(): void {
  localStorage.removeItem("app_authenticated");
}

// ===============================
// Admin Check
// ===============================

export function isAdmin(): boolean {
  const session = getSession();
  return session?.username === "mahyno2022";
}

// ===============================
// User Greetings Management (Database)
// ===============================

export async function getGreetings(): Promise<UserGreeting[]> {
  try {
    const { data, error } = await supabase
      .from('user_greetings')
      .select('username, greeting')
      .order('username');
    
    logDbOperation('select', 'user_greetings', data, error?.message);
    
    if (error || !data) {
      return [];
    }
    
    return data.map(row => ({
      username: row.username,
      greeting: row.greeting,
    }));
  } catch (error) {
    console.error('Failed to get greetings:', error);
    return [];
  }
}

export async function getGreetingForUser(username: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_greetings')
      .select('greeting')
      .ilike('username', username)
      .single();
    
    logDbOperation('select', 'user_greetings', data, error?.message);
    
    if (error || !data) {
      return null;
    }
    
    return data.greeting;
  } catch (error) {
    console.error('Failed to get greeting for user:', error);
    return null;
  }
}

export async function setGreetingForUser(username: string, greeting: string): Promise<void> {
  try {
    if (greeting.trim() === "") {
      // Delete greeting
      const { error } = await supabase
        .from('user_greetings')
        .delete()
        .ilike('username', username);
      
      logDbOperation('delete', 'user_greetings', { username }, error?.message);
    } else {
      // Upsert greeting
      const { error } = await supabase
        .from('user_greetings')
        .upsert({ username, greeting }, { onConflict: 'username' });
      
      logDbOperation('upsert', 'user_greetings', { username, greeting }, error?.message);
    }
  } catch (error) {
    console.error('Failed to set greeting for user:', error);
  }
}

// ===============================
// Known Users Management (Database)
// ===============================

export async function getKnownUsers(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('known_users')
      .select('username')
      .order('last_login', { ascending: false });
    
    logDbOperation('select', 'known_users', data, error?.message);
    
    if (error || !data) {
      return [];
    }
    
    return data.map(row => row.username);
  } catch (error) {
    console.error('Failed to get known users:', error);
    return [];
  }
}

export async function addKnownUser(username: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('known_users')
      .upsert(
        { username, last_login: new Date().toISOString() },
        { onConflict: 'username' }
      );
    
    logDbOperation('upsert', 'known_users', { username }, error?.message);
  } catch (error) {
    console.error('Failed to add known user:', error);
  }
}
