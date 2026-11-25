import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
          description: "Dieses Konto hat keine Admin-Rechte oder die Sitzung ist abgelaufen.",
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
        description: "Der Benutzername fehlt.",
        variant: "destructive",
      });
      return;
    }

    if (!newGreeting.trim()) {
      toast({
        title: "Fehler",
        description: "Der Begrüßungstext fehlt.",
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
      title: "Freigaben zurückgesetzt",
      description: "Alle Benutzer müssen das App-Passwort erneut eingeben.",
    });
  };

  const handleChangePassword = async () => {
    if (!newAppPassword.trim()) {
      toast({
        title: "Fehler",
        description: "Das neue Passwort fehlt.",
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
      description: "Alle müssen das neue Passwort eingeben.",
    });
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Admin-Rechte werden geprüft
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              title="Zurück zum Editor"
              aria-label="Zurück zum Editor"
              className="-ml-2 text-muted-foreground"
            >
              <ArrowLeft />
            </Button>
            <img src="./logo.svg" alt="" className="h-6 w-6" />
            <span className="text-[15px] font-medium">Verwaltung</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-wrap gap-x-12 gap-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Bekannte Benutzer</p>
            <p className="mt-1 font-mono text-[28px] font-medium leading-none tabular-nums">{users.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Begrüßungen</p>
            <p className="mt-1 font-mono text-[28px] font-medium leading-none tabular-nums">{greetings.length}</p>
          </div>
        </div>

        {/* App-Passwort */}
        <section aria-labelledby="pw-title" className="mt-12 grid gap-6 border-t pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-12">
          <div>
            <h2 id="pw-title" className="text-base font-medium">App-Passwort</h2>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Gespeichert wird nur der SHA-256-Hash, nie das Passwort selbst. Nach einer Änderung müssen alle es neu eingeben.
            </p>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newAppPassword}
                  onChange={(e) => setNewAppPassword(e.target.value)}
                  className="h-10 flex-1"
                />
                <Button onClick={handleChangePassword} className="h-10">
                  Passwort ändern
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Mindestens 4 Zeichen</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted px-4 py-3">
              <p className="text-sm text-muted-foreground">Alle Geräte ab sofort nach dem Passwort fragen</p>
              <Button variant="outline" size="sm" onClick={handleResetAppAuth}>
                Freigaben zurücksetzen
              </Button>
            </div>
          </div>
        </section>

        {/* Begrüßungen */}
        <section aria-labelledby="greet-title" className="mt-12 grid gap-6 border-t pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-12">
          <div>
            <h2 id="greet-title" className="text-base font-medium">Begrüßungen</h2>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Ein eigener Text, den ein Benutzer nach der Anmeldung statt seines Namens sieht.
            </p>
          </div>
          <div className="space-y-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddGreeting();
              }}
              className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] sm:items-end"
            >
              <div className="space-y-2">
                <Label htmlFor="newUsername">Benutzername</Label>
                <Input id="newUsername" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newGreeting">Text</Label>
                <Input id="newGreeting" value={newGreeting} onChange={(e) => setNewGreeting(e.target.value)} className="h-10" />
              </div>
              <Button type="submit" className="h-10">
                Hinzufügen
              </Button>
            </form>

            <div className="rounded-xl border">
              {greetings.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">Noch keine Begrüßungen</p>
              ) : (
                <div className="max-h-[320px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-10 font-normal">Benutzer</TableHead>
                        <TableHead className="h-10 font-normal">Text</TableHead>
                        <TableHead className="h-10 w-20"><span className="sr-only">Aktionen</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {greetings.map((greeting) => {
                        const editing = editingUser === greeting.username;
                        return (
                          <TableRow key={greeting.username} data-state={editing ? "selected" : undefined}>
                            <TableCell className="py-2 font-mono text-[13px]">{greeting.username}</TableCell>
                            <TableCell className="py-2">
                              {editing ? (
                                <form
                                  className="flex gap-2"
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSaveEdit();
                                  }}
                                >
                                  <Input
                                    value={editGreeting}
                                    onChange={(e) => setEditGreeting(e.target.value)}
                                    aria-label={`Begrüßung für ${greeting.username}`}
                                    autoFocus
                                    className="h-8"
                                  />
                                  <Button type="submit" size="sm">Sichern</Button>
                                </form>
                              ) : (
                                greeting.greeting
                              )}
                            </TableCell>
                            <TableCell className="py-2">
                              {!editing && (
                                <div className="flex justify-end gap-1 text-muted-foreground">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditGreeting(greeting.username)}
                                    title="Bearbeiten"
                                    aria-label={`Begrüßung für ${greeting.username} bearbeiten`}
                                  >
                                    <Pencil />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteGreeting(greeting.username)}
                                    title="Löschen"
                                    aria-label={`Begrüßung für ${greeting.username} löschen`}
                                    className="hover:text-destructive"
                                  >
                                    <Trash2 />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bekannte Benutzer */}
        <section aria-labelledby="users-title" className="mt-12 grid gap-6 border-t pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-12">
          <div>
            <h2 id="users-title" className="text-base font-medium">Bekannte Benutzer</h2>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Alle, die sich auf diesem Gerät schon erfolgreich angemeldet haben.
            </p>
          </div>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch niemand</p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {users.map((user) => (
                <li key={user} className="truncate font-mono text-[13px]">
                  {user}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
