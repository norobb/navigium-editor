import { encrypt, decrypt, encryptObject, decryptObject } from "./crypto";

const NAVIGIUM_BASE_URL = "https://www.navigium.de";

/**
 * Computes SHA-256 hash of a string
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// SHA-256 hash of default app password (never store plaintext password in code)
const DEFAULT_APP_PASSWORD_HASH = "2b360fb64c7b96da2dbc611fe746fe666a83866c9a54249bb482f930ee497aad";

// SHA-256 hash of authorized admin username
const ADMIN_USERNAME_HASH = "612cbfe01f59bf4b543fe9ae83f9b33bbf39f05bc41a87939b6d7197768f217b";

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
  token: string;
  school: string;
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
  type: 'login' | 'setpoints' | 'points' | 'welcome' | 'training' | 'vocable';
  request: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
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
  return logEntry;
}

export function getLogs(): LogEntry[] {
  return [...logs];
}

export function clearLogs(): void {
  logs.length = 0;
}

/**
 * Parses aktuellerKarteikasten from Navigium welcome HTML
 */
function parseKarteikasten(html: string): string {
  // Looks for hilfeRang("Vokabeln L. 1-5") or hilfeRang('...')
  const match = html.match(/hilfeRang\(\s*["']([^"']+)["']\s*\)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  // Fallback: look for "in [Name]." after link
  const fallbackMatch = html.match(/in\s+([^.<>]+)\.<a/i);
  if (fallbackMatch && fallbackMatch[1]) {
    return fallbackMatch[1].trim();
  }
  return "";
}

/**
 * Parses gesamtpunkteKarteikasten from Navigium welcome HTML
 */
function parseGesamtpunkte(html: string): number {
  // Pattern: "Gesamtpunktzahl in Latein: 10339<a class" or other languages
  const match = html.match(/Gesamtpunktzahl[^:]*:\s*([0-9]+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10) || 0;
  }
  return 0;
}

/**
 * Direct call to Navigium welcome endpoint to read current points and active box
 */
export async function fetchWelcomeInfo(
  user: string,
  school: string,
  token: string,
  lang: string = "LA"
): Promise<{ aktuellerKarteikasten: string; gesamtpunkteKarteikasten: number }> {
  const url = `${NAVIGIUM_BASE_URL}/schule/login/welcome?lang=${encodeURIComponent(lang)}&user=${encodeURIComponent(user)}&schule=${encodeURIComponent(school)}`;
  const headers: Record<string, string> = {
    "X-AUTH-TOKEN": token,
  };

  const logEntry: Omit<LogEntry, 'id' | 'timestamp'> = {
    type: 'welcome',
    request: { url, method: 'GET', headers },
    response: null,
    error: null,
  };

  try {
    const response = await fetch(url, { method: "GET", headers });
    const text = await response.text();

    logEntry.response = { status: response.status, data: text.substring(0, 300) };
    addLog(logEntry);

    if (!response.ok) {
      throw new Error(`Navigium Welcome fehlgeschlagen: Status ${response.status}`);
    }

    const aktuellerKarteikasten = parseKarteikasten(text);
    const gesamtpunkteKarteikasten = parseGesamtpunkte(text);

    return {
      aktuellerKarteikasten,
      gesamtpunkteKarteikasten,
    };
  } catch (err) {
    logEntry.error = err instanceof Error ? err.message : "Welcome-Abfrage fehlgeschlagen";
    addLog(logEntry);
    throw err;
  }
}

/**
 * Direct login to Navigium
 * Rejects immediately if user/password not found or invalid
 */
export async function login(
  user: string,
  password: string,
  lang: string = "LA"
): Promise<LoginResponse> {
  const cleanUser = user.trim();
  const url = `${NAVIGIUM_BASE_URL}/schule/login2`;
  const bodyParams = new URLSearchParams({
    name: cleanUser,
    password: password,
    school: "PRIVAT",
    permanent: "true",
  });

  const logEntry: Omit<LogEntry, 'id' | 'timestamp'> = {
    type: 'login',
    request: {
      url,
      method: 'POST',
      body: { name: cleanUser, school: "PRIVAT", permanent: "true" },
    },
    response: null,
    error: null,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

    const data = await response.json().catch(() => null);
    logEntry.response = { status: response.status, data };
    addLog(logEntry);

    // Strict validation: Must be 200, authenticated === true and have a valid token
    if (!response.ok || !data || data.authenticated !== true || !data.token) {
      // Clear any previous session immediately
      await clearSession();
      const errorMsg = data?.message || "Benutzer nicht gefunden oder falsches Passwort.";
      throw new Error(`Navigium-Anmeldung fehlgeschlagen: ${errorMsg}`);
    }

    const token = data.token;
    const school = data.school || "GSJ_HAMBURG";

    // Now fetch welcome screen to parse points and box
    const welcomeInfo = await fetchWelcomeInfo(cleanUser, school, token, lang);

    const session: UserSession = {
      username: cleanUser,
      password: password,
      lang: lang,
      token: token,
      school: school,
      aktuellerKarteikasten: welcomeInfo.aktuellerKarteikasten,
      gesamtpunkteKarteikasten: welcomeInfo.gesamtpunkteKarteikasten,
    };

    await saveSession(session);
    await addKnownUser(cleanUser);

    return {
      username: cleanUser,
      aktuellerKarteikasten: welcomeInfo.aktuellerKarteikasten,
      gesamtpunkteKarteikasten: welcomeInfo.gesamtpunkteKarteikasten,
    };
  } catch (error) {
    logEntry.error = error instanceof Error ? error.message : "Anmeldefehler";
    addLog(logEntry);
    throw error;
  }
}

/**
 * Fetches current points directly from Navigium
 */
export async function getPoints(
  name: string,
  lang: string = "LA"
): Promise<SetPointsResponse> {
  let session = await getSession();

  if (!session || !session.token) {
    throw new Error("Nicht eingeloggt. Bitte melde dich erneut an.");
  }

  try {
    const welcomeInfo = await fetchWelcomeInfo(
      session.username,
      session.school,
      session.token,
      lang || session.lang
    );

    session = {
      ...session,
      aktuellerKarteikasten: welcomeInfo.aktuellerKarteikasten || session.aktuellerKarteikasten,
      gesamtpunkteKarteikasten: welcomeInfo.gesamtpunkteKarteikasten,
    };
    await saveSession(session);

    return {
      aktuellerKarteikasten: session.aktuellerKarteikasten,
      gesamtpunkteKarteikasten: session.gesamtpunkteKarteikasten,
    };
  } catch (error) {
    // If token expired, try refreshing login automatically
    if (session.password) {
      try {
        const refreshed = await login(session.username, session.password, lang || session.lang);
        return {
          aktuellerKarteikasten: refreshed.aktuellerKarteikasten,
          gesamtpunkteKarteikasten: refreshed.gesamtpunkteKarteikasten,
        };
      } catch {
        // Fall through to throw original error
      }
    }
    throw error;
  }
}

interface VocableItem {
  lernvokabelId: number | string;
  vokid: string;
}

/**
 * Sets points by executing the Navigium workflow directly:
 * - Batches diff into chunks of up to 250
 * - Fetches training tasks
 * - Moves vocables vor (diff > 0) or zurueck (diff < 0)
 * - Verifies final points via welcome screen
 */
export async function setPoints(
  name: string,
  diff: number,
  lang: string = "LA",
  onProgress?: (completed: number, total: number) => void
): Promise<SetPointsResponse> {
  if (diff === 0) {
    return getPoints(name, lang);
  }

  let session = await getSession();
  if (!session || !session.token) {
    throw new Error("Keine aktive Sitzung gefunden. Bitte neu anmelden.");
  }

  // Ensure we have current box
  if (!session.aktuellerKarteikasten) {
    const fresh = await getPoints(name, lang);
    session = await getSession() || session;
    if (!session.aktuellerKarteikasten) {
      session.aktuellerKarteikasten = fresh.aktuellerKarteikasten;
    }
  }

  const isNegative = diff < 0;
  const action = isNegative ? "zurueck" : "vor";
  const totalDiff = Math.abs(diff);
  const batchSize = 250;
  let remaining = totalDiff;
  let processed = 0;

  const richtung = lang === "GRC" ? "GRC_DT" : lang === "EN" ? "EN_DT" : "LAT_DT";

  const setPointsLog: Omit<LogEntry, 'id' | 'timestamp'> = {
    type: 'setpoints',
    request: {
      url: `${NAVIGIUM_BASE_URL}/boxes/${session.aktuellerKarteikasten}/${action}`,
      method: 'POST',
      body: { diff, totalDiff, isNegative, box: session.aktuellerKarteikasten },
    },
    response: null,
    error: null,
  };

  try {
    while (remaining > 0) {
      const currentBatchAmount = remaining >= batchSize ? batchSize : remaining;

      // 1. Fetch training vocables for this batch
      const trainingUrl = `${NAVIGIUM_BASE_URL}/schule/rest/vokabeltraining/karteikasten/${encodeURIComponent(session.aktuellerKarteikasten)}/training?schule=${encodeURIComponent(session.school)}&user=${encodeURIComponent(session.username)}&gg=false&stf=false&stf2=true&stf3=true&artikelErzwingen=false&wa=SUBST,ADJ,PRON,VERB,ADV,KONJ,SUBJ,PRAEP,PHR,EIGN,ETC&gr=false&richtung=${richtung}&qv=false&gleichverteilt=false&anzahl=0&voktestAktivieren=false&minikontexte=true`;

      const trainingResp = await fetch(trainingUrl, {
        method: "GET",
        headers: {
          "X-AUTH-TOKEN": session.token,
        },
      });

      if (!trainingResp.ok) {
        // Try refreshing login if unauthorized
        if (trainingResp.status === 401 && session.password) {
          await login(session.username, session.password, lang);
          session = (await getSession())!;
          continue;
        }
        throw new Error(`Fehler beim Abrufen der Vokabeln: Status ${trainingResp.status}`);
      }

      const trainingData = await trainingResp.json();
      const rawAufgaben: VocableItem[] = (trainingData?.aufgaben || [])
        .map((a: { lernvokabelId?: number | string; vokid?: string }) => ({
          lernvokabelId: a.lernvokabelId ?? "",
          vokid: a.vokid ?? "",
        }))
        .filter((item: VocableItem) => item.lernvokabelId && item.vokid);

      if (rawAufgaben.length === 0) {
        throw new Error("Keine Vokabeln im aktuellen Karteikasten zum Bewegen gefunden.");
      }

      const sliced = rawAufgaben.slice(0, currentBatchAmount);

      // 2. Move vocables in chunks of 10 concurrent requests for performance
      const concurrency = 10;
      for (let i = 0; i < sliced.length; i += concurrency) {
        const chunk = sliced.slice(i, i + concurrency);
        await Promise.all(
          chunk.map(async (vocable) => {
            const moveUrl = `${NAVIGIUM_BASE_URL}/schools/${encodeURIComponent(session!.school)}/users/${encodeURIComponent(session!.username)}/boxes/${encodeURIComponent(session!.aktuellerKarteikasten)}/${action}`;
            const moveBody = `${NAVIGIUM_BASE_URL}/schools/${session!.school}/users/${session!.username}/vocable/${vocable.lernvokabelId}/vokid/${vocable.vokid}`;

            const res = await fetch(moveUrl, {
              method: "POST",
              headers: {
                "X-AUTH-TOKEN": session!.token,
                "Content-Type": "text/plain",
              },
              body: moveBody,
            });

            if (!res.ok && res.status === 401 && session!.password) {
              await login(session!.username, session!.password, lang);
              session = (await getSession())!;
            }
          })
        );

        processed += chunk.length;
        if (onProgress) {
          onProgress(processed, totalDiff);
        }
      }

      remaining -= sliced.length;
      if (sliced.length === 0) {
        break;
      }
    }

    // 3. Confirm with fresh points from welcome endpoint
    const finalInfo = await fetchWelcomeInfo(session.username, session.school, session.token, lang);
    session = {
      ...session,
      aktuellerKarteikasten: finalInfo.aktuellerKarteikasten || session.aktuellerKarteikasten,
      gesamtpunkteKarteikasten: finalInfo.gesamtpunkteKarteikasten,
    };
    await saveSession(session);

    setPointsLog.response = {
      status: 200,
      data: {
        aktuellerKarteikasten: session.aktuellerKarteikasten,
        gesamtpunkteKarteikasten: session.gesamtpunkteKarteikasten,
        processed,
      },
    };
    addLog(setPointsLog);

    return {
      aktuellerKarteikasten: session.aktuellerKarteikasten,
      gesamtpunkteKarteikasten: session.gesamtpunkteKarteikasten,
    };
  } catch (error) {
    setPointsLog.error = error instanceof Error ? error.message : "Punkteanpassung fehlgeschlagen";
    addLog(setPointsLog);
    throw error;
  }
}

// Encrypted session management using localStorage
export async function getSession(): Promise<UserSession | null> {
  const encrypted = localStorage.getItem("navigium_session_v2");
  if (!encrypted) return null;
  return decryptObject<UserSession>(encrypted);
}

export async function saveSession(session: UserSession): Promise<void> {
  const encrypted = encryptObject(session);
  localStorage.setItem("navigium_session_v2", encrypted);
}

export async function clearSession(): Promise<void> {
  localStorage.removeItem("navigium_session_v2");
}

// Re-login function to refresh session
export async function refreshLogin(): Promise<LoginResponse | null> {
  const session = await getSession();
  if (!session || !session.password) return null;

  try {
    const response = await login(session.username, session.password, session.lang);
    return response;
  } catch (error) {
    console.error('Refresh login failed:', error);
    return null;
  }
}

// App Password Functions - purely hash-based, plaintext is NEVER kept in code
export async function getAppPasswordHash(): Promise<string> {
  return localStorage.getItem("app_password_hash") || DEFAULT_APP_PASSWORD_HASH;
}

export async function setAppPassword(password: string): Promise<void> {
  const hash = await sha256(password);
  localStorage.setItem("app_password_hash", hash);
  // Clean up any legacy unhashed entries
  localStorage.removeItem("app_password_v2");
}

export async function checkAppPassword(): Promise<boolean> {
  return localStorage.getItem("app_authenticated") === "true";
}

export async function authenticateApp(password: string): Promise<boolean> {
  const inputHash = await sha256(password);
  const storedHash = await getAppPasswordHash();
  if (inputHash === storedHash) {
    localStorage.setItem("app_authenticated", "true");
    return true;
  }
  return false;
}

export function clearAppAuth(): void {
  localStorage.removeItem("app_authenticated");
}

/**
 * Validates admin access:
 * - Checks username hash against authorized admin hash (no plaintext in code)
 * - If verifyWithServer is true, verifies that the session token is actually accepted by Navigium
 */
export async function isAdmin(verifyWithServer: boolean = false): Promise<boolean> {
  const session = await getSession();
  if (!session || !session.username || !session.token) {
    return false;
  }

  const usernameHash = await sha256(session.username.toLowerCase().trim());
  if (usernameHash !== ADMIN_USERNAME_HASH) {
    return false;
  }

  if (verifyWithServer) {
    try {
      await fetchWelcomeInfo(session.username, session.school, session.token, session.lang);
      return true;
    } catch {
      return false;
    }
  }

  return true;
}

// User Greetings Management (Encrypted in localStorage)
export async function getGreetings(): Promise<UserGreeting[]> {
  const encrypted = localStorage.getItem("user_greetings_v2");
  if (encrypted) {
    const greetings = decryptObject<UserGreeting[]>(encrypted);
    if (Array.isArray(greetings)) return greetings;
  }
  return [];
}

export async function saveGreetings(greetings: UserGreeting[]): Promise<void> {
  const encrypted = encryptObject(greetings);
  localStorage.setItem("user_greetings_v2", encrypted);
}

export async function getGreetingForUser(username: string): Promise<string | null> {
  const greetings = await getGreetings();
  const found = greetings.find(g => g.username.toLowerCase() === username.toLowerCase());
  return found?.greeting || null;
}

export async function setGreetingForUser(username: string, greeting: string): Promise<void> {
  const greetings = await getGreetings();
  const filtered = greetings.filter(g => g.username.toLowerCase() !== username.toLowerCase());

  if (greeting.trim()) {
    filtered.push({ username: username.trim(), greeting: greeting.trim() });
  }

  await saveGreetings(filtered);
}

// Known Users Management (Encrypted in localStorage)
export async function getKnownUsers(): Promise<string[]> {
  const encrypted = localStorage.getItem("known_users_v2");
  if (encrypted) {
    const users = decryptObject<string[]>(encrypted);
    if (Array.isArray(users)) return users;
  }
  return [];
}

export async function saveKnownUsers(users: string[]): Promise<void> {
  const encrypted = encryptObject(users);
  localStorage.setItem("known_users_v2", encrypted);
}

export async function addKnownUser(username: string): Promise<void> {
  const users = await getKnownUsers();
  if (!users.some(u => u.toLowerCase() === username.toLowerCase())) {
    users.push(username);
    await saveKnownUsers(users);
  }
}
