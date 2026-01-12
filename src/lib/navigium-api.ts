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
  type: 'login' | 'setpoints' | 'points';
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

export async function login(
  user: string,
  password: string,
  lang: string = "LA"
): Promise<LoginResponse> {
  const { data } = await makeRequest('login', { user, password, lang }, 'login');
  const response = data as Record<string, unknown>;

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

// Encrypted session management using Supabase
export async function getSession(): Promise<UserSession | null> {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    // Fallback to localStorage for migration
    const encrypted = localStorage.getItem("navigium_session_v2");
    if (encrypted) {
      const session = decryptObject<UserSession>(encrypted);
      if (session) {
        // Migrate to DB
        await saveSession(session);
        localStorage.removeItem("navigium_session_v2");
      }
      return session;
    }
    return null;
  }

  return {
    username: data.username,
    password: data.password_hash, // Note: this is stored as plaintext for now
    lang: data.lang,
    aktuellerKarteikasten: data.aktueller_karteikasten || "",
    gesamtpunkteKarteikasten: data.gesamtpunkte_karteikasten,
  };
}

export async function saveSession(session: UserSession): Promise<void> {
  const { error } = await supabase
    .from('user_sessions')
    .upsert({
      username: session.username,
      password_hash: session.password, // Storing as plaintext for compatibility
      lang: session.lang,
      aktueller_karteikasten: session.aktuellerKarteikasten,
      gesamtpunkte_karteikasten: session.gesamtpunkteKarteikasten,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'username'
    });

  if (error) {
    console.error('Error saving session:', error);
    throw error;
  }
}

export async function clearSession(): Promise<void> {
  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .neq('id', 0); // Delete all

  if (error) {
    console.error('Error clearing session:', error);
  }
}

// Re-login function to refresh session
export async function refreshLogin(): Promise<LoginResponse | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    const response = await login(session.username, session.password, session.lang);
    await saveSession({
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

// App Password Functions using Supabase
export async function getAppPassword(): Promise<string> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'app_password')
    .single();

  if (error || !data) {
    // Fallback to localStorage for migration
    const encrypted = localStorage.getItem("app_password_v2");
    if (encrypted) {
      const decrypted = decrypt(encrypted);
      if (decrypted) {
        await setAppPassword(decrypted);
        localStorage.removeItem("app_password_v2");
      }
      return decrypted || DEFAULT_APP_PASSWORD;
    }
    return DEFAULT_APP_PASSWORD;
  }

  return data.value;
}

export async function setAppPassword(password: string): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .upsert({
      key: 'app_password',
      value: password,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'key'
    });

  if (error) {
    console.error('Error setting app password:', error);
    throw error;
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

// Admin Check
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.username === "mahyno2022";
}

// User Greetings Management using Supabase
export async function getGreetings(): Promise<UserGreeting[]> {
  const { data, error } = await supabase
    .from('user_greetings')
    .select('username, greeting');

  if (error) {
    console.error('Error getting greetings:', error);
    // Fallback to localStorage for migration
    const encrypted = localStorage.getItem("user_greetings_v2");
    if (encrypted) {
      const greetings = decryptObject<UserGreeting[]>(encrypted) || [];
      // Migrate to DB
      for (const greeting of greetings) {
        await supabase
          .from('user_greetings')
          .upsert({
            username: greeting.username,
            greeting: greeting.greeting,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'username'
          });
      }
      localStorage.removeItem("user_greetings_v2");
      return greetings;
    }
    return [];
  }

  return data || [];
}

export async function saveGreetings(greetings: UserGreeting[]): Promise<void> {
  // First, delete all existing
  await supabase.from('user_greetings').delete().neq('id', 0);

  // Then insert new ones
  if (greetings.length > 0) {
    const { error } = await supabase
      .from('user_greetings')
      .insert(greetings.map(g => ({
        username: g.username,
        greeting: g.greeting,
      })));

    if (error) {
      console.error('Error saving greetings:', error);
      throw error;
    }
  }
}

export async function getGreetingForUser(username: string): Promise<string | null> {
  const greetings = await getGreetings();
  const greeting = greetings.find(g => g.username.toLowerCase() === username.toLowerCase());
  return greeting?.greeting || null;
}

export async function setGreetingForUser(username: string, greeting: string): Promise<void> {
  if (greeting.trim() === "") {
    const { error } = await supabase
      .from('user_greetings')
      .delete()
      .eq('username', username);

    if (error) {
      console.error('Error deleting greeting:', error);
    }
  } else {
    const { error } = await supabase
      .from('user_greetings')
      .upsert({
        username,
        greeting,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'username'
      });

    if (error) {
      console.error('Error setting greeting:', error);
      throw error;
    }
  }
}

// Known Users Management using Supabase
export async function getKnownUsers(): Promise<string[]> {
  const { data, error } = await supabase
    .from('known_users')
    .select('username');

  if (error) {
    console.error('Error getting known users:', error);
    // Fallback to localStorage for migration
    const encrypted = localStorage.getItem("known_users_v2");
    if (encrypted) {
      const users = decryptObject<string[]>(encrypted) || [];
      // Migrate to DB
      for (const user of users) {
        await supabase
          .from('known_users')
          .upsert({
            username: user,
          }, {
            onConflict: 'username'
          });
      }
      localStorage.removeItem("known_users_v2");
      return users;
    }
    return [];
  }

  return data?.map(u => u.username) || [];
}

export async function saveKnownUsers(users: string[]): Promise<void> {
  // First, delete all existing
  await supabase.from('known_users').delete().neq('id', 0);

  // Then insert new ones
  if (users.length > 0) {
    const { error } = await supabase
      .from('known_users')
      .insert(users.map(username => ({ username })));

    if (error) {
      console.error('Error saving known users:', error);
      throw error;
    }
  }
}

export async function addKnownUser(username: string): Promise<void> {
  const { error } = await supabase
    .from('known_users')
    .upsert({
      username,
    }, {
      onConflict: 'username'
    });

  if (error) {
    console.error('Error adding known user:', error);
    throw error;
  }
}
