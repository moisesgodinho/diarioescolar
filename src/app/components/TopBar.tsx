import { useState } from 'react';
import { Bell, HelpCircle, LoaderCircle, LogOut, Menu, Search } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { getPlatformRoleLabel } from '../lib/roleLabels';
import { SidebarContent } from './Sidebar';
import { useAuth } from '../providers/AuthProvider';
import { useInepCatalogImport } from '../providers/InepCatalogImportProvider';

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'DE';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function TopBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { isPlatformStaff, platformRole, profile, schoolMemberships, signOut, user } = useAuth();
  const { isImporting, progressPercent } = useInepCatalogImport();

  const displayName =
    profile?.fullName ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Diario Escolar';

  const primarySchoolRole = schoolMemberships[0]?.role;
  const helperText = platformRole
    ? `${getPlatformRoleLabel(platformRole)} | ${user?.email ?? 'Acesso global'}`
    : primarySchoolRole
      ? `${primarySchoolRole} | ${user?.email ?? 'Sessao autenticada'}`
      : user?.email || 'Sessao autenticada';
  const searchPlaceholder = isPlatformStaff
    ? 'Buscar secretarias, escolas ou profissionais...'
    : 'Buscar alunos, escolas ou relatorios...';

  async function handleSignOut() {
    setIsSigningOut(true);
    const error = await signOut();
    setIsSigningOut(false);

    if (error) {
      toast.error('Nao foi possivel sair', {
        description: error.message,
      });
      return;
    }

    toast.success('Sessao encerrada com sucesso.');
  }

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-5 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-gray-200 lg:hidden">
                <Menu className="h-5 w-5 text-gray-700" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] max-w-xs p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navegacao principal</SheetTitle>
                <SheetDescription>Abra uma area do sistema pelo menu lateral.</SheetDescription>
              </SheetHeader>
              <SidebarContent mobile onNavigate={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              className="h-10 rounded-xl border-gray-200 bg-gray-50 pl-10"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {isImporting ? (
              <Link
                to="/plataforma/importacao-inep"
                className="hidden items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 lg:inline-flex"
              >
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                Importando INEP {progressPercent}%
              </Link>
            ) : null}

            <Button variant="ghost" size="icon" className="relative rounded-xl">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </Button>

            <Button variant="ghost" size="icon" className="rounded-xl">
              <HelpCircle className="h-5 w-5 text-gray-600" />
            </Button>

            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="hidden rounded-xl border-gray-200 text-gray-700 sm:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              {isSigningOut ? 'Saindo...' : 'Sair'}
            </Button>
          </div>

          <div className="flex items-center gap-3 border-l border-gray-200 pl-3 sm:pl-4">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-blue-600 text-white">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-sm sm:block">
              <p className="font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">{helperText}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-xl sm:hidden"
            >
              <LogOut className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
