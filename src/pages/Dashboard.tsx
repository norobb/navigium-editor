import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSession, clearSession, setPoints, getPoints, saveSession, refreshLogin, UserSession, isAdmin, getGreetingForUser } from "@/lib/navigium-api";
import { Loader2, LogOut, Save, Plus, Minus, Trophy, Target, RefreshCw, FileText, Shield } from "lucide-react";
import RequestLog from "@/components/RequestLog";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/ThemeToggle";

const LOGIN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function Dashboard() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [targetPoints, setTargetPoints] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logRefreshTrigger, setLogRefreshTrigger] = useState(0);
  const [showLog, setShowLog] = useState(false);
  const [personalGreeting, setPersonalGreeting] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const refreshSession = useCallback(async () => {
    const currentSession = getSession();
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
        setLogRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
    }
  }, [navigate]);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      navigate("/");
      return;
    }
    setSession(currentSession);
    setTargetPoints(currentSession.gesamtpunkteKarteikasten.toString());
    setPersonalGreeting(getGreetingForUser(currentSession.username));

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
      description: "Du wurdest erfolgreich ausgeloggt.",
    });
    navigate("/");
  };

  const handleSetPoints = async (diff: number) => {
    if (!session) return;
    setIsLoading(true);

    try {
      // First, set the points
      const setResponse = await setPoints(session.username, diff, session.lang);
      
      // Then, fetch the current points to confirm
      const getResponse = await getPoints(session.username, session.lang);
      
      const updatedSession = {
        ...session,
        aktuellerKarteikasten: getResponse.aktuellerKarteikasten,
        gesamtpunkteKarteikasten: getResponse.gesamtpunkteKarteikasten,
      };
      
      saveSession(updatedSession);
      setSession(updatedSession);
      setTargetPoints(getResponse.gesamtpunkteKarteikasten.toString());
      setLogRefreshTrigger(prev => prev + 1);

      if (diff === 0) {
        toast({
          title: "Punkte aktualisiert!",
          description: `Aktueller Punktestand: ${getResponse.gesamtpunkteKarteikasten}`,
        });
      } else {
        toast({
          title: "Punkte geändert!",
          description: `Neuer Punktestand: ${getResponse.gesamtpunkteKarteikasten}`,
        });
      }
    } catch (error) {
      setLogRefreshTrigger(prev => prev + 1);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
        description: "Der Punktestand ist bereits auf diesem Wert.",
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
      setLogRefreshTrigger(prev => prev + 1);

      toast({
        title: "Punkte aktualisiert!",
        description: `Aktueller Punktestand: ${response.gesamtpunkteKarteikasten}`,
      });
    } catch (error) {
      setLogRefreshTrigger(prev => prev + 1);
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

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Navigium Punkte-Editor</h1>
            <p className="text-sm text-muted-foreground">
              {personalGreeting || `Eingeloggt als ${session.username}`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Aktualisieren</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowLog(!showLog)}>
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Log</span>
            </Button>
            {isAdmin() && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Admin</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Ausloggen</span>
            </Button>
          </div>
        </div>

        {/* Points Display */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktueller Karteikasten</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-4xl font-bold text-primary break-all">
                {session.aktuellerKarteikasten || "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ausgewählter Karteikasten
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamtpunkte</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-4xl font-bold text-primary">
                {session.gesamtpunkteKarteikasten}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Deine aktuellen Punkte
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Points Editor */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Punkte bearbeiten</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Gib den neuen Punktestand ein oder nutze die Schnellauswahl
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Manual Input */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetPoints" className="text-sm">Neuer Punktestand</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="targetPoints"
                    type="number"
                    placeholder="Gewünschter Punktestand"
                    value={targetPoints}
                    onChange={(e) => setTargetPoints(e.target.value)}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Anwenden
                      </>
                    )}
                  </Button>
                </div>
                {session && targetPoints && !isNaN(parseInt(targetPoints, 10)) && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Differenz: {parseInt(targetPoints, 10) - session.gesamtpunkteKarteikasten} Punkte
                  </p>
                )}
              </div>
            </form>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Label className="text-sm">Schnellauswahl</Label>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(-100)}
                  disabled={isLoading}
                  className="text-xs sm:text-sm"
                >
                  <Minus className="mr-1 h-3 w-3" />
                  100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(-10)}
                  disabled={isLoading}
                  className="text-xs sm:text-sm"
                >
                  <Minus className="mr-1 h-3 w-3" />
                  10
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(10)}
                  disabled={isLoading}
                  className="text-xs sm:text-sm"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  10
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(100)}
                  disabled={isLoading}
                  className="text-xs sm:text-sm"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(1000)}
                  disabled={isLoading}
                  className="col-span-2 sm:col-span-1 text-xs sm:text-sm"
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
