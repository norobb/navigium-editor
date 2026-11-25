import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getLogs, clearLogs, LogEntry } from "@/lib/navigium-api";
import { Trash2, RefreshCw, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface RequestLogProps {
  refreshTrigger?: number;
}

const formatTime = (date: Date) =>
  new Date(date).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const Block = ({ label, children, error }: { label: string; children: string; error?: boolean }) => (
  <div>
    <p className={`mb-1 text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>{label}</p>
    <pre
      className={`overflow-x-auto rounded-md p-3 font-mono text-xs leading-5 ${
        error ? "bg-destructive/10 text-destructive" : "bg-muted"
      }`}
    >
      {children}
    </pre>
  </div>
);

export default function RequestLog({ refreshTrigger }: RequestLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    setLogs(getLogs());
  }, [refreshTrigger]);

  const handleClear = () => {
    clearLogs();
    setLogs([]);
  };

  return (
    <section aria-labelledby="log-title">
      <div className="flex h-10 items-center justify-between">
        <h2 id="log-title" className="text-base font-medium">
          Protokoll <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">{logs.length}</span>
        </h2>
        <div className="flex gap-1 text-muted-foreground">
          <Button variant="ghost" size="icon" onClick={() => setLogs(getLogs())} title="Neu laden" aria-label="Protokoll neu laden">
            <RefreshCw />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleClear} title="Leeren" aria-label="Protokoll leeren">
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="mt-2 rounded-xl border">
        <ScrollArea className="h-[320px] sm:h-[400px]">
          {logs.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Noch keine Anfragen</p>
          ) : (
            <ul className="divide-y">
              {logs.map((log) => (
                <li key={log.id}>
                  <Collapsible>
                    <CollapsibleTrigger className="group flex h-10 w-full items-center gap-4 px-4 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:bg-accent">
                      <span className="w-16 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                        {formatTime(log.timestamp)}
                      </span>
                      <span className="flex-1 font-mono text-[13px]">{log.type}</span>
                      {log.error && <span className="text-xs text-destructive">Fehler</span>}
                      {log.response && !log.error && (
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">{log.response.status}</span>
                      )}
                      <ChevronDown className="h-4 w-4 stroke-[1.5] text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-4 px-4 pb-4 pt-2">
                        <Block label="Anfrage">{JSON.stringify(log.request, null, 2)}</Block>
                        {log.response && (
                          <Block label={`Antwort, Status ${log.response.status}`}>
                            {JSON.stringify(log.response.data, null, 2)}
                          </Block>
                        )}
                        {log.error && (
                          <Block label="Fehler" error>
                            {log.error}
                          </Block>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>
    </section>
  );
}
