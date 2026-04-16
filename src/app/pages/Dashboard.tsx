import { Users, TrendingUp, ClipboardList, CalendarDays } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { Button } from '../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const performanceData = [
  { turma: '1º A', desempenho: 8.5 },
  { turma: '1º B', desempenho: 7.8 },
  { turma: '2º A', desempenho: 9.2 },
  { turma: '2º B', desempenho: 8.0 },
  { turma: '3º A', desempenho: 8.7 },
  { turma: '3º B', desempenho: 7.5 },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resumo do Semestre</h1>
        <p className="text-gray-600 mt-1">Visão geral do desempenho e métricas importantes</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Alunos"
          value="342"
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <MetricCard
          title="Frequência Média de Hoje"
          value="94.5%"
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <MetricCard
          title="Tarefas Pendentes de Correção"
          value="18"
          icon={ClipboardList}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-50"
        />
        <MetricCard
          title="Próximo Evento"
          value="Amanhã"
          icon={CalendarDays}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
        />
      </div>

      {/* Main Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Desempenho Geral das Turmas</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="turma" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#D1D5DB' }}
                />
                <YAxis 
                  domain={[0, 10]}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#D1D5DB' }}
                  label={{ value: 'Média', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  cursor={{ fill: '#F3F4F6' }}
                />
                <Bar 
                  dataKey="desempenho" 
                  fill="#2563EB" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Acesso Rápido</h2>
          <div className="space-y-3">
            <Button 
              className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              Fazer Chamada
            </Button>
            <Button 
              className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              Lançar Notas
            </Button>
            <Button 
              className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              Gerar Boletins
            </Button>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Atividade Recente</h3>
            <div className="space-y-3">
              <div className="text-sm">
                <p className="text-gray-900">Chamada realizada</p>
                <p className="text-gray-500 text-xs">2º A - Há 30 minutos</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-900">Notas lançadas</p>
                <p className="text-gray-500 text-xs">3º B - Há 2 horas</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-900">Relatório gerado</p>
                <p className="text-gray-500 text-xs">1º A - Ontem</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Footer */}
      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <p className="text-sm text-green-800 text-center">
          🔒 Último backup realizado há 2 horas - Conexão Segura e Criptografada
        </p>
      </div>
    </div>
  );
}
