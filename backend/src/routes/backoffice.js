const express = require('express');
const { sql, getPool, executeProcedure } = require('../db/pool');
const { logRetentionDays } = require('../config/env');

const router = express.Router();

/**
 * Lista de SPs que a API espera encontrar na base de dados — usada pelo painel
 * "Verificação de Stored Procedures" do backoffice (docs/ARQUITETURA.md tem o contrato de cada uma).
 */
const SPS_ESPERADOS = [
  { nome: 'sp_ObterEquipamentos', usadoPor: 'Lista de equipamentos' },
  { nome: 'sp_ObterEquipamento', usadoPor: 'Detalhe do equipamento' },
  { nome: 'sp_ObterHistoricoEquipamento', usadoPor: 'Histórico do equipamento' },
  { nome: 'sp_ObterPedidosTecnico', usadoPor: 'Dashboard / próximos agendados' },
  { nome: 'sp_ObterAgendaTecnico', usadoPor: 'Agenda' },
  { nome: 'sp_ObterPedidoDetalhe', usadoPor: 'Detalhe do pedido' },
  { nome: 'sp_CriarPedido', usadoPor: 'Novo pedido' },
  { nome: 'sp_RegistarFoto', usadoPor: 'Upload de foto' },
  { nome: 'sp_ConcluirPedido', usadoPor: 'Concluir pedido' },
  { nome: 'sp_ValidarUtilizador', usadoPor: 'Login' },
  { nome: 'sp_RegistarDispositivo', usadoPor: 'Login / registo de dispositivo' },
  { nome: 'sp_InserirLog', usadoPor: 'Middleware de logging' },
  { nome: 'sp_LimparLogsAntigos', usadoPor: 'Limpeza automática de logs' },
];

/** GET /backoffice/status — resumo para os cartões do topo. */
router.get('/status', async (req, res) => {
  const resposta = { api: 'ok', sqlServer: 'falhou', spsEmFalta: null };
  try {
    await getPool();
    resposta.sqlServer = 'ok';
  } catch (err) {
    resposta.detalheSql = err.message;
  }
  res.json(resposta);
});

/** GET /backoffice/sps — compara SPS_ESPERADOS com o que existe em sys.procedures. */
router.get('/sps', async (req, res) => {
  try {
    const pool = await getPool();
    const resultado = await pool.request().query('SELECT name FROM sys.procedures');
    const existentes = new Set(resultado.recordset.map((r) => r.name));
    const lista = SPS_ESPERADOS.map((sp) => ({ ...sp, encontrado: existentes.has(sp.nome) }));
    res.json(lista);
  } catch (err) {
    res.status(503).json({ erro: 'Não foi possível ligar à base de dados para verificar os SPs.', detalhe: err.message });
  }
});

/** GET /backoffice/dispositivos — últimos dispositivos a comunicar com a API. */
router.get('/dispositivos', async (req, res) => {
  try {
    const resultado = await executeProcedure('sp_ObterDispositivosLigados', {});
    res.json(resultado.recordset);
  } catch (err) {
    res.status(503).json({ erro: 'Erro ao consultar dispositivos.', detalhe: err.message });
  }
});

/**
 * GET /backoffice/logs?utilizador=&accao=&estado=&desde=
 * Consulta paginada aos logs — via sp_ObterLogs (a implementar).
 */
router.get('/logs', async (req, res) => {
  const { utilizador, accao, estado, desde, pagina = 1, porPagina = 50 } = req.query;
  try {
    const resultado = await executeProcedure('sp_ObterLogs', {
      Utilizador: { type: sql.NVarChar(100), value: utilizador || null },
      Accao: { type: sql.NVarChar(200), value: accao || null },
      Estado: { type: sql.NVarChar(20), value: estado || null },
      Desde: { type: sql.DateTime, value: desde ? new Date(desde) : null },
      Pagina: { type: sql.Int, value: Number(pagina) },
      PorPagina: { type: sql.Int, value: Number(porPagina) },
    });
    res.json(resultado.recordset);
  } catch (err) {
    res.status(503).json({ erro: 'Erro ao consultar logs.', detalhe: err.message });
  }
});

/** POST /backoffice/sps/reinstalar — reexecuta os scripts SQL de infraestrutura (idempotentes). */
router.post('/sps/reinstalar', async (req, res) => {
  try {
    const { instalarInfraestrutura } = require('../../installer/install-sql');
    await instalarInfraestrutura();
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Falha ao reinstalar SPs.', detalhe: err.message });
  }
});

/** GET/POST /backoffice/definicoes — retenção de logs, pasta de uploads, etc. */
router.get('/definicoes', (req, res) => {
  res.json({ logRetentionDays, uploadsPath: require('../config/env').uploadsPath });
});

module.exports = router;
