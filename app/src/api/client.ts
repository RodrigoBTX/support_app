import { obterApiUrl, obterToken } from '../storage/settings';

/**
 * Cliente HTTP fino sobre fetch. Sem dados fictícios/mocks — todos os pedidos
 * vão mesmo para a API configurada. Se a API ainda não tiver os SPs de negócio
 * implementados, os pedidos vão simplesmente devolver erro 500, o que é esperado
 * nesta fase de desenvolvimento.
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

export const api = {
  health: () => pedido('/health'),
  login: (dados: { username: string; password: string; deviceId: string; deviceName?: string; platform?: string; appVersion?: string }) =>
    pedido('/auth/login', { method: 'POST', body: JSON.stringify(dados) }),
  equipamentos: (pesquisa?: string) => pedido(`/equipamentos${pesquisa ? `?pesquisa=${encodeURIComponent(pesquisa)}` : ''}`),
  equipamento: (codigo: string) => pedido(`/equipamentos/${encodeURIComponent(codigo)}`),
  historicoEquipamento: (codigo: string) => pedido(`/equipamentos/${encodeURIComponent(codigo)}/historico`),
  pedidosAgendados: () => pedido('/pedidos/agendados'),
  agenda: (data: string) => pedido(`/pedidos/agenda?data=${data}`),
  pedidoDetalhe: (id: string) => pedido(`/pedidos/${id}`),
  criarPedido: (dados: { equipamentoCodigo: string; tipo: string; prioridade: string; descricao: string }) =>
    pedido('/pedidos', { method: 'POST', body: JSON.stringify(dados) }),
  concluirPedido: (id: string, assinaturaBase64: string) =>
    pedido(`/pedidos/${id}/concluir`, { method: 'POST', body: JSON.stringify({ assinaturaBase64 }) }),
};
