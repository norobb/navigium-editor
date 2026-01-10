const BASE_URL = "https://n8n.nemserver.duckdns.org/webhook/navigium";
const INTERNAL_KEY = "BANANA";

export interface LoginResponse {
  username: string;
  aktuellerKarteikasten: number;
  gesamtpunkteKarteikasten: number;
}

export interface SetPointsResponse {
  aktuellerKarteikasten: number;
  gesamtpunkteKarteikasten: number;
}

export interface UserSession {
  username: string;
  lang: string;
  aktuellerKarteikasten: number;
  gesamtpunkteKarteikasten: number;
}

export async function login(
  user: string,
  password: string,
  lang: string = "de"
): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": INTERNAL_KEY,
    },
    body: JSON.stringify({ user, password, lang }),
  });

  if (!response.ok) {
    throw new Error("Login fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.");
  }

  return response.json();
}

export async function setPoints(
  name: string,
  diff: number,
  lang: string = "de"
): Promise<SetPointsResponse> {
  const response = await fetch(`${BASE_URL}/setpoints`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": INTERNAL_KEY,
    },
    body: JSON.stringify({ name, diff, lang }),
  });

  if (!response.ok) {
    throw new Error("Punkte konnten nicht geändert werden.");
  }

  return response.json();
}

export function getSession(): UserSession | null {
  const session = localStorage.getItem("navigium_session");
  return session ? JSON.parse(session) : null;
}

export function saveSession(session: UserSession): void {
  localStorage.setItem("navigium_session", JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem("navigium_session");
}
