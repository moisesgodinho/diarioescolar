import { supabase, supabaseAnonKey, supabaseUrl } from '../../lib/supabase';
import type { EducationSecretariat } from './platformRegistry';

interface ImportSchoolCatalogResponse {
  duplicateRowsCount: number;
  fileName: string | null;
  ignoredRowsCount: number;
  importedCount: number;
  matchedRowsCount: number;
  totalRowsCount: number;
}

export async function importInepSchoolCatalogCsv(
  file: File,
  secretariat: EducationSecretariat,
) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`Nao foi possivel validar a sessao atual: ${sessionError.message}`);
  }

  if (!session?.access_token) {
    throw new Error('Voce precisa estar autenticado para importar o catalogo do INEP.');
  }

  const csvText = await file.text();
  const response = await fetch(`${supabaseUrl}/functions/v1/platform-import-school-catalog`, {
    body: JSON.stringify({
      city: secretariat.city,
      csvText,
      fileName: file.name,
      ibgeCode: secretariat.cityIbgeCode,
      state: secretariat.state,
    }),
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
    method: 'POST',
  });

  const payload = (await response.json()) as ImportSchoolCatalogResponse & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Falha ao importar o CSV do INEP (HTTP ${response.status}).`);
  }

  return payload;
}
