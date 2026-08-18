import * as SecureStore from 'expo-secure-store';

/**
 * A app só guarda localmente o endereço da API e o token de sessão.
 * Nenhum dado de ligação ao SQL Server passa por aqui — isso vive só no servidor.
 */
const CHAVE_API_URL = 'api_url';
const CHAVE_TOKEN = 'auth_token';

export async function guardarApiUrl(url: string) {
  await SecureStore.setItemAsync(CHAVE_API_URL, url);
}

export async function obterApiUrl(): Promise<string | null> {
  return SecureStore.getItemAsync(CHAVE_API_URL);
}

export async function guardarToken(token: string) {
  await SecureStore.setItemAsync(CHAVE_TOKEN, token);
}

export async function obterToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CHAVE_TOKEN);
}

export async function limparSessao() {
  await SecureStore.deleteItemAsync(CHAVE_TOKEN);
}

export async function limparTudo() {
  await SecureStore.deleteItemAsync(CHAVE_TOKEN);
  await SecureStore.deleteItemAsync(CHAVE_API_URL);
}
