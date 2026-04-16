import { useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { cn } from '../components/ui/utils';

type HistoryStatus = 'ready' | 'scheduled' | 'processing' | 'validation';

interface ReportCard {
  title: string;
  description: string;
  icon: LucideIcon;
  accentWrap: string;
  accentIcon: string;
  accentBadge: string;
  badge: string;
  stats: string[];
  items: string[];
}

const years = [
  { value: '2026', label: 'Ano letivo 2026' },
  { value: '2025', label: 'Ano letivo 2025' },
];

const periods = [
  { value: 'resultado-final', label: 'Resultado final' },
  { value: '4-bimestre', label: '4º bimestre' },
  { value: '3-trimestre', label: '3º trimestre' },
];

const scopes = [
  { value: 'todas', label: 'Todas as turmas' },
  { value: 'fundamental-ii', label: 'Fundamental II' },
  { value: 'medio', label: 'Ensino Médio' },
];

const queues = [
  { value: 'automatico', label: 'Geração automática' },
  { value: 'pronto', label: 'Pronto para emitir' },
  { value: 'pendente', label: 'Com pendências' },
];

const reportCards: ReportCard[] = [
  {
    title: 'Boletins em PDF',
    description:
      'Geração individual por estudante com notas, frequência, médias, parecer e validação institucional.',
    icon: FileText,
    accentWrap: 'bg-[#EFF6FF]',
    accentIcon: 'text-[#2563EB]',
    accentBadge: 'bg-[#DBEAFE] text-[#1D4ED8]',
    badge: 'Entrega às famílias',
    stats: ['126 PDFs estimados', '6 turmas', '99,4% de entrega'],
    items: [
      'Notas e médias por componente curricular',
      'Frequência consolidada por estudante',
      'Parecer final e assinatura da escola',
    ],
  },
  {
    title: 'Atas de Resultados Finais',
    description:
      'Documento consolidado para secretaria e conselho com situação final, recuperação e rastreio de versões.',
    icon: ScrollText,
    accentWrap: 'bg-[#FEF3C7]',
    accentIcon: 'text-[#B45309]',
    accentBadge: 'bg-[#FDE68A] text-[#92400E]',
    badge: 'Fechamento legal',
    stats: ['18 atas previstas', '3 pendências', '100% rastreado'],
    items: [
      'Situação final de cada estudante',
      'Validação automática de diário e carga horária',
      'PDF pronto para assinatura e arquivamento',
    ],
  },
  {
    title: 'Estatísticas de Desempenho',
    description:
      'Relatórios analíticos em PDF com aprovação, frequência, médias, recortes por turma e visão executiva.',
    icon: BarChart3,
    accentWrap: 'bg-[#ECFDF5]',
    accentIcon: 'text-[#15803D]',
    accentBadge: 'bg-[#DCFCE7] text-[#166534]',
    badge: 'Gestão pedagógica',
    stats: ['12 dashboards em PDF', '24 indicadores', '18s por emissão'],
    items: [
      'Comparativos por série, turma e disciplina',
      'Resumo executivo para coordenação e direção',
      'Exportação resumida ou detalhada em lote',
    ],
  },
];

const historyItems = [
  {
    name: 'Boletins 8º Ano A - 2º Bimestre',
    audience: '32 estudantes',
    time: 'Hoje, 08:15',
    size: '4,8 MB',
    status: 'ready' as HistoryStatus,
  },
  {
    name: 'Ata Final 9º Ano C',
    audience: 'Secretaria',
    time: 'Hoje, 10:30',
    size: '1,1 MB',
    status: 'processing' as HistoryStatus,
  },
  {
    name: 'Estatísticas Gerais - Fundamental II',
    audience: 'Coordenação',
    time: 'Hoje, 14:00',
    size: '2,7 MB',
    status: 'scheduled' as HistoryStatus,
  },
  {
    name: 'Boletins Ensino Médio - Recuperação',
    audience: '48 estudantes',
    time: 'Ontem, 17:40',
    size: '8,1 MB',
    status: 'validation' as HistoryStatus,
  },
];

const statusStyles: Record<HistoryStatus, { label: string; className: string }> = {
  ready: {
    label: 'Pronto',
    className: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  scheduled: {
    label: 'Agendado',
    className: 'border border-blue-200 bg-blue-50 text-blue-700',
  },
  processing: {
    label: 'Processando',
    className: 'border border-slate-200 bg-slate-100 text-slate-700',
  },
  validation: {
    label: 'Em validação',
    className: 'border border-amber-200 bg-amber-50 text-amber-700',
  },
};

const pipelineSteps = [
  'Consolidação automática de notas, frequência e pareceres',
  'Validação de regras acadêmicas antes da emissão',
  'Montagem do PDF com identidade visual da escola',
  'Distribuição para secretaria, arquivo e impressão em lote',
];

const upcomingRuns = [
  { title: 'Boletins 9º Ano B', time: 'Hoje, 18:30', context: 'Resultado final · 29 estudantes' },
  { title: 'Ata final 1ª Série B', time: '17 abr, 10:00', context: 'Secretaria · versão assinável' },
  { title: 'Estatísticas Ensino Médio', time: '17 abr, 14:00', context: 'Direção · comparativo por disciplina' },
];

const performanceIndicators = [
  { label: 'Aprovação geral', value: '94%', width: 'w-[94%]', tone: 'bg-[#2563EB]' },
  { label: 'Frequência média', value: '91%', width: 'w-[91%]', tone: 'bg-[#22C55E]' },
  { label: 'Recuperação paralela', value: '8%', width: 'w-[8%]', tone: 'bg-[#F59E0B]' },
];

function findLabel(options: Array<{ value: string; label: string }>, value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function RelatoriosDinamicos() {
  const [year, setYear] = useState('2026');
  const [period, setPeriod] = useState('resultado-final');
  const [scope, setScope] = useState('todas');
  const [queue, setQueue] = useState('automatico');

  const summary = useMemo(
    () =>
      `${findLabel(years, year)} · ${findLabel(periods, period)} · ${findLabel(scopes, scope)} · ${findLabel(queues, queue)}`,
    [period, queue, scope, year],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
            Central de documentos em PDF
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Relatórios Dinâmicos</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Boletins, atas de resultados finais e estatísticas de desempenho gerados automaticamente em PDF.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" size="lg" className="h-11 w-full rounded-xl border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50 sm:w-auto">
            <Bot className="h-4 w-4" />
            Salvar automação
          </Button>
          <Button size="lg" className="h-11 w-full rounded-xl bg-[#2563EB] px-5 text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)] hover:bg-[#1D4ED8] sm:w-auto">
            <Sparkles className="h-4 w-4" />
            Gerar PDF agora
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="PDFs emitidos no mês" value="148" icon={FileText} iconColor="text-blue-600" iconBgColor="bg-blue-50" />
        <MetricCard title="Rotinas automáticas" value="12" icon={Bot} iconColor="text-indigo-600" iconBgColor="bg-indigo-50" />
        <MetricCard title="Taxa de entrega" value="99,2%" icon={ShieldCheck} iconColor="text-green-600" iconBgColor="bg-green-50" />
        <MetricCard title="Pendências de fechamento" value="3" icon={AlertCircle} iconColor="text-amber-600" iconBgColor="bg-amber-50" />
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Configuração de emissão</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Ajuste o recorte da geração automática</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Defina o ano letivo, o período de referência e o agrupamento para emitir documentos em lote sem retrabalho manual.
            </p>
          </div>
          <div className="rounded-3xl bg-[#F8F9FA] px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Lote atual:</span> {summary}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm text-slate-700">Ano letivo</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="rounded-xl bg-[#F8F9FA]"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-700">Período</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="rounded-xl bg-[#F8F9FA]"><SelectValue /></SelectTrigger>
              <SelectContent>{periods.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-700">Agrupamento</label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="rounded-xl bg-[#F8F9FA]"><SelectValue /></SelectTrigger>
              <SelectContent>{scopes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-700">Status da fila</label>
            <Select value={queue} onValueChange={setQueue}>
              <SelectTrigger className="rounded-xl bg-[#F8F9FA]"><SelectValue /></SelectTrigger>
              <SelectContent>{queues.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-3xl bg-[#F8F9FA] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">PDF/A padronizado</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">Assinatura digital</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">Arquivamento automático</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
            <CalendarDays className="h-5 w-5 text-[#2563EB]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Próxima janela</p>
              <p className="text-sm font-semibold text-slate-900">Hoje, 18:30</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Catálogo de relatórios</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Modelos prontos para gerar em PDF</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {reportCards.map((report) => {
                const Icon = report.icon;
                return (
                  <div key={report.title} className="rounded-3xl border border-slate-200 bg-[#F8F9FA] p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', report.accentWrap)}>
                        <Icon className={cn('h-6 w-6', report.accentIcon)} />
                      </div>
                      <div>
                        <span className={cn('rounded-full px-3 py-1 text-[11px] font-semibold', report.accentBadge)}>{report.badge}</span>
                        <h3 className="mt-2 text-lg font-semibold text-slate-900">{report.title}</h3>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{report.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {report.stats.map((stat) => <span key={stat} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">{stat}</span>)}
                    </div>
                    <div className="mt-4 space-y-2">
                      {report.items.map((item) => <div key={item} className="rounded-2xl bg-white px-3 py-2 text-sm leading-6 text-slate-600">{item}</div>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Fila de PDFs</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">Últimas gerações e lotes</h2>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                <Download className="h-4 w-4" />
                Exportar histórico
              </Button>
            </div>
            <div className="mt-5 space-y-3">
              {historyItems.map((item) => (
                <div key={item.name} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-[#F8F9FA] p-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <FileText className="h-5 w-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.audience} · {item.time}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <span className="text-sm font-medium text-slate-500">{item.size}</span>
                    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusStyles[item.status].className)}>
                      {statusStyles[item.status].label}
                    </span>
                    <Button variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pipeline automático</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Da consolidação ao PDF final</h2>
            <div className="mt-5 space-y-3">
              {pipelineSteps.map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-3xl border border-slate-100 bg-[#F8F9FA] p-4">
                  <div className={cn('mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl', index < 2 ? 'bg-blue-100' : 'bg-slate-100')}>
                    {index < 2 ? <CheckCircle2 className="h-5 w-5 text-blue-700" /> : <Clock3 className="h-5 w-5 text-slate-500" />}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Próximas execuções</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">Fila inteligente</h2>
              </div>
              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-5 space-y-3">
              {upcomingRuns.map((run) => (
                <div key={run.title} className="rounded-3xl border border-slate-100 bg-[#F8F9FA] p-4">
                  <p className="text-sm font-semibold text-slate-900">{run.title}</p>
                  <p className="mt-1 text-sm text-[#2563EB]">{run.time}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{run.context}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Indicadores no PDF</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Resumo de desempenho</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Os relatórios analíticos saem com estes indicadores destacados para coordenação e direção.</p>
            <div className="mt-5 space-y-4">
              {performanceIndicators.map((indicator) => (
                <div key={indicator.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{indicator.label}</span>
                    <span className="font-semibold text-slate-900">{indicator.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className={cn('h-full rounded-full', indicator.width, indicator.tone)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-3xl bg-[#F8F9FA] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <TrendingUp className="h-5 w-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Exportação pronta para gestão</p>
                  <p className="text-sm text-slate-600">Versão resumida para direção e detalhada para coordenação.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
