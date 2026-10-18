import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { type Reminders, useAgenda } from "@/lib/agenda-store";

export const Route = createFileRoute("/lembretes")({
  head: () => ({
    meta: [
      { title: "Lembretes e avisos — Jaaa Profissional" },
      { name: "description", content: "Configure lembretes para clientes e avisos para você." },
      { property: "og:title", content: "Lembretes e avisos — Jaaa Profissional" },
      { property: "og:description", content: "Avisos automáticos ligados aos compromissos." },
    ],
  }),
  component: Lembretes,
});

function Row({ k, title, desc }: { k: keyof Reminders; title: string; desc: string }) {
  const { reminders, setReminders } = useAgenda();
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b last:border-0">
      <div><p className="font-medium">{title}</p><p className="text-sm text-muted-foreground">{desc}</p></div>
      <Switch checked={reminders[k] as boolean} onCheckedChange={(v) => setReminders((r) => ({ ...r, [k]: v }))} />
    </div>
  );
}

function Lembretes() {
  const { reminders, setReminders } = useAgenda();
  const activeCount = Object.values(reminders).filter((v) => v === true).length;
  return (
    <>
      <PageHeader title="Lembretes e avisos" subtitle={`${activeCount} avisos ativos. Os lembretes ao cliente chegam como mensagem na conversa de vocês.`} />
      <div className="px-4 md:px-10 grid gap-4 lg:grid-cols-[1fr_320px] max-w-5xl">
        <div className="space-y-4">
          <section className="rounded-2xl border bg-card px-5">
            <h2 className="pt-4 text-lg font-bold">Para o cliente</h2>
            <Row k="clientConfirm" title="Confirmação do agendamento" desc="Cartão do compromisso enviado assim que é marcado." />
            <Row k="client24h" title="Lembrete 24 horas antes" desc="Com opções de confirmar presença ou reagendar." />
            <Row k="client2h" title="Lembrete 2 horas antes" desc="Aviso rápido no dia do atendimento." />
            <Row k="chatCard" title="Avisar mudanças na conversa" desc="Reagendamentos e cancelamentos atualizam o cartão na conversa." />
          </section>
          <section className="rounded-2xl border bg-card px-5">
            <h2 className="pt-4 text-lg font-bold">Para você</h2>
            <Row k="proNewBooking" title="Novo agendamento" desc="Notificação quando um cliente marca, cancela ou reagenda." />
            <Row k="proDaily" title="Resumo do dia" desc="Lista dos atendimentos de hoje, todas as manhãs." />
            {reminders.proDaily && (
              <div className="flex items-center gap-3 pb-4">
                <span className="text-sm text-muted-foreground">Enviar às</span>
                <Input type="time" className="w-28" value={reminders.proDailyTime} onChange={(e) => setReminders((r) => ({ ...r, proDailyTime: e.target.value }))} />
              </div>
            )}
          </section>
        </div>
        <aside className="rounded-2xl bg-secondary p-4 h-fit space-y-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-secondary-foreground"><MessageCircle className="size-3.5" /> Prévia na conversa</p>
          {reminders.client24h && (
            <div className="rounded-2xl rounded-bl-sm bg-card p-3 text-sm shadow-sm">
              ⏰ Lembrete: amanhã às <b>08:30</b> você tem <b>Limpeza residencial</b> com Claudia.
              <div className="mt-2 flex gap-2 text-xs font-medium text-primary"><span>Confirmar</span><span>Reagendar</span></div>
            </div>
          )}
          {reminders.client2h && <div className="rounded-2xl rounded-bl-sm bg-card p-3 text-sm shadow-sm">Seu atendimento começa em 2 horas 👋</div>}
          {!reminders.client24h && !reminders.client2h && <p className="text-sm text-muted-foreground">Nenhum lembrete ao cliente ativo.</p>}
        </aside>
      </div>
    </>
  );
}
