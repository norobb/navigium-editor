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
  UserGreeting,
} from "@/lib/navigium-api";
import { ArrowLeft, Users, MessageSquare, Trash2, Save, Shield, LogOut } from "lucide-react";
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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const session = getSession();
    if (!session || !isAdmin()) {
      toast({
        title: "Kein Zugang",
        description: "Du hast keinen Zugang zum Admin Panel.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    loadData();
  }, [navigate, toast]);

  const loadData = () => {
    setUsers(getKnownUsers());
    setGreetings(getGreetings());
  };

  const handleAddGreeting = () => {
    if (!newUsername.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib einen Benutzernamen ein.",
        variant: "destructive",
      });
      return;
    }

    setGreetingForUser(newUsername.trim(), newGreeting.trim());
    setNewUsername("");
    setNewGreeting("");
    loadData();
    
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

  const handleSaveEdit = () => {
    if (!editingUser) return;
    
    setGreetingForUser(editingUser, editGreeting);
    setEditingUser(null);
    setEditGreeting("");
    loadData();
    
    toast({
      title: "Gespeichert",
      description: "Begrüßung wurde aktualisiert.",
    });
  };

  const handleDeleteGreeting = (username: string) => {
    setGreetingForUser(username, "");
    loadData();
    
    toast({
      title: "Gelöscht",
      description: `Begrüßung für ${username} wurde entfernt.`,
    });
  };

  const handleResetAppAuth = () => {
    clearAppAuth();
    toast({
      title: "App-Authentifizierung zurückgesetzt",
      description: "Alle Benutzer müssen sich erneut mit dem App-Passwort anmelden.",
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
              <p className="text-sm text-muted-foreground">Benutzer und Begrüßungen verwalten</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleResetAppAuth}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">App-Auth Reset</span>
            </Button>
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
            <ScrollArea className="h-[300px]">
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
            <ScrollArea className="h-[200px]">
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Noch keine Benutzer bekannt
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {users.map((user) => (
                    <div
                      key={user}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
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
