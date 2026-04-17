export interface SchoolCatalogEntry {
  address?: string | null
  administrativeDependency?: string | null
  city: string
  cityIbgeCode?: string | null
  educationStages: string[]
  id: string
  inepCode: string
  name: string
  neighborhood?: string | null
  operationalStatus?: string | null
  phone?: string | null
  state: string
  zone: 'Urbana' | 'Rural'
}

interface SchoolCatalogSeedEntry extends SchoolCatalogEntry {
  cityIbgeCode: string | null
}

interface SchoolCatalogLookupInput {
  city: string
  cityIbgeCode?: string | null
  state: string
}

const schoolCatalogSeed: SchoolCatalogSeedEntry[] = [
  {
    city: 'Sobral',
    cityIbgeCode: '2312908',
    educationStages: ['Anos Iniciais', 'Anos Finais'],
    id: 'inep-23045678',
    inepCode: '23045678',
    name: 'EMEF Padre Osvaldo Chaves',
    state: 'CE',
    zone: 'Urbana',
  },
  {
    city: 'Sobral',
    cityIbgeCode: '2312908',
    educationStages: ['Anos Iniciais'],
    id: 'inep-23045679',
    inepCode: '23045679',
    name: 'EMEF Maria do Carmo Andrade',
    state: 'CE',
    zone: 'Rural',
  },
  {
    city: 'Sobral',
    cityIbgeCode: '2312908',
    educationStages: ['Educacao Infantil', 'Anos Iniciais'],
    id: 'inep-23045680',
    inepCode: '23045680',
    name: 'Centro de Educacao Infantil Sementes do Futuro',
    state: 'CE',
    zone: 'Urbana',
  },
  {
    city: 'Petrolina',
    cityIbgeCode: '2611101',
    educationStages: ['Anos Finais', 'Ensino Medio'],
    id: 'inep-26114560',
    inepCode: '26114560',
    name: 'Escola Dom Malan',
    state: 'PE',
    zone: 'Urbana',
  },
  {
    city: 'Petrolina',
    cityIbgeCode: '2611101',
    educationStages: ['Anos Iniciais', 'Anos Finais'],
    id: 'inep-26114561',
    inepCode: '26114561',
    name: 'Escola Jose Joaquim da Silva',
    state: 'PE',
    zone: 'Rural',
  },
  {
    city: 'Petrolina',
    cityIbgeCode: '2611101',
    educationStages: ['Educacao Infantil'],
    id: 'inep-26114562',
    inepCode: '26114562',
    name: 'Centro Municipal Pequeno Aprendiz',
    state: 'PE',
    zone: 'Urbana',
  },
]

function normalizeDigits(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '')
}

function normalizeState(value: string) {
  return value.trim().toUpperCase()
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function readString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

function readStages(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (Array.isArray(value)) {
      const stages = value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)

      if (stages.length > 0) {
        return stages
      }
    }

    if (typeof value === 'string' && value.trim()) {
      const stages = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      if (stages.length > 0) {
        return stages
      }
    }
  }

  return []
}

function readZone(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value !== 'string' || !value.trim()) {
      continue
    }

    const normalized = normalizeText(value)

    if (normalized.startsWith('rural')) {
      return 'Rural'
    }

    if (normalized.startsWith('urbana') || normalized.startsWith('urbano')) {
      return 'Urbana'
    }
  }

  return null
}

export function normalizeCatalogEntry(value: unknown): SchoolCatalogEntry | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const city = readString(record, 'city', 'municipality', 'municipio')
  const state = readString(record, 'state', 'uf')
  const name = readString(record, 'name', 'school_name', 'nome')
  const inepCode = normalizeDigits(
    readString(record, 'inepCode', 'inep_code', 'codigoInep', 'codigo_inep'),
  )
  const zone = readZone(record, 'zone', 'location_type', 'localizacao', 'tipo_localizacao')

  if (!city || !state || !name || !inepCode || !zone) {
    return null
  }

  return {
    address: readString(record, 'address', 'endereco') || null,
    administrativeDependency:
      readString(
        record,
        'administrativeDependency',
        'administrative_dependency',
        'dependencia_administrativa',
        'categoria_administrativa',
      ) || null,
    city,
    cityIbgeCode: normalizeDigits(
      readString(record, 'cityIbgeCode', 'city_ibge_code', 'ibgeCode', 'ibge_code'),
    ) || null,
    educationStages: readStages(record, 'educationStages', 'education_stages', 'etapas_ensino'),
    id: readString(record, 'id') || `inep-${inepCode}`,
    inepCode,
    name,
    neighborhood: readString(record, 'neighborhood', 'bairro') || null,
    operationalStatus:
      readString(record, 'operationalStatus', 'operational_status', 'situacao_funcionamento') ||
      null,
    phone: readString(record, 'phone', 'telefone') || null,
    state: normalizeState(state),
    zone,
  }
}

export function parseCatalogPayload(payload: unknown) {
  const collection = Array.isArray(payload)
    ? payload
    : payload &&
        typeof payload === 'object' &&
        Array.isArray((payload as { schools?: unknown[] }).schools)
      ? (payload as { schools: unknown[] }).schools
      : []

  return collection
    .map((entry) => normalizeCatalogEntry(entry))
    .filter((entry): entry is SchoolCatalogEntry => entry !== null)
}

export function filterSchoolCatalog(
  input: SchoolCatalogLookupInput,
  catalog: SchoolCatalogSeedEntry[] = schoolCatalogSeed,
) {
  const cityIbgeCode = normalizeDigits(input.cityIbgeCode)
  const cityKey = normalizeText(input.city)
  const stateKey = normalizeState(input.state)

  return catalog
    .filter((entry) => {
      if (cityIbgeCode && entry.cityIbgeCode) {
        return normalizeDigits(entry.cityIbgeCode) === cityIbgeCode
      }

      return normalizeText(entry.city) === cityKey && normalizeState(entry.state) === stateKey
    })
    .map(({ cityIbgeCode: _cityIbgeCode, ...school }) => school)
}
