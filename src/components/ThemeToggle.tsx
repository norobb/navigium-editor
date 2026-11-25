import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "Helles Design" : "Dunkles Design";

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} title={label} aria-label={label} className="text-muted-foreground">
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
