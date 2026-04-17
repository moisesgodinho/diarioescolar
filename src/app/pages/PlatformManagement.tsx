import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Link } from 'react-router';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  getPlatformRegistryMetrics,
  type PlatformRegistrySnapshot,
} from '../lib/platformRegistry';
import {
  getPlatformOverviewMetrics,
  loadPlatformOverviewData,
  type PlatformOverviewData,
} from '../lib/platformOverview';
import { usePlatformRegistry } from '../providers/PlatformRegistryProvider';

interface ModuleCard {
  description: string;
  href: string;
  label: string;
  metric: string;
}

export function PlatformManagement() {
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

  const modules: ModuleCard[] = [
    {
      description: 'Cadastre a cidade, o secretario responsavel e todos os contatos institucionais.',
      href: '/plataforma/secretarias',
      label: 'Secretarias de Educacao',
      metric: `${registryMetrics.secretariatsCount} cadastro(s)`,
    },
    {
      description: 'Escolha a secretaria, carregue a lista da cidade pelo INEP e complemente manualmente.',
      href: '/plataforma/escolas',
      label: 'Cadastro de Escolas',
      metric: `${registryMetrics.registeredSchoolsCount} escola(s)`,
    },
    {
      description: 'Busque por CPF, reaproveite cadastro existente e so crie o novo vinculo escolar.',
      href: '/plataforma/equipe-escolar',
      label: 'Diretores e Professores',
      metric: `${registryMetrics.linkedProfessionalsCount} profissional(is)`,
    },
    {
      description: 'Suba o CSV nacional do INEP em uma area separada, com processamento por lotes.',
      href: '/plataforma/importacao-inep',
      label: 'Importacao INEP Brasil',
      metric: 'Carga nacional',
    },
  ];

  const recentSecretariats = registry.secretariats
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 3);
  const recentSchools = registry.registeredSchools
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Hub da gestao global
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Gestao da Plataforma</h1>
          <p className="mt-1 max-w-3xl text-gray-600">
            A operacao foi separada em trilhas claras: primeiro secretaria, depois escolas e por
            fim diretores e professores. Isso deixa a implantacao mais previsivel e legivel.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={refreshOverview}
          disabled={isRefreshing}
          className="w-full rounded-xl border-gray-200 text-gray-700 sm:w-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Secretarias" value={registryMetrics.secretariatsCount} icon={Landmark} iconColor="text-blue-600" iconBgColor="bg-blue-50" />
        <MetricCard title="Escolas da Operacao" value={registryMetrics.registeredSchoolsCount} icon={Building2} iconColor="text-emerald-600" iconBgColor="bg-emerald-50" />
        <MetricCard title="Diretores na Base" value={overviewMetrics.activeDirectorsCount} icon={Users} iconColor="text-cyan-600" iconBgColor="bg-cyan-50" />
        <MetricCard title="Profissionais Vinculados" value={registryMetrics.linkedProfessionalsCount} icon={BriefcaseBusiness} iconColor="text-amber-600" iconBgColor="bg-amber-50" />
      </div>

      {loadError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.href} className="rounded-[28px] border-gray-200 bg-white shadow-sm">
            <CardHeader className="gap-3 border-b border-gray-100 pb-6">
              <Badge className="rounded-full border-blue-100 bg-blue-50 px-3 py-1 text-blue-700">
                {module.metric}
              </Badge>
              <CardTitle className="text-xl font-semibold text-gray-900">{module.label}</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-500">
                {module.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button asChild className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                <Link to={module.href}>
                  Abrir modulo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-3 border-b border-gray-100 pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">Ideias aplicadas</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-500">
              Melhorias que entram junto com essa reorganizacao da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
              A secretaria agora nasce com cidade, secretario, CPF, email, telefone e endereco.
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
              O cadastro de escola parte da secretaria e tenta aproveitar a base local por codigo INEP.
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
              Diretor e professor entram pelo CPF, evitando duplicidade e facilitando vinculos em mais de uma escola.
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-900">
              Ideia extra ja incorporada: monitoramento de vinculos multi-escola para identificar
              rapidamente profissionais compartilhados entre unidades.
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
            <CardHeader className="gap-3 border-b border-gray-100 pb-6">
              <CardTitle className="text-lg font-semibold text-gray-900">Secretarias recentes</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-500">
                Ultimos territorios organizados dentro da operacao.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentSecretariats.map((secretariat) => (
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
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
            <CardHeader className="gap-3 border-b border-gray-100 pb-6">
              <CardTitle className="text-lg font-semibold text-gray-900">Escolas recentes</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-500">
                Entradas mais novas na operacao, com destaque para INEP ou cadastro manual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentSchools.map((school) => (
                <div key={school.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{school.name}</p>
                      <p className="text-sm text-gray-500">{school.city}/{school.state}</p>
                    </div>
                    <Badge
                      className={
                        school.source === 'inep'
                          ? 'rounded-full border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700'
                          : 'rounded-full border-amber-100 bg-amber-50 px-3 py-1 text-amber-700'
                      }
                    >
                      {school.source === 'inep' ? 'INEP' : 'Manual'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
