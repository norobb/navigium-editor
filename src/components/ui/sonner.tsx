import { Toaster as Sonner, toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "light" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:max-w-[320px] group-[.toaster]:p-3",
          title: "group-[.toast]:text-sm group-[.toast]:font-medium",
          description: "group-[.toast]:text-xs group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:text-xs",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          success: "group-[.toaster]:border-emerald-500/30 group-[.toaster]:bg-emerald-50/95 dark:group-[.toaster]:bg-emerald-950/80",
          error: "group-[.toaster]:border-destructive/30 group-[.toaster]:bg-destructive/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
