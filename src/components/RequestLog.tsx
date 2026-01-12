import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getLogs, clearLogs, LogEntry } from "@/lib/navigium-api";
import { Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface RequestLogProps {
  refreshTrigger?: number;
}

export default function RequestLog({ refreshTrigger }: RequestLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLogs(getLogs());
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setLogs(getLogs());
  };

  const handleClear = () => {
    clearLogs();
    setLogs([]);
  };

  const toggleExpand = (id: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getTypeBadgeVariant = (type: LogEntry['type']) => {
    switch (type) {
      case 'login':
        return 'default';
      case 'setpoints':
        return 'secondary';
      case 'points':
        return 'outline';
      default:
        return 'default';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base sm:text-lg">Request Log</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] sm:h-[400px]">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">
              Keine Requests bisher
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <Collapsible
                  key={log.id}
                  open={expandedLogs.has(log.id)}
                  onOpenChange={() => toggleExpand(log.id)}
                >
                  <div className="border rounded-lg p-2 sm:p-3">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={getTypeBadgeVariant(log.type)} className="text-xs">
                            {log.type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(log.timestamp)}
                          </span>
                          {log.error && (
                            <Badge variant="destructive" className="text-xs">
                              Error
                            </Badge>
                          )}
                        </div>
                        {expandedLogs.has(log.id) ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-3 space-y-3 text-xs sm:text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Request:</p>
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.request, null, 2)}
                          </pre>
                        </div>
                        {log.response && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">
                              Response (Status: {log.response.status}):
                            </p>
                            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.response.data, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.error && (
                          <div>
                            <p className="font-medium text-destructive mb-1">Error:</p>
                            <pre className="bg-destructive/10 text-destructive p-2 rounded text-xs overflow-x-auto">
                              {log.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
