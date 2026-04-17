import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface BatchCatalogRow {
  address?: string | null
  administrative_dependency?: string | null
  city?: string | null
  city_ibge_code?: string | null
  education_stages?: string[] | null
  inep_code?: string | null
  neighborhood?: string | null
  operational_status?: string | null
  phone?: string | null
  raw_data?: Record<string, unknown> | null
  school_name?: string | null
  source_year?: number | null
  state?: string | null
  zone?: string | null
}

interface ImportBatchPayload {
  batchIndex?: number
  rows?: BatchCatalogRow[]
  totalBatches?: number
}

const MAX_BATCH_SIZE = 400

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

function normalizeDigits(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '')
}

function cleanText(value: string | null | undefined) {
  return (value ?? '').trim()
}

function normalizeComparableText(value: string | null | undefined) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function normalizeState(value: string | null | undefined) {
  return cleanText(value).toUpperCase()
}

function normalizeZone(value: string | null | undefined) {
  const normalized = normalizeComparableText(value)

  if (!normalized) {
    return null
  }

  if (normalized.includes('rural')) {
    return 'Rural'
  }

  if (normalized.includes('urban')) {
    return 'Urbana'
  }

  return null
}

function normalizeStages(value: string[] | null | undefined) {
  return [...new Set(
    (value ?? [])
      .filter((stage): stage is string => typeof stage === 'string')
      .map((stage) => cleanText(stage))
      .filter(Boolean),
  )]
}

function sanitizeRow(row: BatchCatalogRow) {
  const inepCode = normalizeDigits(row.inep_code)
  const schoolName = cleanText(row.school_name)
  const city = cleanText(row.city)
  const state = normalizeState(row.state)
  const zone = normalizeZone(row.zone)

  if (!inepCode || !schoolName || !city || !state || !zone) {
    return null
  }

  return {
    address: cleanText(row.address) || null,
    administrative_dependency: cleanText(row.administrative_dependency) || null,
    city,
    city_ibge_code: normalizeDigits(row.city_ibge_code) || null,
    education_stages: normalizeStages(row.education_stages),
    inep_code: inepCode,
    neighborhood: cleanText(row.neighborhood) || null,
    operational_status: cleanText(row.operational_status) || null,
    phone: normalizeDigits(row.phone) || null,
    raw_data:
      row.raw_data && typeof row.raw_data === 'object' && !Array.isArray(row.raw_data)
        ? row.raw_data
        : {},
    school_name: schoolName,
    source_year:
      typeof row.source_year === 'number' && Number.isFinite(row.source_year)
        ? row.source_year
        : null,
    state,
    synced_at: new Date().toISOString(),
    zone,
  }
}

async function parsePayload(req: Request): Promise<ImportBatchPayload> {
  const contentType = req.headers.get('Content-Type') ?? ''

  if (!contentType.includes('application/json')) {
    return {}
  }

  return (await req.json()) as ImportBatchPayload
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    return jsonResponse({ error: 'Missing authorization header' }, 401)
  }

  try {
    const payload = await parsePayload(req)
    const incomingRows = Array.isArray(payload.rows) ? payload.rows : []

    if (incomingRows.length === 0) {
      return jsonResponse({ error: 'At least one row is required.' }, 400)
    }

    if (incomingRows.length > MAX_BATCH_SIZE) {
      return jsonResponse(
        { error: `Batch size exceeds the maximum of ${MAX_BATCH_SIZE} rows.` },
        400,
      )
    }

    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const publishableKey =
      Deno.env.get('SB_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')

    if (!publishableKey) {
      throw new Error('Missing publishable key for function user context')
    }

    const userClient = createClient(supabaseUrl, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const serviceRoleClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Invalid or expired session.' }, 401)
    }

    const { data: platformStaffRow, error: platformStaffError } = await userClient
      .from('platform_staff')
      .select('role, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (platformStaffError) {
      return jsonResponse({ error: platformStaffError.message }, 400)
    }

    if (!platformStaffRow || platformStaffRow.status !== 'active') {
      return jsonResponse({ error: 'You do not have platform access.' }, 403)
    }

    if (!['owner', 'education_secretary', 'admin'].includes(platformStaffRow.role)) {
      return jsonResponse({ error: 'Your current platform role cannot import national school catalogs.' }, 403)
    }

    const sanitizedRows = incomingRows
      .map((row) => sanitizeRow(row))
      .filter((row): row is NonNullable<ReturnType<typeof sanitizeRow>> => row !== null)

    if (sanitizedRows.length === 0) {
      return jsonResponse({ error: 'No valid rows were found in this batch.' }, 400)
    }

    const { error: upsertError } = await serviceRoleClient
      .from('school_catalog_cache')
      .upsert(sanitizedRows, {
        onConflict: 'inep_code',
      })

    if (upsertError) {
      return jsonResponse({ error: upsertError.message }, 400)
    }

    return jsonResponse({
      batchIndex: payload.batchIndex ?? null,
      importedCount: sanitizedRows.length,
      sourceLabel: 'CSV nacional do INEP',
      totalBatches: payload.totalBatches ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return jsonResponse({ error: message }, 500)
  }
})
