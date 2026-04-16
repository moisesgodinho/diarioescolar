import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DiarioDeClasse } from './pages/DiarioDeClasse';
import { GestaoDeAlunos } from './pages/GestaoDeAlunos';
import { CalendarioEscolar } from './pages/CalendarioEscolar';
import { Comunicacao } from './pages/Comunicacao';
import { Configuracoes } from './pages/Configuracoes';
import { RelatoriosDinamicos } from './pages/RelatoriosDinamicos';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
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
      {
        path: '*',
        Component: NotFound,
      },
    ],
  },
]);
