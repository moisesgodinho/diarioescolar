export type RegisteredSchoolSource = 'inep' | 'manual';
export type SchoolStaffRole = 'director' | 'teacher';

export interface EducationSecretariat {
  city: string;
  cityIbgeCode: string | null;
  contactPhone: string;
  coordinatorName: string | null;
  createdAt: string;
  email: string;
  id: string;
  officeAddress: string;
  secretaryCpf: string;
  secretaryName: string;
  state: string;
  title: string;
  zipCode: string;
}

export interface SchoolCatalogEntry {
  address?: string | null;
  administrativeDependency?: string | null;
  city: string;
  cityIbgeCode?: string | null;
  educationStages: string[];
  id: string;
  inepCode: string;
  name: string;
  neighborhood?: string | null;
  operationalStatus?: string | null;
  phone?: string | null;
  state: string;
  zone: 'Urbana' | 'Rural';
}

export interface RegisteredSchool {
  address?: string | null;
  administrativeDependency?: string | null;
  catalogSchoolId: string | null;
  city: string;
  createdAt: string;
  educationStages: string[];
  id: string;
  inepCode: string | null;
  name: string;
  neighborhood: string | null;
  operationalStatus?: string | null;
  phone?: string | null;
  secretariatId: string;
  source: RegisteredSchoolSource;
  state: string;
  zone: 'Urbana' | 'Rural';
}

export interface ProfessionalProfile {
  cpf: string;
  createdAt: string;
  email: string;
  fullName: string;
  id: string;
  notes: string | null;
  phone: string;
}

export interface ProfessionalAssignment {
  createdAt: string;
  discipline: string | null;
  id: string;
  profileId: string;
  role: SchoolStaffRole;
  schoolId: string;
}

export interface PlatformRegistrySnapshot {
  professionalAssignments: ProfessionalAssignment[];
  professionalProfiles: ProfessionalProfile[];
  registeredSchools: RegisteredSchool[];
  schoolCatalog: SchoolCatalogEntry[];
  secretariats: EducationSecretariat[];
}

export const platformRegistryStorageKey = 'diarioescolar.platform-registry.v1';

const initialSecretariats: EducationSecretariat[] = [
  {
    city: 'Sobral',
    cityIbgeCode: null,
    contactPhone: '88999887766',
    coordinatorName: 'Renata Araujo',
    createdAt: '2026-04-10T10:00:00.000Z',
    email: 'semed@sobral.ce.gov.br',
    id: 'secretariat-sobral',
    officeAddress: 'Rua Viriato de Medeiros, 1250 - Centro',
    secretaryCpf: '12345678901',
    secretaryName: 'Marcio Almeida',
    state: 'CE',
    title: 'Secretaria Municipal da Educacao de Sobral',
    zipCode: '62011000',
  },
  {
    city: 'Petrolina',
    cityIbgeCode: null,
    contactPhone: '87991234567',
    coordinatorName: 'Joana Ribeiro',
    createdAt: '2026-04-09T14:30:00.000Z',
    email: 'educacao@petrolina.pe.gov.br',
    id: 'secretariat-petrolina',
    officeAddress: 'Avenida Guararapes, 2114 - Centro',
    secretaryCpf: '98765432100',
    secretaryName: 'Claudia Monteiro',
    state: 'PE',
    title: 'Secretaria Municipal de Educacao de Petrolina',
    zipCode: '56302110',
  },
];

const initialSchoolCatalog: SchoolCatalogEntry[] = [
  {
    city: 'Sobral',
    educationStages: ['Anos Iniciais', 'Anos Finais'],
    id: 'catalog-sobral-1',
    inepCode: '23045678',
    name: 'EMEF Padre Osvaldo Chaves',
    state: 'CE',
    zone: 'Urbana',
  },
  {
    city: 'Sobral',
    educationStages: ['Anos Iniciais'],
    id: 'catalog-sobral-2',
    inepCode: '23045679',
    name: 'EMEF Maria do Carmo Andrade',
    state: 'CE',
    zone: 'Rural',
  },
  {
    city: 'Sobral',
    educationStages: ['Educacao Infantil', 'Anos Iniciais'],
    id: 'catalog-sobral-3',
    inepCode: '23045680',
    name: 'Centro de Educacao Infantil Sementes do Futuro',
    state: 'CE',
    zone: 'Urbana',
  },
  {
    city: 'Petrolina',
    educationStages: ['Anos Finais', 'Ensino Medio'],
    id: 'catalog-petrolina-1',
    inepCode: '26114560',
    name: 'Escola Dom Malan',
    state: 'PE',
    zone: 'Urbana',
  },
  {
    city: 'Petrolina',
    educationStages: ['Anos Iniciais', 'Anos Finais'],
    id: 'catalog-petrolina-2',
    inepCode: '26114561',
    name: 'Escola Jose Joaquim da Silva',
    state: 'PE',
    zone: 'Rural',
  },
  {
    city: 'Petrolina',
    educationStages: ['Educacao Infantil'],
    id: 'catalog-petrolina-3',
    inepCode: '26114562',
    name: 'Centro Municipal Pequeno Aprendiz',
    state: 'PE',
    zone: 'Urbana',
  },
];

const initialRegisteredSchools: RegisteredSchool[] = [
  {
    catalogSchoolId: 'catalog-sobral-1',
    city: 'Sobral',
    createdAt: '2026-04-12T09:15:00.000Z',
    educationStages: ['Anos Iniciais', 'Anos Finais'],
    id: 'registered-sobral-1',
    inepCode: '23045678',
    name: 'EMEF Padre Osvaldo Chaves',
    neighborhood: 'Centro',
    secretariatId: 'secretariat-sobral',
    source: 'inep',
    state: 'CE',
    zone: 'Urbana',
  },
  {
    catalogSchoolId: null,
    city: 'Petrolina',
    createdAt: '2026-04-12T16:40:00.000Z',
    educationStages: ['Anos Finais'],
    id: 'registered-petrolina-1',
    inepCode: null,
    name: 'Escola Piloto do Nucleo 07',
    neighborhood: 'Projeto Senador Nilo Coelho',
    secretariatId: 'secretariat-petrolina',
    source: 'manual',
    state: 'PE',
    zone: 'Rural',
  },
];

const initialProfessionalProfiles: ProfessionalProfile[] = [
  {
    cpf: '11122233344',
    createdAt: '2026-04-11T13:30:00.000Z',
    email: 'maria.lima@educa.br',
    fullName: 'Maria Fernanda Lima',
    id: 'profile-maria-lima',
    notes: 'Perfil ja validado pela equipe de implantacao.',
    phone: '88999111222',
  },
  {
    cpf: '22233344455',
    createdAt: '2026-04-11T14:15:00.000Z',
    email: 'carlos.silva@educa.br',
    fullName: 'Carlos Eduardo Silva',
    id: 'profile-carlos-silva',
    notes: 'Professor com atuacao em rede.',
    phone: '87999888777',
  },
];

const initialProfessionalAssignments: ProfessionalAssignment[] = [
  {
    createdAt: '2026-04-12T09:30:00.000Z',
    discipline: null,
    id: 'assignment-maria-1',
    profileId: 'profile-maria-lima',
    role: 'director',
    schoolId: 'registered-sobral-1',
  },
  {
    createdAt: '2026-04-12T17:00:00.000Z',
    discipline: 'Matematica',
    id: 'assignment-carlos-1',
    profileId: 'profile-carlos-silva',
    role: 'teacher',
    schoolId: 'registered-petrolina-1',
  },
];

export const initialPlatformRegistrySnapshot: PlatformRegistrySnapshot = {
  professionalAssignments: initialProfessionalAssignments,
  professionalProfiles: initialProfessionalProfiles,
  registeredSchools: initialRegisteredSchools,
  schoolCatalog: initialSchoolCatalog,
  secretariats: initialSecretariats,
};

export function normalizeDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function maskCpf(value: string) {
  const digits = normalizeDigits(value).slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function maskPhone(value: string) {
  const digits = normalizeDigits(value).slice(0, 11);

  if (digits.length === 0) {
    return '';
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);

  if (number.length <= 5) {
    return `(${areaCode}) ${number}`;
  }

  return `(${areaCode}) ${number.slice(0, 5)}-${number.slice(5)}`;
}

export function maskZipCode(value: string) {
  const digits = normalizeDigits(value).slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}-${digits.slice(5)}`;
}

export function formatCpf(value: string | null) {
  if (!value) {
    return 'Nao informado';
  }

  return maskCpf(value);
}

export function formatPhone(value: string | null) {
  if (!value) {
    return 'Nao informado';
  }

  return maskPhone(value);
}

export function formatZipCode(value: string | null) {
  if (!value) {
    return 'Nao informado';
  }

  return maskZipCode(value);
}

export function cityKey(city: string, state: string) {
  return `${city.trim().toLowerCase()}::${state.trim().toUpperCase()}`;
}

export function getCatalogSchoolsForSecretariat(
  secretariat: EducationSecretariat,
  catalog: SchoolCatalogEntry[],
) {
  const targetKey = cityKey(secretariat.city, secretariat.state);

  return catalog.filter((school) => cityKey(school.city, school.state) === targetKey);
}

export function getRegisteredSchoolsForSecretariat(
  secretariatId: string,
  schools: RegisteredSchool[],
) {
  return schools.filter((school) => school.secretariatId === secretariatId);
}

export function getAssignmentsForProfile(
  profileId: string,
  assignments: ProfessionalAssignment[],
) {
  return assignments.filter((assignment) => assignment.profileId === profileId);
}

export function getPlatformRegistryMetrics(snapshot: PlatformRegistrySnapshot) {
  const citiesCoveredCount = new Set(
    snapshot.secretariats.map((secretariat) => cityKey(secretariat.city, secretariat.state)),
  ).size;

  const linkedProfessionalsCount = new Set(
    snapshot.professionalAssignments.map((assignment) => assignment.profileId),
  ).size;

  const crossSchoolProfilesCount = snapshot.professionalProfiles.filter((profile) => {
    const schoolIds = new Set(
      snapshot.professionalAssignments
        .filter((assignment) => assignment.profileId === profile.id)
        .map((assignment) => assignment.schoolId),
    );

    return schoolIds.size > 1;
  }).length;

  const manualSchoolsCount = snapshot.registeredSchools.filter(
    (school) => school.source === 'manual',
  ).length;

  return {
    citiesCoveredCount,
    crossSchoolProfilesCount,
    linkedProfessionalsCount,
    manualSchoolsCount,
    registeredSchoolsCount: snapshot.registeredSchools.length,
    secretariatsCount: snapshot.secretariats.length,
  };
}
