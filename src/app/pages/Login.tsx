import { FormEvent, useState } from 'react';
import { BookOpen, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../providers/AuthProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

function resolveRedirectPath(state: unknown) {
  if (
    state &&
    typeof state === 'object' &&
    'from' in state &&
    state.from &&
    typeof state.from === 'object' &&
    'pathname' in state.from &&
    typeof state.from.pathname === 'string'
  ) {
    return state.from.pathname;
  }

  return '/';
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const error = await signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error('Nao foi possivel entrar', {
        description: error.message,
      });
      return;
    }

    navigate(resolveRedirectPath(location.state), { replace: true });
    toast.success('Acesso liberado', {
      description: 'Sua sessao foi iniciada com sucesso.',
    });
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:flex-row lg:items-stretch lg:gap-6 lg:px-8 lg:py-8">
        <section className="relative overflow-hidden rounded-[32px] bg-slate-900 px-6 py-8 text-white shadow-sm sm:px-8 sm:py-10 lg:flex lg:w-[52%] lg:flex-col lg:justify-between lg:px-10 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.45),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.24),_transparent_34%)]" />

          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15">
                <BookOpen className="h-5 w-5" />
              </div>
              Diario Escolar SaaS
            </div>

            <div className="mt-8 max-w-xl">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Gestao escolar multi-escola com acesso seguro por perfil.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-200 sm:text-base">
                Centralize calendario, diario, comunicacao e relatorios em um unico ambiente com
                autenticacao integrada ao Supabase.
              </p>
            </div>
          </div>

          <div className="relative mt-8 grid gap-4 sm:grid-cols-3 lg:mt-0">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Perfis</p>
              <p className="mt-2 text-lg font-semibold">Diretor, secretaria, professor e aluno</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Seguranca</p>
              <p className="mt-2 text-lg font-semibold">Sessao persistente e acesso protegido</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Escala</p>
              <p className="mt-2 text-lg font-semibold">Base pronta para multiplas escolas</p>
            </div>
          </div>
        </section>

        <section className="mt-6 flex flex-1 items-center justify-center lg:mt-0">
          <div className="w-full max-w-xl rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-600">
                Area restrita
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-gray-900">Entrar no sistema</h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Use seu email institucional e senha para acessar o painel da sua escola.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="voce@escola.com.br"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 rounded-2xl border-gray-200 bg-gray-50 pl-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password">Senha</Label>
                  <span className="text-xs text-gray-400">Minimo de 6 caracteres</span>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-2xl border-gray-200 bg-gray-50 px-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-2xl bg-[#2563EB] text-base font-semibold hover:bg-[#1D4ED8]"
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              O cadastro de usuarios pode ficar restrito a convites da escola. Nesta etapa, o app ja
              esta pronto para autenticar com o Supabase e proteger as rotas internas.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
