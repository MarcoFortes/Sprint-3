import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { issueTicket, subscribe, getTicket, type Ticket } from "@/lib/ticket";

export function PassengerView() {
  const [ticket, setTicket] = useState<Ticket>(() => issueTicket());

  // Re-render when the central state for this ticket changes (e.g. validated).
  useEffect(() => {
    return subscribe(() => {
      const fresh = getTicket(ticket.token);
      if (fresh) setTicket({ ...fresh });
    });
  }, [ticket.token]);

  const expIn = Math.max(0, Math.round((ticket.expiresAt - Date.now()) / 60000));
  const statusTone =
    ticket.status === "Ativo" ? "success" : ticket.status === "Utilizado" ? "danger" : "danger";

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
              <QRCodeSVG value={ticket.token} size={208} level="M" />
            </div>
            <p className="font-mono text-xs text-muted-foreground">{ticket.token}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-dashed border-border bg-secondary/40 px-5 py-4 text-sm">
            <Field label="Passageiro" value={ticket.passenger} />
            <Field label="Tarifa" value={`${Math.floor(ticket.fareCents / 100)} CVE`} />
            <Field label="Estação de Partida" value={ticket.origin} />
            <Field label="Estação de Desembarque" value={ticket.destination} />
            <Field label="Validade" value={ticket.status === "Ativo" ? `${expIn} min` : ticket.status} />
            <Field label="Status" value={ticket.status} tone={statusTone} />
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Estado do bilhete
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            O QR Code carrega apenas um token único. A validação acontece sempre online,
            consultando a base de dados central em tempo real.
          </p>
          <button
            onClick={() => setTicket(issueTicket())}
            className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
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
