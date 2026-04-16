import { useState } from 'react';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  FileText,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface Aluno {
  id: number;
  matricula: string;
  nome: string;
  iniciais: string;
  turma: string;
  status: 'Ativo' | 'Inativo';
}

const alunosData: Aluno[] = [
  { id: 1, matricula: '#2026001', nome: 'Ana Carolina Silva', iniciais: 'AS', turma: '8º Ano A', status: 'Ativo' },
  { id: 2, matricula: '#2026002', nome: 'Bruno Henrique Costa', iniciais: 'BC', turma: '8º Ano A', status: 'Ativo' },
  { id: 3, matricula: '#2026003', nome: 'Camila Rodrigues Santos', iniciais: 'CS', turma: '8º Ano B', status: 'Ativo' },
  { id: 4, matricula: '#2026004', nome: 'Daniel Oliveira Lima', iniciais: 'DL', turma: '9º Ano A', status: 'Ativo' },
  { id: 5, matricula: '#2026005', nome: 'Eduardo Pereira Souza', iniciais: 'ES', turma: '7º Ano A', status: 'Ativo' },
  { id: 6, matricula: '#2026006', nome: 'Fernanda Alves Martins', iniciais: 'FM', turma: '8º Ano A', status: 'Ativo' },
  { id: 7, matricula: '#2026007', nome: 'Gabriel Santos Ferreira', iniciais: 'GF', turma: '9º Ano B', status: 'Ativo' },
  { id: 8, matricula: '#2026008', nome: 'Helena Costa Barbosa', iniciais: 'HB', turma: '7º Ano B', status: 'Inativo' },
  { id: 9, matricula: '#2026009', nome: 'Igor Mendes Cardoso', iniciais: 'IC', turma: '8º Ano B', status: 'Ativo' },
  { id: 10, matricula: '#2026010', nome: 'Julia Ribeiro Nascimento', iniciais: 'JN', turma: '9º Ano A', status: 'Ativo' },
];

function statusBadgeClass(status: Aluno['status']) {
  return status === 'Ativo'
    ? 'bg-green-100 text-green-800 hover:bg-green-100'
    : 'bg-red-100 text-red-800 hover:bg-red-100';
}

export function GestaoDeAlunos() {
  const [busca, setBusca] = useState('');
  const [turmaFiltro, setTurmaFiltro] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [anoLetivo, setAnoLetivo] = useState('2026');
  const [paginaAtual, setPaginaAtual] = useState(1);

  const itensPorPagina = 10;
  const totalAlunos = 340;
  const totalPaginas = Math.ceil(totalAlunos / itensPorPagina);

  const handleNovaMatricula = () => {
    toast.success('Abrindo formulário de nova matrícula...', {
      description: 'Você será redirecionado para o cadastro.',
    });
  };

  const handleVisualizarHistorico = (aluno: Aluno) => {
    toast.info(`Histórico Escolar - ${aluno.nome}`, {
      description: 'Carregando dados acadêmicos...',
    });
  };

  const handleEditar = (aluno: Aluno) => {
    toast.info(`Editando - ${aluno.nome}`, {
      description: 'Abrindo formulário de edição...',
    });
  };

  const handleRematricula = (aluno: Aluno) => {
    toast.success(`Rematrícula - ${aluno.nome}`, {
      description: 'Processo de rematrícula iniciado.',
    });
  };

  const handleEmitirDeclaracao = (aluno: Aluno) => {
    toast.info(`Emitindo declaração para ${aluno.nome}...`);
  };

  const handleDesativar = (aluno: Aluno) => {
    toast.warning(`Desativar matrícula - ${aluno.nome}`, {
      description: 'Confirme esta ação no sistema.',
    });
  };

  const renderActions = (aluno: Aluno) => (
    <>
      <Button variant="ghost" size="icon" onClick={() => handleVisualizarHistorico(aluno)} className="text-gray-600 hover:text-blue-600">
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => handleEditar(aluno)} className="text-gray-600 hover:text-blue-600">
        <Edit className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleRematricula(aluno)}>
            <UserCheck className="mr-2 h-4 w-4" />
            Rematrícula
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleEmitirDeclaracao(aluno)}>
            <FileText className="mr-2 h-4 w-4" />
            Emitir Declaração
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDesativar(aluno)} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Desativar Matrícula
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Alunos</h1>
          <p className="mt-1 text-gray-600">
            Gerencie matrículas, dados acadêmicos e histórico dos estudantes.
          </p>
        </div>
        <Button onClick={handleNovaMatricula} className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto" size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Nova Matrícula
        </Button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,180px))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nome, CPF ou matrícula..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-10 rounded-xl border-gray-200 bg-gray-50 pl-10"
            />
          </div>

          <Select value={turmaFiltro} onValueChange={setTurmaFiltro}>
            <SelectTrigger className="h-10 rounded-xl bg-gray-50">
              <SelectValue placeholder="Turma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Turmas</SelectItem>
              <SelectItem value="7a">7º Ano A</SelectItem>
              <SelectItem value="7b">7º Ano B</SelectItem>
              <SelectItem value="8a">8º Ano A</SelectItem>
              <SelectItem value="8b">8º Ano B</SelectItem>
              <SelectItem value="9a">9º Ano A</SelectItem>
              <SelectItem value="9b">9º Ano B</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="h-10 rounded-xl bg-gray-50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="inativos">Inativos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={anoLetivo} onValueChange={setAnoLetivo}>
            <SelectTrigger className="h-10 rounded-xl bg-gray-50">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 xl:hidden">
        {alunosData.map((aluno) => (
          <div key={aluno.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="bg-blue-100 font-semibold text-blue-700">
                    {aluno.iniciais}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{aluno.nome}</p>
                  <p className="text-sm text-gray-500">{aluno.matricula}</p>
                </div>
              </div>
              <Badge className={statusBadgeClass(aluno.status)}>{aluno.status}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Turma</p>
                <p className="mt-1 text-sm text-gray-700">{aluno.turma}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Matrícula</p>
                <p className="mt-1 font-mono text-sm text-gray-700">{aluno.matricula}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {renderActions(aluno)}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm xl:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Matrícula</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Aluno</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Turma</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alunosData.map((aluno) => (
                <tr key={aluno.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{aluno.matricula}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 font-semibold text-blue-700">
                          {aluno.iniciais}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-gray-900">{aluno.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{aluno.turma}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <Badge className={statusBadgeClass(aluno.status)}>{aluno.status}</Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">{renderActions(aluno)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-sm text-gray-600">
              Mostrando <span className="font-semibold text-gray-900">1</span> a{' '}
              <span className="font-semibold text-gray-900">10</span> de{' '}
              <span className="font-semibold text-gray-900">{totalAlunos}</span> alunos
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                disabled={paginaAtual === 1}
                className="text-gray-700"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>

              <div className="flex flex-wrap items-center gap-1">
                {[1, 2, 3].map((page) => (
                  <Button
                    key={page}
                    variant={paginaAtual === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaginaAtual(page)}
                    className={paginaAtual === page ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700'}
                  >
                    {page}
                  </Button>
                ))}
                {totalPaginas > 3 && (
                  <>
                    <span className="px-2 text-gray-500">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(totalPaginas)}
                      className="text-gray-700"
                    >
                      {totalPaginas}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))}
                disabled={paginaAtual === totalPaginas}
                className="text-gray-700"
              >
                Próxima
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Total de Matrículas</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalAlunos}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Alunos Ativos</p>
          <p className="mt-1 text-2xl font-bold text-green-600">338</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Alunos Inativos</p>
          <p className="mt-1 text-2xl font-bold text-red-600">2</p>
        </div>
      </div>
    </div>
  );
}
