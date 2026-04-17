import {
  getCatalogSchoolsForSecretariat,
  type EducationSecretariat,
  type SchoolCatalogEntry,
} from './platformRegistry';
import { supabaseAnonKey, supabaseUrl } from '../../lib/supabase';

export interface SchoolCatalogLoadResult {
  advisory: string | null;
  sourceLabel: string;
  sourceType: 'local' | 'remote';
  schools: SchoolCatalogEntry[];
}

interface RemoteCatalogPayload {
  advisory?: string | null;
  schools?: SchoolCatalogEntry[];
  sourceLabel?: string;
  sourceType?: 'local' | 'remote';
}

const configuredSyncUrl = import.meta.env.VITE_BD_CATALOG_SYNC_URL?.trim();

interface CatalogLookupQuery {
  city: string;
  ibgeCode?: string | null;
  state: string;
}

async function requestSupabaseFunction(
  query: CatalogLookupQuery,
) {
  return fetch(`${supabaseUrl}/functions/v1/platform-school-catalog`, {
    body: JSON.stringify(query),
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
    },
    method: 'POST',
  });
}

function getSchoolsFromPayload(payload: RemoteCatalogPayload | SchoolCatalogEntry[] | null | undefined) {
  if (!payload) {
    return [];
  }

  return Array.isArray(payload) ? payload : payload.schools ?? [];
}

function tryParseRemotePayload(responseText: string) {
  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as RemoteCatalogPayload & { error?: string };
  } catch {
    return null;
  }
}

async function loadFromConfiguredEndpoint(
  query: CatalogLookupQuery,
): Promise<SchoolCatalogLoadResult> {
  const url = new URL(configuredSyncUrl!);
  url.searchParams.set('city', query.city);
  url.searchParams.set('state', query.state);

  if (query.ibgeCode) {
    url.searchParams.set('ibge_code', query.ibgeCode);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Falha ao consultar o catalogo remoto.');
  }

  const payload = (await response.json()) as RemoteCatalogPayload | SchoolCatalogEntry[];

  return {
    advisory:
      Array.isArray(payload)
        ? 'Fonte externa configurada. O catalogo retornou pela sua integracao server-side.'
        : payload.advisory ??
          'Fonte externa configurada. O catalogo retornou pela sua integracao server-side.',
    sourceLabel: Array.isArray(payload)
      ? 'Sincronizacao externa'
      : payload.sourceLabel ?? 'Sincronizacao externa',
    sourceType: Array.isArray(payload) ? 'remote' : payload.sourceType ?? 'remote',
    schools: getSchoolsFromPayload(payload),
  };
}

async function loadFromSupabaseFunction(
  query: CatalogLookupQuery,
): Promise<SchoolCatalogLoadResult> {
  const response = await requestSupabaseFunction(query);

  const responseText = await response.text();
  const parsedPayload = tryParseRemotePayload(responseText);

  if (!response.ok) {
    const detail =
      parsedPayload && 'error' in parsedPayload && parsedPayload.error
        ? parsedPayload.error
        : `HTTP ${response.status}`;
    throw new Error(detail);
  }

  return {
    advisory:
      parsedPayload?.advisory ??
      'Catalogo atendido pela function do Supabase. Configure a sincronizacao externa quando quiser alimentar essa rota com a Base dos Dados.',
    sourceLabel: parsedPayload?.sourceLabel ?? 'Catalogo Supabase',
    sourceType: parsedPayload?.sourceType === 'local' ? 'local' : 'remote',
    schools: getSchoolsFromPayload(parsedPayload),
  };
}

export async function loadSchoolCatalogForSecretariat(
  secretariat: EducationSecretariat,
  localCatalog: SchoolCatalogEntry[],
): Promise<SchoolCatalogLoadResult> {
  const query: CatalogLookupQuery = {
    city: secretariat.city,
    ibgeCode: secretariat.cityIbgeCode,
    state: secretariat.state,
  };

  if (configuredSyncUrl) {
    try {
      return await loadFromConfiguredEndpoint(query);
    } catch {
      try {
        const fallbackFunctionResult = await loadFromSupabaseFunction(query);

        return {
          ...fallbackFunctionResult,
          advisory:
            'A URL externa configurada nao respondeu agora. O sistema usou a function do Supabase como contingencia.',
          sourceLabel: 'Supabase (contingencia)',
        };
      } catch (functionError) {
        const fallbackReason =
          functionError instanceof Error ? functionError.message : 'Erro nao identificado';
        return {
          advisory:
            `Nao foi possivel consultar nem a URL externa nem a function do Supabase agora (${fallbackReason}). Mostrando a base local como fallback.`,
          sourceLabel: 'Fallback local',
          sourceType: 'local',
          schools: getCatalogSchoolsForSecretariat(secretariat, localCatalog),
        };
      }
    }
  }

  try {
    return await loadFromSupabaseFunction(query);
  } catch (error) {
    const fallbackReason = error instanceof Error ? error.message : 'Erro nao identificado';
    return {
      advisory:
        `Nao foi possivel consultar a function do Supabase agora (${fallbackReason}). Verifique se platform-school-catalog foi publicada. Mostrando a base local como fallback.`,
      sourceLabel: 'Fallback local',
      sourceType: 'local',
      schools: getCatalogSchoolsForSecretariat(secretariat, localCatalog),
    };
  }
}
