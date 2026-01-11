import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authenticateApp, checkAppPassword } from "@/lib/navigium-api";
import { Lock, Unlock } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface AppPasswordGateProps {
  children: React.ReactNode;
}

export default function AppPasswordGate({ children }: AppPasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAppPassword());
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authenticateApp(password)) {
      setIsAuthenticated(true);
      toast({
        title: "Zugang gewährt",
        description: "Du kannst jetzt die App verwenden.",
      });
    } else {
      toast({
        title: "Falsches Passwort",
        description: "Das eingegebene Passwort ist falsch.",
        variant: "destructive",
      });
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">Geschützter Bereich</CardTitle>
          <CardDescription className="text-sm">
            Bitte gib das App-Passwort ein um fortzufahren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appPassword">Passwort</Label>
              <Input
                id="appPassword"
                type="password"
                placeholder="App-Passwort eingeben"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <Button type="submit" className="w-full">
              <Unlock className="mr-2 h-4 w-4" />
              Zugang erhalten
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
