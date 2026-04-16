import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileText, 
  Calendar, 
  MessageSquare, 
  Settings 
} from 'lucide-react';
import { Link, useLocation } from 'react-router';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
}

function MenuItem({ icon, label, path, isActive }: MenuItemProps) {
  return (
    <Link
      to={path}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { icon: <LayoutDashboard />, label: 'Dashboard', path: '/' },
    { icon: <BookOpen />, label: 'Diário de Classe', path: '/diario' },
    { icon: <Users />, label: 'Gestão de Alunos', path: '/alunos' },
    { icon: <FileText />, label: 'Relatórios', path: '/relatorios' },
    { icon: <Calendar />, label: 'Calendário Escolar', path: '/calendario' },
    { icon: <MessageSquare />, label: 'Comunicação', path: '/comunicacao' },
    { icon: <Settings />, label: 'Configurações', path: '/configuracoes' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">Diário Escolar</h1>
            <p className="text-xs text-gray-500">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <MenuItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={location.pathname === item.path}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Versão 2.4.1
        </p>
      </div>
    </aside>
  );
}
