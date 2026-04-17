import type { MembershipStatus, PlatformRole } from '../providers/AuthProvider';
import { supabase } from '../../lib/supabase';

export type ManagedSchoolRole = 'director' | 'secretary';

export interface PlatformStaffMember {
  createdAt: string;
  email: string | null;
  fullName: string | null;
  role: PlatformRole;
  status: MembershipStatus;
  userId: string;
}

export interface SchoolTeamMemberSummary {
  createdAt: string;
  email: string | null;
  fullName: string | null;
  role: ManagedSchoolRole;
  status: MembershipStatus;
  userId: string;
}

export interface ManagedSchool {
  createdAt: string;
  director: SchoolTeamMemberSummary | null;
  documentNumber: string | null;
  id: string;
  legalName: string | null;
  name: string;
  secretaries: SchoolTeamMemberSummary[];
  slug: string;
}

export interface PlatformOverviewData {
  managedSchools: ManagedSchool[];
  platformStaff: PlatformStaffMember[];
}

interface SchoolRow {
  created_at: string;
  document_number: string | null;
  id: string;
  legal_name: string | null;
  name: string;
  slug: string;
}

interface PlatformStaffRow {
  created_at: string;
  role: PlatformRole;
  status: MembershipStatus;
  user_id: string;
}

interface MembershipRow {
  created_at: string;
  role: ManagedSchoolRole;
  school_id: string;
  status: MembershipStatus;
  user_id: string;
}

interface ProfileRow {
  email: string | null;
  full_name: string | null;
  id: string;
}

interface SchoolContactsGroup {
  director: SchoolTeamMemberSummary | null;
  secretaries: SchoolTeamMemberSummary[];
}

function sortSchoolTeamMembers(a: SchoolTeamMemberSummary, b: SchoolTeamMemberSummary) {
  if (a.status === 'active' && b.status !== 'active') {
    return -1;
  }

  if (a.status !== 'active' && b.status === 'active') {
    return 1;
  }

  return (a.fullName ?? '').localeCompare(b.fullName ?? '', 'pt-BR');
}

export async function loadPlatformOverviewData(): Promise<{
  data: PlatformOverviewData | null;
  error: string | null;
}> {
  const [schoolsResponse, platformStaffResponse, membershipsResponse] = await Promise.all([
    supabase
      .from('schools')
      .select('id, name, slug, legal_name, document_number, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('platform_staff')
      .select('user_id, role, status, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('school_memberships')
      .select('school_id, user_id, role, status, created_at')
      .in('role', ['director', 'secretary'])
      .order('created_at', { ascending: false }),
  ]);

  const loadError =
    schoolsResponse.error?.message ||
    platformStaffResponse.error?.message ||
    membershipsResponse.error?.message ||
    null;

  if (loadError) {
    return {
      data: null,
      error: loadError,
    };
  }

  const staffRows = (platformStaffResponse.data ?? []) as PlatformStaffRow[];
  const membershipRows = (membershipsResponse.data ?? []) as MembershipRow[];

  const profileIds = [
    ...new Set([...staffRows.map((row) => row.user_id), ...membershipRows.map((row) => row.user_id)]),
  ];

  const profilesResponse = profileIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', profileIds)
    : { data: [], error: null };

  if (profilesResponse.error) {
    return {
      data: null,
      error: profilesResponse.error.message,
    };
  }

  const profilesById = new Map(
    ((profilesResponse.data ?? []) as ProfileRow[]).map((profileRow) => [profileRow.id, profileRow]),
  );

  const schoolContactsById = new Map<string, SchoolContactsGroup>();

  for (const membershipRow of membershipRows) {
    const profileRow = profilesById.get(membershipRow.user_id);
    const memberSummary: SchoolTeamMemberSummary = {
      createdAt: membershipRow.created_at,
      email: profileRow?.email ?? null,
      fullName: profileRow?.full_name ?? null,
      role: membershipRow.role,
      status: membershipRow.status,
      userId: membershipRow.user_id,
    };

    const currentGroup = schoolContactsById.get(membershipRow.school_id) ?? {
      director: null,
      secretaries: [],
    };

    if (membershipRow.role === 'director') {
      currentGroup.director ??= memberSummary;
    } else {
      currentGroup.secretaries.push(memberSummary);
    }

    schoolContactsById.set(membershipRow.school_id, currentGroup);
  }

  for (const group of schoolContactsById.values()) {
    group.secretaries.sort(sortSchoolTeamMembers);
  }

  const managedSchools = ((schoolsResponse.data ?? []) as SchoolRow[]).map((schoolRow) => {
    const schoolContacts = schoolContactsById.get(schoolRow.id);

    return {
      createdAt: schoolRow.created_at,
      director: schoolContacts?.director ?? null,
      documentNumber: schoolRow.document_number,
      id: schoolRow.id,
      legalName: schoolRow.legal_name,
      name: schoolRow.name,
      secretaries: schoolContacts?.secretaries ?? [],
      slug: schoolRow.slug,
    };
  });

  const platformStaff = staffRows.map((staffRow) => {
    const profileRow = profilesById.get(staffRow.user_id);

    return {
      createdAt: staffRow.created_at,
      email: profileRow?.email ?? null,
      fullName: profileRow?.full_name ?? null,
      role: staffRow.role,
      status: staffRow.status,
      userId: staffRow.user_id,
    };
  });

  return {
    data: {
      managedSchools,
      platformStaff,
    },
    error: null,
  };
}

export function getPlatformOverviewMetrics(data: PlatformOverviewData) {
  const directors = data.managedSchools
    .map((school) => school.director)
    .filter((director): director is SchoolTeamMemberSummary => director !== null);
  const secretaries = data.managedSchools.flatMap((school) => school.secretaries);

  return {
    activeDirectorsCount: directors.filter((director) => director.status === 'active').length,
    activeSecretariesCount: secretaries.filter((secretary) => secretary.status === 'active').length,
    pendingSchoolInvitesCount: [...directors, ...secretaries].filter(
      (member) => member.status === 'invited',
    ).length,
    platformStaffCount: data.platformStaff.length,
    schoolsCount: data.managedSchools.length,
  };
}
