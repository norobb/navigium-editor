import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSession, clearSession, setPoints, saveSession, UserSession } from "@/lib/navigium-api";
import { Loader2, LogOut, Save, Plus, Minus, Trophy, Target } from "lucide-react";

export default function Dashboard() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [targetPoints, setTargetPoints] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      navigate("/");
      return;
    }
    setSession(currentSession);
    setTargetPoints(currentSession.aktuellerKarteikasten.toString());
  }, [navigate]);

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
      const response = await setPoints(session.username, diff, session.lang);
      
      const updatedSession = {
        ...session,
        aktuellerKarteikasten: response.aktuellerKarteikasten,
        gesamtpunkteKarteikasten: response.gesamtpunkteKarteikasten,
      };
      
      saveSession(updatedSession);
      setSession(updatedSession);
      setTargetPoints(response.aktuellerKarteikasten.toString());

      toast({
        title: "Punkte aktualisiert!",
        description: `Neuer Punktestand: ${response.aktuellerKarteikasten}`,
      });
    } catch (error) {
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

    const diff = target - session.aktuellerKarteikasten;
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

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Navigium Punkte-Editor</h1>
            <p className="text-muted-foreground">Eingeloggt als {session.username}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Ausloggen
          </Button>
        </div>

        {/* Points Display */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Karteikasten-Punkte</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {session.aktuellerKarteikasten}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aktueller Punktestand
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamtpunkte</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {session.gesamtpunkteKarteikasten}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Alle Punkte zusammen
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Points Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Punkte bearbeiten</CardTitle>
            <CardDescription>
              Gib den neuen Punktestand ein oder nutze die Schnellauswahl
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Manual Input */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetPoints">Neuer Punktestand</Label>
                <div className="flex gap-2">
                  <Input
                    id="targetPoints"
                    type="number"
                    placeholder="Gewünschter Punktestand"
                    value={targetPoints}
                    onChange={(e) => setTargetPoints(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading}>
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
                  <p className="text-sm text-muted-foreground">
                    Differenz: {parseInt(targetPoints, 10) - session.aktuellerKarteikasten} Punkte
                  </p>
                )}
              </div>
            </form>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Label>Schnellauswahl</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(-100)}
                  disabled={isLoading}
                >
                  <Minus className="mr-1 h-3 w-3" />
                  100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(-10)}
                  disabled={isLoading}
                >
                  <Minus className="mr-1 h-3 w-3" />
                  10
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(10)}
                  disabled={isLoading}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  10
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(100)}
                  disabled={isLoading}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(1000)}
                  disabled={isLoading}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  1000
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
