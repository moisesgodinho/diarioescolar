import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  getBigQueryConfig,
  mapCacheRecordToSchool,
  syncCitySchoolCatalogFromBaseDosDados,
  type SchoolCatalogCacheRecord,
} from '../_shared/baseDosDadosSchoolCatalog.ts'
import {
  filterSchoolCatalog,
  parseCatalogPayload,
  type SchoolCatalogEntry,
} from '../_shared/schoolCatalog.ts'

interface CatalogRequestPayload {
  city?: string
  forceRefresh?: boolean
  ibgeCode?: string | null
  state?: string
}

interface CatalogResponseBody {
  advisory: string | null
  schools: SchoolCatalogEntry[]
  sourceLabel: string
  sourceType: 'remote' | 'seed'
}

interface CacheLookupInput {
  city: string
  ibgeCode?: string | null
  state: string
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

function getOptionalEnv(...names: string[]) {
  for (const name of names) {
    const value = Deno.env.get(name)?.trim()

    if (value) {
      return value
    }
  }

  return null
}

function normalizeDigits(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '')
}

function normalizeComparableText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function pickCitySearchToken(city: string) {
  const tokens = city
    .trim()
    .split(/[\s/-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)

  const preferredToken =
    tokens
      .filter((token) => normalizeComparableText(token) === token.toLowerCase())
      .sort((left, right) => right.length - left.length)[0] ??
    tokens.sort((left, right) => right.length - left.length)[0] ??
    null

  return preferredToken
}

function getCacheMaxAgeHours() {
  const rawValue = Deno.env.get('SCHOOL_CATALOG_CACHE_MAX_AGE_HOURS')?.trim()

  if (!rawValue) {
    return 24 * 7
  }

  const parsedValue = Number(rawValue)
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 24 * 7
}

function createServiceRoleClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function getMostRecentSync(rows: SchoolCatalogCacheRecord[]) {
  const timestamps = rows
    .map((row) => Date.parse(row.synced_at))
    .filter((value) => Number.isFinite(value))

  if (timestamps.length === 0) {
    return null
  }

  return new Date(Math.max(...timestamps))
}

function isCacheFresh(rows: SchoolCatalogCacheRecord[]) {
  const mostRecentSync = getMostRecentSync(rows)

  if (!mostRecentSync) {
    return false
  }

  const maxAgeMs = getCacheMaxAgeHours() * 60 * 60 * 1000
  return Date.now() - mostRecentSync.getTime() <= maxAgeMs
}

function toCacheResponse(
  rows: SchoolCatalogCacheRecord[],
  advisory: string,
  sourceLabel: string,
): CatalogResponseBody {
  return {
    advisory,
    schools: rows.map(mapCacheRecordToSchool),
    sourceLabel,
    sourceType: 'remote',
  }
}

async function loadCachedCatalog(
  input: CacheLookupInput,
): Promise<SchoolCatalogCacheRecord[]> {
  const serviceRoleClient = createServiceRoleClient()

  if (!serviceRoleClient) {
    return []
  }

  const selectClause =
    'address, administrative_dependency, city, city_ibge_code, education_stages, inep_code, neighborhood, operational_status, phone, raw_data, school_name, source_year, state, synced_at, zone'

  if (input.ibgeCode) {
    const { data: rowsByIbge, error: ibgeError } = await serviceRoleClient
      .from('school_catalog_cache')
      .select(selectClause)
      .eq('city_ibge_code', input.ibgeCode)
      .order('school_name')

    if (ibgeError) {
      throw new Error(ibgeError.message)
    }

    if ((rowsByIbge ?? []).length > 0) {
      return (rowsByIbge ?? []) as SchoolCatalogCacheRecord[]
    }
  }

  const { data: rowsByCity, error: cityError } = await serviceRoleClient
    .from('school_catalog_cache')
    .select(selectClause)
    .eq('city', input.city)
    .eq('state', input.state)
    .order('school_name')

  if (cityError) {
    throw new Error(cityError.message)
  }

  if ((rowsByCity ?? []).length > 0) {
    return (rowsByCity ?? []) as SchoolCatalogCacheRecord[]
  }

  const citySearchToken = pickCitySearchToken(input.city)
  let normalizedCityQuery = serviceRoleClient
    .from('school_catalog_cache')
    .select(selectClause)
    .eq('state', input.state)
    .limit(2000)

  if (citySearchToken) {
    normalizedCityQuery = normalizedCityQuery.ilike('city', `%${citySearchToken}%`)
  }

  const { data: fallbackRowsByState, error: fallbackStateError } = await normalizedCityQuery.order('school_name')

  if (fallbackStateError) {
    throw new Error(fallbackStateError.message)
  }

  const comparableCity = normalizeComparableText(input.city)

  return ((fallbackRowsByState ?? []) as SchoolCatalogCacheRecord[]).filter(
    (row) => normalizeComparableText(row.city) === comparableCity,
  )
}

async function replaceCachedCatalog(
  input: Required<Pick<CatalogRequestPayload, 'city' | 'state'>> & { ibgeCode?: string | null },
  rows: SchoolCatalogCacheRecord[],
) {
  const serviceRoleClient = createServiceRoleClient()

  if (!serviceRoleClient) {
    return
  }

  if (rows.length === 0) {
    return
  }

  const { error: upsertError } = await serviceRoleClient.from('school_catalog_cache').upsert(rows, {
    onConflict: 'inep_code',
  })

  if (upsertError) {
    throw new Error(upsertError.message)
  }

  const retainedCodes = rows.map((row) => row.inep_code)

  if (retainedCodes.length === 0) {
    return
  }

  const quotedCodes = retainedCodes.map((code) => `"${code}"`).join(',')
  let deleteQuery = serviceRoleClient
    .from('school_catalog_cache')
    .delete()

  if (input.ibgeCode) {
    deleteQuery = deleteQuery.eq('city_ibge_code', input.ibgeCode)
  } else {
    deleteQuery = deleteQuery.eq('city', input.city).eq('state', input.state)
  }

  const { error: deleteError } = await deleteQuery.not('inep_code', 'in', `(${quotedCodes})`)

  if (deleteError) {
    throw new Error(deleteError.message)
  }
}

async function parsePayload(req: Request): Promise<CatalogRequestPayload> {
  const contentType = req.headers.get('Content-Type') ?? ''

  if (contentType.includes('application/json')) {
    return (await req.json()) as CatalogRequestPayload
  }

  return {}
}

async function loadRemoteCatalog(payload: Required<Pick<CatalogRequestPayload, 'city' | 'state'>> & {
  ibgeCode?: string | null
}): Promise<CatalogResponseBody | null> {
  const syncUrl = getOptionalEnv('BD_CATALOG_SYNC_URL', 'BD_SCHOOL_CATALOG_SYNC_URL')

  if (!syncUrl) {
    return null
  }

  const url = new URL(syncUrl)
  url.searchParams.set('city', payload.city)
  url.searchParams.set('state', payload.state)

  const normalizedIbgeCode = normalizeDigits(payload.ibgeCode)
  if (normalizedIbgeCode) {
    url.searchParams.set('ibge_code', normalizedIbgeCode)
  }

  const authToken = getOptionalEnv('BD_CATALOG_SYNC_TOKEN', 'BD_SCHOOL_CATALOG_SYNC_TOKEN')
  const response = await fetch(url.toString(), {
    headers: authToken
      ? {
          Authorization: `Bearer ${authToken}`,
        }
      : undefined,
  })

  if (!response.ok) {
    throw new Error(`Catalog sync returned status ${response.status}`)
  }

  const schools = parseCatalogPayload(await response.json())

  return {
    advisory:
      'Catalogo atendido pela function do Supabase usando a sua sincronizacao server-side.',
    schools,
    sourceLabel: 'Base sincronizada',
    sourceType: 'remote',
  }
}

async function loadRealCatalogFromBaseDosDados(payload: Required<Pick<CatalogRequestPayload, 'city' | 'state'>> & {
  ibgeCode?: string | null
}): Promise<CatalogResponseBody | null> {
  if (!payload.ibgeCode || !getBigQueryConfig()) {
    return null
  }

  const syncedCatalog = await syncCitySchoolCatalogFromBaseDosDados({
    city: payload.city,
    cityIbgeCode: payload.ibgeCode,
    state: payload.state,
  })

  if (!syncedCatalog || syncedCatalog.cacheRecords.length === 0) {
    return null
  }

  await replaceCachedCatalog(
    {
      city: payload.city,
      ibgeCode: payload.ibgeCode,
      state: payload.state,
    },
    syncedCatalog.cacheRecords,
  )

  return {
    advisory:
      'Catalogo sincronizado em tempo real da Base dos Dados e salvo no cache do Supabase.',
    schools: syncedCatalog.schools,
    sourceLabel: 'Base dos Dados',
    sourceType: 'remote',
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const payload = await parsePayload(req)
    const city = payload.city?.trim()
    const forceRefresh = payload.forceRefresh === true
    const state = payload.state?.trim().toUpperCase()
    const ibgeCode = normalizeDigits(payload.ibgeCode)

    if (!city) {
      return jsonResponse({ error: 'City is required.' }, 400)
    }

    if (!state) {
      return jsonResponse({ error: 'State is required.' }, 400)
    }

    let cachedCatalog: SchoolCatalogCacheRecord[] = []
    let cacheLoadError: string | null = null

    try {
      cachedCatalog = await loadCachedCatalog({ city, ibgeCode, state })
    } catch (error) {
      cacheLoadError = error instanceof Error ? error.message : 'Unexpected cache error'
    }

    if (!forceRefresh && cachedCatalog.length > 0 && isCacheFresh(cachedCatalog)) {
      return jsonResponse(
        toCacheResponse(
          cachedCatalog,
          'Catalogo atendido pelo cache sincronizado da Base dos Dados.',
          'Base dos Dados (cache)',
        ),
      )
    }

    try {
      const realCatalog = await loadRealCatalogFromBaseDosDados({ city, ibgeCode, state })

      if (realCatalog) {
        return jsonResponse(realCatalog)
      }
    } catch (syncError) {
      const syncMessage =
        syncError instanceof Error ? syncError.message : 'Unexpected Base dos Dados sync error'

      if (cachedCatalog.length > 0) {
        return jsonResponse(
          toCacheResponse(
            cachedCatalog,
            `A sincronizacao em tempo real da Base dos Dados falhou agora (${syncMessage}). Mostrando o ultimo cache salvo no Supabase.`,
            'Base dos Dados (cache)',
          ),
        )
      }
    }

    try {
      const remoteCatalog = await loadRemoteCatalog({ city, ibgeCode, state })

      if (remoteCatalog) {
        return jsonResponse(remoteCatalog)
      }
    } catch (remoteError) {
      if (cachedCatalog.length > 0) {
        const remoteMessage =
          remoteError instanceof Error ? remoteError.message : 'Unexpected catalog sync error'

        return jsonResponse(
          toCacheResponse(
            cachedCatalog,
            `A sincronizacao externa nao respondeu agora (${remoteMessage}). Mostrando o ultimo cache salvo no Supabase.`,
            'Base dos Dados (cache)',
          ),
        )
      }

      const fallbackCatalog = filterSchoolCatalog({ city, cityIbgeCode: ibgeCode, state })
      const remoteMessage =
        remoteError instanceof Error ? remoteError.message : 'Unexpected catalog sync error'

      return jsonResponse({
        advisory:
          'A sincronizacao externa nao respondeu agora. A function do Supabase serviu a base homologada de contingencia.',
        fallbackReason: remoteMessage,
        schools: fallbackCatalog,
        sourceLabel: 'Catalogo Supabase (contingencia)',
        sourceType: 'seed',
      })
    }

    if (cachedCatalog.length > 0) {
      return jsonResponse(
        toCacheResponse(
          cachedCatalog,
          'Mostrando o ultimo cache salvo no Supabase para esta cidade.',
          'Base dos Dados (cache)',
        ),
      )
    }

    return jsonResponse({
      advisory:
        cacheLoadError
          ? `Catalogo servido pela function do Supabase com base homologada. O cache local ainda nao esta disponivel (${cacheLoadError}).`
          : 'Catalogo servido pela function do Supabase com base homologada. Configure a sincronizacao real da Base dos Dados para substituir este fallback.',
      schools: filterSchoolCatalog({ city, cityIbgeCode: ibgeCode, state }),
      sourceLabel: 'Catalogo Supabase',
      sourceType: 'seed',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return jsonResponse({ error: message }, 500)
  }
})
