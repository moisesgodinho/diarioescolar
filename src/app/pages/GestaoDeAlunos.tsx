import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

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

export function GestaoDeAlunos() {
  const [busca, setBusca] = useState('');
  const [turmaFiltro, setTurmaFiltro] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [anoLetivo, setAnoLetivo] = useState('2026');
  const [paginaAtual, setPaginaAtual] = useState(1);
  
  const itensPorPagina = 10;
  const totalAlunos = 340; // Simulando total de alunos
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Alunos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie matrículas, dados acadêmicos e histórico dos estudantes
          </p>
        </div>
        <Button 
          onClick={handleNovaMatricula}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Matrícula
        </Button>
      </div>

      {/* Toolbar / Filtros */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Barra de Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nome, CPF ou matrícula..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>

          {/* Filtro: Turma */}
          <div className="w-full md:w-48">
            <Select value={turmaFiltro} onValueChange={setTurmaFiltro}>
              <SelectTrigger className="bg-gray-50">
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
          </div>

          {/* Filtro: Status */}
          <div className="w-full md:w-40">
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="bg-gray-50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro: Ano Letivo */}
          <div className="w-full md:w-32">
            <Select value={anoLetivo} onValueChange={setAnoLetivo}>
              <SelectTrigger className="bg-gray-50">
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
      </div>

      {/* Tabela de Alunos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Matrícula
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Aluno
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Turma
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alunosData.map((aluno) => (
                <tr 
                  key={aluno.id} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Matrícula */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-mono">
                      {aluno.matricula}
                    </span>
                  </td>

                  {/* Aluno */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                          {aluno.iniciais}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-gray-900">{aluno.nome}</span>
                    </div>
                  </td>

                  {/* Turma */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{aluno.turma}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <Badge 
                        className={
                          aluno.status === 'Ativo'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-red-100 text-red-800 hover:bg-red-100'
                        }
                      >
                        {aluno.status}
                      </Badge>
                    </div>
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVisualizarHistorico(aluno)}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditar(aluno)}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-600 hover:text-blue-600"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleRematricula(aluno)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Rematrícula
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEmitirDeclaracao(aluno)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Emitir Declaração
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDesativar(aluno)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Desativar Matrícula
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela - Paginação */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando <span className="font-semibold text-gray-900">1</span> a{' '}
              <span className="font-semibold text-gray-900">10</span> de{' '}
              <span className="font-semibold text-gray-900">{totalAlunos}</span> alunos
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                disabled={paginaAtual === 1}
                className="text-gray-700"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((page) => (
                  <Button
                    key={page}
                    variant={paginaAtual === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaginaAtual(page)}
                    className={
                      paginaAtual === page
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'text-gray-700'
                    }
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
                onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                disabled={paginaAtual === totalPaginas}
                className="text-gray-700"
              >
                Próxima
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">Total de Matrículas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalAlunos}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">Alunos Ativos</p>
          <p className="text-2xl font-bold text-green-600 mt-1">338</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">Alunos Inativos</p>
          <p className="text-2xl font-bold text-red-600 mt-1">2</p>
        </div>
      </div>
    </div>
  );
}
