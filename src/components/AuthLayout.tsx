import { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  corner?: ReactNode;
  children: ReactNode;
}

/** Shared frame for the password gate and the Navigium login. */
export function AuthLayout({ title, subtitle, corner, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-2">
          <img src="./logo.svg" alt="" className="h-6 w-6" />
          <span className="text-[15px] font-medium">Navigium Punkte-Editor</span>
        </div>
        {corner}
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-24">
        <div className="w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <h1 className="text-[28px] font-medium leading-tight">{title}</h1>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
