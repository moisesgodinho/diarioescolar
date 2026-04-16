import { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { cn } from '../components/ui/utils';

type CalendarView = 'month' | 'week' | 'list';
type EventCategory = 'academic' | 'holiday' | 'event';

interface CalendarEvent {
  id: string;
  title: string;
  label: string;
  date: string;
  category: EventCategory;
  description: string;
}

interface AcademicPeriod {
  id: string;
  label: string;
  start: string;
  end: string;
  schoolDays: number;
}

const viewOptions: Array<{ id: CalendarView; label: string }> = [
  { id: 'month', label: 'Mês' },
  { id: 'week', label: 'Semana' },
  { id: 'list', label: 'Lista' },
];

const weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const academicPeriods: AcademicPeriod[] = [
  { id: 'p1', label: '1º Bimestre', start: '2026-02-02', end: '2026-04-17', schoolDays: 53 },
  { id: 'p2', label: '2º Bimestre', start: '2026-05-04', end: '2026-07-10', schoolDays: 49 },
  { id: 'p3', label: '3º Bimestre', start: '2026-07-27', end: '2026-10-02', schoolDays: 50 },
  { id: 'p4', label: '4º Bimestre', start: '2026-10-13', end: '2026-12-18', schoolDays: 48 },
];

const calendarEvents: CalendarEvent[] = [
  {
    id: 'evt-01',
    title: 'Planejamento Pedagógico',
    label: 'Planejamento',
    date: '2026-01-26',
    category: 'academic',
    description: 'Definição do calendário, trilhas formativas e conselho de abertura.',
  },
  {
    id: 'evt-02',
    title: 'Início das Aulas',
    label: 'Início das Aulas',
    date: '2026-02-02',
    category: 'academic',
    description: 'Recepção das turmas e início oficial do ano letivo.',
  },
  {
    id: 'evt-03',
    title: 'Carnaval',
    label: 'Carnaval',
    date: '2026-02-16',
    category: 'holiday',
    description: 'Suspensão das atividades letivas conforme calendário nacional.',
  },
  {
    id: 'evt-04',
    title: 'Feira Cultural',
    label: 'Feira Cultural',
    date: '2026-03-14',
    category: 'event',
    description: 'Apresentações interdisciplinares com participação das famílias.',
  },
  {
    id: 'evt-05',
    title: 'Paixão de Cristo',
    label: 'Feriado',
    date: '2026-04-03',
    category: 'holiday',
    description: 'Feriado nacional com suspensão das aulas.',
  },
  {
    id: 'evt-06',
    title: 'Dia do Trabalhador',
    label: 'Feriado',
    date: '2026-05-01',
    category: 'holiday',
    description: 'Feriado nacional com calendário escolar bloqueado para lançamentos.',
  },
  {
    id: 'evt-07',
    title: 'Início do 2º Bimestre',
    label: '2º Bimestre',
    date: '2026-05-04',
    category: 'academic',
    description: 'Abertura do segundo ciclo letivo com metas e avaliações diagnósticas.',
  },
  {
    id: 'evt-08',
    title: 'Feira de Ciências',
    label: 'Feira de Ciências',
    date: '2026-05-14',
    category: 'event',
    description: 'Mostra de projetos investigativos organizada pelos anos finais.',
  },
  {
    id: 'evt-09',
    title: 'Reunião com Famílias',
    label: 'Famílias',
    date: '2026-05-20',
    category: 'event',
    description: 'Encontro para alinhamento pedagógico e devolutiva do bimestre.',
  },
  {
    id: 'evt-10',
    title: 'Simulado Geral',
    label: 'Simulado',
    date: '2026-05-26',
    category: 'academic',
    description: 'Avaliação integrada com acompanhamento por turma e componente.',
  },
  {
    id: 'evt-11',
    title: 'Corpus Christi',
    label: 'Feriado',
    date: '2026-06-04',
    category: 'holiday',
    description: 'Feriado previsto no planejamento anual da rede.',
  },
  {
    id: 'evt-12',
    title: 'Festa Junina',
    label: 'Festa Junina',
    date: '2026-06-27',
    category: 'event',
    description: 'Evento cultural com quadrilhas, barracas temáticas e integração escolar.',
  },
  {
    id: 'evt-13',
    title: 'Encerramento do 2º Bimestre',
    label: 'Fechamento',
    date: '2026-07-10',
    category: 'academic',
    description: 'Data limite para fechamento de notas e frequência do período.',
  },
  {
    id: 'evt-14',
    title: 'Início do 3º Bimestre',
    label: '3º Bimestre',
    date: '2026-07-27',
    category: 'academic',
    description: 'Retomada das aulas com novo ciclo de acompanhamento.',
  },
  {
    id: 'evt-15',
    title: 'Olimpíada de Matemática',
    label: 'Olimpíada',
    date: '2026-08-11',
    category: 'event',
    description: 'Aplicação interna da olimpíada com ranking por turma.',
  },
  {
    id: 'evt-16',
    title: 'Independência do Brasil',
    label: 'Feriado',
    date: '2026-09-07',
    category: 'holiday',
    description: 'Feriado nacional.',
  },
  {
    id: 'evt-17',
    title: 'Nossa Senhora Aparecida',
    label: 'Feriado',
    date: '2026-10-12',
    category: 'holiday',
    description: 'Feriado nacional com ajuste no calendário acadêmico.',
  },
  {
    id: 'evt-18',
    title: 'Início do 4º Bimestre',
    label: '4º Bimestre',
    date: '2026-10-13',
    category: 'academic',
    description: 'Último ciclo letivo com foco em recuperação e fechamento anual.',
  },
  {
    id: 'evt-19',
    title: 'Finados',
    label: 'Feriado',
    date: '2026-11-02',
    category: 'holiday',
    description: 'Feriado nacional.',
  },
  {
    id: 'evt-20',
    title: 'Proclamação da República',
    label: 'Feriado',
    date: '2026-11-15',
    category: 'holiday',
    description: 'Feriado nacional.',
  },
  {
    id: 'evt-21',
    title: 'Mostra de Projetos',
    label: 'Projetos',
    date: '2026-12-12',
    category: 'event',
    description: 'Exposição final dos projetos do ano letivo.',
  },
  {
    id: 'evt-22',
    title: 'Encerramento do Ano Letivo',
    label: 'Encerramento',
    date: '2026-12-18',
    category: 'academic',
    description: 'Conclusão das atividades letivas e publicação do calendário de rematrícula.',
  },
];

const categoryStyles: Record<
  EventCategory,
  {
    dotClassName: string;
    chipClassName: string;
    panelClassName: string;
    label: string;
  }
> = {
  academic: {
    dotClassName: 'bg-[#93C5FD]',
    chipClassName: 'border border-[#BFDBFE] bg-[#DBEAFE] text-[#1E3A8A]',
    panelClassName: 'bg-[#DBEAFE] text-[#1E3A8A]',
    label: 'Período letivo',
  },
  holiday: {
    dotClassName: 'bg-[#FDBA74]',
    chipClassName: 'border border-[#FED7AA] bg-[#FEE2E2] text-[#9A3412]',
    panelClassName: 'bg-[#FEE2E2] text-[#9A3412]',
    label: 'Feriado',
  },
  event: {
    dotClassName: 'bg-[#86EFAC]',
    chipClassName: 'border border-[#BBF7D0] bg-[#DCFCE7] text-[#166534]',
    panelClassName: 'bg-[#DCFCE7] text-[#166534]',
    label: 'Evento escolar',
  },
};

function capitalizeLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatShortDate(date: Date) {
  return capitalizeLabel(format(date, "d 'de' MMM", { locale: ptBR }));
}

export function CalendarioEscolar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1));
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 4, 14));
  const [view, setView] = useState<CalendarView>('month');

  const sortedEvents = useMemo(
    () =>
      [...calendarEvents].sort(
        (firstEvent, secondEvent) =>
          parseISO(firstEvent.date).getTime() - parseISO(secondEvent.date).getTime(),
      ),
    [],
  );

  const eventsByDay = useMemo(() => {
    const eventMap = new Map<string, CalendarEvent[]>();

    sortedEvents.forEach((event) => {
      const dayEvents = eventMap.get(event.date) ?? [];
      dayEvents.push(event);
      eventMap.set(event.date, dayEvents);
    });

    return eventMap;
  }, [sortedEvents]);

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    });
  }, [currentMonth]);

  const selectedWeekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

    return eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6),
    });
  }, [selectedDate]);

  const monthEvents = useMemo(
    () =>
      sortedEvents.filter((event) => {
        const eventDate = parseISO(event.date);
        return isSameMonth(eventDate, currentMonth);
      }),
    [currentMonth, sortedEvents],
  );

  const sidebarEvents = useMemo(() => {
    const referenceDate = startOfMonth(currentMonth);
    const upcomingEvents = sortedEvents.filter(
      (event) => parseISO(event.date).getTime() >= referenceDate.getTime(),
    );

    return (upcomingEvents.length > 0 ? upcomingEvents : sortedEvents).slice(0, 6);
  }, [currentMonth, sortedEvents]);

  const activePeriod = useMemo(
    () =>
      academicPeriods.find((period) =>
        isWithinInterval(selectedDate, {
          start: parseISO(period.start),
          end: parseISO(period.end),
        }),
      ) ??
      academicPeriods.find(
        (period) => parseISO(period.start).getTime() >= selectedDate.getTime(),
      ) ??
      academicPeriods[academicPeriods.length - 1],
    [selectedDate],
  );

  const periodProgress = useMemo(() => {
    const startDate = parseISO(activePeriod.start);
    const endDate = parseISO(activePeriod.end);
    const totalDays = Math.max(1, differenceInCalendarDays(endDate, startDate));
    const elapsedDays = Math.min(
      totalDays,
      Math.max(0, differenceInCalendarDays(selectedDate, startDate)),
    );

    return Math.round((elapsedDays / totalDays) * 100);
  }, [activePeriod, selectedDate]);

  const monthTitle = capitalizeLabel(format(currentMonth, 'MMMM yyyy', { locale: ptBR }));
  const selectedDateTitle = capitalizeLabel(
    format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR }),
  );

  const handlePreviousMonth = () => {
    const previousMonth = subMonths(currentMonth, 1);
    setCurrentMonth(previousMonth);
    setSelectedDate(startOfMonth(previousMonth));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    setCurrentMonth(nextMonth);
    setSelectedDate(startOfMonth(nextMonth));
  };

  const getEventsForDate = (date: Date) => eventsByDay.get(format(date, 'yyyy-MM-dd')) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
            Planejamento acadêmico com visão anual
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Calendário Escolar - 2026
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Organize bimestres, feriados e eventos escolares com uma visão clara do ano letivo.
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="h-11 rounded-xl bg-[#2563EB] px-5 text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)] hover:bg-[#1D4ED8]"
        >
          <Plus className="h-4 w-4" />
          Adicionar Evento
        </Button>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              className="h-10 w-10 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Navegação de mês
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">{monthTitle}</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="h-10 w-10 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="inline-flex w-full rounded-2xl bg-slate-100 p-1 lg:w-auto">
            {viewOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setView(option.id)}
                className={cn(
                  'flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all lg:flex-none',
                  view === option.id
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Visão atual
                </p>
                <h3 className="text-lg font-semibold text-slate-900">{selectedDateTitle}</h3>
              </div>
              <div className="rounded-2xl bg-[#F8F9FA] px-4 py-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{monthEvents.length}</span> itens
                planejados neste mês
              </div>
            </div>

            {view === 'month' && (
              <div className="overflow-hidden">
                <div>
                  <div className="mb-2 grid grid-cols-7 gap-2 md:mb-3 md:gap-2.5">
                    {weekdayLabels.map((weekday) => (
                      <div
                        key={weekday}
                        className="px-1 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
                      >
                        {weekday}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2 md:gap-2.5">
                    {monthDays.map((day) => {
                      const dayEvents = getEventsForDate(day);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isSelected = isSameDay(day, selectedDate);

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            'flex min-h-[104px] flex-col rounded-[20px] border p-2 md:min-h-[114px] md:p-2.5 xl:min-h-[118px] text-left transition-all',
                            isCurrentMonth ? 'bg-white' : 'bg-slate-50/90',
                            isSelected
                              ? 'border-[#2563EB] shadow-[0_14px_26px_rgba(37,99,235,0.14)]'
                              : 'border-slate-200 hover:border-slate-300 hover:shadow-[0_10px_18px_rgba(15,23,42,0.06)]',
                          )}
                        >
                          <div className="flex justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-slate-200" />
                              )}
                            </div>
                            <span
                              className={cn(
                                'text-[11px] font-medium md:text-xs',
                                isCurrentMonth ? 'text-slate-500' : 'text-slate-400',
                              )}
                            >
                              {format(day, 'd')}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1">
                            {dayEvents.slice(0, 3).map((event) => (
                              <div
                                key={event.id}
                                className={cn(
                                  'truncate rounded-full px-2 py-0.5 text-[10px] font-semibold md:px-2.5 md:py-1 md:text-[11px]',
                                  categoryStyles[event.category].chipClassName,
                                )}
                              >
                                {event.label}
                              </div>
                            ))}

                            {dayEvents.length > 3 && (
                              <div className="px-1 text-[10px] font-medium text-slate-500 md:text-[11px]">
                                +{dayEvents.length - 3} eventos
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {view === 'week' && (
              <div className="space-y-3">
                {selectedWeekDays.map((day) => {
                  const dayEvents = getEventsForDate(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'rounded-2xl border p-4 transition-colors',
                        isSameDay(day, selectedDate)
                          ? 'border-[#BFDBFE] bg-[#EFF6FF]'
                          : 'border-slate-200 bg-[#F8F9FA]',
                      )}
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {capitalizeLabel(format(day, 'EEEE', { locale: ptBR }))}
                          </p>
                          <p className="text-sm text-slate-500">{formatShortDate(day)}</p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDate(day)}
                          className="justify-start rounded-xl px-3 text-slate-600 hover:bg-white"
                        >
                          Ver detalhes
                        </Button>
                      </div>

                      <div className="mt-4 space-y-2">
                        {dayEvents.length > 0 ? (
                          dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white p-3 shadow-sm"
                            >
                              <span
                                className={cn(
                                  'mt-1 h-2.5 w-2.5 rounded-full',
                                  categoryStyles[event.category].dotClassName,
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {event.title}
                                  </p>
                                  <Badge
                                    className={cn(
                                      'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                      categoryStyles[event.category].chipClassName,
                                    )}
                                  >
                                    {categoryStyles[event.category].label}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-sm text-slate-500">{event.description}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                            Nenhum evento cadastrado para este dia.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === 'list' && (
              <div className="space-y-3">
                {monthEvents.map((event) => {
                  const eventDate = parseISO(event.date);

                  return (
                    <div
                      key={event.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-[#F8F9FA] p-4 md:flex-row md:items-center"
                    >
                      <div
                        className={cn(
                          'flex min-w-[92px] items-center justify-between rounded-2xl px-4 py-3 md:flex-col md:justify-center',
                          categoryStyles[event.category].panelClassName,
                        )}
                      >
                        <span className="text-2xl font-semibold leading-none">
                          {format(eventDate, 'dd')}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                          {format(eventDate, 'MMM', { locale: ptBR })}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-slate-900">{event.title}</p>
                          <Badge
                            className={cn(
                              'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                              categoryStyles[event.category].chipClassName,
                            )}
                          >
                            {categoryStyles[event.category].label}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{event.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Legenda
            </p>
            <div className="mt-4 space-y-3">
              {(['academic', 'holiday', 'event'] as EventCategory[]).map((category) => (
                <div key={category} className="flex items-center gap-3">
                  <span
                    className={cn(
                      'h-3 w-3 rounded-full',
                      categoryStyles[category].dotClassName,
                    )}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {categoryStyles[category].label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-[#F8F9FA] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Período em andamento
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{activePeriod.label}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {formatShortDate(parseISO(activePeriod.start))} até{' '}
                {formatShortDate(parseISO(activePeriod.end))}
              </p>
              <div className="mt-4 h-2 rounded-full bg-[#DBEAFE]">
                <div
                  className="h-full rounded-full bg-[#2563EB]"
                  style={{ width: `${periodProgress}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500">
                <span>{activePeriod.schoolDays} dias letivos planejados</span>
                <span>{periodProgress}% concluído</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Próximos Eventos
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  Agenda priorizada
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {sidebarEvents.length} itens
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {sidebarEvents.map((event) => {
                const eventDate = parseISO(event.date);

                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-[#F8F9FA] p-4 transition-transform hover:-translate-y-0.5"
                  >
                    <div
                      className={cn(
                        'flex min-w-[76px] flex-col items-center rounded-2xl px-3 py-3',
                        categoryStyles[event.category].panelClassName,
                      )}
                    >
                      <span className="text-2xl font-semibold leading-none">
                        {format(eventDate, 'dd')}
                      </span>
                      <span className="mt-1 text-xs font-semibold uppercase tracking-[0.18em]">
                        {format(eventDate, 'MMM', { locale: ptBR })}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {event.title}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        {event.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
