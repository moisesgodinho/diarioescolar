import {
  BookOpen,
  Calendar,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { cn } from './ui/utils';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  onNavigate?: () => void;
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

export const navigationItems = [
  { icon: <LayoutDashboard />, label: 'Dashboard', path: '/' },
  { icon: <BookOpen />, label: 'Diário de Classe', path: '/diario' },
  { icon: <Users />, label: 'Gestão de Alunos', path: '/alunos' },
  { icon: <FileText />, label: 'Relatórios', path: '/relatorios' },
  { icon: <Calendar />, label: 'Calendário Escolar', path: '/calendario' },
  { icon: <MessageSquare />, label: 'Comunicação', path: '/comunicacao' },
  { icon: <Settings />, label: 'Configurações', path: '/configuracoes' },
];

interface SidebarContentProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function SidebarContent({ mobile = false, onNavigate }: SidebarContentProps) {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className={cn('border-b border-gray-200', mobile ? 'p-5 pr-12' : 'p-6')}>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Diário Escolar</h1>
            <p className="text-xs text-gray-500">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigationItems.map((item) => (
          <MenuItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={location.pathname === item.path}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <p className="text-center text-xs text-gray-500">Versão 2.4.1</p>
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
