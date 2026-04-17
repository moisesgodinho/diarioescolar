import { normalizeDigits } from './platformRegistry';

export interface CepLookupResult {
  city: string;
  cityIbgeCode: string | null;
  neighborhood: string;
  state: string;
  street: string;
  zipCode: string;
}

export async function fetchAddressByCep(zipCode: string): Promise<CepLookupResult> {
  const normalizedZipCode = normalizeDigits(zipCode);

  if (normalizedZipCode.length !== 8) {
    throw new Error('Digite um CEP com 8 numeros.');
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalizedZipCode}/json/`);

  if (!response.ok) {
    throw new Error('Nao foi possivel consultar o CEP agora.');
  }

  const payload = (await response.json()) as {
    bairro?: string;
    cep?: string;
    erro?: boolean;
    ibge?: string;
    localidade?: string;
    logradouro?: string;
    uf?: string;
  };

  if (payload.erro) {
    throw new Error('CEP nao encontrado.');
  }

  return {
    city: payload.localidade?.trim() || '',
    cityIbgeCode: payload.ibge?.trim() || null,
    neighborhood: payload.bairro?.trim() || '',
    state: payload.uf?.trim() || '',
    street: payload.logradouro?.trim() || '',
    zipCode: normalizedZipCode,
  };
}
