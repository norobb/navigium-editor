import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  getSession,
  clearSession,
  setPoints,
  getPoints,
  saveSession,
  refreshLogin,
  UserSession,
  isAdmin,
  getGreetingForUser,
} from "@/lib/navigium-api";
import { RefreshCw, ScrollText, Shield } from "lucide-react";
import RequestLog from "@/components/RequestLog";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/ThemeToggle";

const LOGIN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const QUICK_STEPS = [-100, -10, 10, 100, 1000];
const LANG_LABELS: Record<string, string> = { LA: "Latein", GRC: "Griechisch", EN: "Englisch" };

export default function Dashboard() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [targetPoints, setTargetPoints] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [logRefreshTrigger, setLogRefreshTrigger] = useState(0);
  const [showLog, setShowLog] = useState(false);
  const [personalGreeting, setPersonalGreeting] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const refreshSession = useCallback(async () => {
    const currentSession = await getSession();
    if (!currentSession) {
      navigate("/");
      return;
    }

    try {
      const response = await refreshLogin();
      if (response) {
        const updatedSession = {
          ...currentSession,
          aktuellerKarteikasten: response.aktuellerKarteikasten,
          gesamtpunkteKarteikasten: response.gesamtpunkteKarteikasten,
        };
        setSession(updatedSession);
        setTargetPoints(response.gesamtpunkteKarteikasten.toString());
        setLogRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Session refresh failed:", error);
    }
  }, [navigate]);

  useEffect(() => {
    const initSession = async () => {
      const currentSession = await getSession();
      if (!currentSession) {
        navigate("/");
        return;
      }
      setSession(currentSession);
      setTargetPoints(currentSession.gesamtpunkteKarteikasten.toString());

      const greeting = await getGreetingForUser(currentSession.username);
      setPersonalGreeting(greeting);

      const admin = await isAdmin();
      setIsAdminUser(admin);
    };

    initSession();

    // Initial refresh login
    refreshSession();

    // Set up periodic login refresh
    const intervalId = setInterval(refreshSession, LOGIN_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [navigate, refreshSession]);

  const handleLogout = () => {
    clearSession();
    toast({ title: "Abgemeldet" });
    navigate("/");
  };

  const handleSetPoints = async (diff: number) => {
    if (!session) return;
    setIsLoading(true);
    setProgress(diff !== 0 ? { done: 0, total: Math.abs(diff) } : null);

    try {
      // Direct client-side batching and updating with live progress
      const result = await setPoints(
        session.username,
        diff,
        session.lang,
        (done, total) => setProgress({ done, total })
      );

      const updatedSession = {
        ...session,
        aktuellerKarteikasten: result.aktuellerKarteikasten,
        gesamtpunkteKarteikasten: result.gesamtpunkteKarteikasten,
      };

      saveSession(updatedSession);
      setSession(updatedSession);
      setTargetPoints(result.gesamtpunkteKarteikasten.toString());
      setLogRefreshTrigger((prev) => prev + 1);

      if (diff === 0) {
        toast({
          title: "Aktualisiert",
          description: `Punktestand: ${result.gesamtpunkteKarteikasten.toLocaleString("de-DE")}`,
        });
      } else {
        toast({
          title: diff > 0 ? `${diff} Punkte hinzugefügt` : `${-diff} Punkte abgezogen`,
          description: `Neuer Punktestand: ${result.gesamtpunkteKarteikasten.toLocaleString("de-DE")}`,
        });
      }
    } catch (error) {
      setLogRefreshTrigger((prev) => prev + 1);
      toast({
        title: "Punktestand nicht geändert",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const target = parseInt(targetPoints, 10);
    if (isNaN(target)) {
      toast({
        title: "Ungültige Eingabe",
        description: "Gib eine ganze Zahl ein.",
        variant: "destructive",
      });
      return;
    }

    const diff = target - session.gesamtpunkteKarteikasten;
    if (diff === 0) {
      toast({
        title: "Keine Änderung",
        description: "Der Punktestand entspricht bereits diesem Wert.",
      });
      return;
    }

    await handleSetPoints(diff);
  };

  const handleQuickChange = async (amount: number) => {
    await handleSetPoints(amount);
  };

  const handleRefresh = async () => {
    if (!session) return;
    setIsLoading(true);

    try {
      const response = await getPoints(session.username, session.lang);

      const updatedSession = {
        ...session,
        aktuellerKarteikasten: response.aktuellerKarteikasten,
        gesamtpunkteKarteikasten: response.gesamtpunkteKarteikasten,
      };

      saveSession(updatedSession);
      setSession(updatedSession);
      setTargetPoints(response.gesamtpunkteKarteikasten.toString());
      setLogRefreshTrigger((prev) => prev + 1);

      toast({
        title: "Aktualisiert",
        description: `Punktestand: ${response.gesamtpunkteKarteikasten.toLocaleString("de-DE")}`,
      });
    } catch (error) {
      setLogRefreshTrigger((prev) => prev + 1);
      toast({
        title: "Neu laden fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  const progressPercent =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.done / progress.total) * 100))
      : 0;

  const parsedTarget = parseInt(targetPoints, 10);
  const diff = isNaN(parsedTarget) ? null : parsedTarget - session.gesamtpunkteKarteikasten;
  const fmt = (n: number) => n.toLocaleString("de-DE");
  const signed = (n: number) => (n > 0 ? `+${fmt(n)}` : n < 0 ? `−${fmt(-n)}` : "±0");

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <img src="./logo.svg" alt="" className="h-6 w-6 shrink-0" />
            <span className="text-[15px] font-medium">Punkte-Editor</span>
            <span className="truncate text-sm text-muted-foreground">
              {personalGreeting || session.username}
            </span>
          </div>
          <nav className="flex items-center gap-1 text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Punktestand neu laden"
              aria-label="Punktestand neu laden"
            >
              <RefreshCw className={isLoading ? "animate-spin" : ""} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLog(!showLog)}
              title="Protokoll"
              aria-label="Protokoll"
              aria-pressed={showLog}
              className={showLog ? "bg-accent text-foreground" : ""}
            >
              <ScrollText />
            </Button>
            {isAdminUser && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
                title="Verwaltung"
                aria-label="Verwaltung"
              >
                <Shield />
              </Button>
            )}
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-1 text-muted-foreground">
              Abmelden
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          {/* Karteikarte mit dem aktuellen Punktestand */}
          <section
            aria-label="Aktueller Punktestand"
            className="index-card relative self-start overflow-hidden rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none"
          >
            <div className="flex h-12 items-center justify-between pl-12 pr-5">
              <span className="truncate text-sm text-muted-foreground">
                {session.aktuellerKarteikasten || "Karteikasten"}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {LANG_LABELS[session.lang] ?? session.lang}
              </span>
            </div>
            <div className="pl-12 pr-5 pt-5 pb-8">
              <p className="text-sm text-muted-foreground">Gesamtpunkte</p>
              <p className="mt-2 font-mono text-[56px] font-medium leading-none tabular-nums sm:text-[64px]">
                {fmt(session.gesamtpunkteKarteikasten)}
              </p>
              <p className="mt-4 h-5 font-mono text-sm tabular-nums">
                {diff !== null && diff !== 0 && (
                  <span className="text-primary">
                    Ziel {fmt(parsedTarget)}, {signed(diff)}
                  </span>
                )}
              </p>
            </div>
            {session.school && (
              <div className="flex h-12 items-center pl-12 pr-5 font-mono text-xs text-muted-foreground">
                {session.school}
              </div>
            )}
          </section>

          {/* Editor */}
          <section aria-labelledby="editor-title" className="md:pt-2">
            <h1 id="editor-title" className="text-xl font-medium">
              Punktestand setzen
            </h1>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Gib den Zielwert ein. Die App schiebt dafür Vokabeln im Karteikasten vor oder zurück, pro Punkt eine Bewegung.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-2">
              <Label htmlFor="targetPoints">Zielwert</Label>
              <div className="flex gap-2">
                <Input
                  id="targetPoints"
                  type="number"
                  inputMode="numeric"
                  value={targetPoints}
                  onChange={(e) => setTargetPoints(e.target.value)}
                  disabled={isLoading}
                  className="h-11 flex-1 font-mono text-base tabular-nums"
                />
                <Button type="submit" disabled={isLoading || diff === 0 || diff === null} className="h-11 px-5">
                  Übernehmen
                </Button>
              </div>
            </form>

            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium" id="quick-label">
                Schnell ändern
              </p>
              <div className="grid grid-cols-5 gap-2" role="group" aria-labelledby="quick-label">
                {QUICK_STEPS.map((step) => (
                  <Button
                    key={step}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickChange(step)}
                    disabled={isLoading}
                    className="h-9 px-0 font-mono text-[13px] tabular-nums"
                  >
                    {signed(step)}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading && progress && (
              <div className="mt-8 space-y-2" role="status" aria-live="polite">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vokabeln werden verschoben</span>
                  <span className="font-mono tabular-nums">
                    {fmt(progress.done)} / {fmt(progress.total)}
                  </span>
                </div>
                <Progress value={progressPercent} aria-label={`${progressPercent} Prozent`} />
              </div>
            )}
          </section>
        </div>

        <Collapsible open={showLog} onOpenChange={setShowLog}>
          <CollapsibleContent className="mt-12">
            <RequestLog refreshTrigger={logRefreshTrigger} />
          </CollapsibleContent>
        </Collapsible>
      </main>
    </div>
  );
}
