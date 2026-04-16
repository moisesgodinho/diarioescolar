import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Check, X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Aluno {
  id: number;
  nome: string;
  iniciais: string;
  presente: boolean;
  nota: string;
  observacoes: string;
}

const alunosIniciais: Aluno[] = [
  { id: 1, nome: 'Ana Carolina Silva', iniciais: 'AS', presente: true, nota: '8.5', observacoes: '' },
  { id: 2, nome: 'Bruno Henrique Costa', iniciais: 'BC', presente: true, nota: '7.0', observacoes: '' },
  { id: 3, nome: 'Camila Rodrigues Santos', iniciais: 'CS', presente: false, nota: '9.2', observacoes: 'Justificou ausência' },
  { id: 4, nome: 'Daniel Oliveira Lima', iniciais: 'DL', presente: true, nota: '6.5', observacoes: '' },
  { id: 5, nome: 'Eduardo Pereira Souza', iniciais: 'ES', presente: true, nota: '8.8', observacoes: '' },
  { id: 6, nome: 'Fernanda Alves Martins', iniciais: 'FM', presente: true, nota: '9.5', observacoes: 'Excelente participação' },
  { id: 7, nome: 'Gabriel Santos Ferreira', iniciais: 'GF', presente: true, nota: '7.3', observacoes: '' },
  { id: 8, nome: 'Helena Costa Barbosa', iniciais: 'HB', presente: false, nota: '8.0', observacoes: '' },
  { id: 9, nome: 'Igor Mendes Cardoso', iniciais: 'IC', presente: true, nota: '6.8', observacoes: '' },
  { id: 10, nome: 'Julia Ribeiro Nascimento', iniciais: 'JN', presente: true, nota: '9.0', observacoes: '' },
  { id: 11, nome: 'Kaique Silva Rocha', iniciais: 'KR', presente: true, nota: '7.5', observacoes: '' },
  { id: 12, nome: 'Larissa Fernandes Dias', iniciais: 'LD', presente: true, nota: '8.2', observacoes: '' },
];

export function DiarioDeClasse() {
  const [alunos, setAlunos] = useState<Aluno[]>(alunosIniciais);
  const [disciplina, setDisciplina] = useState('matematica');
  const [bimestre, setBimestre] = useState('2');
  const [data, setData] = useState('2026-04-16');

  const togglePresenca = (id: number) => {
    setAlunos(alunos.map(aluno => 
      aluno.id === id ? { ...aluno, presente: !aluno.presente } : aluno
    ));
  };

  const atualizarNota = (id: number, nota: string) => {
    setAlunos(alunos.map(aluno => 
      aluno.id === id ? { ...aluno, nota } : aluno
    ));
  };

  const atualizarObservacoes = (id: number, observacoes: string) => {
    setAlunos(alunos.map(aluno => 
      aluno.id === id ? { ...aluno, observacoes } : aluno
    ));
  };

  const salvarAlteracoes = () => {
    toast.success('Alterações salvas com sucesso!', {
      description: 'O diário de classe foi atualizado.',
    });
  };

  const presentes = alunos.filter(a => a.presente).length;
  const percentualPresenca = ((presentes / alunos.length) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diário de Classe - Turma 8º Ano A</h1>
          <p className="text-gray-600 mt-1">
            Gerencie presença, notas e observações dos alunos
          </p>
        </div>
        <Button 
          onClick={salvarAlteracoes}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-700 mb-2 block">Disciplina</label>
            <Select value={disciplina} onValueChange={setDisciplina}>
              <SelectTrigger className="bg-gray-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="matematica">Matemática</SelectItem>
                <SelectItem value="portugues">Português</SelectItem>
                <SelectItem value="ciencias">Ciências</SelectItem>
                <SelectItem value="historia">História</SelectItem>
                <SelectItem value="geografia">Geografia</SelectItem>
                <SelectItem value="ingles">Inglês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-2 block">Bimestre</label>
            <Select value={bimestre} onValueChange={setBimestre}>
              <SelectTrigger className="bg-gray-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1º Bimestre</SelectItem>
                <SelectItem value="2">2º Bimestre</SelectItem>
                <SelectItem value="3">3º Bimestre</SelectItem>
                <SelectItem value="4">4º Bimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-2 block">Data de Hoje</label>
            <Input 
              type="date" 
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="bg-gray-50"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-2 block">Resumo de Presença</label>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <p className="text-sm font-semibold text-green-800">
                {presentes}/{alunos.length} presentes ({percentualPresenca}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Alunos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-16">#</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Aluno</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 w-32">Presença</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 w-32">Nota da Atividade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alunos.map((aluno, index) => (
                <tr 
                  key={aluno.id} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Número */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {String(index + 1).padStart(2, '0')}
                  </td>

                  {/* Aluno */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {aluno.iniciais}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900">{aluno.nome}</span>
                    </div>
                  </td>

                  {/* Presença */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => togglePresenca(aluno.id)}
                        className={`w-20 h-10 rounded-lg flex items-center justify-center gap-2 transition-all ${
                          aluno.presente
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {aluno.presente ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">Sim</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            <span className="text-sm font-medium">Não</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Nota */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={aluno.nota}
                        onChange={(e) => atualizarNota(aluno.id, e.target.value)}
                        className="w-20 text-center bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="0.0"
                        maxLength={4}
                      />
                    </div>
                  </td>

                  {/* Observações */}
                  <td className="px-6 py-4">
                    <Input
                      type="text"
                      value={aluno.observacoes}
                      onChange={(e) => atualizarObservacoes(aluno.id, e.target.value)}
                      className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Adicione uma observação..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-8">
            <p className="text-blue-800">
              <span className="font-semibold">Total de alunos:</span> {alunos.length}
            </p>
            <p className="text-blue-800">
              <span className="font-semibold">Presentes:</span> {presentes}
            </p>
            <p className="text-blue-800">
              <span className="font-semibold">Ausentes:</span> {alunos.length - presentes}
            </p>
          </div>
          <p className="text-blue-600 font-medium">
            💡 Adeus papelada! Tudo digital e seguro.
          </p>
        </div>
      </div>
    </div>
  );
}
