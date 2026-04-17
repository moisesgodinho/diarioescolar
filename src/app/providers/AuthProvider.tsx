import type { AuthError, Session, User } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface SignInCredentials {
  email: string;
  password: string;
}

export type PlatformRole = 'owner' | 'education_secretary' | 'admin' | 'support';
export type SchoolRole = 'director' | 'secretary' | 'teacher' | 'student';
export type MembershipStatus = 'active' | 'inactive' | 'invited';

interface UserProfile {
  avatarUrl: string | null;
  email: string | null;
  fullName: string | null;
}

interface SchoolMembership {
  id: string;
  role: SchoolRole;
  schoolId: string;
  schoolName: string | null;
  schoolSlug: string | null;
  status: MembershipStatus;
}

interface AuthContextValue {
  accessError: string | null;
  isAccessLoading: boolean;
  isLoading: boolean;
  isPlatformStaff: boolean;
  platformRole: PlatformRole | null;
  profile: UserProfile | null;
  refreshAccessContext: () => Promise<void>;
  schoolMemberships: SchoolMembership[];
  session: Session | null;
  user: User | null;
  signInWithPassword: (credentials: SignInCredentials) => Promise<AuthError | null>;
  signOut: () => Promise<AuthError | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccessLoading, setIsAccessLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [platformRole, setPlatformRole] = useState<PlatformRole | null>(null);
  const [schoolMemberships, setSchoolMemberships] = useState<SchoolMembership[]>([]);
  const [accessError, setAccessError] = useState<string | null>(null);

  function resetAccessContext() {
    setProfile(null);
    setPlatformRole(null);
    setSchoolMemberships([]);
    setAccessError(null);
    setIsAccessLoading(false);
  }

  async function loadAccessContext(targetSession: Session | null) {
    if (!targetSession?.user) {
      resetAccessContext();
      return;
    }

    setIsAccessLoading(true);

    const userId = targetSession.user.id;
    const [profileResponse, platformStaffResponse, membershipsResponse] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('platform_staff')
        .select('role, status')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('school_memberships')
        .select('id, school_id, role, status, schools(name, slug)')
        .eq('user_id', userId),
    ]);

    let nextAccessError: string | null = null;

    if (profileResponse.error) {
      nextAccessError = profileResponse.error.message;
      setProfile(null);
    } else {
      setProfile(
        profileResponse.data
          ? {
              avatarUrl: profileResponse.data.avatar_url ?? null,
              email: profileResponse.data.email ?? null,
              fullName: profileResponse.data.full_name ?? null,
            }
          : null,
      );
    }

    if (platformStaffResponse.error) {
      nextAccessError = nextAccessError ?? platformStaffResponse.error.message;
      setPlatformRole(null);
    } else if (platformStaffResponse.data?.status === 'active') {
      setPlatformRole(platformStaffResponse.data.role as PlatformRole);
    } else {
      setPlatformRole(null);
    }

    if (membershipsResponse.error) {
      nextAccessError = nextAccessError ?? membershipsResponse.error.message;
      setSchoolMemberships([]);
    } else {
      const mappedMemberships = (membershipsResponse.data ?? []).map((membership) => {
        const relatedSchool = Array.isArray(membership.schools)
          ? membership.schools[0] ?? null
          : membership.schools;

        return {
          id: membership.id as string,
          role: membership.role as SchoolRole,
          schoolId: membership.school_id as string,
          schoolName: relatedSchool?.name ?? null,
          schoolSlug: relatedSchool?.slug ?? null,
          status: membership.status as MembershipStatus,
        };
      });

      setSchoolMemberships(mappedMemberships);
    }

    setAccessError(nextAccessError);
    setIsAccessLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        setSession(null);
        resetAccessContext();
        setIsLoading(false);
        return;
      }

      const nextSession = data.session ?? null;
      setSession(nextSession);

      loadAccessContext(nextSession).finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);

      loadAccessContext(nextSession).finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithPassword({ email, password }: SignInCredentials) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    return error;
  }

  async function refreshAccessContext() {
    await loadAccessContext(session);
  }

  return (
    <AuthContext.Provider
      value={{
        accessError,
        isAccessLoading,
        isLoading,
        isPlatformStaff: platformRole !== null,
        platformRole,
        profile,
        refreshAccessContext,
        schoolMemberships,
        session,
        user: session?.user ?? null,
        signInWithPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
