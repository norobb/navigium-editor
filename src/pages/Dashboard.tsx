import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Loader2,
  LogOut,
  Save,
  Plus,
  Minus,
  Trophy,
  Target,
  RefreshCw,
  FileText,
  Shield,
  Sparkles,
} from "lucide-react";
import RequestLog from "@/components/RequestLog";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/ThemeToggle";

const LOGIN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

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
    toast({
      title: "Ausgeloggt",
      description: "Du wurdest erfolgreich abgemeldet.",
    });
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
          description: `Punktestand: ${result.gesamtpunkteKarteikasten}`,
        });
      } else {
        toast({
          title: diff > 0 ? `+${diff} Punkte hinzugefügt` : `${diff} Punkte angepasst`,
          description: `Neuer Punktestand: ${result.gesamtpunkteKarteikasten}`,
        });
      }
    } catch (error) {
      setLogRefreshTrigger((prev) => prev + 1);
      toast({
        title: "Fehler beim Anpassen",
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
        description: "Bitte gib eine gültige Zahl ein.",
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
        description: `Punktestand: ${response.gesamtpunkteKarteikasten}`,
      });
    } catch (error) {
      setLogRefreshTrigger((prev) => prev + 1);
      toast({
        title: "Fehler",
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

  return (
    <div className="min-h-screen p-3 sm:p-6 relative overflow-hidden bg-background">
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-10 left-10 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/40 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center drop-shadow-sm flex-shrink-0">
              <img src="./logo.svg" alt="Navigium Logo" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Navigium Editor
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium border border-primary/20">
                  v2.0
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {personalGreeting || `Eingeloggt als ${session.username}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Punkte aktualisieren"
              className="h-9 px-3"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin text-primary" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLog(!showLog)}
              title="Request Log anzeigen"
              className="h-9 px-3"
            >
              <FileText className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Log</span>
            </Button>
            {isAdminUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin")}
                title="Admin-Panel"
                className="h-9 px-3 border-amber-500/30 text-amber-500 hover:text-amber-400"
              >
                <Shield className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              title="Abmelden"
              className="h-9 px-3 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Live Progress Bar when updating points */}
        {isLoading && progress && (
          <Card className="border-primary/40 bg-primary/5 shadow-md animate-in fade-in-50">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Vokabeln werden synchronisiert...
                </span>
                <span>
                  {progress.done} / {progress.total} ({progressPercent}%)
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Points Display */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktueller Karteikasten
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground break-all">
                {session.aktuellerKarteikasten || "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Schule: <span className="font-semibold text-foreground/80">{session.school || "GSJ_HAMBURG"}</span> • Sprache:{" "}
                <span className="font-semibold text-foreground/80">{session.lang || "LA"}</span>
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gesamtpunkte
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {session.gesamtpunkteKarteikasten.toLocaleString("de-DE")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Synchronisierter Navigium-Punktestand
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Points Editor */}
        <Card className="backdrop-blur-xl bg-card/90 border-border/50 shadow-md">
          <CardHeader className="pb-3 sm:pb-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base sm:text-lg">Punktestand modifizieren</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Gib einen Zielwert ein oder nutze die Schnellauswahl. Der Algorithmus bewegt die Vokabeln direkt im Karteikasten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5 pt-4">
            {/* Manual Input */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="targetPoints" className="text-sm font-medium">
                  Neuer Punktestand
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="targetPoints"
                    type="number"
                    placeholder="Gewünschter Punktestand"
                    value={targetPoints}
                    onChange={(e) => setTargetPoints(e.target.value)}
                    disabled={isLoading}
                    className="flex-1 h-11 text-base font-semibold"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto h-11 px-6 font-medium"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verarbeite...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Anwenden
                      </>
                    )}
                  </Button>
                </div>
                {session && targetPoints && !isNaN(parseInt(targetPoints, 10)) && (
                  <p className="text-xs text-muted-foreground">
                    Differenz:{" "}
                    <span
                      className={`font-semibold ${
                        parseInt(targetPoints, 10) - session.gesamtpunkteKarteikasten > 0
                          ? "text-emerald-500"
                          : parseInt(targetPoints, 10) - session.gesamtpunkteKarteikasten < 0
                          ? "text-rose-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {parseInt(targetPoints, 10) - session.gesamtpunkteKarteikasten > 0 ? "+" : ""}
                      {parseInt(targetPoints, 10) - session.gesamtpunkteKarteikasten} Punkte
                    </span>
                  </p>
                )}
              </div>
            </form>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2 border-t border-border/30">
              <Label className="text-sm font-medium">Schnellauswahl</Label>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(-100)}
                  disabled={isLoading}
                  className="text-xs sm:text-sm h-9 hover:border-destructive hover:text-destructive"
                >
                  <Minus className="mr-1 h-3 w-3" />
                  100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(-10)}
                  disabled={isLoading}
                  className="text-xs sm:text-sm h-9 hover:border-destructive hover:text-destructive"
                >
                  <Minus className="mr-1 h-3 w-3" />
                  10
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(10)}
                  disabled={isLoading}
                  className="text-xs sm:text-sm h-9 hover:border-emerald-500 hover:text-emerald-500"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  10
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(100)}
                  disabled={isLoading}
                  className="text-xs sm:text-sm h-9 hover:border-emerald-500 hover:text-emerald-500"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(1000)}
                  disabled={isLoading}
                  className="col-span-2 sm:col-span-1 text-xs sm:text-sm h-9 hover:border-emerald-500 hover:text-emerald-500 font-semibold"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  1000
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Log */}
        <Collapsible open={showLog} onOpenChange={setShowLog}>
          <CollapsibleContent>
            <RequestLog refreshTrigger={logRefreshTrigger} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
