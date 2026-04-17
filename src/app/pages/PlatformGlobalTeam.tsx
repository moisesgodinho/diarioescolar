import { useEffect, useState, type FormEvent } from 'react';
import {
  BriefcaseBusiness,
  Mail,
  RefreshCw,
  ShieldCheck,
  ShieldUser,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getPlatformRoleLabel } from '../lib/roleLabels';
import { managePlatformStaff } from '../lib/platformStaff';
import {
  loadPlatformOverviewData,
  type PlatformOverviewData,
  type PlatformStaffMember,
} from '../lib/platformOverview';
import { useAuth } from '../providers/AuthProvider';
import type { MembershipStatus, PlatformRole } from '../providers/AuthProvider';

interface TeamFormState {
  memberEmail: string;
  memberName: string;
  role: Exclude<PlatformRole, 'owner'>;
}

const initialFormState: TeamFormState = {
  memberEmail: '',
  memberName: '',
  role: 'admin',
};

const roleDescriptions: Record<Exclude<PlatformRole, 'owner'>, string> = {
  admin:
    'Use para gestores da plataforma ou admins internos. Ambos compartilham o mesmo acesso operacional.',
  education_secretary:
    'Responsavel por abrir secretarias, escolas e diretores dentro da camada territorial.',
  support: 'Acesso de apoio e consulta global, sem o mesmo alcance operacional do gestor/admin.',
};

function getStatusLabel(status: MembershipStatus) {
  switch (status) {
    case 'active':
      return 'Ativo';
    case 'invited':
      return 'Convidado';
    case 'inactive':
      return 'Inativo';
    default:
      return status;
  }
}

function getStatusBadgeClassName(status: MembershipStatus) {
  switch (status) {
    case 'active':
      return 'rounded-full border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700';
    case 'invited':
      return 'rounded-full border-amber-100 bg-amber-50 px-3 py-1 text-amber-700';
    case 'inactive':
      return 'rounded-full border-slate-200 bg-slate-100 px-3 py-1 text-slate-700';
    default:
      return 'rounded-full border-slate-200 bg-white px-3 py-1 text-slate-700';
  }
}

function sortPlatformStaff(left: PlatformStaffMember, right: PlatformStaffMember) {
  if (left.role === 'owner' && right.role !== 'owner') {
    return -1;
  }

  if (left.role !== 'owner' && right.role === 'owner') {
    return 1;
  }

  if (left.status === 'active' && right.status !== 'active') {
    return -1;
  }

  if (left.status !== 'active' && right.status === 'active') {
    return 1;
  }

  return right.createdAt.localeCompare(left.createdAt);
}

export function PlatformGlobalTeam() {
  const { platformRole } = useAuth();
  const [formState, setFormState] = useState<TeamFormState>(initialFormState);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [overview, setOverview] = useState<PlatformOverviewData | null>(null);

  const canManageGlobalTeam = platformRole === 'owner';

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageGlobalTeam) {
      toast.error('Somente o Gestor do Sistema pode cadastrar a equipe global.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await managePlatformStaff({
        memberEmail: formState.memberEmail,
        memberName: formState.memberName,
        redirectTo: `${window.location.origin}/login`,
        role: formState.role,
      });

      toast.success('Membro da equipe global cadastrado com sucesso.', {
        description: response.member?.wasExistingUser
          ? `${formState.memberName} recebeu o novo papel na plataforma.`
          : `${formState.memberName} foi convidado por email para entrar na plataforma.`,
      });
      setFormState(initialFormState);
      await refreshOverview();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel cadastrar a equipe global.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const platformStaff = overview?.platformStaff.slice().sort(sortPlatformStaff) ?? [];
  const adminsCount = platformStaff.filter(
    (member) => member.role === 'admin' && member.status === 'active',
  ).length;
  const educationSecretaryCount = platformStaff.filter(
    (member) => member.role === 'education_secretary' && member.status === 'active',
  ).length;
  const supportCount = platformStaff.filter(
    (member) => member.role === 'support' && member.status === 'active',
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Equipe global
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Gestores e Admins da Plataforma</h1>
          <p className="mt-1 max-w-3xl text-gray-600">
            Cadastre aqui quem opera a camada global. No sistema, gestor da plataforma e admin usam
            o mesmo alcance operacional pelo papel combinado de gestor/admin.
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
        <MetricCard title="Equipe Global" value={platformStaff.length} icon={Users} iconColor="text-blue-600" iconBgColor="bg-blue-50" />
        <MetricCard title="Gestores/Admins" value={adminsCount} icon={ShieldUser} iconColor="text-emerald-600" iconBgColor="bg-emerald-50" />
        <MetricCard title="Secretarios de Educacao" value={educationSecretaryCount} icon={BriefcaseBusiness} iconColor="text-cyan-600" iconBgColor="bg-cyan-50" />
        <MetricCard title="Suporte Ativo" value={supportCount} icon={Mail} iconColor="text-amber-600" iconBgColor="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-3 border-b border-gray-100 pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">Novo membro da equipe global</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-500">
              O Gestor do Sistema convida quem precisa atuar na camada da plataforma e define o papel
              inicial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-staff-name">Nome completo</Label>
                  <Input
                    id="platform-staff-name"
                    value={formState.memberName}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        memberName: event.target.value,
                      }))
                    }
                    placeholder="Ana Paula Martins"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                    disabled={!canManageGlobalTeam || isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform-staff-email">Email</Label>
                  <Input
                    id="platform-staff-email"
                    type="email"
                    value={formState.memberEmail}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        memberEmail: event.target.value,
                      }))
                    }
                    placeholder="ana@plataforma.com"
                    className="h-11 rounded-xl border-gray-200 bg-gray-50"
                    disabled={!canManageGlobalTeam || isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Papel</Label>
                  <Select
                    value={formState.role}
                    onValueChange={(value) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        role: value as Exclude<PlatformRole, 'owner'>,
                      }))
                    }
                    disabled={!canManageGlobalTeam || isSubmitting}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50">
                      <SelectValue placeholder="Selecione um papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Gestor/Admin da Plataforma</SelectItem>
                      <SelectItem value="education_secretary">Secretario de Educacao</SelectItem>
                      <SelectItem value="support">Suporte</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm leading-6 text-gray-500">
                    {roleDescriptions[formState.role]}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
                {canManageGlobalTeam
                  ? 'Se o email ja existir, o sistema apenas atualiza o papel global. Se nao existir, envia convite automaticamente.'
                  : 'Somente o Gestor do Sistema pode cadastrar ou alterar a equipe global. Os demais perfis veem esta lista em modo leitura.'}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                  disabled={!canManageGlobalTeam || isSubmitting}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Salvando...' : 'Adicionar a equipe global'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-3 border-b border-gray-100 pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">Equipe cadastrada</CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-500">
              Relacao dos usuarios com acesso global ao sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {loadError}
              </div>
            )}

            {platformStaff.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                Nenhum membro cadastrado ainda na camada global.
              </div>
            ) : (
              platformStaff.map((member) => (
                <div key={member.userId} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">
                        {member.fullName || 'Usuario global'}
                      </p>
                      <p className="mt-1 break-all text-sm text-gray-500">
                        {member.email || 'Sem email principal'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className="rounded-full border-blue-100 bg-blue-50 px-3 py-1 text-blue-700">
                        {getPlatformRoleLabel(member.role)}
                      </Badge>
                      <Badge className={getStatusBadgeClassName(member.status)}>
                        {getStatusLabel(member.status)}
                      </Badge>
                    </div>
                  </div>

                  {member.role === 'owner' ? (
                    <p className="mt-3 text-sm text-gray-500">
                      Perfil raiz do sistema. Continua acima da equipe global operacional.
                    </p>
                  ) : member.role === 'admin' ? (
                    <p className="mt-3 text-sm text-gray-500">
                      Mesmo acesso operacional para quem voce chamar de gestor da plataforma ou admin.
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
