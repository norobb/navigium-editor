import { supabase } from "@/integrations/supabase/client";

export interface LoginResponse {
  username: string;
  // Name des aktuell ausgewählten Karteikastens
  aktuellerKarteikasten: string;
  // Gesamtpunkte als Zahl
  gesamtpunkteKarteikasten: number;
}

export interface SetPointsResponse {
  aktuellerKarteikasten: string;
  gesamtpunkteKarteikasten: number;
}

export interface UserSession {
  username: string;
  lang: string;
  aktuellerKarteikasten: string;
  gesamtpunkteKarteikasten: number;
}

export async function login(
  user: string,
  password: string,
  lang: string = "LA"
): Promise<LoginResponse> {
  const { data, error } = await supabase.functions.invoke("navigium-proxy", {
    body: { action: "login", user, password, lang },
  });

  if (error) {
    throw new Error("Login fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.");
  }

  return {
    username: (data?.username as string) || user,
    aktuellerKarteikasten: String(data?.aktuellerKarteikasten ?? ""),
    gesamtpunkteKarteikasten: Number.parseInt(String(data?.gesamtpunkteKarteikasten ?? "0"), 10) || 0,
  };
}

export async function setPoints(
  name: string,
  diff: number,
  lang: string = "LA"
): Promise<SetPointsResponse> {
  const { data, error } = await supabase.functions.invoke("navigium-proxy", {
    body: { action: "setpoints", name, diff, lang },
  });

  if (error) {
    throw new Error("Punkte konnten nicht geändert werden.");
  }

  return {
    aktuellerKarteikasten: String(data?.aktuellerKarteikasten ?? ""),
    gesamtpunkteKarteikasten: Number.parseInt(String(data?.gesamtpunkteKarteikasten ?? "0"), 10) || 0,
  };
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
