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
  getAppPassword,
  setAppPassword,
  UserGreeting,
} from "@/lib/navigium-api";
import { ArrowLeft, Users, MessageSquare, Trash2, Save, Shield, LogOut, Key, Eye, EyeOff } from "lucide-react";
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
  const [currentAppPassword, setCurrentAppPassword] = useState("");
  const [newAppPassword, setNewAppPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initAdmin = async () => {
      const session = await getSession();
      const admin = await isAdmin();
      if (!session || !admin) {
        toast({
          title: "Kein Zugang",
          description: "Du hast keinen Zugang zum Admin Panel.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      await loadData();
    };

    initAdmin();
  }, [navigate, toast]);

  const loadData = async () => {
    const knownUsers = await getKnownUsers();
    const userGreetings = await getGreetings();
    const appPassword = await getAppPassword();
    setUsers(knownUsers);
    setGreetings(userGreetings);
    setCurrentAppPassword(appPassword);
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

    await setGreetingForUser(newUsername.trim(), newGreeting.trim());
    setNewUsername("");
    setNewGreeting("");
    await loadData();
    
    toast({
      title: "Gespeichert",
      description: `Begrüßung für ${newUsername} wurde gespeichert.`,
    });
  };

  const handleEditGreeting = (username: string) => {
    const current = greetings.find(g => g.username === username);
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
      title: "Zurückgesetzt",
      description: "Alle Benutzer müssen sich erneut anmelden.",
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

    await setAppPassword(newAppPassword);
    clearAppAuth(); // Force re-authentication with new password
    setCurrentAppPassword(newAppPassword);
    setNewAppPassword("");
    
    toast({
      title: "Passwort geändert",
      description: "Das App-Passwort wurde erfolgreich geändert.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Panel</h1>
              </div>
              <p className="text-sm text-muted-foreground">Benutzer und Einstellungen verwalten</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ThemeToggle />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekannte Benutzer</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Key className="h-4 w-4" />
              App-Passwort
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Ändere das allgemeine Zugangspasswort für die App
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Aktuelles Passwort</Label>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={currentAppPassword}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Neues Passwort eingeben"
                  value={newAppPassword}
                  onChange={(e) => setNewAppPassword(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleChangePassword} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Ändern
                </Button>
                <Button variant="outline" onClick={handleResetAppAuth}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Greeting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Neue Begrüßung hinzufügen</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Personalisierte Begrüßungsnachricht für einen Benutzer festlegen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newUsername">Benutzername</Label>
                <Input
                  id="newUsername"
                  placeholder="z.B. max123"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newGreeting">Begrüßungstext</Label>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Alle Begrüßungen</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Übersicht aller personalisierten Begrüßungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              {greetings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Noch keine Begrüßungen vorhanden
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
                                <Trash2 className="h-3 w-3" />
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Bekannte Benutzer</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Liste aller Benutzer, die sich angemeldet haben
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px]">
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Noch keine Benutzer bekannt
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {users.map((user) => (
                    <div
                      key={user}
                      className="px-3 py-1.5 bg-secondary/80 backdrop-blur-sm text-secondary-foreground rounded-full text-sm border border-border/30"
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
