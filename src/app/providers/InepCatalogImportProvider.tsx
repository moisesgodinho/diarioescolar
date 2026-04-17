import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  importNationalInepCatalogCsv,
  type NationalCatalogImportProgress,
  type NationalCatalogImportSummary,
} from '../lib/inepNationalCatalogImport';

interface InepCatalogImportContextValue {
  errorMessage: string | null;
  isImporting: boolean;
  progress: NationalCatalogImportProgress | null;
  progressPercent: number;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  startImport: () => Promise<void>;
  summary: NationalCatalogImportSummary | null;
}

const InepCatalogImportContext = createContext<InepCatalogImportContextValue | undefined>(undefined);

export function InepCatalogImportProvider({ children }: { children: ReactNode }) {
  const [selectedFile, setSelectedFileState] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<NationalCatalogImportProgress | null>(null);
  const [summary, setSummary] = useState<NationalCatalogImportSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function setSelectedFile(file: File | null) {
    if (isImporting) {
      return;
    }

    setSelectedFileState(file);
    setSummary(null);
    setProgress(null);
    setErrorMessage(null);
  }

  async function startImport() {
    if (!selectedFile) {
      toast.error('Escolha o CSV nacional do INEP antes de iniciar.');
      return;
    }

    if (isImporting) {
      return;
    }

    setIsImporting(true);
    setSummary(null);
    setErrorMessage(null);

    try {
      const result = await importNationalInepCatalogCsv(selectedFile, setProgress);
      setSummary(result);
      toast.success('Base nacional do INEP importada com sucesso.', {
        description: `${result.importedRowsCount} escolas atualizadas em ${result.totalBatches} lote(s).`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel importar a base nacional do INEP.';
      setErrorMessage(message);
      toast.error('Falha na importacao nacional do INEP.', {
        description: message,
      });
    } finally {
      setIsImporting(false);
    }
  }

  useEffect(() => {
    if (!isImporting) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = 'A importacao nacional do INEP ainda esta em andamento.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isImporting]);

  const progressPercent = useMemo(() => {
    if (!progress?.fileSize) {
      return 0;
    }

    return Math.max(1, Math.min(100, Math.round((progress.bytesRead / progress.fileSize) * 100)));
  }, [progress]);

  return (
    <InepCatalogImportContext.Provider
      value={{
        errorMessage,
        isImporting,
        progress,
        progressPercent,
        selectedFile,
        setSelectedFile,
        startImport,
        summary,
      }}
    >
      {children}
    </InepCatalogImportContext.Provider>
  );
}

export function useInepCatalogImport() {
  const context = useContext(InepCatalogImportContext);

  if (!context) {
    throw new Error('useInepCatalogImport must be used within an InepCatalogImportProvider');
  }

  return context;
}
