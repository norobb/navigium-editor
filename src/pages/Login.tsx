import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { login, saveSession, addKnownUser, getGreetingForUser } from "@/lib/navigium-api";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthLayout } from "@/components/AuthLayout";

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
        title: "Angemeldet",
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
    <AuthLayout
      corner={<ThemeToggle />}
      title="Anmelden"
      subtitle="Mit deinem Navigium-Konto. Danach kannst du den Punktestand deines Karteikastens setzen."
    >
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Benutzername</Label>
            <Input
              id="user"
              type="text"
              autoComplete="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
              disabled={isLoading}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lang">Sprache</Label>
            <Select value={lang} onValueChange={setLang} disabled={isLoading}>
              <SelectTrigger id="lang" className="w-full h-11">
                <SelectValue placeholder="Sprache wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LA">Latein</SelectItem>
                <SelectItem value="GRC">Griechisch</SelectItem>
                <SelectItem value="EN">Englisch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" />}
          {isLoading ? "Wird angemeldet…" : "Anmelden"}
        </Button>
      </form>
    </AuthLayout>
  );
}
