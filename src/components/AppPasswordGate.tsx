import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authenticateApp, checkAppPassword } from "@/lib/navigium-api";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { AuthLayout } from "./AuthLayout";

interface AppPasswordGateProps {
  children: React.ReactNode;
}

export default function AppPasswordGate({ children }: AppPasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await checkAppPassword();
      setIsAuthenticated(auth);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await authenticateApp(password);
    if (success) {
      setIsAuthenticated(true);
      toast({ title: "Zugang freigegeben" });
    } else {
      toast({
        title: "Falsches Passwort",
        description: "Prüfe die Eingabe und versuche es erneut.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Wird geladen" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <AuthLayout
      corner={<ThemeToggle />}
      title="Zugangspasswort"
      subtitle="Dieser Punkte-Editor ist geschützt. Das Passwort bekommst du von der Person, die ihn betreibt."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="appPassword">Passwort</Label>
          <Input
            id="appPassword"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            className="h-11"
          />
        </div>
        <Button type="submit" className="w-full h-11">
          Entsperren
        </Button>
      </form>
    </AuthLayout>
  );
}
