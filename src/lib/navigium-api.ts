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
  type: 'login' | 'setpoints' | 'points' | 'password' | 'getpassword' | 'greeting' | 'greetings';
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

// App Password Functions with server sync
export async function getAppPassword(): Promise<string> {
  try {
    // First try to get from server
    const serverPassword = await getAppPasswordFromServer();
    if (serverPassword && serverPassword !== DEFAULT_APP_PASSWORD) {
      // Update local storage with server password
      setAppPassword(serverPassword);
      return serverPassword;
    }
  } catch (error) {
    console.error('Failed to get password from server, using local:', error);
  }
  
  // Fallback to local storage
  const encrypted = localStorage.getItem("app_password_v2");
  if (encrypted) {
    const decrypted = decrypt(encrypted);
    return decrypted || DEFAULT_APP_PASSWORD;
  }
  return DEFAULT_APP_PASSWORD;
}

export function setAppPassword(password: string): void {
  const encrypted = encrypt(password);
  localStorage.setItem("app_password_v2", encrypted);
}

export async function checkAppPassword(): Promise<boolean> {
  // Ensure we have the latest password from server
  await getAppPassword();
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

// Server-side app password functions
export async function syncAppPasswordToServer(password: string): Promise<void> {
  const { data } = await makeRequest('password', { password }, 'password');
  // Response is just success confirmation
}

export async function getAppPasswordFromServer(): Promise<string> {
  try {
    const { data } = await makeRequest('getpassword', {}, 'getpassword');
    const response = data as Record<string, unknown>;
    return (response?.password as string) || DEFAULT_APP_PASSWORD;
  } catch (error) {
    console.error('Failed to get password from server:', error);
    return DEFAULT_APP_PASSWORD;
  }
}

// Admin Check
export function isAdmin(): boolean {
  const session = getSession();
  return session?.username === "mahyno2022";
}

// User Greetings Management with server sync
export async function getGreetings(): Promise<UserGreeting[]> {
  try {
    // First try to get from server
    const serverGreetings = await getGreetingsFromServer();
    if (serverGreetings.length > 0) {
      // Update local storage with server greetings
      saveGreetings(serverGreetings);
      return serverGreetings;
    }
  } catch (error) {
    console.error('Failed to get greetings from server, using local:', error);
  }
  
  // Fallback to local storage
  return getLocalGreetings();
}

export function getLocalGreetings(): UserGreeting[] {
  const encrypted = localStorage.getItem("user_greetings_v2");
  if (encrypted) {
    return decryptObject<UserGreeting[]>(encrypted) || [];
  }
  // Migrate from old unencrypted greetings
  const oldGreetings = localStorage.getItem("user_greetings");
  if (oldGreetings) {
    try {
      const greetings = JSON.parse(oldGreetings) as UserGreeting[];
      saveGreetings(greetings);
      localStorage.removeItem("user_greetings");
      return greetings;
    } catch {
      return [];
    }
  }
  return [];
}

export function saveGreetings(greetings: UserGreeting[]): void {
  const encrypted = encryptObject(greetings);
  localStorage.setItem("user_greetings_v2", encrypted);
}

export async function getGreetingForUser(username: string): Promise<string | null> {
  const greetings = await getGreetings();
  const greeting = greetings.find(g => g.username.toLowerCase() === username.toLowerCase());
  return greeting?.greeting || null;
}

export async function setGreetingForUser(username: string, greeting: string): Promise<void> {
  const greetings = await getGreetings();
  const existing = greetings.findIndex(g => g.username.toLowerCase() === username.toLowerCase());
  
  if (greeting.trim() === "") {
    if (existing !== -1) {
      greetings.splice(existing, 1);
    }
  } else if (existing !== -1) {
    greetings[existing] = { username, greeting };
  } else {
    greetings.push({ username, greeting });
  }
  
  saveGreetings(greetings);
}

// Server-side greeting functions
export async function syncGreetingToServer(username: string, greeting: string): Promise<void> {
  await makeRequest('greeting', { user: username, greeting }, 'greeting');
}

export async function getGreetingsFromServer(): Promise<UserGreeting[]> {
  try {
    const { data } = await makeRequest('greetings', {}, 'greetings');
    const rows = data as Array<Record<string, unknown>>;
    
    // Filter out entries that have greetings and map to UserGreeting format
    return rows
      .filter(row => row.greeting && typeof row.greeting === 'string' && row.greeting.trim() !== '')
      .map(row => ({
        username: String(row.user || ''),
        greeting: String(row.greeting || '')
      }))
      .filter(g => g.username && g.greeting); // Ensure both fields are present
  } catch (error) {
    console.error('Failed to get greetings from server:', error);
    return [];
  }
}

// Known Users Management with localStorage
export function getKnownUsers(): string[] {
  const encrypted = localStorage.getItem("known_users_v2");
  if (encrypted) {
    return decryptObject<string[]>(encrypted) || [];
  }
  // Migrate from old unencrypted users
  const oldUsers = localStorage.getItem("known_users");
  if (oldUsers) {
    try {
      const users = JSON.parse(oldUsers) as string[];
      saveKnownUsers(users);
      localStorage.removeItem("known_users");
      return users;
    } catch {
      return [];
    }
  }
  return [];
}

export function saveKnownUsers(users: string[]): void {
  const encrypted = encryptObject(users);
  localStorage.setItem("known_users_v2", encrypted);
}

export function addKnownUser(username: string): void {
  const users = getKnownUsers();
  if (!users.includes(username)) {
    users.push(username);
    saveKnownUsers(users);
  }
}
