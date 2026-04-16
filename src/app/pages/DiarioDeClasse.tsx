import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Save, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
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
    setAlunos(alunos.map((aluno) => (aluno.id === id ? { ...aluno, presente: !aluno.presente } : aluno)));
  };

  const atualizarNota = (id: number, nota: string) => {
    setAlunos(alunos.map((aluno) => (aluno.id === id ? { ...aluno, nota } : aluno)));
  };

  const atualizarObservacoes = (id: number, observacoes: string) => {
    setAlunos(alunos.map((aluno) => (aluno.id === id ? { ...aluno, observacoes } : aluno)));
  };

  const salvarAlteracoes = () => {
    toast.success('Alterações salvas com sucesso!', {
      description: 'O diário de classe foi atualizado.',
    });
  };

  const presentes = alunos.filter((aluno) => aluno.presente).length;
  const percentualPresenca = ((presentes / alunos.length) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diário de Classe - Turma 8º Ano A</h1>
          <p className="mt-1 text-gray-600">Gerencie presença, notas e observações dos alunos.</p>
        </div>
        <Button onClick={salvarAlteracoes} className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto" size="lg">
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm text-gray-700">Disciplina</label>
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
            <label className="mb-2 block text-sm text-gray-700">Bimestre</label>
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
            <label className="mb-2 block text-sm text-gray-700">Data de hoje</label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="bg-gray-50" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-700">Resumo de presença</label>
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
              <p className="text-sm font-semibold text-green-800">
                {presentes}/{alunos.length} presentes ({percentualPresenca}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 xl:hidden">
        {alunos.map((aluno, index) => (
          <div key={aluno.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="bg-blue-100 text-blue-700">{aluno.iniciais}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{aluno.nome}</p>
                  <p className="text-sm text-gray-500">Aluno {String(index + 1).padStart(2, '0')}</p>
                </div>
              </div>

              <button
                onClick={() => togglePresenca(aluno.id)}
                className={`flex h-10 min-w-20 items-center justify-center gap-2 rounded-lg px-3 transition-all ${
                  aluno.presente
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {aluno.presente ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                <span className="text-sm font-medium">{aluno.presente ? 'Sim' : 'Não'}</span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
              <div>
                <label className="mb-2 block text-sm text-gray-700">Nota</label>
                <Input
                  type="text"
                  value={aluno.nota}
                  onChange={(e) => atualizarNota(aluno.id, e.target.value)}
                  className="bg-gray-50 text-center"
                  placeholder="0.0"
                  maxLength={4}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-700">Observações</label>
                <Input
                  type="text"
                  value={aluno.observacoes}
                  onChange={(e) => atualizarObservacoes(aluno.id, e.target.value)}
                  className="bg-gray-50"
                  placeholder="Adicione uma observação..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm xl:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="w-16 px-6 py-4 text-left text-sm font-semibold text-gray-900">#</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Aluno</th>
                <th className="w-32 px-6 py-4 text-center text-sm font-semibold text-gray-900">Presença</th>
                <th className="w-32 px-6 py-4 text-center text-sm font-semibold text-gray-900">Nota</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alunos.map((aluno, index) => (
                <tr key={aluno.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{String(index + 1).padStart(2, '0')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700">{aluno.iniciais}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900">{aluno.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => togglePresenca(aluno.id)}
                        className={`flex h-10 w-20 items-center justify-center gap-2 rounded-lg transition-all ${
                          aluno.presente
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {aluno.presente ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span className="text-sm font-medium">Sim</span>
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4" />
                            <span className="text-sm font-medium">Não</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <Input
                        type="text"
                        value={aluno.nota}
                        onChange={(e) => atualizarNota(aluno.id, e.target.value)}
                        className="w-20 bg-gray-50 text-center"
                        placeholder="0.0"
                        maxLength={4}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      type="text"
                      value={aluno.observacoes}
                      onChange={(e) => atualizarObservacoes(aluno.id, e.target.value)}
                      className="bg-gray-50"
                      placeholder="Adicione uma observação..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 text-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 text-blue-800 sm:flex-row sm:flex-wrap sm:gap-6">
            <p><span className="font-semibold">Total de alunos:</span> {alunos.length}</p>
            <p><span className="font-semibold">Presentes:</span> {presentes}</p>
            <p><span className="font-semibold">Ausentes:</span> {alunos.length - presentes}</p>
          </div>
          <p className="font-medium text-blue-700">Tudo sincronizado e salvo com segurança.</p>
        </div>
      </div>
    </div>
  );
}
