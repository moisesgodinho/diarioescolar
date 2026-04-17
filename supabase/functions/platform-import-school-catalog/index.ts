import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { parseInepSchoolCatalogCsv } from '../_shared/inepSchoolCatalogCsv.ts'

interface ImportSchoolCatalogPayload {
  city?: string
  csvText?: string
  fileName?: string
  ibgeCode?: string | null
  state?: string
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

function normalizeDigits(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '')
}

function normalizeState(value: string) {
  return value.trim().toUpperCase()
}

async function parsePayload(req: Request): Promise<ImportSchoolCatalogPayload> {
  const contentType = req.headers.get('Content-Type') ?? ''

  if (!contentType.includes('application/json')) {
    return {}
  }

  return (await req.json()) as ImportSchoolCatalogPayload
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
    const city = payload.city?.trim()
    const state = payload.state?.trim()
    const csvText = payload.csvText ?? ''
    const ibgeCode = normalizeDigits(payload.ibgeCode)

    if (!city) {
      return jsonResponse({ error: 'City is required.' }, 400)
    }

    if (!state) {
      return jsonResponse({ error: 'State is required.' }, 400)
    }

    if (!csvText.trim()) {
      return jsonResponse({ error: 'CSV content is required.' }, 400)
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
      return jsonResponse({ error: 'Your current platform role cannot import school catalogs.' }, 403)
    }

    const parsedCatalog = parseInepSchoolCatalogCsv({
      city,
      cityIbgeCode: ibgeCode || null,
      csvText,
      state: normalizeState(state),
    })

    if (parsedCatalog.cacheRecords.length === 0) {
      return jsonResponse(
        {
          error:
            'Nenhuma escola valida foi encontrada no CSV para a cidade e UF selecionadas. Confira o arquivo exportado do INEP.',
        },
        400,
      )
    }

    const { error: upsertError } = await serviceRoleClient
      .from('school_catalog_cache')
      .upsert(parsedCatalog.cacheRecords, {
        onConflict: 'inep_code',
      })

    if (upsertError) {
      return jsonResponse({ error: upsertError.message }, 400)
    }

    const retainedCodes = parsedCatalog.cacheRecords.map((row) => row.inep_code)

    if (retainedCodes.length > 0) {
      const quotedCodes = retainedCodes.map((code) => `"${code}"`).join(',')
      let deleteQuery = serviceRoleClient.from('school_catalog_cache').delete()

      if (ibgeCode) {
        deleteQuery = deleteQuery.eq('city_ibge_code', ibgeCode)
      } else {
        deleteQuery = deleteQuery.eq('city', city).eq('state', normalizeState(state))
      }

      const { error: deleteError } = await deleteQuery.not('inep_code', 'in', `(${quotedCodes})`)

      if (deleteError) {
        return jsonResponse({ error: deleteError.message }, 400)
      }
    }

    return jsonResponse({
      city,
      duplicateRowsCount: parsedCatalog.duplicateRowsCount,
      fileName: payload.fileName?.trim() || null,
      ibgeCode: ibgeCode || null,
      ignoredRowsCount: parsedCatalog.ignoredRowsCount,
      importedCount: parsedCatalog.cacheRecords.length,
      matchedRowsCount: parsedCatalog.matchedRowsCount,
      sourceLabel: 'CSV do INEP',
      state: normalizeState(state),
      totalRowsCount: parsedCatalog.totalRowsCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return jsonResponse({ error: message }, 500)
  }
})
