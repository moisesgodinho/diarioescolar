import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  initialPlatformRegistrySnapshot,
  normalizeDigits,
  platformRegistryStorageKey,
  type EducationSecretariat,
  type PlatformRegistrySnapshot,
  type ProfessionalAssignment,
  type ProfessionalProfile,
  type RegisteredSchool,
  type SchoolCatalogEntry,
  type SchoolStaffRole,
} from '../lib/platformRegistry';

interface CreateSecretariatInput {
  city: string;
  cityIbgeCode: string | null;
  contactPhone: string;
  coordinatorName: string;
  email: string;
  officeAddress: string;
  secretaryCpf: string;
  secretaryName: string;
  state: string;
  title: string;
  zipCode: string;
}

interface RegisterManualSchoolInput {
  educationStages: string[];
  inepCode: string;
  name: string;
  neighborhood: string;
  secretariatId: string;
  zone: 'Urbana' | 'Rural';
}

interface AssignProfessionalInput {
  cpf: string;
  discipline: string;
  email: string;
  fullName: string;
  notes: string;
  phone: string;
  role: SchoolStaffRole;
  schoolId: string;
}

interface AssignProfessionalResult {
  existedAssignment: boolean;
  existedProfile: boolean;
  profile: ProfessionalProfile;
}

interface PlatformRegistryContextValue extends PlatformRegistrySnapshot {
  addSecretariat: (input: CreateSecretariatInput) => EducationSecretariat;
  assignProfessionalToSchool: (input: AssignProfessionalInput) => AssignProfessionalResult;
  findProfileByCpf: (cpf: string) => ProfessionalProfile | null;
  registerManualSchool: (input: RegisterManualSchoolInput) => RegisteredSchool;
  registerSchoolFromCatalog: (input: {
    catalogSchool: SchoolCatalogEntry;
    secretariatId: string;
  }) => { alreadyRegistered: boolean; school: RegisteredSchool };
}

const PlatformRegistryContext = createContext<PlatformRegistryContextValue | undefined>(undefined);

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function createBlankProfile(input: AssignProfessionalInput): ProfessionalProfile {
  return {
    cpf: normalizeDigits(input.cpf),
    createdAt: new Date().toISOString(),
    email: input.email.trim(),
    fullName: input.fullName.trim(),
    id: createId('profile'),
    notes: input.notes.trim() || null,
    phone: normalizeDigits(input.phone),
  };
}

function mergeProfile(currentProfile: ProfessionalProfile, input: AssignProfessionalInput): ProfessionalProfile {
  return {
    ...currentProfile,
    email: input.email.trim() || currentProfile.email,
    fullName: input.fullName.trim() || currentProfile.fullName,
    notes: input.notes.trim() || currentProfile.notes,
    phone: normalizeDigits(input.phone) || currentProfile.phone,
  };
}

export function PlatformRegistryProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<PlatformRegistrySnapshot>(initialPlatformRegistrySnapshot);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(platformRegistryStorageKey);

      if (storedValue) {
        setSnapshot(JSON.parse(storedValue) as PlatformRegistrySnapshot);
      }
    } catch {
      setSnapshot(initialPlatformRegistrySnapshot);
    } finally {
      setHasLoadedStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    window.localStorage.setItem(platformRegistryStorageKey, JSON.stringify(snapshot));
  }, [hasLoadedStorage, snapshot]);

  function addSecretariat(input: CreateSecretariatInput) {
    const nextSecretariat: EducationSecretariat = {
      city: input.city.trim(),
      cityIbgeCode: input.cityIbgeCode?.trim() || null,
      contactPhone: normalizeDigits(input.contactPhone),
      coordinatorName: input.coordinatorName.trim() || null,
      createdAt: new Date().toISOString(),
      email: input.email.trim().toLowerCase(),
      id: createId('secretariat'),
      officeAddress: input.officeAddress.trim(),
      secretaryCpf: normalizeDigits(input.secretaryCpf),
      secretaryName: input.secretaryName.trim(),
      state: input.state.trim().toUpperCase(),
      title: input.title.trim(),
      zipCode: normalizeDigits(input.zipCode),
    };

    setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      secretariats: [nextSecretariat, ...currentSnapshot.secretariats],
    }));

    return nextSecretariat;
  }

  function registerSchoolFromCatalog(input: {
    catalogSchool: SchoolCatalogEntry;
    secretariatId: string;
  }) {
    const catalogSchool = input.catalogSchool;
    const existingSchool = snapshot.registeredSchools.find(
      (school) =>
        school.secretariatId === input.secretariatId &&
        (school.catalogSchoolId === catalogSchool.id || school.inepCode === catalogSchool.inepCode),
    );

    if (existingSchool) {
      return {
        alreadyRegistered: true,
        school: existingSchool,
      };
    }

    const nextSchool: RegisteredSchool = {
      address: catalogSchool.address ?? null,
      administrativeDependency: catalogSchool.administrativeDependency ?? null,
      catalogSchoolId: catalogSchool.id,
      city: catalogSchool.city,
      createdAt: new Date().toISOString(),
      educationStages: catalogSchool.educationStages,
      id: createId('school'),
      inepCode: normalizeDigits(catalogSchool.inepCode) || null,
      name: catalogSchool.name,
      neighborhood: catalogSchool.neighborhood ?? null,
      operationalStatus: catalogSchool.operationalStatus ?? null,
      phone: catalogSchool.phone ?? null,
      secretariatId: input.secretariatId,
      source: 'inep',
      state: catalogSchool.state,
      zone: catalogSchool.zone,
    };

    setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      registeredSchools: [nextSchool, ...currentSnapshot.registeredSchools],
    }));

    return {
      alreadyRegistered: false,
      school: nextSchool,
    };
  }

  function registerManualSchool(input: RegisterManualSchoolInput) {
    const secretariat = snapshot.secretariats.find(
      (currentSecretariat) => currentSecretariat.id === input.secretariatId,
    );

    if (!secretariat) {
      throw new Error('Secretaria nao encontrada.');
    }

    const nextSchool: RegisteredSchool = {
      address: null,
      administrativeDependency: null,
      catalogSchoolId: null,
      city: secretariat.city,
      createdAt: new Date().toISOString(),
      educationStages: input.educationStages,
      id: createId('school'),
      inepCode: normalizeDigits(input.inepCode) || null,
      name: input.name.trim(),
      neighborhood: input.neighborhood.trim() || null,
      operationalStatus: null,
      phone: null,
      secretariatId: input.secretariatId,
      source: 'manual',
      state: secretariat.state,
      zone: input.zone,
    };

    setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      registeredSchools: [nextSchool, ...currentSnapshot.registeredSchools],
    }));

    return nextSchool;
  }

  function findProfileByCpf(cpf: string) {
    const normalizedCpf = normalizeDigits(cpf);

    return (
      snapshot.professionalProfiles.find((profile) => profile.cpf === normalizedCpf) ?? null
    );
  }

  function assignProfessionalToSchool(input: AssignProfessionalInput): AssignProfessionalResult {
    const existingProfile = findProfileByCpf(input.cpf);
    const nextProfile = existingProfile
      ? mergeProfile(existingProfile, input)
      : createBlankProfile(input);

    const existingAssignment = snapshot.professionalAssignments.find(
      (assignment) =>
        assignment.profileId === nextProfile.id &&
        assignment.schoolId === input.schoolId &&
        assignment.role === input.role,
    );

    setSnapshot((currentSnapshot) => {
      const nextProfiles = existingProfile
        ? currentSnapshot.professionalProfiles.map((profile) =>
            profile.id === existingProfile.id ? nextProfile : profile,
          )
        : [nextProfile, ...currentSnapshot.professionalProfiles];

      const nextAssignments = existingAssignment
        ? currentSnapshot.professionalAssignments
        : [
            {
              createdAt: new Date().toISOString(),
              discipline: input.role === 'teacher' ? input.discipline.trim() || null : null,
              id: createId('assignment'),
              profileId: nextProfile.id,
              role: input.role,
              schoolId: input.schoolId,
            } satisfies ProfessionalAssignment,
            ...currentSnapshot.professionalAssignments,
          ];

      return {
        ...currentSnapshot,
        professionalAssignments: nextAssignments,
        professionalProfiles: nextProfiles,
      };
    });

    return {
      existedAssignment: Boolean(existingAssignment),
      existedProfile: Boolean(existingProfile),
      profile: nextProfile,
    };
  }

  return (
    <PlatformRegistryContext.Provider
      value={{
        ...snapshot,
        addSecretariat,
        assignProfessionalToSchool,
        findProfileByCpf,
        registerManualSchool,
        registerSchoolFromCatalog,
      }}
    >
      {children}
    </PlatformRegistryContext.Provider>
  );
}

export function usePlatformRegistry() {
  const context = useContext(PlatformRegistryContext);

  if (!context) {
    throw new Error('usePlatformRegistry must be used within a PlatformRegistryProvider');
  }

  return context;
}
