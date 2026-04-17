import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CreateSchoolPayload {
  directorEmail: string
  directorName: string
  redirectTo?: string
  schoolDocumentNumber?: string | null
  schoolLegalName?: string | null
  schoolName: string
  schoolSlug: string
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

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
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
      return jsonResponse({ error: 'Your current platform role cannot create schools.' }, 403)
    }

    const payload = (await req.json()) as CreateSchoolPayload

    if (!payload.schoolName?.trim()) {
      return jsonResponse({ error: 'School name is required.' }, 400)
    }

    if (!payload.schoolSlug?.trim()) {
      return jsonResponse({ error: 'School slug is required.' }, 400)
    }

    if (!payload.directorName?.trim()) {
      return jsonResponse({ error: 'Director name is required.' }, 400)
    }

    if (!payload.directorEmail?.trim()) {
      return jsonResponse({ error: 'Director email is required.' }, 400)
    }

    const normalizedEmail = payload.directorEmail.trim().toLowerCase()
    const normalizedSlug = slugify(payload.schoolSlug || payload.schoolName)

    const { data: existingSchool, error: existingSchoolError } = await serviceRoleClient
      .from('schools')
      .select('id')
      .eq('slug', normalizedSlug)
      .maybeSingle()

    if (existingSchoolError) {
      return jsonResponse({ error: existingSchoolError.message }, 400)
    }

    if (existingSchool) {
      return jsonResponse({ error: 'A school with this slug already exists.' }, 409)
    }

    const { data: matchingProfiles, error: matchingProfilesError } = await serviceRoleClient
      .from('profiles')
      .select('id, full_name, email')
      .ilike('email', normalizedEmail)
      .limit(1)

    if (matchingProfilesError) {
      return jsonResponse({ error: matchingProfilesError.message }, 400)
    }

    let directorUserId = matchingProfiles?.[0]?.id ?? null
    const wasExistingUser = directorUserId !== null

    if (!directorUserId) {
      const { data: inviteData, error: inviteError } = await serviceRoleClient.auth.admin.inviteUserByEmail(
        normalizedEmail,
        {
          data: {
            full_name: payload.directorName.trim(),
            name: payload.directorName.trim(),
          },
          redirectTo: payload.redirectTo,
        },
      )

      if (inviteError) {
        return jsonResponse({ error: inviteError.message }, 400)
      }

      directorUserId = inviteData.user?.id ?? null

      if (!directorUserId) {
        return jsonResponse({ error: 'Unable to create or invite the director user.' }, 400)
      }
    } else {
      const { error: updateProfileError } = await serviceRoleClient
        .from('profiles')
        .update({
          email: normalizedEmail,
          full_name: payload.directorName.trim(),
        })
        .eq('id', directorUserId)

      if (updateProfileError) {
        return jsonResponse({ error: updateProfileError.message }, 400)
      }
    }

    const { data: schoolData, error: createSchoolError } = await userClient.rpc(
      'create_school_with_director',
      {
        director_user_id: directorUserId,
        school_document_number: payload.schoolDocumentNumber?.trim() || null,
        school_legal_name: payload.schoolLegalName?.trim() || null,
        school_name: payload.schoolName.trim(),
        school_slug: normalizedSlug,
      },
    )

    if (createSchoolError) {
      return jsonResponse({ error: createSchoolError.message }, 400)
    }

    return jsonResponse({
      director: {
        email: normalizedEmail,
        fullName: payload.directorName.trim(),
        userId: directorUserId,
        wasExistingUser,
      },
      school: schoolData,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return jsonResponse({ error: message }, 500)
  }
})
