import { useEffect, useState } from "react";
import {
  appendLog,
  createSampleTicket,
  decryptTicket,
  encryptTicket,
  getLogs,
  getUsedTickets,
  markLogsSynced,
  markTicketUsed,
  type BoardingLog,
} from "@/lib/ticket";
import { playError, playSuccess } from "@/lib/sounds";

type Result =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

// Demo: a small pool of payloads the "scanner" picks from at random.
function makeScanPool(): string[] {
  return [
    encryptTicket(createSampleTicket()),
    encryptTicket(createSampleTicket({ passenger: "João P. Ribeiro", line: "Linha 108" })),
    encryptTicket(createSampleTicket({ expiresAt: Date.now() - 60_000, passenger: "Lucas Andrade" })),
    "TRX1.@@@CORRUPTED@@@",
  ];
}

export function ValidatorView() {
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [logs, setLogs] = useState<BoardingLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setLogs(getLogs());
  }, []);

  function handleScan() {
    const pool = makeScanPool();
    const payload = pool[Math.floor(Math.random() * pool.length)];

    try {
      const ticket = decryptTicket(payload);
      const used = getUsedTickets();
      if (used[ticket.id]) {
        finish("error", `Bilhete já utilizado (${ticket.id})`, {
          ticketId: ticket.id,
          passenger: ticket.passenger,
          line: ticket.line,
          status: "reused",
        });
        return;
      }
      if (ticket.expiresAt < Date.now()) {
        finish("error", `Bilhete expirado — ${ticket.passenger}`, {
          ticketId: ticket.id,
          passenger: ticket.passenger,
          line: ticket.line,
          status: "expired",
        });
        return;
      }
      markTicketUsed(ticket.id);
      finish("success", `Embarque registrado — ${ticket.passenger}`, {
        ticketId: ticket.id,
        passenger: ticket.passenger,
        line: ticket.line,
        status: "valid",
      });
    } catch {
      finish("error", "QR Code inválido ou adulterado", {
        ticketId: "—",
        passenger: "Desconhecido",
        line: "—",
        status: "invalid",
      });
    }
  }

  function finish(
    kind: "success" | "error",
    message: string,
    log: Omit<BoardingLog, "at" | "synced">,
  ) {
    if (kind === "success") {
      playSuccess();
      setFlash(true);
      setTimeout(() => setFlash(false), 1400);
    } else {
      playError();
    }
    setResult({ kind, message });
    appendLog({ ...log, at: Date.now(), synced: false });
    setLogs(getLogs());
    setTimeout(() => setResult({ kind: "idle" }), 2600);
  }

  async function handleSync() {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 1100));
    markLogsSynced();
    setLogs(getLogs());
    setSyncing(false);
  }

  const pending = logs.filter((l) => !l.synced).length;

  return (
    <div className="relative px-4 pb-10">
      {flash && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-success animate-flash-success">
          <div className="text-center text-success-foreground">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/40">
              <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-3xl font-bold tracking-tight">Embarque Registrado</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-sm space-y-4">
        <div className="rounded-3xl bg-card p-5 shadow-lg ring-1 ring-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Veículo</p>
              <p className="text-base font-semibold">SDVBO-1042 · Linha 042</p>
            </div>
            <div className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
              Online
            </div>
          </div>

          <div className="mt-5 rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">Aponte para o QR Code do passageiro</p>
            <button
              onClick={handleScan}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-[0.99]"
            >
              Simular Leitura de QR Code
            </button>
          </div>

          {result.kind === "error" && (
            <div className="mt-4 animate-shake rounded-xl bg-danger px-4 py-3 text-danger-foreground ring-2 ring-danger/60">
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-90">
                Embarque negado
              </p>
              <p className="mt-1 text-base font-semibold leading-tight">{result.message}</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Logs locais do veículo</p>
              <p className="text-xs text-muted-foreground">
                {logs.length} registros · {pending} pendentes de envio
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing || pending === 0}
              className="rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background transition disabled:opacity-40"
            >
              {syncing ? "Sincronizando…" : "Sincronizar Logs Locais"}
            </button>
          </div>

          <ul className="mt-4 divide-y divide-border">
            {logs.length === 0 && (
              <li className="py-6 text-center text-xs text-muted-foreground">
                Nenhum embarque registrado ainda.
              </li>
            )}
            {logs.slice(0, 6).map((l, i) => (
              <li key={i} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{l.passenger}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {l.ticketId} · {new Date(l.at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      l.status === "valid"
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger"
                    }`}
                  >
                    {l.status}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${l.synced ? "bg-success" : "bg-accent"}`}
                    title={l.synced ? "Sincronizado" : "Pendente"}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
