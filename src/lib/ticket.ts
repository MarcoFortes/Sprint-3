// Simulated ticket encryption: base64-encoded JSON with a tiny XOR "cipher".
// Purely for prototype purposes — not real cryptography.

export type Ticket = {
  id: string;
  passenger: string;
  line: string;
  origin: string;
  destination: string;
  issuedAt: number; // epoch ms
  expiresAt: number; // epoch ms
  fareCents: number;
};

const SECRET = "TRANSCOR-SDVBO-2026";

function xor(input: string, key: string): string {
  let out = "";
  for (let i = 0; i < input.length; i++) {
    out += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

function toB64(s: string): string {
  if (typeof window === "undefined") return Buffer.from(s, "binary").toString("base64");
  return btoa(s);
}
function fromB64(s: string): string {
  if (typeof window === "undefined") return Buffer.from(s, "base64").toString("binary");
  return atob(s);
}

export function encryptTicket(t: Ticket): string {
  const json = JSON.stringify(t);
  return "TRX1." + toB64(xor(json, SECRET));
}

export function decryptTicket(payload: string): Ticket {
  if (!payload.startsWith("TRX1.")) throw new Error("Unknown payload format");
  const body = payload.slice(5);
  const json = xor(fromB64(body), SECRET);
  return JSON.parse(json) as Ticket;
}

export function createSampleTicket(overrides: Partial<Ticket> = {}): Ticket {
  const now = Date.now();
  return {
    id: "TKT-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    passenger: "Maria S. Almeida",
    line: "Linha 042",
    origin: "Terminal Central",
    destination: "Praça da Estação",
    issuedAt: now,
    expiresAt: now + 1000 * 60 * 60, // 1 hour
    fareCents: 475,
    ...overrides,
  };
}

// Local log storage (per-vehicle cache)
const USED_KEY = "transcor.used_tickets";
const LOG_KEY = "transcor.local_logs";

export type BoardingLog = {
  ticketId: string;
  passenger: string;
  line: string;
  at: number;
  status: "valid" | "expired" | "reused" | "invalid";
  synced: boolean;
};

export function getUsedTickets(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(USED_KEY) || "{}");
  } catch {
    return {};
  }
}
export function markTicketUsed(id: string) {
  const used = getUsedTickets();
  used[id] = Date.now();
  localStorage.setItem(USED_KEY, JSON.stringify(used));
}

export function getLogs(): BoardingLog[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}
export function appendLog(log: BoardingLog) {
  const all = getLogs();
  all.unshift(log);
  localStorage.setItem(LOG_KEY, JSON.stringify(all.slice(0, 50)));
}
export function markLogsSynced() {
  const all = getLogs().map((l) => ({ ...l, synced: true }));
  localStorage.setItem(LOG_KEY, JSON.stringify(all));
}
export function clearUsedTickets() {
  localStorage.removeItem(USED_KEY);
}
