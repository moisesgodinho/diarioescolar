import { supabase, supabaseAnonKey, supabaseUrl } from '../../lib/supabase';
import type { PlatformRole } from '../providers/AuthProvider';

type ManagedPlatformRole = Exclude<PlatformRole, 'owner'>;

interface ManagePlatformStaffInput {
  memberEmail: string;
  memberName: string;
  redirectTo?: string;
  role: ManagedPlatformRole;
}

interface ManagePlatformStaffResponse {
  error?: string;
  member?: {
    email: string;
    fullName: string;
    role: ManagedPlatformRole;
    userId: string;
    wasExistingUser: boolean;
  };
}

async function getFreshAccessToken(forceRefresh = false) {
  if (forceRefresh) {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      throw new Error(`Nao foi possivel renovar a sessao atual: ${error.message}`);
    }

    if (!data.session?.access_token) {
      throw new Error('Sua sessao expirou. Entre novamente para gerenciar a equipe global.');
    }

    return data.session.access_token;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`Nao foi possivel validar a sessao atual: ${sessionError.message}`);
  }

  if (!session?.access_token) {
    return getFreshAccessToken(true);
  }

  return session.access_token;
}

export async function managePlatformStaff(input: ManagePlatformStaffInput) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const accessToken = await getFreshAccessToken(attempt > 0);
    const response = await fetch(`${supabaseUrl}/functions/v1/platform-manage-staff`, {
      body: JSON.stringify(input),
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      method: 'POST',
    });

    const payload = (await response.json()) as ManagePlatformStaffResponse;

    if (response.ok) {
      return payload;
    }

    if (response.status === 401 && attempt === 0) {
      continue;
    }

    throw new Error(payload.error ?? `Falha ao gerenciar a equipe global (HTTP ${response.status}).`);
  }

  throw new Error('Nao foi possivel gerenciar a equipe global agora.');
}
