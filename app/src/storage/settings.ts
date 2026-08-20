import * as SecureStore from 'expo-secure-store';

/**
 * A app guarda localmente o endereço da API, o token de sessão, e os dados
 * do utilizador autenticado (para mostrar no Perfil sem ter de decifrar o
 * token ou voltar a pedir à API). Nenhum dado de ligação ao SQL Server passa
 * por aqui — isso vive só no servidor.
 */
const CHAVE_API_URL = 'api_url';
const CHAVE_TOKEN = 'auth_token';
const CHAVE_UTILIZADOR = 'utilizador';

export type Utilizador = {
  username: string;
  nome: string;
  abreviatura?: string;
  tecnicoId: number;
  email?: string;
};

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

export async function guardarUtilizador(utilizador: Utilizador) {
  await SecureStore.setItemAsync(CHAVE_UTILIZADOR, JSON.stringify(utilizador));
}

export async function obterUtilizador(): Promise<Utilizador | null> {
  const bruto = await SecureStore.getItemAsync(CHAVE_UTILIZADOR);
  return bruto ? JSON.parse(bruto) : null;
}

export async function limparSessao() {
  await SecureStore.deleteItemAsync(CHAVE_TOKEN);
  await SecureStore.deleteItemAsync(CHAVE_UTILIZADOR);
}

export async function limparTudo() {
  await SecureStore.deleteItemAsync(CHAVE_TOKEN);
  await SecureStore.deleteItemAsync(CHAVE_UTILIZADOR);
  await SecureStore.deleteItemAsync(CHAVE_API_URL);
}

/**
 * Rascunho de uma intervenção em curso (relatório + fotos ainda por enviar),
 * guardado localmente por mhstamp. Existe para não perderes o trabalho feito
 * se a app fechar/o telemóvel desligar a meio de uma intervenção — ao
 * reabrires essa intervenção, o rascunho é restaurado automaticamente.
 * Não é "modo offline" (isso foi decidido que não é preciso): é só uma rede
 * de segurança para o que já escreveste/tiraste antes de carregares em
 * "Concluir".
 */
export type RascunhoIntervencao = {
  relatorio: string;
  fotos: { uri: string; nome: string; enviada: boolean }[];
};

function chaveRascunho(mhstamp: string) {
  return `rascunho_intervencao_${mhstamp}`;
}

export async function guardarRascunhoIntervencao(mhstamp: string, rascunho: RascunhoIntervencao) {
  await SecureStore.setItemAsync(chaveRascunho(mhstamp), JSON.stringify(rascunho));
}

export async function obterRascunhoIntervencao(mhstamp: string): Promise<RascunhoIntervencao | null> {
  const bruto = await SecureStore.getItemAsync(chaveRascunho(mhstamp));
  return bruto ? JSON.parse(bruto) : null;
}

export async function limparRascunhoIntervencao(mhstamp: string) {
  await SecureStore.deleteItemAsync(chaveRascunho(mhstamp));
}
