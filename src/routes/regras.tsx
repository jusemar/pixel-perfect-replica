import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/app-shell";
import { type Rules, TODAY, addDays, duration, toMin, toTime, useAgenda } from "@/lib/agenda-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/regras")({
  head: () => ({
    meta: [
      { title: "Regras da agenda — Jaaa Profissional" },
      { name: "description", content: "Antecedência mínima, horizonte, horários de início, intervalo e cancelamento." },
      { property: "og:title", content: "Regras da agenda — Jaaa Profissional" },
      { property: "og:description", content: "Regras gerais que valem para todas as atividades." },
    ],
  }),
  component: Regras,
});

function Chips<T extends number>({ options, value, onChange, fmt }: { options: T[]; value: T; onChange: (v: T) => void; fmt: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={cn("rounded-full border px-4 py-1.5 text-sm font-medium transition", value === o ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50")}>
          {fmt(o)}
        </button>
      ))}
    </div>
  );
}

function Block({ title, desc, children, example }: { title: string; desc: string; children: ReactNode; example: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <div><h2 className="text-lg font-bold">{title}</h2><p className="text-sm text-muted-foreground">{desc}</p></div>
        {children}
      </div>
      <div className="rounded-xl bg-muted p-4 text-sm">{example}</div>
    </section>
  );
}

const fmtH = (m: number) => (m === 0 ? "Sem limite" : duration(m));

function Regras() {
  const { rules, setRules } = useAgenda();
  const set = <K extends keyof Rules>(k: K) => (v: Rules[K]) => setRules((r) => ({ ...r, [k]: v }));
  const lastDay = addDays(TODAY, rules.horizonDays);
  const starts = Array.from({ length: 6 }, (_, i) => toTime(toMin("08:30") + i * rules.slotStepMin));

  return (
    <>
      <PageHeader title="Regras da agenda" subtitle="Valem para todas as suas atividades e definem o que o cliente consegue marcar. Alterações são salvas automaticamente." />
      <div className="px-4 md:px-10 space-y-4 max-w-5xl">
        <Block title="Antecedência mínima" desc="Quanto tempo antes um cliente ainda pode marcar."
          example={<>Agora são 10:00. Com {duration(rules.minNoticeMin)} de antecedência, o primeiro horário que o cliente vê hoje é <b>{toTime(600 + rules.minNoticeMin)}</b>.</>}>
          <Chips options={[30, 60, 120, 240, 720, 1440]} value={rules.minNoticeMin} onChange={set("minNoticeMin")} fmt={duration} />
        </Block>
        <Block title="Horizonte de agendamento" desc="Até quantos dias no futuro os clientes podem marcar."
          example={<>
            <p>O calendário do cliente vai de <b>hoje</b> até <b>{lastDay.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}</b>.</p>
            <div className="mt-3 grid grid-cols-10 gap-1">
              {Array.from({ length: 60 }).map((_, i) => <span key={i} className={cn("h-2 rounded-sm", i < rules.horizonDays ? "bg-primary" : "bg-border")} />)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Cada quadrado = 1 dia</p>
          </>}>
          <Chips options={[7, 15, 30, 60]} value={rules.horizonDays} onChange={set("horizonDays")} fmt={(v) => `${v} dias`} />
        </Block>
        <Block title="Horários de início" desc="De quanto em quanto tempo um atendimento pode começar."
          example={<>
            <p>Expediente começando às 08:30, possíveis inícios:</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{starts.map((s) => <span key={s} className="rounded-md bg-card px-2 py-1 text-xs font-medium">{s}</span>)}<span className="text-xs self-center">…</span></div>
          </>}>
          <Chips options={[15, 30, 60]} value={rules.slotStepMin} onChange={set("slotStepMin")} fmt={(v) => `A cada ${duration(v)}`} />
        </Block>
        <Block title="Intervalo entre atendimentos" desc="Folga obrigatória depois de cada atendimento (deslocamento, preparação). É diferente dos horários de início."
          example={<>
            <div className="flex h-8 overflow-hidden rounded-lg text-xs font-medium">
              <span className="flex flex-[3] items-center justify-center bg-primary text-primary-foreground">Atendimento</span>
              <span className="flex flex-1 items-center justify-center bg-accent text-accent-foreground">{rules.bufferMin ? `${rules.bufferMin}m` : "—"}</span>
              <span className="flex flex-[3] items-center justify-center bg-secondary">Próximo</span>
            </div>
            <p className="mt-2">Termina às 14:00 → próximo pode começar a partir de <b>{toTime(840 + rules.bufferMin)}</b>.</p>
          </>}>
          <Chips options={[0, 10, 15, 20, 30, 60]} value={rules.bufferMin} onChange={set("bufferMin")} fmt={(v) => (v ? duration(v) : "Sem intervalo")} />
        </Block>
        <Block title="Cancelamento e reagendamento" desc="Até quanto tempo antes o cliente pode cancelar ou reagendar sozinho pela conversa. Depois disso, só você."
          example={<>Atendimento sexta às 09:00:<br />• cancelar até <b>{fmtH(rules.cancelLimitMin)}</b> antes<br />• reagendar até <b>{fmtH(rules.rescheduleLimitMin)}</b> antes</>}>
          <p className="text-sm font-medium">Cancelar</p>
          <Chips options={[0, 120, 720, 1440, 2880]} value={rules.cancelLimitMin} onChange={set("cancelLimitMin")} fmt={fmtH} />
          <p className="text-sm font-medium">Reagendar</p>
          <Chips options={[0, 120, 720, 1440, 2880]} value={rules.rescheduleLimitMin} onChange={set("rescheduleLimitMin")} fmt={fmtH} />
        </Block>
      </div>
    </>
  );
}
