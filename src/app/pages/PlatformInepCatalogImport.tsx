import { type ChangeEvent } from 'react';
import {
  Database,
  FileSpreadsheet,
  LoaderCircle,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useInepCatalogImport } from '../providers/InepCatalogImportProvider';

function formatBytes(bytes: number) {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** exponent;

  return `${size.toFixed(size >= 100 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function PlatformInepCatalogImport() {
  const {
    errorMessage,
    isImporting,
    progress,
    progressPercent,
    selectedFile,
    setSelectedFile,
    startImport,
    summary,
  } = useInepCatalogImport();

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Importacao nacional
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Importacao INEP Brasil</h1>
          <p className="mt-1 max-w-3xl text-gray-600">
            Pagina separada para subir o CSV nacional do INEP. O arquivo e processado localmente
            no navegador e enviado ao Supabase em lotes menores, sem depender de um upload unico
            de 80 MB.
          </p>
          <p className="mt-3 max-w-3xl text-sm font-medium text-blue-700">
            Voce pode navegar para outras telas do sistema enquanto a importacao continua nesta aba
            do navegador.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Arquivo Selecionado"
          value={selectedFile ? formatBytes(selectedFile.size) : '0 B'}
          icon={FileSpreadsheet}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <MetricCard
          title="Linhas Processadas"
          value={progress?.parsedRowsCount ?? summary?.parsedRowsCount ?? 0}
          icon={Database}
          iconColor="text-cyan-600"
          iconBgColor="bg-cyan-50"
        />
        <MetricCard
          title="Escolas Importadas"
          value={progress?.importedRowsCount ?? summary?.importedRowsCount ?? 0}
          icon={Upload}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-50"
        />
        <MetricCard
          title="Lotes Concluidos"
          value={progress?.completedBatches ?? summary?.totalBatches ?? 0}
          icon={LoaderCircle}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
          <CardHeader className="gap-3 border-b border-gray-100 pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Upload da Base Brasil
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-gray-500">
              Use o CSV completo do Catalogo de Escolas do INEP. O sistema vai ler o arquivo por
              etapas, normalizar os dados e gravar em batches no cache escolar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              Recomendado para a carga nacional anual. O cache final fica em `school_catalog_cache`
              e depois abastece normalmente as buscas por cidade nas secretarias.
            </div>

            <div className="space-y-3">
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                disabled={isImporting}
                className="h-11 rounded-xl border-gray-200 bg-gray-50 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-900"
              />
              <p className="text-sm text-gray-500">
                {selectedFile
                  ? `${selectedFile.name} • ${formatBytes(selectedFile.size)}`
                  : 'Selecione o CSV nacional com colunas como Escola, Codigo INEP, UF, Municipio e Localizacao.'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500">
                {progress?.status ??
                  'Quando a importacao comecar, voce vai ver o progresso por leitura e por lotes enviados.'}
              </div>
              <Button
                type="button"
                onClick={startImport}
                disabled={isImporting || !selectedFile}
                className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? 'Importando base...' : 'Importar Base Brasil'}
              </Button>
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                <span>Progresso do arquivo</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                {progress
                  ? `${formatBytes(progress.bytesRead)} lidos de ${formatBytes(progress.fileSize)}`
                  : 'Nenhum processamento iniciado ainda.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
            <CardHeader className="gap-3 border-b border-gray-100 pb-6">
              <CardTitle className="text-lg font-semibold text-gray-900">Como funciona</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-500">
                Fluxo pensado para arquivo grande, com pouco risco de travar a aplicacao.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                O navegador le o CSV em streaming, sem mandar 80 MB de uma vez para o servidor.
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                Cada lote envia cerca de 90 escolas, ou menos se o payload daquele trecho crescer demais.
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                O banco faz `upsert` por `Codigo INEP`, entao a importacao pode ser repetida sem
                duplicar escolas.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-gray-200 bg-white shadow-sm">
            <CardHeader className="gap-3 border-b border-gray-100 pb-6">
              <CardTitle className="text-lg font-semibold text-gray-900">Resumo da ultima carga</CardTitle>
              <CardDescription className="text-sm leading-6 text-gray-500">
                Quando a importacao termina, o resultado consolidado aparece aqui.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                Importadas: {summary?.importedRowsCount ?? 0}
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                Ignoradas: {summary?.ignoredRowsCount ?? 0}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Duplicadas no arquivo: {summary?.duplicateRowsCount ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
