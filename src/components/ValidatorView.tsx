import { useEffect, useState } from "react";
import { issueTicket, validateOnline, type Ticket } from "@/lib/ticket";
import { playError, playSuccess } from "@/lib/sounds";

type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; ticket: Ticket }
  | { kind: "error"; message: string };

// A small pool of demo tokens the "scanner" picks from. We pre-seed the
// central DB so the validator always has something to react to.
const DEMO_TOKENS = ["TX-9482-ONLINE", "TX-5571-ONLINE", "TX-3140-ONLINE", "TX-0001-ONLINE"];

let seeded = false;
function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  issueTicket({ token: DEMO_TOKENS[0], passenger: "Maria S. Almeida" });
  issueTicket({ token: DEMO_TOKENS[1], passenger: "João P. Ribeiro", line: "Linha 03" });
  issueTicket({
    token: DEMO_TOKENS[2],
    passenger: "Lucas Andrade",
    expiresAt: Date.now() - 60_000, // already expired
  });
  // DEMO_TOKENS[3] is intentionally NOT issued — simulates an unknown token.
}

export function ValidatorView() {
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    ensureSeeded();
  }, []);


  async function handleScan() {
    if (result.kind === "loading") return;
    const token = DEMO_TOKENS[Math.floor(Math.random() * DEMO_TOKENS.length)];
    setResult({ kind: "loading" });

    const res = await validateOnline(token);

    if (res.ok) {
      playSuccess();
      setFlash(true);
      setTimeout(() => setFlash(false), 1400);
      setResult({ kind: "success", ticket: res.ticket });
      setTimeout(() => setResult({ kind: "idle" }), 2600);
    } else {
      playError();
      setResult({
        kind: "error",
        message: "Erro: Validação Falhou. Bilhete já utilizado ou inválido.",
      });
      setTimeout(() => setResult({ kind: "idle" }), 3000);
    }
  }

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
              <p className="text-base font-semibold">SDVBO-1042 · Linha 03</p>
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
              disabled={result.kind === "loading"}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
            >
              {result.kind === "loading" ? "Consultando central…" : "Simular Leitura de QR Code"}
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

          {result.kind === "success" && (
            <div className="mt-4 rounded-xl bg-success/10 px-4 py-3 ring-1 ring-success/40">
              <p className="text-[11px] font-bold uppercase tracking-widest text-success">
                Validado online
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {result.ticket.passenger} · {result.ticket.token}
              </p>
              <p className="text-xs text-muted-foreground">
                −{Math.floor(result.ticket.fareCents / 100)} CVE da carteira central
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
