import type { PlatformRole } from '../providers/AuthProvider';

export function getPlatformRoleLabel(role: PlatformRole) {
  switch (role) {
    case 'owner':
      return 'Gestor do Sistema';
    case 'education_secretary':
      return 'Secretario de Educacao';
    case 'admin':
      return 'Admin da Plataforma';
    case 'support':
      return 'Suporte';
    default:
      return role;
  }
}
