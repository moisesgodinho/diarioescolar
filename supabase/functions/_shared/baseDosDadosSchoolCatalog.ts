import { type SchoolCatalogEntry } from './schoolCatalog.ts'

export interface BaseDosDadosCatalogInput {
  city: string
  cityIbgeCode: string
  state: string
}

export interface SchoolCatalogCacheRecord {
  address: string | null
  administrative_dependency: string | null
  city: string
  city_ibge_code: string | null
  education_stages: string[]
  inep_code: string
  neighborhood: string | null
  operational_status: string | null
  phone: string | null
  raw_data: Record<string, unknown>
  school_name: string
  source_year: number | null
  state: string
  synced_at: string
  zone: 'Urbana' | 'Rural'
}

export interface BaseDosDadosCatalogResult {
  cacheRecords: SchoolCatalogCacheRecord[]
  schools: SchoolCatalogEntry[]
}

interface GoogleServiceAccountCredentials {
  client_email: string
  private_key: string
  private_key_id?: string
  token_uri?: string
}

interface BigQueryCell {
  v?: string | null
}

interface BigQueryRow {
  f?: BigQueryCell[]
}

interface BigQueryJobReference {
  jobId?: string
  projectId?: string
}

interface BigQueryQueryResponse {
  error?: {
    message?: string
  }
  errors?: Array<{ message?: string }>
  jobComplete?: boolean
  jobReference?: BigQueryJobReference
  location?: string
  pageToken?: string
  rows?: BigQueryRow[]
}

interface BigQueryConfig {
  billingProjectId: string
  credentials: GoogleServiceAccountCredentials
  location: string
  maximumBytesBilled: string | null
}

const BIGQUERY_SCOPE = 'https://www.googleapis.com/auth/bigquery.readonly'
const BIGQUERY_TOKEN_AUDIENCE = 'https://oauth2.googleapis.com/token'
const BIGQUERY_QUERY_URL = 'https://bigquery.googleapis.com/bigquery/v2/projects'
const DEFAULT_BIGQUERY_LOCATION = 'US'
const SCHOOL_CATALOG_QUERY = `
WITH latest_city_schools AS (
  SELECT
    *
  FROM
    \`basedosdados.br_inep_censo_escolar.escola\`
  WHERE
    id_municipio = @city_ibge_code
    AND sigla_uf = @state
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY id_escola
    ORDER BY ano DESC
  ) = 1
)
SELECT
  TO_JSON_STRING(school_row) AS row_json
FROM
  latest_city_schools AS school_row
ORDER BY
  id_escola
`

export function getBigQueryConfig() {
  const billingProjectId =
    Deno.env.get('BD_BIGQUERY_BILLING_PROJECT_ID')?.trim() ??
    Deno.env.get('BD_BILLING_PROJECT_ID')?.trim() ??
    null
  const credentials = readGoogleServiceAccountCredentials()

  if (!billingProjectId || !credentials) {
    return null
  }

  return {
    billingProjectId,
    credentials,
    location: Deno.env.get('BD_BIGQUERY_LOCATION')?.trim() || DEFAULT_BIGQUERY_LOCATION,
    maximumBytesBilled: Deno.env.get('BD_BIGQUERY_MAX_BYTES_BILLED')?.trim() || null,
  } satisfies BigQueryConfig
}

export async function syncCitySchoolCatalogFromBaseDosDados(
  input: BaseDosDadosCatalogInput,
) {
  const config = getBigQueryConfig()

  if (!config) {
    return null
  }

  const accessToken = await requestGoogleAccessToken(config.credentials)
  const rawRows = await querySchoolRows(accessToken, config, input)
  const syncedAt = new Date().toISOString()
  const cacheRecords = rawRows
    .map((row) => mapRowToCacheRecord(row, input, syncedAt))
    .filter((row): row is SchoolCatalogCacheRecord => row !== null)

  return {
    cacheRecords,
    schools: cacheRecords.map(mapCacheRecordToSchool),
  } satisfies BaseDosDadosCatalogResult
}

export function mapCacheRecordToSchool(row: SchoolCatalogCacheRecord): SchoolCatalogEntry {
  return {
    address: row.address,
    administrativeDependency: row.administrative_dependency,
    city: row.city,
    cityIbgeCode: row.city_ibge_code,
    educationStages: row.education_stages,
    id: `inep-${row.inep_code}`,
    inepCode: row.inep_code,
    name: row.school_name,
    neighborhood: row.neighborhood,
    operationalStatus: row.operational_status,
    phone: row.phone,
    state: row.state,
    zone: row.zone,
  }
}

function readGoogleServiceAccountCredentials() {
  const rawValue =
    Deno.env.get('BD_GOOGLE_SERVICE_ACCOUNT_JSON') ??
    Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON') ??
    null
  const rawBase64Value =
    Deno.env.get('BD_GOOGLE_SERVICE_ACCOUNT_JSON_BASE64') ??
    Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64') ??
    null

  let jsonText: string | null = rawValue?.trim() || null

  if (!jsonText && rawBase64Value?.trim()) {
    jsonText = new TextDecoder().decode(decodeBase64(rawBase64Value.trim()))
  }

  if (!jsonText) {
    return null
  }

  const parsed = JSON.parse(jsonText) as Partial<GoogleServiceAccountCredentials>

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('Google service account JSON is missing client_email or private_key.')
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
    private_key_id: parsed.private_key_id,
    token_uri: parsed.token_uri,
  } satisfies GoogleServiceAccountCredentials
}

async function requestGoogleAccessToken(credentials: GoogleServiceAccountCredentials) {
  const jwt = await createServiceAccountJwt(credentials)
  const response = await fetch(credentials.token_uri ?? BIGQUERY_TOKEN_AUDIENCE, {
    body: new URLSearchParams({
      assertion: jwt,
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  })

  const payload = (await response.json()) as {
    access_token?: string
    error?: string
    error_description?: string
  }

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? 'Unable to obtain Google access token.')
  }

  return payload.access_token
}

async function createServiceAccountJwt(credentials: GoogleServiceAccountCredentials) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const expiresAt = issuedAt + 3600
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    ...(credentials.private_key_id ? { kid: credentials.private_key_id } : {}),
  }
  const claimSet = {
    aud: BIGQUERY_TOKEN_AUDIENCE,
    exp: expiresAt,
    iat: issuedAt,
    iss: credentials.client_email,
    scope: BIGQUERY_SCOPE,
  }

  const encodedHeader = encodeBase64Url(new TextEncoder().encode(JSON.stringify(header)))
  const encodedClaimSet = encodeBase64Url(new TextEncoder().encode(JSON.stringify(claimSet)))
  const unsignedToken = `${encodedHeader}.${encodedClaimSet}`
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(credentials.private_key),
    {
      hash: 'SHA-256',
      name: 'RSASSA-PKCS1-v1_5',
    },
    false,
    ['sign'],
  )
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken),
  )
  const signature = encodeBase64Url(new Uint8Array(signatureBuffer))

  return `${unsignedToken}.${signature}`
}

async function querySchoolRows(
  accessToken: string,
  config: BigQueryConfig,
  input: BaseDosDadosCatalogInput,
) {
  const initialResponse = await fetch(
    `${BIGQUERY_QUERY_URL}/${config.billingProjectId}/queries`,
    {
      body: JSON.stringify({
        location: config.location,
        maximumBytesBilled: config.maximumBytesBilled ?? undefined,
        parameterMode: 'NAMED',
        query: SCHOOL_CATALOG_QUERY,
        queryParameters: [
          {
            name: 'city_ibge_code',
            parameterType: { type: 'STRING' },
            parameterValue: { value: input.cityIbgeCode },
          },
          {
            name: 'state',
            parameterType: { type: 'STRING' },
            parameterValue: { value: input.state },
          },
        ],
        requestId: crypto.randomUUID(),
        timeoutMs: 60000,
        useLegacySql: false,
        useQueryCache: true,
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  )
  const initialPayload = (await initialResponse.json()) as BigQueryQueryResponse

  if (!initialResponse.ok) {
    throw new Error(getBigQueryErrorMessage(initialPayload))
  }

  const completedPayload = await waitForBigQueryResults(accessToken, config, initialPayload)
  const rows = [...extractRowJsonStrings(completedPayload)]
  let pageToken = completedPayload.pageToken ?? null

  while (pageToken) {
    const nextPayload = await fetchQueryResultsPage(accessToken, config, completedPayload, pageToken)
    rows.push(...extractRowJsonStrings(nextPayload))
    pageToken = nextPayload.pageToken ?? null
  }

  return rows.map((rowText) => JSON.parse(rowText) as Record<string, unknown>)
}

async function waitForBigQueryResults(
  accessToken: string,
  config: BigQueryConfig,
  payload: BigQueryQueryResponse,
) {
  if (payload.jobComplete !== false) {
    return payload
  }

  if (!payload.jobReference?.jobId) {
    throw new Error('BigQuery returned an incomplete job without a job reference.')
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await delay(1200)
    const polledPayload = await fetchQueryResultsPage(accessToken, config, payload, null)

    if (polledPayload.jobComplete !== false) {
      return polledPayload
    }
  }

  throw new Error('BigQuery query did not complete in time for this municipality.')
}

async function fetchQueryResultsPage(
  accessToken: string,
  config: BigQueryConfig,
  payload: BigQueryQueryResponse,
  pageToken: string | null,
) {
  const jobId = payload.jobReference?.jobId
  const projectId = payload.jobReference?.projectId ?? config.billingProjectId

  if (!jobId) {
    throw new Error('Missing BigQuery job reference for result pagination.')
  }

  const url = new URL(`${BIGQUERY_QUERY_URL}/${projectId}/queries/${jobId}`)
  url.searchParams.set('location', payload.location ?? config.location)
  url.searchParams.set('maxResults', '1000')

  if (pageToken) {
    url.searchParams.set('pageToken', pageToken)
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const nextPayload = (await response.json()) as BigQueryQueryResponse

  if (!response.ok) {
    throw new Error(getBigQueryErrorMessage(nextPayload))
  }

  return nextPayload
}

function extractRowJsonStrings(payload: BigQueryQueryResponse) {
  const rows = payload.rows ?? []

  return rows
    .map((row) => row.f?.[0]?.v ?? null)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
}

function getBigQueryErrorMessage(payload: BigQueryQueryResponse) {
  return (
    payload.error?.message ??
    payload.errors?.map((entry) => entry.message).filter(Boolean).join(' | ') ??
    'BigQuery request failed.'
  )
}

function mapRowToCacheRecord(
  row: Record<string, unknown>,
  input: BaseDosDadosCatalogInput,
  syncedAt: string,
) {
  const inepCode = normalizeDigits(readString(row, 'id_escola', 'inep_code', 'codigo_inep'))
  const schoolName = readString(row, 'nome', 'nome_escola', 'nome_entidade')
  const zone = readZone(row)

  if (!inepCode || !schoolName || !zone) {
    return null
  }

  return {
    address: readString(row, 'endereco', 'logradouro', 'endereco_escola') || null,
    administrative_dependency:
      readString(row, 'dependencia_administrativa', 'rede', 'categoria_administrativa') || null,
    city: input.city,
    city_ibge_code: input.cityIbgeCode,
    education_stages: readEducationStages(row),
    inep_code: inepCode,
    neighborhood: readString(row, 'bairro', 'bairro_escola') || null,
    operational_status:
      readString(row, 'situacao_funcionamento', 'funcionamento', 'status_funcionamento') || null,
    phone: normalizePhone(readString(row, 'telefone', 'telefone_escola')) || null,
    raw_data: row,
    school_name: schoolName,
    source_year: readNumber(row, 'ano'),
    state: input.state,
    synced_at: syncedAt,
    zone,
  } satisfies SchoolCatalogCacheRecord
}

function readEducationStages(row: Record<string, unknown>) {
  const explicitStages = readDelimitedStages(
    row,
    'etapas_ensino',
    'etapas_modalidades',
    'etapas_modalidades_ofertadas',
    'modalidades_ensino',
  )

  if (explicitStages.length > 0) {
    return explicitStages
  }

  const stages = [
    ...readBooleanStage(row, ['educacao_infantil', 'indicador_educacao_infantil'], 'Educacao Infantil'),
    ...readBooleanStage(
      row,
      [
        'ensino_fundamental_anos_iniciais',
        'indicador_ensino_fundamental_anos_iniciais',
        'anos_iniciais',
      ],
      'Anos Iniciais',
    ),
    ...readBooleanStage(
      row,
      [
        'ensino_fundamental_anos_finais',
        'indicador_ensino_fundamental_anos_finais',
        'anos_finais',
      ],
      'Anos Finais',
    ),
    ...readBooleanStage(
      row,
      ['ensino_medio', 'indicador_ensino_medio'],
      'Ensino Medio',
    ),
    ...readBooleanStage(
      row,
      ['educacao_profissional', 'indicador_educacao_profissional'],
      'Educacao Profissional',
    ),
    ...readBooleanStage(row, ['eja', 'indicador_eja'], 'EJA'),
    ...readBooleanStage(row, ['ead', 'indicador_ead'], 'EaD'),
  ]

  return [...new Set(stages)]
}

function readBooleanStage(
  row: Record<string, unknown>,
  keys: string[],
  label: string,
) {
  for (const key of keys) {
    if (isTruthyIndicator(row[key])) {
      return [label]
    }
  }

  return []
}

function readDelimitedStages(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key]

    if (typeof value !== 'string' || !value.trim()) {
      continue
    }

    const stages = value
      .split(/[;,/|]/)
      .map((entry) => entry.trim())
      .filter(Boolean)

    if (stages.length > 0) {
      return stages
    }
  }

  return []
}

function readZone(row: Record<string, unknown>) {
  const value =
    row.localizacao ??
    row.tipo_localizacao ??
    row.localizacao_escola ??
    row.tipo_localizacao_escola ??
    null

  if (typeof value === 'number') {
    return value === 2 ? 'Rural' : value === 1 ? 'Urbana' : null
  }

  if (typeof value === 'string') {
    const normalized = normalizeText(value)

    if (normalized === '2' || normalized.includes('rural')) {
      return 'Rural'
    }

    if (normalized === '1' || normalized.includes('urb')) {
      return 'Urbana'
    }
  }

  return null
}

function readString(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    if (typeof value === 'number') {
      return String(value)
    }
  }

  return ''
}

function readNumber(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value.trim())

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

function isTruthyIndicator(value: unknown) {
  if (value === true) {
    return true
  }

  if (typeof value === 'number') {
    return value === 1
  }

  if (typeof value !== 'string') {
    return false
  }

  const normalized = normalizeText(value)

  return normalized === '1' || normalized === 'true' || normalized === 'sim' || normalized === 's'
}

function normalizeDigits(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '')
}

function normalizePhone(value: string) {
  const digits = normalizeDigits(value)
  return digits || ''
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function pemToArrayBuffer(pem: string) {
  const normalized = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '')

  return decodeBase64(normalized).buffer
}

function decodeBase64(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4 || 4)) % 4)
  const binary = atob(`${normalized}${padding}`)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = ''

  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
