import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createSampleTicket, encryptTicket, type Ticket } from "@/lib/ticket";

type Mode = "valid" | "expired" | "tampered";

export function PassengerView() {
  const [mode, setMode] = useState<Mode>("valid");
  const [ticket, setTicket] = useState<Ticket>(() => createSampleTicket());

  const payload = useMemo(() => {
    if (mode === "expired") {
      return encryptTicket({ ...ticket, expiresAt: Date.now() - 1000 * 60 * 30 });
    }
    if (mode === "tampered") {
      return "TRX1.@@@CORRUPTED@@@";
    }
    return encryptTicket(ticket);
  }, [ticket, mode]);

  const expIn = Math.max(0, Math.round((ticket.expiresAt - Date.now()) / 60000));

  return (
    <div className="px-4 pb-10">
      <div className="mx-auto max-w-sm">
        <div className="overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-border">
          <div className="bg-brand px-5 py-4 text-brand-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-80">Transcor SDVBO</p>
                <p className="text-lg font-semibold">Bilhete Digital</p>
              </div>
              <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                {ticket.line}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 bg-white px-5 py-6">
            <div className="rounded-2xl bg-white p-3 ring-1 ring-border">
              <QRCodeSVG value={payload} size={208} level="M" />
            </div>
            <p className="font-mono text-xs text-muted-foreground">{ticket.id}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-dashed border-border bg-secondary/40 px-5 py-4 text-sm">
            <Field label="Passageiro" value={ticket.passenger} />
            <Field label="Tarifa" value={`R$ ${(ticket.fareCents / 100).toFixed(2)}`} />
            <Field label="Origem" value={ticket.origin} />
            <Field label="Destino" value={ticket.destination} />
            <Field
              label="Validade"
              value={mode === "expired" ? "Expirado" : `${expIn} min`}
              tone={mode === "expired" ? "danger" : "default"}
            />
            <Field
              label="Status"
              value={
                mode === "valid" ? "Pronto para embarque" : mode === "expired" ? "Vencido" : "Adulterado"
              }
              tone={mode === "valid" ? "success" : "danger"}
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Modo de simulação
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(["valid", "expired", "tampered"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-2 py-2 font-medium transition ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                {m === "valid" ? "Válido" : m === "expired" ? "Expirado" : "Adulterado"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setTicket(createSampleTicket())}
            className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-secondary"
          >
            Emitir novo bilhete
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger";
}) {
  const toneClass =
    tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-foreground";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${toneClass}`}>{value}</p>
    </div>
  );
}

// Export helpers to share the "currently displayed payload" with validator via localStorage
