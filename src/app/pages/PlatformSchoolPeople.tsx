import { useEffect, useState, type FormEvent } from 'react';
import { BadgeCheck, BriefcaseBusiness, Search, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import {
  formatCpf,
  formatPhone,
  getAssignmentsForProfile,
  getPlatformRegistryMetrics,
  maskCpf,
  maskPhone,
  type SchoolStaffRole,
} from '../lib/platformRegistry';
import { usePlatformRegistry } from '../providers/PlatformRegistryProvider';

interface ProfessionalFormState {
  cpf: string;
  discipline: string;
  email: string;
  fullName: string;
  notes: string;
  phone: string;
}

const initialFormState: ProfessionalFormState = {
  cpf: '',
  discipline: '',
  email: '',
  fullName: '',
  notes: '',
  phone: '',
};

export function PlatformSchoolPeople() {
  const {
    assignProfessionalToSchool,
    findProfileByCpf,
    professionalAssignments,
    professionalProfiles,
    registeredSchools,
  } = usePlatformRegistry();
  const [selectedRole, setSelectedRole] = useState<SchoolStaffRole>('director');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [lookupDone, setLookupDone] = useState(false);
  const [matchedProfileId, setMatchedProfileId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ProfessionalFormState>(initialFormState);

  useEffect(() => {
    if (!selectedSchoolId && registeredSchools.length > 0) {
      setSelectedSchoolId(registeredSchools[0].id);
    }
  }, [registeredSchools, selectedSchoolId]);

  const metrics = getPlatformRegistryMetrics({
    professionalAssignments,
    professionalProfiles,
    registeredSchools,
    schoolCatalog: [],
    secretariats: [],
  });
  const matchedProfile =
    professionalProfiles.find((profile) => profile.id === matchedProfileId) ?? null;
  const matchedAssignments = matchedProfile
    ? getAssignmentsForProfile(matchedProfile.id, professionalAssignments)
    : [];
  const selectedSchool = registeredSchools.find((school) => school.id === selectedSchoolId) ?? null;
  const recentAssignments = professionalAssignments.slice(0, 6);
  const directorsCount = professionalAssignments.filter((assignment) => assignment.role === 'director').length;
  const teachersCount = professionalAssignments.filter((assignment) => assignment.role === 'teacher').length;

  function handleLookupCpf() {
    const profile = findProfileByCpf(formState.cpf);

    if (!profile) {
      setLookupDone(true);
      setMatchedProfileId(null);
      setFormState((currentState) => ({
        ...currentState,
        discipline: selectedRole === 'teacher' ? currentState.discipline : '',
        email: '',
        fullName: '',
        notes: '',
        phone: '',
      }));
      toast.info('CPF nao encontrado. Complete os dados e crie o cadastro.');
      return;
    }

    setLookupDone(true);
    setMatchedProfileId(profile.id);
    setFormState((currentState) => ({
      ...currentState,
      email: profile.email,
      fullName: profile.fullName,
      notes: profile.notes ?? '',
      phone: maskPhone(profile.phone),
    }));
    toast.success('CPF encontrado.', {
      description: `${profile.fullName} ja possui historico na rede.`,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSchoolId) {
      toast.error('Selecione uma escola antes de vincular o profissional.');
      return;
    }

    const result = assignProfessionalToSchool({
      cpf: formState.cpf,
      discipline: formState.discipline,
      email: formState.email,
      fullName: formState.fullName,
      notes: formState.notes,
      phone: formState.phone,
      role: selectedRole,
      schoolId: selectedSchoolId,
    });

    setLookupDone(true);
    setMatchedProfileId(result.profile.id);

    if (result.existedAssignment) {
      toast.info('Esse profissional ja estava vinculado a essa escola com o mesmo papel.');
      return;
    }

    toast.success(
      result.existedProfile
        ? 'Vinculo criado com cadastro existente.'
        : 'Cadastro e vinculo criados com sucesso.',
      {
        description: `${result.profile.fullName} agora aparece em ${selectedSchool?.name ?? 'uma nova escola'}.`,
      },
    );

    setFormState((currentState) => ({
      ...currentState,
      discipline: '',
      notes: currentState.notes,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Equipe escolar
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Diretores e Professores</h1>
          <p className="mt-1 max-w-3xl text-gray-600">
            Comece pelo CPF. Se o profissional ja existir em outra escola, o sistema reaproveita o
            cadastro e cria so o novo vinculo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Profissionais Vinculados" value={metrics.linkedProfessionalsCount} icon={Users} iconColor="text-blue-600" iconBgColor="bg-blue-50" />
        <MetricCard title="Diretores Ativos" value={directorsCount} icon={BadgeCheck} iconColor="text-emerald-600" iconBgColor="bg-emerald-50" />
        <MetricCard title="Professores Ativos" value={teachersCount} icon={BriefcaseBusiness} iconColor="text-cyan-600" iconBgColor="bg-cyan-50" />
        <MetricCard title="Vinculos Multi-escola" value={metrics.crossSchoolProfilesCount} icon={UserPlus} iconColor="text-amber-600" iconBgColor="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-3 border-b border-gray-100 pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">Novo vinculo escolar</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-500">
              Escolha a escola, informe o papel e busque primeiro pelo CPF antes de completar os
              demais campos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Escola</Label>
                  <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50">
                      <SelectValue placeholder="Selecione a escola" />
                    </SelectTrigger>
                    <SelectContent>
                      {registeredSchools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name} - {school.city}/{school.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Papel</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as SchoolStaffRole)}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50">
                      <SelectValue placeholder="Selecione o papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="director">Diretor</SelectItem>
                      <SelectItem value="teacher">Professor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="person-cpf">CPF</Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="person-cpf"
                      value={formState.cpf}
                      onChange={(event) =>
                        setFormState((currentState) => ({
                          ...currentState,
                          cpf: maskCpf(event.target.value),
                        }))
                      }
                      placeholder="000.000.000-00"
                      className="h-11 rounded-xl border-gray-200 bg-gray-50"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLookupCpf}
                      className="h-11 rounded-xl border-gray-200 text-gray-700"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Buscar CPF
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="person-name">Nome completo</Label>
                  <Input
                    id="person-name"
                    value={formState.fullName}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="Maria Fernanda Lima"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="person-email">Email</Label>
                  <Input
                    id="person-email"
                    type="email"
                    value={formState.email}
                    onChange={(event) =>
                      setFormState((currentState) => ({ ...currentState, email: event.target.value }))
                    }
                    placeholder="maria.lima@educa.br"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="person-phone">Telefone</Label>
                  <Input
                    id="person-phone"
                    value={formState.phone}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        phone: maskPhone(event.target.value),
                      }))
                    }
                    placeholder="(88) 99911-1222"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                    required
                  />
                </div>

                {selectedRole === 'teacher' && (
                  <div className="space-y-2">
                    <Label htmlFor="person-discipline">Disciplina</Label>
                    <Input
                      id="person-discipline"
                      value={formState.discipline}
                      onChange={(event) =>
                        setFormState((currentState) => ({
                          ...currentState,
                          discipline: event.target.value,
                        }))
                      }
                      placeholder="Matematica"
                      className="h-11 rounded-xl border-gray-200 bg-gray-50"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="person-notes">Observacoes</Label>
                  <Textarea
                    id="person-notes"
                    value={formState.notes}
                    onChange={(event) =>
                      setFormState((currentState) => ({ ...currentState, notes: event.target.value }))
                    }
                    placeholder="Informacoes adicionais para equipe de implantacao."
                    className="min-h-28 rounded-2xl border-gray-200 bg-gray-50"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Salvar vinculo
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
            <CardHeader className="gap-3 border-b border-gray-100 pb-6">
              <CardTitle className="text-lg font-semibold text-gray-900">Resultado da busca por CPF</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-500">
                O sistema mostra aqui se o profissional ja tem historico em outra escola.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!lookupDone ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                  Busque um CPF para decidir entre criar novo cadastro ou apenas vincular.
                </div>
              ) : matchedProfile ? (
                <>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="font-semibold text-blue-900">{matchedProfile.fullName}</p>
                    <p className="mt-2 text-sm text-blue-800">{formatCpf(matchedProfile.cpf)}</p>
                    <p className="mt-1 text-sm text-blue-800">{matchedProfile.email}</p>
                    <p className="mt-1 text-sm text-blue-800">{formatPhone(matchedProfile.phone)}</p>
                  </div>

                  {matchedAssignments.map((assignment) => {
                    const school = registeredSchools.find((currentSchool) => currentSchool.id === assignment.schoolId);

                    return (
                      <div key={assignment.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{school?.name || 'Escola vinculada'}</p>
                            <p className="text-sm text-gray-500">{assignment.role === 'director' ? 'Diretor' : 'Professor'}</p>
                          </div>
                          {assignment.discipline && (
                            <Badge className="rounded-full border-cyan-100 bg-cyan-50 px-3 py-1 text-cyan-700">
                              {assignment.discipline}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-900">
                  Nenhum cadastro encontrado para esse CPF. Complete os dados e o sistema cria um
                  novo perfil ao salvar.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
            <CardHeader className="gap-3 border-b border-gray-100 pb-6">
              <CardTitle className="text-lg font-semibold text-gray-900">Boas praticas</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-500">
                Pequenos cuidados que evitam cadastro duplicado na rede.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                1. Sempre busque o CPF antes de preencher nome e email.
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                2. Se o cadastro ja existir, apenas atualize os dados que mudaram e salve o vinculo.
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                3. Para professor, registre tambem a disciplina principal na escola atual.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
        <CardHeader className="gap-3 border-b border-gray-100 pb-6">
          <CardTitle className="text-xl font-semibold text-gray-900">Vinculos recentes</CardTitle>
          <CardDescription className="text-sm leading-6 text-gray-500">
            Visao consolidada dos ultimos diretores e professores inseridos ou vinculados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentAssignments.map((assignment) => {
            const profile = professionalProfiles.find(
              (currentProfile) => currentProfile.id === assignment.profileId,
            );
            const school = registeredSchools.find((currentSchool) => currentSchool.id === assignment.schoolId);

            return (
              <div key={assignment.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{profile?.fullName || 'Profissional vinculado'}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {school?.name || 'Escola vinculada'} • {assignment.role === 'director' ? 'Diretor' : 'Professor'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-700">
                      {formatCpf(profile?.cpf ?? null)}
                    </Badge>
                    {assignment.discipline && (
                      <Badge className="rounded-full border-cyan-100 bg-cyan-50 px-3 py-1 text-cyan-700">
                        {assignment.discipline}
                      </Badge>
                    )}
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
