import { createBrowserRouter } from 'react-router';
import { PlatformRoute, PublicOnlyRoute, ProtectedRoute, SchoolRoute } from './components/RouteGuards';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DiarioDeClasse } from './pages/DiarioDeClasse';
import { GestaoDeAlunos } from './pages/GestaoDeAlunos';
import { CalendarioEscolar } from './pages/CalendarioEscolar';
import { Comunicacao } from './pages/Comunicacao';
import { Configuracoes } from './pages/Configuracoes';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { PlatformManagement } from './pages/PlatformManagement';
import { PlatformInepCatalogImport } from './pages/PlatformInepCatalogImport';
import { PlatformSchoolPeople } from './pages/PlatformSchoolPeople';
import { PlatformSchools } from './pages/PlatformSchools';
import { PlatformSecretariats } from './pages/PlatformSecretariats';
import { RelatoriosDinamicos } from './pages/RelatoriosDinamicos';

export const router = createBrowserRouter([
  {
    Component: PublicOnlyRoute,
    children: [
      {
        path: '/login',
        Component: Login,
      },
    ],
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          {
            index: true,
            Component: Dashboard,
          },
          {
            Component: PlatformRoute,
            children: [
              {
                path: 'plataforma',
                Component: PlatformManagement,
              },
              {
                path: 'plataforma/secretarias',
                Component: PlatformSecretariats,
              },
              {
                path: 'plataforma/escolas',
                Component: PlatformSchools,
              },
              {
                path: 'plataforma/equipe-escolar',
                Component: PlatformSchoolPeople,
              },
              {
                path: 'plataforma/importacao-inep',
                Component: PlatformInepCatalogImport,
              },
            ],
          },
          {
            Component: SchoolRoute,
            children: [
              {
                path: 'diario',
                Component: DiarioDeClasse,
              },
              {
                path: 'alunos',
                Component: GestaoDeAlunos,
              },
              {
                path: 'relatorios',
                Component: RelatoriosDinamicos,
              },
              {
                path: 'calendario',
                Component: CalendarioEscolar,
              },
              {
                path: 'comunicacao',
                Component: Comunicacao,
              },
              {
                path: 'configuracoes',
                Component: Configuracoes,
              },
            ],
          },
          {
            path: '*',
            Component: NotFound,
          },
        ],
      },
    ],
  },
]);
