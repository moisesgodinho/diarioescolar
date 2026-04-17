import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

type AllowedPlatformRole = 'education_secretary' | 'admin' | 'support'

interface ManageStaffPayload {
  memberEmail: string
  memberName: string
  redirectTo?: string
  role: AllowedPlatformRole
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

    if (platformStaffRow.role !== 'owner') {
      return jsonResponse({ error: 'Only the system manager can manage the global team.' }, 403)
    }

    const payload = (await req.json()) as ManageStaffPayload

    if (!payload.memberName?.trim()) {
      return jsonResponse({ error: 'Member name is required.' }, 400)
    }

    if (!payload.memberEmail?.trim()) {
      return jsonResponse({ error: 'Member email is required.' }, 400)
    }

    if (!['education_secretary', 'admin', 'support'].includes(payload.role)) {
      return jsonResponse({ error: 'Only education secretary, admin or support roles can be assigned here.' }, 400)
    }

    const normalizedEmail = payload.memberEmail.trim().toLowerCase()
    const normalizedName = payload.memberName.trim()

    const { data: matchingProfiles, error: matchingProfilesError } = await serviceRoleClient
      .from('profiles')
      .select('id, full_name, email')
      .ilike('email', normalizedEmail)
      .limit(1)

    if (matchingProfilesError) {
      return jsonResponse({ error: matchingProfilesError.message }, 400)
    }

    let memberUserId = matchingProfiles?.[0]?.id ?? null
    const wasExistingUser = memberUserId !== null

    if (!memberUserId) {
      const { data: inviteData, error: inviteError } = await serviceRoleClient.auth.admin.inviteUserByEmail(
        normalizedEmail,
        {
          data: {
            full_name: normalizedName,
            name: normalizedName,
          },
          redirectTo: payload.redirectTo,
        },
      )

      if (inviteError) {
        return jsonResponse({ error: inviteError.message }, 400)
      }

      memberUserId = inviteData.user?.id ?? null

      if (!memberUserId) {
        return jsonResponse({ error: 'Unable to create or invite the team member.' }, 400)
      }
    } else {
      const { error: updateProfileError } = await serviceRoleClient
        .from('profiles')
        .update({
          email: normalizedEmail,
          full_name: normalizedName,
        })
        .eq('id', memberUserId)

      if (updateProfileError) {
        return jsonResponse({ error: updateProfileError.message }, 400)
      }
    }

    const { data: assignedRoleData, error: assignError } = await userClient.rpc(
      'assign_platform_staff',
      {
        target_role: payload.role,
        target_status: 'active',
        target_user_id: memberUserId,
      },
    )

    if (assignError) {
      return jsonResponse({ error: assignError.message }, 400)
    }

    return jsonResponse({
      member: {
        email: normalizedEmail,
        fullName: normalizedName,
        role: payload.role,
        userId: memberUserId,
        wasExistingUser,
      },
      platformStaff: assignedRoleData,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return jsonResponse({ error: message }, 500)
  }
})
