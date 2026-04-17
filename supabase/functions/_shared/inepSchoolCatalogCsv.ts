import { type SchoolCatalogCacheRecord } from './baseDosDadosSchoolCatalog.ts'

export interface ParseInepSchoolCatalogCsvInput {
  city: string
  cityIbgeCode?: string | null
  csvText: string
  state: string
}

export interface ParseInepSchoolCatalogCsvResult {
  cacheRecords: SchoolCatalogCacheRecord[]
  duplicateRowsCount: number
  ignoredRowsCount: number
  matchedRowsCount: number
  totalRowsCount: number
}

type CsvRecord = Record<string, string>

const HEADER_ALIASES = {
  administrativeDependency: ['dependencia administrativa', 'categoria administrativa'],
  address: ['endereco'],
  city: ['municipio'],
  differentiatedLocation: ['localidade diferenciada'],
  educationStages: ['etapas e modalidade de ensino oferecidas'],
  inepCode: ['codigo inep'],
  latitude: ['latitude'],
  longitude: ['longitude'],
  phone: ['telefone'],
  privateCategory: ['categoria escola privada'],
  publicAgreement: ['conveniada poder publico'],
  regulation: ['regulamentacao pelo conselho de educacao'],
  restriction: ['restricao de atendimento'],
  schoolLocation: ['localizacao'],
  schoolName: ['escola'],
  schoolSize: ['porte da escola'],
  state: ['uf'],
  extraOffers: ['outras ofertas educacionais'],
} as const

export function parseInepSchoolCatalogCsv(
  input: ParseInepSchoolCatalogCsvInput,
): ParseInepSchoolCatalogCsvResult {
  const rows = parseCsvText(input.csvText)

  if (rows.length <= 1) {
    return {
      cacheRecords: [],
      duplicateRowsCount: 0,
      ignoredRowsCount: 0,
      matchedRowsCount: 0,
      totalRowsCount: 0,
    }
  }

  const headerRow = rows[0].map((header) => normalizeText(header))
  const dataRows = rows.slice(1)
  const targetCity = normalizeText(input.city)
  const targetState = normalizeState(input.state)
  const dedupedRows = new Map<string, SchoolCatalogCacheRecord>()
  let matchedRowsCount = 0
  let ignoredRowsCount = 0

  for (const rawRow of dataRows) {
    const row = rowToRecord(headerRow, rawRow)

    if (isEmptyRow(row)) {
      continue
    }

    const rowState = normalizeState(readValue(row, HEADER_ALIASES.state))
    const rowCity = normalizeText(readValue(row, HEADER_ALIASES.city))

    if ((rowState && rowState !== targetState) || (rowCity && rowCity !== targetCity)) {
      ignoredRowsCount += 1
      continue
    }

    const cacheRecord = mapCsvRowToCacheRecord(row, input)

    if (!cacheRecord) {
      ignoredRowsCount += 1
      continue
    }

    matchedRowsCount += 1
    dedupedRows.set(cacheRecord.inep_code, cacheRecord)
  }

  return {
    cacheRecords: [...dedupedRows.values()],
    duplicateRowsCount: matchedRowsCount - dedupedRows.size,
    ignoredRowsCount,
    matchedRowsCount,
    totalRowsCount: dataRows.length,
  }
}

function mapCsvRowToCacheRecord(
  row: CsvRecord,
  input: ParseInepSchoolCatalogCsvInput,
): SchoolCatalogCacheRecord | null {
  const inepCode = normalizeDigits(readValue(row, HEADER_ALIASES.inepCode))
  const schoolName = readValue(row, HEADER_ALIASES.schoolName)
  const zone = normalizeZone(readValue(row, HEADER_ALIASES.schoolLocation))

  if (!inepCode || !schoolName || !zone) {
    return null
  }

  return {
    address: readValue(row, HEADER_ALIASES.address) || null,
    administrative_dependency:
      readValue(row, HEADER_ALIASES.administrativeDependency) || null,
    city: input.city.trim(),
    city_ibge_code: input.cityIbgeCode?.trim() || null,
    education_stages: parseEducationStages(readValue(row, HEADER_ALIASES.educationStages)),
    inep_code: inepCode,
    neighborhood: null,
    operational_status: readValue(row, HEADER_ALIASES.restriction) || null,
    phone: normalizePhone(readValue(row, HEADER_ALIASES.phone)) || null,
    raw_data: {
      ...row,
      _extra_offers: readValue(row, HEADER_ALIASES.extraOffers) || null,
      _latitude: readValue(row, HEADER_ALIASES.latitude) || null,
      _longitude: readValue(row, HEADER_ALIASES.longitude) || null,
      _private_category: readValue(row, HEADER_ALIASES.privateCategory) || null,
      _public_agreement: readValue(row, HEADER_ALIASES.publicAgreement) || null,
      _regulation: readValue(row, HEADER_ALIASES.regulation) || null,
      _school_size: readValue(row, HEADER_ALIASES.schoolSize) || null,
      _differentiated_location: readValue(row, HEADER_ALIASES.differentiatedLocation) || null,
    },
    school_name: schoolName,
    source_year: null,
    state: normalizeState(input.state),
    synced_at: new Date().toISOString(),
    zone,
  }
}

function parseEducationStages(value: string) {
  if (!value) {
    return []
  }

  return [
    ...new Set(
      value
        .split(/[;,|/]/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ]
}

function normalizeZone(value: string): 'Urbana' | 'Rural' | null {
  const normalized = normalizeText(value)

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

function readValue(row: CsvRecord, aliases: readonly string[]) {
  for (const alias of aliases) {
    const value = row[normalizeText(alias)]

    if (value) {
      return value.trim()
    }
  }

  return ''
}

function rowToRecord(headers: string[], row: string[]) {
  return headers.reduce<CsvRecord>((record, header, index) => {
    if (header) {
      record[header] = row[index]?.trim() ?? ''
    }

    return record
  }, {})
}

function isEmptyRow(row: CsvRecord) {
  return Object.values(row).every((value) => !value.trim())
}

function parseCsvText(csvText: string) {
  const sanitizedText = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const delimiter = detectDelimiter(sanitizedText)
  const rows: string[][] = []
  let currentCell = ''
  let currentRow: string[] = []
  let isInsideQuotes = false

  for (let index = 0; index < sanitizedText.length; index += 1) {
    const character = sanitizedText[index]
    const nextCharacter = sanitizedText[index + 1]

    if (character === '"') {
      if (isInsideQuotes && nextCharacter === '"') {
        currentCell += '"'
        index += 1
      } else {
        isInsideQuotes = !isInsideQuotes
      }

      continue
    }

    if (character === delimiter && !isInsideQuotes) {
      currentRow.push(currentCell)
      currentCell = ''
      continue
    }

    if (character === '\n' && !isInsideQuotes) {
      currentRow.push(currentCell)
      rows.push(currentRow)
      currentCell = ''
      currentRow = []
      continue
    }

    currentCell += character
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell)
    rows.push(currentRow)
  }

  return rows
}

function detectDelimiter(csvText: string) {
  const headerLine = csvText.split('\n', 1)[0] ?? ''
  const commaCount = (headerLine.match(/,/g) ?? []).length
  const semicolonCount = (headerLine.match(/;/g) ?? []).length

  return semicolonCount > commaCount ? ';' : ','
}

function normalizeState(value: string) {
  return value.trim().toUpperCase()
}

function normalizePhone(value: string) {
  const digits = normalizeDigits(value)
  return digits || ''
}

function normalizeDigits(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '')
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}
