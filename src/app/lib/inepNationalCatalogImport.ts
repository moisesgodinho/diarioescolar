import { supabase, supabaseAnonKey, supabaseUrl } from '../../lib/supabase';

export interface NationalCatalogImportProgress {
  batchSize: number;
  bytesRead: number;
  completedBatches: number;
  duplicateRowsCount: number;
  fileSize: number;
  ignoredRowsCount: number;
  importedRowsCount: number;
  parsedRowsCount: number;
  queuedRowsCount: number;
  status: string;
}

export interface NationalCatalogImportSummary {
  duplicateRowsCount: number;
  ignoredRowsCount: number;
  importedRowsCount: number;
  parsedRowsCount: number;
  totalBatches: number;
}

interface BatchCatalogRow {
  address: string | null;
  administrative_dependency: string | null;
  city: string;
  city_ibge_code: string | null;
  education_stages: string[];
  inep_code: string;
  neighborhood: string | null;
  operational_status: string | null;
  phone: string | null;
  raw_data: Record<string, unknown>;
  school_name: string;
  source_year: number | null;
  state: string;
  zone: 'Urbana' | 'Rural';
}

type CsvRecord = Record<string, string>;

type ProgressHandler = (progress: NationalCatalogImportProgress) => void;

const BATCH_SIZE = 90;
const MAX_BATCH_BYTES = 320 * 1024;
const MAX_FETCH_RETRIES = 4;
const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const textEncoder = new TextEncoder();
const HEADER_ALIASES = {
  administrativeDependency: ['dependencia administrativa', 'categoria administrativa'],
  address: ['endereco'],
  city: ['municipio'],
  differentiatedLocality: ['localidade diferenciada'],
  educationStages: ['etapas e modalidade de ensino oferecidas'],
  inepCode: ['codigo inep'],
  latitude: ['latitude'],
  longitude: ['longitude'],
  privateSchoolCategory: ['categoria escola privada'],
  publicAgreement: ['conveniada poder publico'],
  regulationAuthority: ['regulamentacao pelo conselho de educacao'],
  schoolSize: ['porte da escola'],
  phone: ['telefone'],
  restriction: ['restricao de atendimento'],
  schoolLocation: ['localizacao'],
  schoolName: ['escola'],
  state: ['uf'],
  supplementalOfferings: ['outras ofertas educacionais'],
} as const;

export async function importNationalInepCatalogCsv(
  file: File,
  onProgress?: ProgressHandler,
): Promise<NationalCatalogImportSummary> {
  await getValidAccessToken();

  const reader = file.stream().getReader();
  const decoder = new TextDecoder('utf-8');
  const seenInepCodes = new Set<string>();
  const batchRows: BatchCatalogRow[] = [];
  let queuedBytes = 0;
  let bytesRead = 0;
  let parsedRowsCount = 0;
  let ignoredRowsCount = 0;
  let duplicateRowsCount = 0;
  let importedRowsCount = 0;
  let completedBatches = 0;

  function emitProgress(status: string) {
    onProgress?.({
      batchSize: BATCH_SIZE,
      bytesRead,
      completedBatches,
      duplicateRowsCount,
      fileSize: file.size,
      ignoredRowsCount,
      importedRowsCount,
      parsedRowsCount,
      queuedRowsCount: batchRows.length,
      status: batchRows.length > 0 ? `${status} ${batchRows.length} linha(s) na fila.` : status,
    });
  }

  async function sendBatch(
    rowsToUpload: BatchCatalogRow[],
    batchNumber: number,
  ): Promise<{ importedCount?: number }> {
    for (let attempt = 1; attempt <= MAX_FETCH_RETRIES; attempt += 1) {
      let response: Response;

      try {
        const accessToken = await getValidAccessToken();

        response = await fetch(`${supabaseUrl}/functions/v1/platform-import-school-catalog-batch`, {
          body: JSON.stringify({
            batchIndex: batchNumber,
            rows: rowsToUpload,
          }),
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${accessToken}`,
          },
          method: 'POST',
        });
      } catch (error) {
        if (attempt < MAX_FETCH_RETRIES) {
          emitProgress(`Falha de rede no lote ${batchNumber}. Tentando novamente (${attempt}/${MAX_FETCH_RETRIES - 1})...`);
          await wait(600 * 2 ** (attempt - 1));
          continue;
        }

        const detail = error instanceof Error ? error.message : 'Falha de rede ou preflight.';
        throw new Error(
          `Nao foi possivel acessar a function platform-import-school-catalog-batch. ` +
            `Publique novamente com --no-verify-jwt e confirme sua sessao. Detalhe: ${detail}`,
        );
      }

      const responseText = await response.text();
      let payload: { error?: string; importedCount?: number } = {};

      if (responseText) {
        try {
          payload = JSON.parse(responseText) as { error?: string; importedCount?: number };
        } catch {
          payload = {};
        }
      }

      if (response.ok) {
        return payload;
      }

      if (attempt < MAX_FETCH_RETRIES && response.status === 401) {
        emitProgress(`Sessao expirada no lote ${batchNumber}. Renovando acesso (${attempt}/${MAX_FETCH_RETRIES - 1})...`);
        await ensureFreshSession(true);
        continue;
      }

      if (attempt < MAX_FETCH_RETRIES && RETRYABLE_STATUS_CODES.has(response.status)) {
        emitProgress(`Lote ${batchNumber} respondeu HTTP ${response.status}. Tentando novamente (${attempt}/${MAX_FETCH_RETRIES - 1})...`);
        await wait(600 * 2 ** (attempt - 1));
        continue;
      }

      throw new Error(
        payload.error ?? `Falha ao importar lote nacional do INEP (HTTP ${response.status}).`,
      );
    }

    throw new Error(`Nao foi possivel concluir o lote ${batchNumber}.`);
  }

  async function flushBatch() {
    if (batchRows.length === 0) {
      return;
    }

    const rowsToUpload = batchRows.splice(0, batchRows.length);
    queuedBytes = 0;
    const payload = await sendBatch(rowsToUpload, completedBatches + 1);

    importedRowsCount += payload.importedCount ?? rowsToUpload.length;
    completedBatches += 1;
    emitProgress(`Lote ${completedBatches} importado com sucesso.`);
  }

  const processor = createStreamingCsvProcessor(async (row) => {
    parsedRowsCount += 1;

    const mappedRow = mapCsvRowToCatalogRow(row);

    if (!mappedRow) {
      ignoredRowsCount += 1;
      return;
    }

    if (seenInepCodes.has(mappedRow.inep_code)) {
      duplicateRowsCount += 1;
      return;
    }

    seenInepCodes.add(mappedRow.inep_code);
    batchRows.push(mappedRow);
    queuedBytes += estimateRowBytes(mappedRow);

    if (batchRows.length >= BATCH_SIZE || queuedBytes >= MAX_BATCH_BYTES) {
      emitProgress(`Enviando lote ${completedBatches + 1}...`);
      await flushBatch();
    }
  });

  emitProgress('Preparando leitura do arquivo...');

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      const trailingText = decoder.decode();
      if (trailingText) {
        await processor.process(trailingText);
      }
      await processor.finish();
      break;
    }

    bytesRead += value.byteLength;
    await processor.process(decoder.decode(value, { stream: true }));
    emitProgress('Processando linhas do CSV nacional...');
  }

  emitProgress(`Enviando lote ${completedBatches + 1}...`);
  await flushBatch();
  emitProgress('Importacao nacional concluida.');

  return {
    duplicateRowsCount,
    ignoredRowsCount,
    importedRowsCount,
    parsedRowsCount,
    totalBatches: completedBatches,
  };
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function getValidAccessToken() {
  const session = await ensureFreshSession(false);

  if (!session?.access_token) {
    throw new Error('Voce precisa estar autenticado para importar a base nacional do INEP.');
  }

  return session.access_token;
}

async function ensureFreshSession(forceRefresh: boolean) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`Nao foi possivel validar a sessao atual: ${sessionError.message}`);
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const shouldRefresh =
    forceRefresh ||
    !session?.access_token ||
    (typeof session.expires_at === 'number' && session.expires_at - nowInSeconds < 180);

  if (!shouldRefresh) {
    return session;
  }

  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    throw new Error(`Sua sessao expirou durante a importacao: ${error.message}`);
  }

  if (!data.session?.access_token) {
    throw new Error('Sua sessao expirou durante a importacao. Entre novamente e retome a carga.');
  }

  return data.session;
}

function createStreamingCsvProcessor(onRow: (row: CsvRecord) => Promise<void>) {
  let delimiter: ',' | ';' | null = null;
  let headerProbe = '';
  let headers: string[] | null = null;
  let currentCell = '';
  let currentRow: string[] = [];
  let isInsideQuotes = false;

  function buildRecord(row: string[]) {
    if (!headers) {
      headers = row.map((header) => normalizeHeaderKey(header));
      return null;
    }

    return headers.reduce<CsvRecord>((record, header, index) => {
      if (header) {
        record[header] = row[index]?.trim() ?? '';
      }

      return record;
    }, {});
  }

  async function handleCompletedRow() {
    currentRow.push(currentCell);
    currentCell = '';

    const record = buildRecord(currentRow);
    currentRow = [];

    if (!record || Object.values(record).every((value) => !value.trim())) {
      return;
    }

    await onRow(record);
  }

  async function consumeText(text: string) {
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      const nextCharacter = text[index + 1];

      if (character === '"') {
        if (isInsideQuotes && nextCharacter === '"') {
          currentCell += '"';
          index += 1;
        } else {
          isInsideQuotes = !isInsideQuotes;
        }

        continue;
      }

      if (character === delimiter && !isInsideQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
        continue;
      }

      if (character === '\n' && !isInsideQuotes) {
        await handleCompletedRow();
        continue;
      }

      currentCell += character;
    }
  }

  return {
    async finish() {
      if (delimiter === null) {
        const probeText = headerProbe.trim();
        if (!probeText) {
          return;
        }

        delimiter = detectDelimiter(probeText);
        await consumeText(headerProbe);
        headerProbe = '';
      }

      if (currentCell.length > 0 || currentRow.length > 0) {
        await handleCompletedRow();
      }
    },
    async process(text: string) {
      if (!text) {
        return;
      }

      if (delimiter === null) {
        headerProbe += text;
        const newlineIndex = headerProbe.indexOf('\n');

        if (newlineIndex === -1) {
          return;
        }

        delimiter = detectDelimiter(headerProbe.slice(0, newlineIndex));
        await consumeText(headerProbe);
        headerProbe = '';
        return;
      }

      await consumeText(text);
    },
  };
}

function mapCsvRowToCatalogRow(row: CsvRecord): BatchCatalogRow | null {
  const inepCode = normalizeDigits(readValue(row, HEADER_ALIASES.inepCode));
  const schoolName = readValue(row, HEADER_ALIASES.schoolName);
  const city = cleanText(readValue(row, HEADER_ALIASES.city));
  const state = normalizeState(readValue(row, HEADER_ALIASES.state));
  const zone = normalizeZone(readValue(row, HEADER_ALIASES.schoolLocation));

  if (!inepCode || !schoolName || !city || !state || !zone) {
    return null;
  }

  return {
    address: readValue(row, HEADER_ALIASES.address) || null,
    administrative_dependency:
      readValue(row, HEADER_ALIASES.administrativeDependency) || null,
    city,
    city_ibge_code: null,
    education_stages: parseEducationStages(readValue(row, HEADER_ALIASES.educationStages)),
    inep_code: inepCode,
    neighborhood: null,
    operational_status: readValue(row, HEADER_ALIASES.restriction) || null,
    phone: normalizeDigits(readValue(row, HEADER_ALIASES.phone)) || null,
    raw_data: buildCompactRawData(row),
    school_name: schoolName,
    source_year: null,
    state,
    zone,
  };
}

function buildCompactRawData(row: CsvRecord) {
  const compact = {
    categoria_escola_privada: readValue(row, HEADER_ALIASES.privateSchoolCategory) || null,
    conveniada_poder_publico: readValue(row, HEADER_ALIASES.publicAgreement) || null,
    latitude: readValue(row, HEADER_ALIASES.latitude) || null,
    localidade_diferenciada: readValue(row, HEADER_ALIASES.differentiatedLocality) || null,
    longitude: readValue(row, HEADER_ALIASES.longitude) || null,
    outras_ofertas_educacionais: readValue(row, HEADER_ALIASES.supplementalOfferings) || null,
    porte_escola: readValue(row, HEADER_ALIASES.schoolSize) || null,
    regulamentacao_conselho_educacao: readValue(row, HEADER_ALIASES.regulationAuthority) || null,
  };

  return Object.fromEntries(
    Object.entries(compact).filter(([, value]) => typeof value === 'string' && value.trim().length > 0),
  );
}

function readValue(row: CsvRecord, aliases: readonly string[]) {
  for (const alias of aliases) {
    const value = row[normalizeHeaderKey(alias)];

    if (value) {
      return value.trim();
    }
  }

  return '';
}

function parseEducationStages(value: string) {
  if (!value) {
    return [];
  }

  return [
    ...new Set(
      value
        .split(/[;,|/]/)
        .map((stage) => cleanText(stage))
        .filter(Boolean),
    ),
  ];
}

function detectDelimiter(headerLine: string) {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;

  return semicolonCount > commaCount ? ';' : ',';
}

function normalizeState(value: string) {
  return cleanText(value).toUpperCase();
}

function normalizeZone(value: string): 'Urbana' | 'Rural' | null {
  const normalized = normalizeHeaderKey(value);

  if (!normalized) {
    return null;
  }

  if (normalized.includes('rural')) {
    return 'Rural';
  }

  if (normalized.includes('urban')) {
    return 'Urbana';
  }

  return null;
}

function normalizeDigits(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '');
}

function cleanText(value: string | null | undefined) {
  return (value ?? '')
    .replace(/\u0000/g, '')
    .replace(/\r/g, '')
    .trim();
}

function estimateRowBytes(row: BatchCatalogRow) {
  return textEncoder.encode(JSON.stringify(row)).byteLength;
}

function normalizeHeaderKey(value: string | null | undefined) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
