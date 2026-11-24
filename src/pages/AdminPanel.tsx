import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  getSession,
  isAdmin,
  getKnownUsers,
  getGreetings,
  setGreetingForUser,
  clearAppAuth,
  setAppPassword,
  UserGreeting,
} from "@/lib/navigium-api";
import { ArrowLeft, Users, MessageSquare, Trash2, Save, Shield, LogOut, Key, CheckCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminPanel() {
  const [users, setUsers] = useState<string[]>([]);
  const [greetings, setGreetings] = useState<UserGreeting[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newGreeting, setNewGreeting] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editGreeting, setEditGreeting] = useState("");
  const [newAppPassword, setNewAppPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initAdmin = async () => {
      setIsVerifying(true);
      const session = await getSession();
      // Server-verified admin check: verifies token directly with Navigium
      const admin = await isAdmin(true);

      if (!session || !admin) {
        toast({
          title: "Zugriff verweigert",
          description: "Keine gültigen Administrator-Rechte oder ungültige Sitzung.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      await loadData();
      setIsVerifying(false);
    };

    initAdmin();
  }, [navigate, toast]);

  const loadData = async () => {
    const knownUsers = await getKnownUsers();
    const userGreetings = await getGreetings();
    setUsers(knownUsers);
    setGreetings(userGreetings);
  };

  const handleAddGreeting = async () => {
    if (!newUsername.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib einen Benutzernamen ein.",
        variant: "destructive",
      });
      return;
    }

    if (!newGreeting.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib eine Begrüßungsnachricht ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      await setGreetingForUser(newUsername.trim(), newGreeting.trim());
      const savedUsername = newUsername.trim();
      setNewUsername("");
      setNewGreeting("");
      await loadData();

      toast({
        title: "Gespeichert",
        description: `Begrüßung für "${savedUsername}" wurde gespeichert.`,
      });
    } catch {
      toast({
        title: "Fehler",
        description: "Begrüßung konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleEditGreeting = (username: string) => {
    const current = greetings.find((g) => g.username.toLowerCase() === username.toLowerCase());
    setEditingUser(username);
    setEditGreeting(current?.greeting || "");
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    await setGreetingForUser(editingUser, editGreeting);
    setEditingUser(null);
    setEditGreeting("");
    await loadData();

    toast({
      title: "Gespeichert",
      description: "Begrüßung wurde aktualisiert.",
    });
  };

  const handleDeleteGreeting = async (username: string) => {
    await setGreetingForUser(username, "");
    await loadData();

    toast({
      title: "Gelöscht",
      description: `Begrüßung für ${username} wurde entfernt.`,
    });
  };

  const handleResetAppAuth = () => {
    clearAppAuth();
    toast({
      title: "Sitzungen zurückgesetzt",
      description: "Alle Benutzer müssen das App-Passwort erneut eingeben.",
    });
  };

  const handleChangePassword = async () => {
    if (!newAppPassword.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib ein neues Passwort ein.",
        variant: "destructive",
      });
      return;
    }

    if (newAppPassword.length < 4) {
      toast({
        title: "Fehler",
        description: "Das Passwort muss mindestens 4 Zeichen haben.",
        variant: "destructive",
      });
      return;
    }

    await setAppPassword(newAppPassword.trim());
    clearAppAuth(); // Force re-authentication
    setNewAppPassword("");

    toast({
      title: "Passwort geändert",
      description: "Das App-Passwort wurde sicher verschlüsselt (SHA-256) aktualisiert.",
    });
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Administrator-Rechte werden verifiziert...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/40 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="h-9 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
              <img src="./logo.svg" alt="Navigium Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Admin Panel
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Benutzer, Begrüßungen und App-Passwort verwalten
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <ThemeToggle />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2">
          <Card className="backdrop-blur-xl bg-card/80 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekannte Benutzer</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{users.length}</div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-card/80 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Begrüßungen</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{greetings.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* App Password Settings */}
        <Card className="backdrop-blur-xl bg-card/90 border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-500" />
              App-Zugangspasswort
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Das App-Passwort wird niemals im Klartext im Quellcode oder im Browser angezeigt, sondern ist kryptographisch als SHA-256 Hash gesichert.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-foreground font-medium">
                  Status: Aktiv geschützt (SHA-256 Hash)
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetAppAuth} className="h-8 text-xs">
                <LogOut className="mr-1 h-3 w-3" />
                Auth zurücksetzen
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">Neues App-Passwort festlegen</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Neues Passwort eingeben"
                  value={newAppPassword}
                  onChange={(e) => setNewAppPassword(e.target.value)}
                  className="flex-1 h-10"
                />
                <Button onClick={handleChangePassword} className="h-10 px-5">
                  <Save className="mr-2 h-4 w-4" />
                  Speichern
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Greeting */}
        <Card className="backdrop-blur-xl bg-card/90 border-border/50">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Neue Begrüßung hinzufügen</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Personalisierte Begrüßungsnachricht für einen bestimmten Benutzer festlegen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newUsername" className="text-sm">Benutzername</Label>
                <Input
                  id="newUsername"
                  placeholder="z.B. maxmuster"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newGreeting" className="text-sm">Begrüßungstext</Label>
                <Input
                  id="newGreeting"
                  placeholder="z.B. Willkommen zurück, Max!"
                  value={newGreeting}
                  onChange={(e) => setNewGreeting(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleAddGreeting} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Hinzufügen
            </Button>
          </CardContent>
        </Card>

        {/* Greetings List */}
        <Card className="backdrop-blur-xl bg-card/90 border-border/50">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Alle Begrüßungen</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Übersicht aller personalisierten Begrüßungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              {greetings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Noch keine benutzerdefinierten Begrüßungen vorhanden
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Benutzer</TableHead>
                      <TableHead>Begrüßung</TableHead>
                      <TableHead className="w-[100px]">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {greetings.map((greeting) => (
                      <TableRow key={greeting.username}>
                        <TableCell className="font-medium">{greeting.username}</TableCell>
                        <TableCell>
                          {editingUser === greeting.username ? (
                            <div className="flex gap-2">
                              <Input
                                value={editGreeting}
                                onChange={(e) => setEditGreeting(e.target.value)}
                                className="h-8"
                              />
                              <Button size="sm" onClick={handleSaveEdit}>
                                <Save className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            greeting.greeting
                          )}
                        </TableCell>
                        <TableCell>
                          {editingUser !== greeting.username && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditGreeting(greeting.username)}
                              >
                                <MessageSquare className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteGreeting(greeting.username)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Known Users */}
        <Card className="backdrop-blur-xl bg-card/90 border-border/50">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Bekannte Benutzer</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Liste aller authentifizierten Benutzer, die sich erfolgreich angemeldet haben
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px]">
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Noch keine Benutzer bekannt
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {users.map((user) => (
                    <div
                      key={user}
                      className="px-3 py-1.5 bg-secondary/80 backdrop-blur-sm text-secondary-foreground rounded-full text-xs font-medium border border-border/30"
                    >
                      {user}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
