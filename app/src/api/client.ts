import { obterApiUrl, obterToken } from '../storage/settings';

/**
 * Cliente HTTP fino sobre fetch. Sem dados fictícios/mocks — todos os pedidos
 * vão mesmo para a API configurada.
 */
async function pedido(caminho: string, opcoes: RequestInit = {}) {
  const apiUrl = await obterApiUrl();
  if (!apiUrl) {
    throw new Error('Endereço da API não configurado. Vai a Perfil > Configuração da ligação.');
  }
  const token = await obterToken();

  const resposta = await fetch(`${apiUrl}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opcoes.headers || {}),
    },
  });

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new Error(corpo?.erro || `Erro ${resposta.status} ao contactar a API.`);
  }
  return corpo;
}

/** Upload de ficheiro (multipart/form-data) — não usa Content-Type: application/json. */
async function pedidoFicheiro(caminho: string, formData: FormData) {
  const apiUrl = await obterApiUrl();
  if (!apiUrl) {
    throw new Error('Endereço da API não configurado. Vai a Perfil > Configuração da ligação.');
  }
  const token = await obterToken();

  const resposta = await fetch(`${apiUrl}${caminho}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new Error(corpo?.erro || `Erro ${resposta.status} ao contactar a API.`);
  }
  return corpo;
}

export const api = {
  health: () => pedido('/health'),
  login: (dados: { username: string; password: string; deviceId: string; deviceName?: string; platform?: string; appVersion?: string }) =>
    pedido('/auth/login', { method: 'POST', body: JSON.stringify(dados) }),

  // Equipamentos (tabela ma) — devolve sempre uma lista, mesmo por código exato.
  equipamentos: (pesquisa?: string) => pedido(`/equipamentos${pesquisa ? `?pesquisa=${encodeURIComponent(pesquisa)}` : ''}`),
  equipamento: (codigo: string) => pedido(`/equipamentos/${encodeURIComponent(codigo)}`),
  historicoEquipamento: (codigo: string) => pedido(`/equipamentos/${encodeURIComponent(codigo)}/historico`),

  // Pedidos (pa) / Intervenções (mh)
  pedidosAgendados: () => pedido('/pedidos/agendados'),
  pedidosRealizados: (top = 5) => pedido(`/pedidos/realizadas?top=${top}`),
  agenda: (inicio: string, fim?: string) => pedido(`/pedidos/agenda?inicio=${inicio}${fim ? `&fim=${fim}` : ''}`),
  pedidoDetalhe: (nopat: string | number) => pedido(`/pedidos/${nopat}`),
  iniciarIntervencao: (nopat: string | number, mhstamp: string) =>
    pedido(`/pedidos/${nopat}/iniciar`, { method: 'POST', body: JSON.stringify({ mhstamp }) }),
  concluirIntervencao: (nopat: string | number, mhstamp: string, relatorio: string, assinaturaBase64: string) =>
    pedido(`/pedidos/${nopat}/concluir`, { method: 'POST', body: JSON.stringify({ mhstamp, relatorio, assinaturaBase64 }) }),
  enviarFoto: (nopat: string | number, mhstamp: string, uriFicheiro: string, nomeFicheiro: string) => {
    const formData = new FormData();
    formData.append('mhstamp', mhstamp);
    // @ts-ignore — formato esperado pelo React Native para upload de ficheiros locais
    formData.append('foto', { uri: uriFicheiro, name: nomeFicheiro, type: 'image/jpeg' });
    return pedidoFicheiro(`/pedidos/${nopat}/fotos`, formData);
  },
};
