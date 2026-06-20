// Mock "central database" for the Transcor SDVBO online-only ticketing flow.
// All state lives in module memory and is mutated synchronously after a
// simulated network round-trip. No offline cache, no encryption, no signing.

export type TicketStatus = "Ativo" | "Utilizado" | "Expirado";

export type Ticket = {
  token: string; // e.g. "TX-9482-ONLINE"
  passenger: string;
  line: string;
  origin: string;
  destination: string;
  fareCents: number; // value in CVE cents
  status: TicketStatus;
  issuedAt: number;
  expiresAt: number;
  usedAt?: number;
};

export type ValidationResult =
  | { ok: true; ticket: Ticket; walletAfter: number }
  | { ok: false; reason: "not_found" | "already_used" | "expired"; token: string };

type Listener = () => void;

// --- Central state -----------------------------------------------------------

const tickets = new Map<string, Ticket>();
let walletCents = 50_000; // central wallet starting balance (500 CVE)
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getWalletCents(): number {
  return walletCents;
}

export function getTicket(token: string): Ticket | undefined {
  return tickets.get(token);
}

// --- Helpers ----------------------------------------------------------------

function randomCode(len = 4): string {
  let out = "";
  for (let i = 0; i < len; i++) out += Math.floor(Math.random() * 10);
  return out;
}

export function issueTicket(overrides: Partial<Ticket> = {}): Ticket {
  const now = Date.now();
  const token = overrides.token ?? `TX-${randomCode(4)}-ONLINE`;
  const ticket: Ticket = {
    token,
    passenger: "Maria S. Almeida",
    line: "Linha 03",
    origin: "Praça Regala",
    destination: "Liceu Velho",
    fareCents: 4200, // 42 CVE
    status: "Ativo",
    issuedAt: now,
    expiresAt: now + 1000 * 60 * 15,
    ...overrides,
  };
  tickets.set(ticket.token, ticket);
  emit();
  return ticket;
}

// --- Online validation (simulated API call) ---------------------------------

export async function validateOnline(token: string): Promise<ValidationResult> {
  // Simulate central DB round-trip latency.
  await new Promise((r) => setTimeout(r, 650));

  const t = tickets.get(token);
  if (!t) {
    return { ok: false, reason: "not_found", token };
  }

  // Auto-flip to Expirado if needed.
  if (t.status === "Ativo" && t.expiresAt < Date.now()) {
    t.status = "Expirado";
    emit();
  }

  if (t.status === "Utilizado") return { ok: false, reason: "already_used", token };
  if (t.status === "Expirado") return { ok: false, reason: "expired", token };

  // Mark as used and deduct fare from central wallet.
  t.status = "Utilizado";
  t.usedAt = Date.now();
  walletCents = Math.max(0, walletCents - t.fareCents);
  emit();

  return { ok: true, ticket: { ...t }, walletAfter: walletCents };
}
