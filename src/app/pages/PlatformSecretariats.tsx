import { useEffect, useState, type FormEvent } from 'react';
import { Landmark, Mail, MapPinned, MapPlus, Phone, ShieldCheck, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { TypedConfirmDialog } from '../components/TypedConfirmDialog';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { fetchAddressByCep, type CepLookupResult } from '../lib/cepLookup';
import {
  formatCpf,
  formatPhone,
  formatZipCode,
  getPlatformRegistryMetrics,
  getRegisteredSchoolsForSecretariat,
  maskCpf,
  maskPhone,
  maskZipCode,
  normalizeDigits,
} from '../lib/platformRegistry';
import { usePlatformRegistry } from '../providers/PlatformRegistryProvider';

interface SecretariatFormState {
  city: string;
  cityIbgeCode: string | null;
  contactPhone: string;
  coordinatorName: string;
  email: string;
  officeAddress: string;
  secretaryCpf: string;
  secretaryName: string;
  state: string;
  title: string;
  zipCode: string;
}

const stateOptions = ['AC', 'AL', 'AM', 'BA', 'CE', 'DF', 'GO', 'MG', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RS', 'SC', 'SP'];

const initialFormState: SecretariatFormState = {
  city: '',
  cityIbgeCode: null,
  contactPhone: '',
  coordinatorName: '',
  email: '',
  officeAddress: '',
  secretaryCpf: '',
  secretaryName: '',
  state: 'CE',
  title: '',
  zipCode: '',
};

export function PlatformSecretariats() {
  const {
    addSecretariat,
    professionalAssignments,
    registeredSchools,
    removeSecretariat,
    secretariats,
  } = usePlatformRegistry();
  const [formState, setFormState] = useState<SecretariatFormState>(initialFormState);
  const [resolvedCep, setResolvedCep] = useState<CepLookupResult | null>(null);
  const [lastResolvedZipCode, setLastResolvedZipCode] = useState('');
  const [isResolvingZipCode, setIsResolvingZipCode] = useState(false);
  const [zipCodeError, setZipCodeError] = useState<string | null>(null);

  const metrics = getPlatformRegistryMetrics({
    professionalAssignments: [],
    professionalProfiles: [],
    registeredSchools,
    schoolCatalog: [],
    secretariats,
  });

  useEffect(() => {
    const normalizedZipCode = normalizeDigits(formState.zipCode);

    if (normalizedZipCode.length !== 8 || normalizedZipCode === lastResolvedZipCode) {
      return;
    }

    let isCancelled = false;

    async function resolveZipCode() {
      setIsResolvingZipCode(true);
      setZipCodeError(null);

      try {
        const result = await fetchAddressByCep(normalizedZipCode);

        if (isCancelled) {
          return;
        }

        setResolvedCep(result);
        setLastResolvedZipCode(normalizedZipCode);
        setFormState((currentState) => ({
          ...currentState,
          city: result.city || currentState.city,
          cityIbgeCode: result.cityIbgeCode,
          officeAddress:
            [result.street, result.neighborhood].filter(Boolean).join(' - ') || currentState.officeAddress,
          state: result.state || currentState.state,
          zipCode: maskZipCode(result.zipCode),
        }));
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Nao foi possivel consultar o CEP.';
        setResolvedCep(null);
        setZipCodeError(message);
      } finally {
        if (!isCancelled) {
          setIsResolvingZipCode(false);
        }
      }
    }

    resolveZipCode();

    return () => {
      isCancelled = true;
    };
  }, [formState.zipCode, lastResolvedZipCode]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    addSecretariat(formState);
    toast.success('Secretaria cadastrada com sucesso.', {
      description: `${formState.secretaryName} agora responde por ${formState.city}/${formState.state}.`,
    });
    setFormState(initialFormState);
    setResolvedCep(null);
    setLastResolvedZipCode('');
    setZipCodeError(null);
  }

  function handleRemoveSecretariat(secretariatId: string) {
    const result = removeSecretariat(secretariatId);

    if (!result.secretariat) {
      toast.error('Nao foi possivel localizar a secretaria selecionada.');
      return;
    }

    toast.success('Secretaria removida com sucesso.', {
      description: `${result.secretariat.city}/${result.secretariat.state} saiu da plataforma com ${result.removedSchoolsCount} escola(s), ${result.removedAssignmentsCount} vinculo(s) e ${result.removedProfilesCount} perfil(is) sem uso removidos.`,
    });
  }

  const sortedSecretariats = secretariats
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Operacao territorial
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Secretarias de Educacao</h1>
          <p className="mt-1 max-w-3xl text-gray-600">
            Cadastre a secretaria por cidade e mantenha os dados do secretario responsavel para
            organizar a expansao da rede.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Secretarias Ativas" value={metrics.secretariatsCount} icon={Landmark} iconColor="text-blue-600" iconBgColor="bg-blue-50" />
        <MetricCard title="Cidades Cobertas" value={metrics.citiesCoveredCount} icon={MapPinned} iconColor="text-emerald-600" iconBgColor="bg-emerald-50" />
        <MetricCard title="Escolas Ligadas" value={registeredSchools.length} icon={Users} iconColor="text-cyan-600" iconBgColor="bg-cyan-50" />
        <MetricCard title="Cadastros Recentes" value={Math.min(secretariats.length, 7)} icon={MapPlus} iconColor="text-amber-600" iconBgColor="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-3 border-b border-gray-100 pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">Nova secretaria</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-500">
              Comece pela cidade, depois registre os dados do secretario e os contatos de apoio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="secretariat-title">Nome da secretaria</Label>
                  <Input
                    id="secretariat-title"
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((currentState) => ({ ...currentState, title: event.target.value }))
                    }
                    placeholder="Secretaria Municipal de Educacao de Sobral"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretariat-zip-code">CEP da sede</Label>
                  <Input
                    id="secretariat-zip-code"
                    value={formState.zipCode}
                    onChange={(event) => {
                      const nextZipCode = event.target.value;
                      setResolvedCep(null);
                      setZipCodeError(null);
                      if (normalizeDigits(nextZipCode).length < 8) {
                        setLastResolvedZipCode('');
                      }
                      setFormState((currentState) => ({
                        ...currentState,
                        zipCode: maskZipCode(nextZipCode),
                      }));
                    }}
                    placeholder="62.011-000"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretariat-city">Cidade</Label>
                  <Input
                    id="secretariat-city"
                    value={formState.city}
                    onChange={(event) =>
                      setFormState((currentState) => ({ ...currentState, city: event.target.value }))
                    }
                    placeholder="Sobral"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>UF</Label>
                  <Select
                    value={formState.state}
                    onValueChange={(value) =>
                      setFormState((currentState) => ({ ...currentState, state: value }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50">
                      <SelectValue placeholder="Selecione a UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {stateOptions.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretary-name">Secretario responsavel</Label>
                  <Input
                    id="secretary-name"
                    value={formState.secretaryName}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        secretaryName: event.target.value,
                      }))
                    }
                    placeholder="Marcio Almeida"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretary-cpf">CPF</Label>
                  <Input
                    id="secretary-cpf"
                    value={formState.secretaryCpf}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        secretaryCpf: maskCpf(event.target.value),
                      }))
                    }
                    placeholder="000.000.000-00"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretary-email">Email</Label>
                  <Input
                    id="secretary-email"
                    type="email"
                    value={formState.email}
                    onChange={(event) =>
                      setFormState((currentState) => ({ ...currentState, email: event.target.value }))
                    }
                    placeholder="educacao@cidade.gov.br"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretary-phone">Telefone</Label>
                  <Input
                    id="secretary-phone"
                    value={formState.contactPhone}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        contactPhone: maskPhone(event.target.value),
                      }))
                    }
                    placeholder="(88) 99988-7766"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                    required
                  />
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="secretariat-coordinator">Coordenador de apoio</Label>
                  <Input
                    id="secretariat-coordinator"
                    value={formState.coordinatorName}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        coordinatorName: event.target.value,
                      }))
                    }
                    placeholder="Renata Araujo"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                  />
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="secretariat-address">Endereco da sede</Label>
                  <Textarea
                    id="secretariat-address"
                    value={formState.officeAddress}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        officeAddress: event.target.value,
                      }))
                    }
                    placeholder="Rua Viriato de Medeiros, 1250 - Centro"
                    className="min-h-28 rounded-2xl border-gray-200 bg-gray-50"
                    required
                  />
                </div>

                {(isResolvingZipCode || resolvedCep || zipCodeError) && (
                  <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-900 lg:col-span-2">
                    {isResolvingZipCode && 'Consultando CEP para sugerir cidade e UF...'}
                    {!isResolvingZipCode && resolvedCep && (
                      <>
                        Cidade encontrada automaticamente: <strong>{resolvedCep.city}/{resolvedCep.state}</strong>
                        {resolvedCep.cityIbgeCode ? ` • IBGE ${resolvedCep.cityIbgeCode}` : ''}
                      </>
                    )}
                    {!isResolvingZipCode && zipCodeError && zipCodeError}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Dica: cadastrar a secretaria primeiro agiliza o filtro automatico das escolas por
                  cidade nas proximas etapas.
                </p>

                <Button type="submit" className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
                  <MapPlus className="mr-2 h-4 w-4" />
                  Cadastrar secretaria
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
            <CardHeader className="gap-3 border-b border-gray-100 pb-6">
              <CardTitle className="text-lg font-semibold text-gray-900">Checklist recomendado</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-500">
                Campos que ajudam a manter a operacao mais organizada desde o inicio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                1. Cadastre a cidade e o nome oficial da secretaria.
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                2. Salve CPF, email e telefone do secretario responsavel.
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                3. Informe um coordenador de apoio para nao concentrar tudo em uma pessoa.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
            <CardHeader className="gap-3 border-b border-gray-100 pb-6">
              <CardTitle className="text-lg font-semibold text-gray-900">Cobertura imediata</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-500">
                Visao rapida das redes que ja podem seguir para cadastro de escolas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedSecretariats.slice(0, 3).map((secretariat) => {
                const schoolsCount = getRegisteredSchoolsForSecretariat(
                  secretariat.id,
                  registeredSchools,
                ).length;

                return (
                  <div key={secretariat.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                      <p className="font-semibold text-gray-900">{secretariat.city}/{secretariat.state}</p>
                      <p className="text-sm text-gray-500">{secretariat.secretaryName}</p>
                    </div>
                      <Badge className="rounded-full border-blue-100 bg-blue-50 px-3 py-1 text-blue-700">
                        {schoolsCount} escola(s)
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
        <CardHeader className="gap-3 border-b border-gray-100 pb-6">
          <CardTitle className="text-xl font-semibold text-gray-900">Secretarias cadastradas</CardTitle>
          <CardDescription className="text-sm leading-6 text-gray-500">
            Cada card concentra dados suficientes para abrir escolas, diretores e professores sem
            voltar atras procurando contato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedSecretariats.map((secretariat) => {
            const schoolsCount = getRegisteredSchoolsForSecretariat(
              secretariat.id,
              registeredSchools,
            ).length;
            const linkedSchoolIds = new Set(
              registeredSchools
                .filter((school) => school.secretariatId === secretariat.id)
                .map((school) => school.id),
            );
            const linkedAssignmentsCount = professionalAssignments.filter((assignment) =>
              linkedSchoolIds.has(assignment.schoolId),
            ).length;

            return (
              <div key={secretariat.id} className="rounded-[28px] border border-gray-100 bg-gray-50/70 p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-gray-900">{secretariat.title}</p>
                      <Badge className="rounded-full border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700">
                        {secretariat.city}/{secretariat.state}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Secretario responsavel: {secretariat.secretaryName}
                    </p>
                    {secretariat.coordinatorName && (
                      <p className="mt-1 text-sm text-gray-500">
                        Coordenacao de apoio: {secretariat.coordinatorName}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full border-blue-100 bg-blue-50 px-3 py-1 text-blue-700">
                      {schoolsCount} escola(s) vinculada(s)
                    </Badge>
                    <TypedConfirmDialog
                      title="Remover secretaria"
                      description="Essa acao apaga a secretaria, as escolas vinculadas a ela e os vinculos da equipe que existirem apenas nessa rede."
                      confirmationValue={`REMOVER ${secretariat.city} ${secretariat.state}`}
                      confirmButtonLabel="Remover secretaria"
                      details={
                        <p>
                          Impacto previsto: {schoolsCount} escola(s) e {linkedAssignmentsCount}{' '}
                          vinculo(s) vinculados a {secretariat.city}/{secretariat.state}.
                        </p>
                      }
                      onConfirm={() => handleRemoveSecretariat(secretariat.id)}
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remover
                        </Button>
                      }
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Users className="h-4 w-4 text-blue-600" />
                      Secretario
                    </div>
                    <p className="mt-3 text-sm text-gray-600">{secretariat.secretaryName}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatCpf(secretariat.secretaryCpf)}</p>
                  </div>

                  <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Mail className="h-4 w-4 text-cyan-600" />
                      Email
                    </div>
                    <p className="mt-3 break-all text-sm text-gray-600">{secretariat.email}</p>
                  </div>

                  <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      Telefone
                    </div>
                    <p className="mt-3 text-sm text-gray-600">{formatPhone(secretariat.contactPhone)}</p>
                  </div>

                  <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <MapPinned className="h-4 w-4 text-violet-600" />
                      CEP / Cidade
                    </div>
                    <p className="mt-3 text-sm text-gray-600">{formatZipCode(secretariat.zipCode)}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {secretariat.cityIbgeCode ? `IBGE ${secretariat.cityIbgeCode}` : 'IBGE nao informado'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <MapPinned className="h-4 w-4 text-amber-600" />
                      Endereco
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-600">{secretariat.officeAddress}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
