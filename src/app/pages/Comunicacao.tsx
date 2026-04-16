import { useState } from 'react';
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Mail,
  Megaphone,
  Send,
  Smartphone,
  Users,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';

const recentMessages = [
  { title: 'Reunião de pais - 8º Ano', meta: 'Famílias · Hoje, 10:20', status: 'Enviado' },
  { title: 'Lembrete de entrega de projeto', meta: 'Alunos · Hoje, 14:00', status: 'Agendado' },
  { title: 'Simulado geral da próxima semana', meta: 'Equipe pedagógica · Ontem, 18:45', status: 'Lido por 84%' },
];

const channels = [
  { title: 'App do responsável', text: 'Canal principal para comunicados e lembretes rápidos.' },
  { title: 'E-mail institucional', text: 'Usado para avisos formais, PDFs e confirmações.' },
  { title: 'Mural interno', text: 'Recados para professores, coordenação e secretaria.' },
];

const upcoming = [
  { title: 'Confirmação de conselho de classe', time: 'Hoje, 18:30', text: 'Professores · e-mail + mural interno' },
  { title: 'Aviso de feira de ciências', time: '17 abr, 08:00', text: 'Famílias · app do responsável' },
  { title: 'Fechamento do diário', time: '17 abr, 16:30', text: 'Docentes · push + mural' },
];

export function Comunicacao() {
  const [audience, setAudience] = useState('familias');
  const [channel, setChannel] = useState('app');
  const [confirmRead, setConfirmRead] = useState(true);
  const [scheduleSend, setScheduleSend] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
            Central de mensagens da escola
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Comunicação</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Organize comunicados, lembretes e avisos urgentes para famílias, alunos e equipe pedagógica em um só fluxo.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" size="lg" className="h-11 rounded-xl border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50">
            <CalendarClock className="h-4 w-4" />
            Agendar envio
          </Button>
          <Button size="lg" className="h-11 rounded-xl bg-[#2563EB] px-5 text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)] hover:bg-[#1D4ED8]">
            <Send className="h-4 w-4" />
            Nova mensagem
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Mensagens no mês" value="428" icon={Megaphone} iconColor="text-blue-600" iconBgColor="bg-blue-50" />
        <MetricCard title="Taxa média de leitura" value="86%" icon={BarChart3} iconColor="text-green-600" iconBgColor="bg-green-50" />
        <MetricCard title="Canais ativos" value="3" icon={Smartphone} iconColor="text-amber-600" iconBgColor="bg-amber-50" />
        <MetricCard title="Públicos segmentados" value="12" icon={Users} iconColor="text-indigo-600" iconBgColor="bg-indigo-50" />
      </div>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Composição de mensagem</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">Monte o envio com poucos cliques</h2>
              </div>
              <div className="rounded-2xl bg-[#EFF6FF] px-4 py-3 text-sm text-[#1E40AF]">
                O sistema ajusta a apresentação conforme o canal escolhido.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-700">Público</label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="rounded-xl bg-[#F8F9FA]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="familias">Famílias</SelectItem>
                    <SelectItem value="alunos">Alunos</SelectItem>
                    <SelectItem value="equipe">Equipe pedagógica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-700">Canal principal</label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger className="rounded-xl bg-[#F8F9FA]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app">App do responsável</SelectItem>
                    <SelectItem value="email">E-mail institucional</SelectItem>
                    <SelectItem value="mural">Mural interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm text-slate-700">Assunto</label>
              <Input className="rounded-xl bg-[#F8F9FA]" placeholder="Ex: Reunião pedagógica e fechamento do bimestre" />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm text-slate-700">Mensagem</label>
              <Textarea className="min-h-40 rounded-2xl bg-[#F8F9FA]" placeholder="Escreva aqui o conteúdo do comunicado. O sistema organiza o layout para push, mural e e-mail automaticamente." />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-[#F8F9FA] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Solicitar confirmação de leitura</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Ideal para comunicados formais e convocações.</p>
                  </div>
                  <Switch checked={confirmRead} onCheckedChange={setConfirmRead} />
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-[#F8F9FA] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Agendar envio</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Defina data e horário para disparo automático.</p>
                  </div>
                  <Switch checked={scheduleSend} onCheckedChange={setScheduleSend} />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">Salvar rascunho</Button>
              <Button className="rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                <Send className="h-4 w-4" />
                Enviar comunicação
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Histórico recente</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Campanhas e avisos</h2>
            <div className="mt-5 space-y-3">
              {recentMessages.map((item) => (
                <div key={item.title} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-[#F8F9FA] p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Canais</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Saúde dos envios</h2>
            <div className="mt-5 space-y-3">
              {channels.map((item) => (
                <div key={item.title} className="rounded-3xl border border-slate-100 bg-[#F8F9FA] p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Próximos envios</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Fila inteligente</h2>
            <div className="mt-5 space-y-3">
              {upcoming.map((item) => (
                <div key={item.title} className="rounded-3xl border border-slate-100 bg-[#F8F9FA] p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-[#2563EB]">{item.time}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-[#EFF6FF] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Templates prontos</p>
                  <p className="text-sm text-slate-600">Comunicado institucional, lembrete de prazo, convite e aviso emergencial.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-[#F8F9FA] p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-500" />
                <p className="text-sm text-slate-600">Confirmações de leitura e histórico de envio ficam vinculados ao público selecionado.</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
