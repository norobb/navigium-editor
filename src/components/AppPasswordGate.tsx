import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authenticateApp, checkAppPassword } from "@/lib/navigium-api";
import { Lock, Unlock, Sparkles } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

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
      toast({
        title: "Zugang gewährt",
        description: "Willkommen! Du kannst jetzt die App verwenden.",
      });
    } else {
      toast({
        title: "Falsches Passwort",
        description: "Das eingegebene Passwort ist falsch.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-sm relative">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-2 backdrop-blur-sm border border-border/30">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-primary/60" />
              <CardTitle className="text-xl font-bold">Geschützter Bereich</CardTitle>
              <Sparkles className="h-4 w-4 text-primary/60" />
            </div>
            <CardDescription className="text-sm">
              Bitte gib das App-Passwort ein
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appPassword" className="text-sm">Passwort</Label>
              <Input
                id="appPassword"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11">
              <Unlock className="mr-2 h-4 w-4" />
              Zugang erhalten
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
