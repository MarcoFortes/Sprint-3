import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PassengerView } from "@/components/PassengerView";
import { ValidatorView } from "@/components/ValidatorView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Transcor SDVBO — Validação de Bilhete" },
      {
        name: "description",
        content:
          "Protótipo móvel do fluxo de validação de bilhetes Transcor SDVBO: visão do passageiro com QR Code e visão do validador no veículo.",
      },
      { property: "og:title", content: "Transcor SDVBO — Validação de Bilhete" },
      {
        property: "og:description",
        content: "Simulação de leitura de QR Code, validação e sincronização local de embarques.",
      },
    ],
  }),
  component: Index,
});

type Tab = "passenger" | "validator";

function Index() {
  const [tab, setTab] = useState<Tab>("passenger");

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-sm items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M4 17V7a2 2 0 012-2h12a2 2 0 012 2v10M4 17l2 3h12l2-3M4 17h16M8 11h8" />
                <circle cx="8" cy="17.5" r="1.2" fill="currentColor" />
                <circle cx="16" cy="17.5" r="1.2" fill="currentColor" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold leading-none">Transcor SDVBO</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Validação · Protótipo
              </p>
            </div>
          </div>
        </div>
        <nav className="mx-auto flex max-w-sm gap-1 px-4 pb-3">
          <TabButton active={tab === "passenger"} onClick={() => setTab("passenger")}>
            Passageiro
          </TabButton>
          <TabButton active={tab === "validator"} onClick={() => setTab("validator")}>
            Validador
          </TabButton>
        </nav>
      </header>

      <h1 className="sr-only">Transcor SDVBO — Validação de Bilhete</h1>

      <section className="pt-5">
        {tab === "passenger" ? <PassengerView /> : <ValidatorView />}
      </section>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
      }`}
    >
      {children}
    </button>
  );
}
