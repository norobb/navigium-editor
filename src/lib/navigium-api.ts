import { encrypt, decrypt, encryptObject, decryptObject } from "./crypto";

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

// App Password Functions with encryption
export function getAppPassword(): string {
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

export function checkAppPassword(): boolean {
  return localStorage.getItem("app_authenticated") === "true";
}

export function authenticateApp(password: string): boolean {
  const correctPassword = getAppPassword();
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
export function isAdmin(): boolean {
  const session = getSession();
  return session?.username === "mahyno2022";
}

// User Greetings Management with encryption
export function getGreetings(): UserGreeting[] {
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

export function getGreetingForUser(username: string): string | null {
  const greetings = getGreetings();
  const greeting = greetings.find(g => g.username.toLowerCase() === username.toLowerCase());
  return greeting?.greeting || null;
}

export function setGreetingForUser(username: string, greeting: string): void {
  const greetings = getGreetings();
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

// Known Users Management with encryption
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
