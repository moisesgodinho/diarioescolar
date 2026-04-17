import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  ClipboardList,
  Database,
  Landmark,
  RefreshCw,
  School,
  ShieldCheck,
  TrendingUp,
  UserRoundCog,
  Users,
} from 'lucide-react';
import { Link } from 'react-router';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  getPlatformRegistryMetrics,
  type PlatformRegistrySnapshot,
} from '../lib/platformRegistry';
import { useAuth } from '../providers/AuthProvider';
import {
  getPlatformOverviewMetrics,
  loadPlatformOverviewData,
  type PlatformOverviewData,
} from '../lib/platformOverview';
import { usePlatformRegistry } from '../providers/PlatformRegistryProvider';

const performanceData = [
  { turma: '1o A', desempenho: 8.5 },
  { turma: '1o B', desempenho: 7.8 },
  { turma: '2o A', desempenho: 9.2 },
  { turma: '2o B', desempenho: 8.0 },
  { turma: '3o A', desempenho: 8.7 },
  { turma: '3o B', desempenho: 7.5 },
];

function SchoolDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resumo do Semestre</h1>
        <p className="mt-1 text-gray-600">Visao geral do desempenho e das metricas mais importantes.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total de Alunos" value="342" icon={Users} iconColor="text-blue-600" iconBgColor="bg-blue-50" />
        <MetricCard title="Frequencia Media de Hoje" value="94.5%" icon={TrendingUp} iconColor="text-green-600" iconBgColor="bg-green-50" />
        <MetricCard title="Tarefas Pendentes" value="18" icon={ClipboardList} iconColor="text-amber-600" iconBgColor="bg-amber-50" />
        <MetricCard title="Proximo Evento" value="Amanha" icon={CalendarDays} iconColor="text-violet-600" iconBgColor="bg-violet-50" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Desempenho Geral das Turmas</h2>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="turma" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#D1D5DB' }} />
                <YAxis domain={[0, 10]} tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#D1D5DB' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    boxShadow: '0 10px 20px -12px rgb(15 23 42 / 0.35)',
                  }}
                  cursor={{ fill: '#F3F4F6' }}
                />
                <Bar dataKey="desempenho" fill="#2563EB" radius={[8, 8, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Acesso Rapido</h2>
          <div className="space-y-3">
            <Button className="w-full justify-start rounded-xl bg-blue-600 text-white hover:bg-blue-700" size="lg">
              Fazer Chamada
            </Button>
            <Button className="w-full justify-start rounded-xl bg-blue-600 text-white hover:bg-blue-700" size="lg">
              Lancar Notas
            </Button>
            <Button className="w-full justify-start rounded-xl bg-blue-600 text-white hover:bg-blue-700" size="lg">
              Gerar Boletins
            </Button>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Atividade Recente</h3>
            <div className="space-y-3">
              <div className="text-sm">
                <p className="text-gray-900">Chamada realizada</p>
                <p className="text-xs text-gray-500">2o A - ha 30 minutos</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-900">Notas lancadas</p>
                <p className="text-xs text-gray-500">3o B - ha 2 horas</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-900">Relatorio gerado</p>
                <p className="text-xs text-gray-500">1o A - ontem</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-center text-sm text-emerald-800">
          Ultimo backup realizado ha 2 horas com conexao segura e criptografada.
        </p>
      </div>
    </div>
  );
}

function PlatformDashboard() {
  const registry = usePlatformRegistry();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [overview, setOverview] = useState<PlatformOverviewData | null>(null);

  async function refreshOverview() {
    setIsRefreshing(true);

    const { data, error } = await loadPlatformOverviewData();

    setLoadError(error);
    setOverview(data);
    setIsRefreshing(false);
  }

  useEffect(() => {
    refreshOverview();
  }, []);

  const registryMetrics = getPlatformRegistryMetrics(registry as PlatformRegistrySnapshot);
  const overviewMetrics = overview
    ? getPlatformOverviewMetrics(overview)
    : {
        activeDirectorsCount: 0,
        activeSecretariesCount: 0,
        pendingSchoolInvitesCount: 0,
        platformStaffCount: 0,
        schoolsCount: 0,
      };
  const directorAssignments = registry.professionalAssignments.filter(
    (assignment) => assignment.role === 'director',
  );
  const activeDirectorIds = new Set(directorAssignments.map((assignment) => assignment.profileId));
  const recentSecretariats = registry.secretariats
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 3);
  const recentSchools = registry.registeredSchools
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 4);
  const schoolsWithoutDirector = registry.registeredSchools.filter(
    (school) =>
      !registry.professionalAssignments.some(
        (assignment) => assignment.schoolId === school.id && assignment.role === 'director',
      ),
  );
  const secretariatsWithoutSchool = registry.secretariats.filter(
    (secretariat) =>
      !registry.registeredSchools.some((school) => school.secretariatId === secretariat.id),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Camada global da plataforma
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Painel Global</h1>
          <p className="mt-1 max-w-3xl text-gray-600">
            Aqui voce acompanha somente escolas, diretores e secretarias. Turmas, alunos e notas
            ficam restritos ao ambiente interno de cada escola.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={refreshOverview}
            disabled={isRefreshing}
            className="w-full rounded-xl border-gray-200 text-gray-700 sm:w-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button asChild className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
            <Link to="/plataforma">
              Abrir gestao da plataforma
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Secretarias Cadastradas"
          value={registryMetrics.secretariatsCount}
          icon={Landmark}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <MetricCard
          title="Escolas da Operacao"
          value={registryMetrics.registeredSchoolsCount}
          icon={Building2}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-50"
        />
        <MetricCard
          title="Diretores Vinculados"
          value={activeDirectorIds.size}
          icon={BadgeCheck}
          iconColor="text-cyan-600"
          iconBgColor="bg-cyan-50"
        />
        <MetricCard
          title="Convites Pendentes"
          value={overviewMetrics.pendingSchoolInvitesCount}
          icon={Users}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-3 border-b border-gray-100 pb-6">
            <Landmark className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">Secretarias de Educacao</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-500">
              Cadastre a cidade, o secretario e os contatos institucionais antes de abrir escolas.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button asChild className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              <Link to="/plataforma/secretarias">
                Abrir modulo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-3 border-b border-gray-100 pb-6">
            <School className="h-6 w-6 text-emerald-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">Cadastro de Escolas</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-500">
              Escolha a secretaria, carregue a base da cidade por INEP e complemente manualmente.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button asChild className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              <Link to="/plataforma/escolas">
                Abrir modulo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-3 border-b border-gray-100 pb-6">
            <UserRoundCog className="h-6 w-6 text-cyan-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">Diretores e Professores</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-500">
              Comece pelo CPF para reaproveitar cadastro existente e evitar duplicidade na rede.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button asChild className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              <Link to="/plataforma/equipe-escolar">
                Abrir modulo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-3 border-b border-gray-100 pb-6">
            <Database className="h-6 w-6 text-amber-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">Importacao INEP Brasil</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-500">
              Area dedicada para carregar o CSV nacional do INEP em lotes, sem depender de upload unico.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button asChild className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              <Link to="/plataforma/importacao-inep">
                Abrir modulo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError} O painel segue exibindo os dados locais da operacao normalmente.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.95fr)]">
        <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-3 border-b border-gray-100 pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">Escolas Recentes</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-500">
              Panorama das ultimas escolas cadastradas dentro da operacao atual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSchools.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                Nenhuma escola cadastrada ainda.
              </div>
            ) : (
              recentSchools.map((school) => {
                const directorAssignment = registry.professionalAssignments.find(
                  (assignment) => assignment.schoolId === school.id && assignment.role === 'director',
                );
                const directorProfile = directorAssignment
                  ? registry.professionalProfiles.find(
                      (profile) => profile.id === directorAssignment.profileId,
                    ) ?? null
                  : null;
                const secretariat = registry.secretariats.find(
                  (currentSecretariat) => currentSecretariat.id === school.secretariatId,
                );

                return (
                  <div key={school.id} className="rounded-3xl border border-gray-100 bg-gray-50/70 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{school.name}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {school.city}/{school.state}
                          {school.neighborhood ? ` - ${school.neighborhood}` : ''}
                        </p>
                        {school.inepCode && (
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-400">
                            INEP {school.inepCode}
                          </p>
                        )}
                      </div>

                      <Badge
                        className={
                          school.source === 'inep'
                            ? 'rounded-full border-blue-100 bg-blue-50 px-3 py-1 text-blue-700'
                            : 'rounded-full border-amber-100 bg-amber-50 px-3 py-1 text-amber-700'
                        }
                      >
                        {school.source === 'inep' ? 'INEP' : 'Manual'}
                      </Badge>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                          Diretor principal
                        </p>
                        <p className="mt-3 font-semibold text-gray-900">
                          {directorProfile?.fullName || 'Diretor ainda nao vinculado'}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {directorProfile?.email || 'Sem email principal'}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                          Secretaria responsavel
                        </p>
                        <p className="mt-3 font-semibold text-gray-900">
                          {secretariat?.title || 'Secretaria ainda nao vinculada'}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {secretariat?.secretaryName || 'Cadastre a secretaria para destravar a operacao administrativa.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
            <CardHeader className="gap-3 border-b border-gray-100 pb-6">
              <CardTitle className="text-lg font-semibold text-gray-900">Escopo desta camada</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-500">
                A visao global foi enxugada para proteger o dado academico de cada escola.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                Voce acompanha escolas cadastradas, diretor principal e equipe de secretaria.
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                Turmas, alunos, diarios, notas e boletins nao aparecem para o perfil global.
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                Para editar cadastros ou convidar novos responsaveis, use a tela de gestao da
                plataforma.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
            <CardHeader className="gap-3 border-b border-gray-100 pb-6">
              <CardTitle className="text-lg font-semibold text-gray-900">Cobertura recente</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-500">
                Gargalos mais claros da operacao depois dos ultimos cadastros.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Escolas sem diretor</p>
                <p className="mt-2 text-sm text-amber-800">
                  {schoolsWithoutDirector.length > 0
                    ? schoolsWithoutDirector.map((school) => school.name).join(', ')
                    : 'Todas as escolas ja possuem diretor vinculado.'}
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                <p className="text-sm font-semibold text-cyan-900">Secretarias sem escola</p>
                <p className="mt-2 text-sm text-cyan-800">
                  {secretariatsWithoutSchool.length > 0
                    ? secretariatsWithoutSchool
                        .map((secretariat) => `${secretariat.city}/${secretariat.state}`)
                        .join(', ')
                    : 'Todas as secretarias ja contam com ao menos uma escola cadastrada.'}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Equipe global</p>
                <p className="mt-2 text-sm text-gray-700">
                  {overviewMetrics.platformStaffCount} pessoa(s) na camada da plataforma e{' '}
                  {overviewMetrics.activeSecretariesCount} secretaria(s) escolar(es) ativas no banco.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
            <CardHeader className="gap-3 border-b border-gray-100 pb-6">
              <CardTitle className="text-lg font-semibold text-gray-900">Secretarias recentes</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-500">
                Ultimos territorios organizados dentro da operacao.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentSecretariats.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                  Nenhuma secretaria cadastrada ainda.
                </div>
              ) : (
                recentSecretariats.map((secretariat) => (
                  <div key={secretariat.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{secretariat.city}/{secretariat.state}</p>
                        <p className="text-sm text-gray-500">{secretariat.secretaryName}</p>
                      </div>
                      <Badge className="rounded-full border-blue-100 bg-blue-50 px-3 py-1 text-blue-700">
                        Secretaria
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { isPlatformStaff } = useAuth();

  if (isPlatformStaff) {
    return <PlatformDashboard />;
  }

  return <SchoolDashboard />;
}
