import {
  BookOpen,
  Building2,
  Calendar,
  Database,
  FileText,
  LayoutDashboard,
  Landmark,
  MessageSquare,
  School,
  Settings,
  ShieldCheck,
  UserRoundCog,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { getPlatformRoleLabel } from '../lib/roleLabels';
import { useAuth } from '../providers/AuthProvider';
import { cn } from './ui/utils';

type NavigationAudience = 'shared' | 'school' | 'platform';

interface MenuItemProps {
  icon: ReactNode;
  isActive: boolean;
  label: string;
  onNavigate?: () => void;
  path: string;
}

interface NavigationItem {
  audience: NavigationAudience;
  icon: ReactNode;
  label: string;
  path: string;
}

function MenuItem({ icon, label, path, isActive, onNavigate }: MenuItemProps) {
  return (
    <Link
      to={path}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-lg px-4 py-3 transition-colors',
        isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100',
      )}
    >
      <span className="h-5 w-5">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export const navigationItems: NavigationItem[] = [
  { audience: 'shared', icon: <LayoutDashboard />, label: 'Dashboard', path: '/' },
  { audience: 'platform', icon: <Building2 />, label: 'Gestao da Plataforma', path: '/plataforma' },
  { audience: 'platform', icon: <ShieldCheck />, label: 'Equipe Global', path: '/plataforma/equipe-global' },
  { audience: 'platform', icon: <Landmark />, label: 'Secretarias', path: '/plataforma/secretarias' },
  { audience: 'platform', icon: <School />, label: 'Escolas', path: '/plataforma/escolas' },
  { audience: 'platform', icon: <UserRoundCog />, label: 'Diretores e Professores', path: '/plataforma/equipe-escolar' },
  { audience: 'platform', icon: <Database />, label: 'Importacao INEP', path: '/plataforma/importacao-inep' },
  { audience: 'school', icon: <BookOpen />, label: 'Diario de Classe', path: '/diario' },
  { audience: 'school', icon: <Users />, label: 'Gestao de Alunos', path: '/alunos' },
  { audience: 'school', icon: <FileText />, label: 'Relatorios', path: '/relatorios' },
  { audience: 'school', icon: <Calendar />, label: 'Calendario Escolar', path: '/calendario' },
  { audience: 'school', icon: <MessageSquare />, label: 'Comunicacao', path: '/comunicacao' },
  { audience: 'school', icon: <Settings />, label: 'Configuracoes', path: '/configuracoes' },
];

interface SidebarContentProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function SidebarContent({ mobile = false, onNavigate }: SidebarContentProps) {
  const location = useLocation();
  const { isPlatformStaff, platformRole } = useAuth();

  function isItemActive(path: string) {
    if (path === '/' || path === '/plataforma') {
      return location.pathname === path;
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  const visibleNavigationItems = navigationItems.filter((item) => {
    if (item.audience === 'shared') {
      return true;
    }

    if (isPlatformStaff) {
      return item.audience === 'platform';
    }

    return item.audience === 'school';
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <div className={cn('border-b border-gray-200', mobile ? 'p-5 pr-12' : 'p-6')}>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Diario Escolar</h1>
            <p className="text-xs text-gray-500">Sistema de Gestao</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {visibleNavigationItems.map((item) => (
          <MenuItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={isItemActive(item.path)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4">
        {platformRole && (
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            {getPlatformRoleLabel(platformRole)}
          </p>
        )}
        <p className="text-center text-xs text-gray-500">Versao 2.4.1</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-gray-200 bg-white lg:flex">
      <SidebarContent />
    </aside>
  );
}
