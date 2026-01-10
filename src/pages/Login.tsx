import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { login, saveSession } from "@/lib/navigium-api";
import { Loader2, LogIn } from "lucide-react";

export default function Login() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [lang, setLang] = useState("de");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await login(user, password, lang);
      
      saveSession({
        username: response.username,
        lang,
        aktuellerKarteikasten: response.aktuellerKarteikasten,
        gesamtpunkteKarteikasten: response.gesamtpunkteKarteikasten,
      });

      toast({
        title: "Erfolgreich eingeloggt!",
        description: `Willkommen zurück, ${response.username}`,
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Login fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Navigium Punkte-Editor</CardTitle>
          <CardDescription>
            Melde dich mit deinen Navigium-Zugangsdaten an
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user">Benutzername</Label>
              <Input
                id="user"
                type="text"
                placeholder="Dein Navigium-Benutzername"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Dein Navigium-Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lang">Sprache</Label>
              <Input
                id="lang"
                type="text"
                placeholder="de"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anmelden...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Anmelden
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
