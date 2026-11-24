import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { login, saveSession, addKnownUser, getGreetingForUser } from "@/lib/navigium-api";
import { Loader2, LogIn, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Login() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [lang, setLang] = useState("LA");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await login(user, password, lang);
      
      // Check for personalized greeting
      const personalGreeting = await getGreetingForUser(response.username);
      
      toast({
        title: "Erfolgreich angemeldet!",
        description: personalGreeting || `Willkommen zurück, ${response.username}`,
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md relative shadow-2xl backdrop-blur-xl bg-card/90 border-border/50">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-1 drop-shadow-md">
            <img src="./logo.svg" alt="Navigium Logo" className="w-16 h-16 object-contain" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-primary/70" />
              <CardTitle className="text-2xl font-bold tracking-tight">Navigium Punkte-Editor</CardTitle>
              <Sparkles className="h-4 w-4 text-primary/70" />
            </div>
            <CardDescription className="text-sm">
              Direkter Login mit deinen Navigium-Zugangsdaten
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user" className="text-sm">Benutzername</Label>
              <Input
                id="user"
                type="text"
                placeholder="Dein Navigium-Benutzername"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Dein Navigium-Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lang" className="text-sm">Sprache</Label>
              <Select value={lang} onValueChange={setLang} disabled={isLoading}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Sprache wählen" />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                  <SelectItem value="LA">Latein</SelectItem>
                  <SelectItem value="GRC">Griechisch</SelectItem>
                  <SelectItem value="EN">Englisch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
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
