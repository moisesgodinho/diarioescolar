import { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  FileText,
  Globe,
  Lock,
  Save,
  School,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCog,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';

const environmentItems = [
  { title: 'Cadastro institucional', text: 'Dados da escola completos e validados.' },
  { title: 'Notificações', text: 'Canais principais ativos para famílias e equipe.' },
  { title: 'Documentos', text: 'Modelos PDF sincronizados com identidade visual.' },
  { title: 'Segurança', text: 'Controles de sessão e autenticação atualizados.' },
];

const roles = [
  'Direção com acesso total ao ambiente',
  'Coordenação com acesso acadêmico e relatórios',
  'Docentes com diário, comunicação e calendário',
  'Secretaria com emissão e arquivo de documentos',
];

export function Configuracoes() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [digitalSignature, setDigitalSignature] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
            Administração do ambiente escolar
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Gerencie parâmetros institucionais, notificações, documentos e segurança do sistema em um único lugar.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" size="lg" className="h-11 w-full rounded-xl border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50 sm:w-auto">
            Restaurar padrões
          </Button>
          <Button size="lg" className="h-11 w-full rounded-xl bg-[#2563EB] px-5 text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)] hover:bg-[#1D4ED8] sm:w-auto">
            <Save className="h-4 w-4" />
            Salvar ajustes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Integrações ativas" value="7" icon={Globe} iconColor="text-blue-600" iconBgColor="bg-blue-50" />
        <MetricCard title="Perfis com acesso" value="5" icon={UserCog} iconColor="text-indigo-600" iconBgColor="bg-indigo-50" />
        <MetricCard title="Modelos de documento" value="9" icon={FileText} iconColor="text-emerald-600" iconBgColor="bg-emerald-50" />
        <MetricCard title="Controles de segurança" value="12" icon={ShieldCheck} iconColor="text-amber-600" iconBgColor="bg-amber-50" />
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Geral</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">Parâmetros institucionais</h2>
              </div>
              <div className="rounded-2xl bg-[#F8F9FA] px-4 py-3 text-sm text-slate-600">
                Última sincronização de preferências há 4 minutos.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-700">Nome da instituição</label>
                <Input className="rounded-xl bg-[#F8F9FA]" defaultValue="Escola Horizonte do Saber" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-700">Segmento principal</label>
                <Select defaultValue="fundamental">
                  <SelectTrigger className="rounded-xl bg-[#F8F9FA]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fundamental">Ensino Fundamental</SelectItem>
                    <SelectItem value="medio">Ensino Médio</SelectItem>
                    <SelectItem value="integrado">Fundamental + Médio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-slate-700">Ano letivo padrão</label>
                <Select defaultValue="2026">
                  <SelectTrigger className="rounded-xl bg-[#F8F9FA]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-700">Formato acadêmico</label>
                <Select defaultValue="bimestre">
                  <SelectTrigger className="rounded-xl bg-[#F8F9FA]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bimestre">Bimestres</SelectItem>
                    <SelectItem value="trimestre">Trimestres</SelectItem>
                    <SelectItem value="semestre">Semestres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-700">Fuso horário</label>
                <Select defaultValue="america-sao-paulo">
                  <SelectTrigger className="rounded-xl bg-[#F8F9FA]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america-sao-paulo">America/Sao_Paulo</SelectItem>
                    <SelectItem value="america-manaus">America/Manaus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm text-slate-700">Mensagem institucional padrão</label>
              <Textarea className="min-h-32 rounded-2xl bg-[#F8F9FA]" defaultValue="A escola mantém comunicação contínua com famílias e equipe pedagógica para garantir clareza, segurança e acompanhamento do ano letivo." />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Notificações e documentos</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Preferências operacionais</h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-[#F8F9FA] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Push no app</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Envio de alertas rápidos para famílias e equipe interna.</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-[#F8F9FA] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">E-mail transacional</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Confirmações de leitura, PDFs e comunicados formais por e-mail.</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-[#F8F9FA] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Assinatura digital em documentos</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Aplica identificação institucional automática em boletins, atas e declarações.</p>
                  </div>
                  <Switch checked={digitalSignature} onCheckedChange={setDigitalSignature} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Segurança</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Proteção de acesso</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-[#F8F9FA] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Autenticação em dois fatores</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Obrigatória para perfis administrativos e coordenação.</p>
                  </div>
                  <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-[#F8F9FA] p-4">
                <label className="mb-2 block text-sm text-slate-700">Sessão expira em</label>
                <Select defaultValue="8h">
                  <SelectTrigger className="rounded-xl bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8h">8 horas</SelectItem>
                    <SelectItem value="12h">12 horas</SelectItem>
                    <SelectItem value="24h">24 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status do ambiente</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Resumo operacional</h2>
            <div className="mt-5 space-y-3">
              {environmentItems.map((item, index) => {
                const icons = [School, Bell, FileText, Lock];
                const Icon = icons[index];
                return (
                  <div key={item.title} className="rounded-3xl border border-slate-100 bg-[#F8F9FA] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <Icon className="h-5 w-5 text-[#2563EB]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Perfis e permissões</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Acessos ativos</h2>
            <div className="mt-5 space-y-3">
              {roles.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-[#F8F9FA] px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-[#EFF6FF] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <SlidersHorizontal className="h-5 w-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Ambiente pronto para atualização</p>
                  <p className="text-sm text-slate-600">As alterações podem ser publicadas sem interromper o uso do sistema.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-[#F8F9FA] p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[#2563EB]" />
                <p className="text-sm text-slate-600">Checklist sugerido: revisar dados institucionais, janelas de notificação, modelo de PDF e política de segurança.</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
