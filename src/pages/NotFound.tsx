import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-sm">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-2 text-[28px] font-medium leading-tight">Seite nicht gefunden</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Unter <span className="font-mono">{location.pathname}</span> gibt es nichts.
        </p>
        <Link to="/" className="mt-6 inline-block text-sm text-primary underline-offset-4 hover:underline">
          Zur Anmeldung
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
