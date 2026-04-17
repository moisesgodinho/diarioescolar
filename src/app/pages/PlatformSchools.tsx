import { useEffect, useState, type FormEvent } from 'react';
import {
  BadgePlus,
  Building2,
  FileDigit,
  MapPinned,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  formatPhone,
  getRegisteredSchoolsForSecretariat,
  type SchoolCatalogEntry,
} from '../lib/platformRegistry';
import { loadSchoolCatalogForSecretariat } from '../lib/schoolCatalogLoader';
import { usePlatformRegistry } from '../providers/PlatformRegistryProvider';

interface ManualSchoolFormState {
  educationStages: string;
  inepCode: string;
  name: string;
  neighborhood: string;
  zone: 'Urbana' | 'Rural';
}

const initialManualSchoolFormState: ManualSchoolFormState = {
  educationStages: '',
  inepCode: '',
  name: '',
  neighborhood: '',
  zone: 'Urbana',
};

function parseStages(value: string) {
  return value
    .split(',')
    .map((stage) => stage.trim())
    .filter(Boolean);
}

export function PlatformSchools() {
  const {
    registerManualSchool,
    registeredSchools,
    registerSchoolFromCatalog,
    schoolCatalog,
    secretariats,
  } = usePlatformRegistry();
  const [selectedSecretariatId, setSelectedSecretariatId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [manualFormState, setManualFormState] = useState<ManualSchoolFormState>(
    initialManualSchoolFormState,
  );
  const [catalogAdvisory, setCatalogAdvisory] = useState<string | null>(null);
  const [catalogSourceLabel, setCatalogSourceLabel] = useState('Catalogo local');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [loadedCatalogSchools, setLoadedCatalogSchools] = useState<SchoolCatalogEntry[]>([]);

  useEffect(() => {
    if (!selectedSecretariatId && secretariats.length > 0) {
      setSelectedSecretariatId(secretariats[0].id);
    }
  }, [secretariats, selectedSecretariatId]);

  const selectedSecretariat =
    secretariats.find((secretariat) => secretariat.id === selectedSecretariatId) ?? null;
  const cityCatalog = loadedCatalogSchools;
  const filteredCatalog = cityCatalog.filter((school) => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return (
      school.name.toLowerCase().includes(normalizedQuery) ||
      school.inepCode.includes(normalizedQuery) ||
      school.zone.toLowerCase().includes(normalizedQuery) ||
      (school.address ?? '').toLowerCase().includes(normalizedQuery) ||
      (school.neighborhood ?? '').toLowerCase().includes(normalizedQuery) ||
      (school.administrativeDependency ?? '').toLowerCase().includes(normalizedQuery)
    );
  });
  const linkedSchools = selectedSecretariat
    ? getRegisteredSchoolsForSecretariat(selectedSecretariat.id, registeredSchools)
    : [];

  useEffect(() => {
    if (!selectedSecretariat) {
      setLoadedCatalogSchools([]);
      setCatalogAdvisory(null);
      setCatalogSourceLabel('Catalogo local');
      setIsLoadingCatalog(false);
      return;
    }

    let isCancelled = false;

    async function loadCatalog() {
      setIsLoadingCatalog(true);

      const result = await loadSchoolCatalogForSecretariat(selectedSecretariat, schoolCatalog);

      if (isCancelled) {
        return;
      }

      setLoadedCatalogSchools(result.schools);
      setCatalogAdvisory(result.advisory);
      setCatalogSourceLabel(result.sourceLabel);
      setIsLoadingCatalog(false);
    }

    loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, [schoolCatalog, selectedSecretariat]);

  function handleRegisterCatalogSchool(catalogSchool: SchoolCatalogEntry) {
    if (!selectedSecretariat) {
      return;
    }

    const result = registerSchoolFromCatalog({
      catalogSchool,
      secretariatId: selectedSecretariat.id,
    });

    if (result.alreadyRegistered) {
      toast.info('Essa escola ja esta vinculada a secretaria selecionada.');
      return;
    }

    toast.success('Escola vinculada com sucesso.', {
      description: `${result.school.name} entrou com base no codigo INEP.`,
    });
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSecretariat) {
      toast.error('Cadastre ou selecione uma secretaria antes de abrir escolas.');
      return;
    }

    const manualSchool = registerManualSchool({
      educationStages: parseStages(manualFormState.educationStages),
      inepCode: manualFormState.inepCode,
      name: manualFormState.name,
      neighborhood: manualFormState.neighborhood,
      secretariatId: selectedSecretariat.id,
      zone: manualFormState.zone,
    });

    toast.success('Escola cadastrada manualmente.', {
      description: `${manualSchool.name} agora faz parte da rede de ${selectedSecretariat.city}.`,
    });
    setManualFormState(initialManualSchoolFormState);
  }

  const linkedCatalogKeys = new Set(
    linkedSchools.flatMap((school) =>
      [school.catalogSchoolId, school.inepCode].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  );
  const manualSchoolsCount = linkedSchools.filter((school) => school.source === 'manual').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Cadastro de escolas
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Escolas por Secretaria</h1>
          <p className="mt-1 max-w-3xl text-gray-600">
            Escolha a secretaria, carregue a lista da cidade pelo codigo INEP e use cadastro manual
            quando a escola ainda nao aparecer.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Secretarias Disponiveis" value={secretariats.length} icon={MapPinned} iconColor="text-blue-600" iconBgColor="bg-blue-50" />
        <MetricCard title="Escolas Vinculadas" value={registeredSchools.length} icon={Building2} iconColor="text-emerald-600" iconBgColor="bg-emerald-50" />
        <MetricCard title="Base da Cidade" value={cityCatalog.length} icon={FileDigit} iconColor="text-cyan-600" iconBgColor="bg-cyan-50" />
        <MetricCard title="Cadastro Manual" value={manualSchoolsCount} icon={BadgePlus} iconColor="text-amber-600" iconBgColor="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.85fr)]">
        <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-4 border-b border-gray-100 pb-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,0.6fr)_minmax(0,1fr)]">
              <div className="space-y-2">
                <Label>Secretaria responsavel</Label>
                <Select value={selectedSecretariatId} onValueChange={setSelectedSecretariatId}>
                  <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50">
                    <SelectValue placeholder="Selecione uma secretaria" />
                  </SelectTrigger>
                  <SelectContent>
                    {secretariats.map((secretariat) => (
                      <SelectItem key={secretariat.id} value={secretariat.id}>
                        {secretariat.city}/{secretariat.state} - {secretariat.secretaryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school-search">Buscar por nome, INEP ou zona</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="school-search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Ex.: 23045678 ou Rural"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50 pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedSecretariat ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                Cadastre a primeira secretaria para destravar o fluxo de escolas.
              </div>
            ) : (
              <Tabs defaultValue="catalog" className="space-y-6">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-2">
                  <TabsTrigger value="catalog" className="rounded-xl py-2">Base da cidade</TabsTrigger>
                  <TabsTrigger value="manual" className="rounded-xl py-2">Cadastro manual</TabsTrigger>
                </TabsList>

                <TabsContent value="catalog" className="space-y-4">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                    Cidade selecionada: <strong>{selectedSecretariat.city}/{selectedSecretariat.state}</strong>.
                    O sistema tenta carregar o catalogo da cidade para agilizar o cadastro.
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-emerald-900">
                          Importacao centralizada do INEP
                        </p>
                        <p className="text-sm leading-6 text-emerald-800">
                          O upload do CSV saiu desta tela. Agora a leitura daqui usa a base ja
                          importada na pagina nacional e mostra as escolas da cidade automaticamente.
                        </p>
                      </div>

                      <Button asChild type="button" className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                        <Link to="/plataforma/importacao-inep">Abrir Importacao INEP Brasil</Link>
                      </Button>
                    </div>
                  </div>

                  {catalogAdvisory && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-700">
                          {catalogSourceLabel}
                        </Badge>
                        {selectedSecretariat.cityIbgeCode && (
                          <Badge className="rounded-full border-cyan-100 bg-cyan-50 px-3 py-1 text-cyan-700">
                            IBGE {selectedSecretariat.cityIbgeCode}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-3">{catalogAdvisory}</p>
                    </div>
                  )}

                  {isLoadingCatalog ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                      Carregando catalogo da cidade...
                    </div>
                  ) : filteredCatalog.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                      Nenhuma escola encontrada no filtro atual. Voce pode seguir pelo cadastro manual.
                    </div>
                  ) : (
                    filteredCatalog.map((school) => {
                      const alreadyLinked =
                        linkedCatalogKeys.has(school.id) || linkedCatalogKeys.has(school.inepCode);

                      return (
                        <div key={school.id} className="rounded-[24px] border border-gray-100 bg-gray-50/70 p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-semibold text-gray-900">{school.name}</p>
                                <Badge className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-700">
                                  INEP {school.inepCode}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm text-gray-500">
                                {school.city}/{school.state} • {school.zone}
                              </p>
                              {school.address || school.neighborhood ? (
                                <p className="mt-2 text-sm text-gray-500">
                                  {[school.address, school.neighborhood].filter(Boolean).join(' â€¢ ')}
                                </p>
                              ) : null}
                              {school.administrativeDependency || school.phone || school.operationalStatus ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {school.administrativeDependency ? (
                                    <Badge className="rounded-full border-violet-100 bg-violet-50 px-3 py-1 text-violet-700">
                                      {school.administrativeDependency}
                                    </Badge>
                                  ) : null}
                                  {school.phone ? (
                                    <Badge className="rounded-full border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700">
                                      Tel. {formatPhone(school.phone)}
                                    </Badge>
                                  ) : null}
                                  {school.operationalStatus ? (
                                    <Badge className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-700">
                                      {school.operationalStatus}
                                    </Badge>
                                  ) : null}
                                </div>
                              ) : null}
                              <div className="mt-3 flex flex-wrap gap-2">
                                {school.educationStages.map((stage) => (
                                  <Badge key={stage} className="rounded-full border-cyan-100 bg-cyan-50 px-3 py-1 text-cyan-700">
                                    {stage}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <Button
                              type="button"
                              onClick={() => handleRegisterCatalogSchool(school)}
                              disabled={alreadyLinked}
                              className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                            >
                              {alreadyLinked ? 'Ja vinculada' : 'Vincular escola'}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </TabsContent>

                <TabsContent value="manual">
                  <form className="space-y-6" onSubmit={handleManualSubmit}>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="manual-school-name">Nome da escola</Label>
                        <Input
                          id="manual-school-name"
                          value={manualFormState.name}
                          onChange={(event) =>
                            setManualFormState((currentState) => ({
                              ...currentState,
                              name: event.target.value,
                            }))
                          }
                          placeholder="Escola Piloto do Nucleo 07"
                          className="h-11 rounded-xl border-gray-200 bg-gray-50"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="manual-school-inep">Codigo INEP</Label>
                        <Input
                          id="manual-school-inep"
                          value={manualFormState.inepCode}
                          onChange={(event) =>
                            setManualFormState((currentState) => ({
                              ...currentState,
                              inepCode: event.target.value,
                            }))
                          }
                          placeholder="Opcional"
                          className="h-11 rounded-xl border-gray-200 bg-gray-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Bairro ou localidade</Label>
                        <Input
                          value={manualFormState.neighborhood}
                          onChange={(event) =>
                            setManualFormState((currentState) => ({
                              ...currentState,
                              neighborhood: event.target.value,
                            }))
                          }
                          placeholder="Projeto Senador Nilo Coelho"
                          className="h-11 rounded-xl border-gray-200 bg-gray-50"
                        />
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="manual-school-stages">Etapas de ensino</Label>
                        <Input
                          id="manual-school-stages"
                          value={manualFormState.educationStages}
                          onChange={(event) =>
                            setManualFormState((currentState) => ({
                              ...currentState,
                              educationStages: event.target.value,
                            }))
                          }
                          placeholder="Educacao Infantil, Anos Iniciais"
                          className="h-11 rounded-xl border-gray-200 bg-gray-50"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Zona</Label>
                        <Select
                          value={manualFormState.zone}
                          onValueChange={(value) =>
                            setManualFormState((currentState) => ({
                              ...currentState,
                              zone: value as 'Urbana' | 'Rural',
                            }))
                          }
                        >
                          <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50">
                            <SelectValue placeholder="Selecione a zona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Urbana">Urbana</SelectItem>
                            <SelectItem value="Rural">Rural</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                        Use cadastro manual quando a escola ainda nao estiver na base ou vier sem
                        codigo INEP confirmado.
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
                        <BadgePlus className="mr-2 h-4 w-4" />
                        Adicionar manualmente
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-3 border-b border-gray-100 pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">Escolas da secretaria</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-500">
              Painel rapido da cidade escolhida, incluindo registros manuais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedSecretariat ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                Selecione uma secretaria para ver a rede local.
              </div>
            ) : linkedSchools.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                Nenhuma escola vinculada ainda para {selectedSecretariat.city}/{selectedSecretariat.state}.
              </div>
            ) : (
              linkedSchools.map((school) => (
                <div key={school.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{school.name}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {school.city}/{school.state}
                        {school.neighborhood ? ` • ${school.neighborhood}` : ''}
                      </p>
                      {school.address ? (
                        <p className="mt-2 text-sm text-gray-500">{school.address}</p>
                      ) : null}
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

                  <div className="mt-3 flex flex-wrap gap-2">
                    {school.administrativeDependency ? (
                      <Badge className="rounded-full border-violet-100 bg-violet-50 px-3 py-1 text-violet-700">
                        {school.administrativeDependency}
                      </Badge>
                    ) : null}
                    {school.educationStages.map((stage) => (
                      <Badge key={stage} className="rounded-full border-cyan-100 bg-cyan-50 px-3 py-1 text-cyan-700">
                        {stage}
                      </Badge>
                    ))}
                    {school.phone ? (
                      <Badge className="rounded-full border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700">
                        Tel. {formatPhone(school.phone)}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-3 text-xs text-gray-400">
                    {school.inepCode ? `Codigo INEP ${school.inepCode}` : 'Sem codigo INEP vinculado'}
                    {school.operationalStatus ? ` â€¢ ${school.operationalStatus}` : ''}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
