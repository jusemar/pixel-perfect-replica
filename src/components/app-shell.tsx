import { Link } from "@tanstack/react-router";
import { BellRing, Briefcase, CalendarDays, CalendarOff, MessageCircle, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Agenda", icon: CalendarDays },
  { to: "/atividades", label: "Atividades", icon: Briefcase },
  { to: "/regras", label: "Regras", icon: SlidersHorizontal },
  { to: "/bloqueios", label: "Bloqueios", icon: CalendarOff },
  { to: "/lembretes", label: "Lembretes", icon: BellRing },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-surface p-5 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-8">
          <div className="grid size-9 place-items-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">J</div>
          <div>
            <p className="font-display font-bold leading-none">Jaaa</p>
            <p className="text-xs text-muted-foreground">Área profissional</p>
          </div>
        </div>
        <nav className="space-y-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground data-[status=active]:bg-card data-[status=active]:text-primary data-[status=active]:shadow-sm"
            >
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border bg-card p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground font-medium mb-1">
            <MessageCircle className="size-4 text-primary" /> Integrado às conversas
          </div>
          Seus serviços aparecem no botão de agendar dentro de cada conversa.
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full bg-accent font-semibold text-accent-foreground">C</div>
          <div className="text-sm">
            <p className="font-medium leading-none">Claudia Ferreira</p>
            <p className="text-xs text-muted-foreground">Faxineira · Manicure</p>
          </div>
        </div>
      </aside>
      <main className="flex-1 pb-24 md:pb-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card/95 backdrop-blur md:hidden">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.to === "/" }}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground data-[status=active]:text-primary"
          >
            <n.icon className="size-5" /> {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 px-4 pt-6 pb-4 md:px-10 md:pt-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground max-w-xl">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
