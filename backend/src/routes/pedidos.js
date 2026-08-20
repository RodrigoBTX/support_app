const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sql, executeProcedure } = require('../db/pool');
const { autenticar } = require('../middleware/auth');
const { uploadsPath } = require('../config/env');

const router = express.Router();
router.use(autenticar);

const upload = multer({ dest: path.join(uploadsPath, 'tmp') });

/**
 * Pasta de uma intervenção: uploads/{mhstamp}/
 * Nome do ficheiro: {AAAAMMDD-de-hoje}_{numerador}.ext — o numerador conta
 * quantos ficheiros já existem nessa pasta para o dia de hoje e soma 1, para
 * suportar mais do que uma foto/assinatura no mesmo dia sem se sobreporem.
 */
function pastaIntervencao(mhstamp) {
  const pasta = path.join(uploadsPath, String(mhstamp));
  fs.mkdirSync(pasta, { recursive: true });
  return pasta;
}

function proximoNomeFicheiro(mhstamp, extensao) {
  const pasta = pastaIntervencao(mhstamp);
  const agora = new Date();
  const dataStr = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}`;
  const existentes = fs.readdirSync(pasta).filter((f) => f.startsWith(`${dataStr}_`));
  const numerador = existentes.length + 1;
  const nomeFicheiro = `${dataStr}_${numerador}${extensao}`;
  return { pasta, nomeFicheiro, caminhoCompleto: path.join(pasta, nomeFicheiro) };
}

/**
 * GET /pedidos/agendados — próximas intervenções (mh, realizada=0) do técnico autenticado.
 */
router.get('/agendados', async (req, res) => {
  req.logInfo = { accao: 'Consultar pedidos agendados', spNome: 'sp_ObterPedidosTecnico' };
  try {
    const resultado = await executeProcedure('sp_ObterPedidosTecnico', {
      TecnicoId: { type: sql.Int, value: req.user.tecnicoId },
      Realizada: { type: sql.Bit, value: 0 },
      Top: { type: sql.Int, value: null },
    });
    res.json(resultado.recordset);
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao consultar pedidos agendados.', detalhe: err.message });
  }
});

/**
 * GET /pedidos/realizadas?top=5 — últimas intervenções já concluídas do
 * técnico autenticado, mais recente primeiro.
 */
router.get('/realizadas', async (req, res) => {
  const top = req.query.top ? Number(req.query.top) : 5;
  req.logInfo = { accao: 'Consultar pedidos realizados', spNome: 'sp_ObterPedidosTecnico', parametros: { top } };
  try {
    const resultado = await executeProcedure('sp_ObterPedidosTecnico', {
      TecnicoId: { type: sql.Int, value: req.user.tecnicoId },
      Realizada: { type: sql.Bit, value: 1 },
      Top: { type: sql.Int, value: top },
    });
    res.json(resultado.recordset);
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao consultar pedidos realizados.', detalhe: err.message });
  }
});

/**
 * GET /pedidos/agenda?inicio=YYYY-MM-DD&fim=YYYY-MM-DD — agenda do técnico
 * num intervalo de dias (mx + mh). "fim" é opcional — sem ele devolve só o
 * dia de "inicio" (mantém compatibilidade com pedir um único dia).
 */
router.get('/agenda', async (req, res) => {
  const inicio = req.query.inicio || new Date().toISOString().slice(0, 10);
  const fim = req.query.fim || null;
  req.logInfo = { accao: `Consultar agenda ${inicio}${fim ? ` a ${fim}` : ''}`, spNome: 'sp_ObterAgendaTecnico', parametros: { inicio, fim } };
  try {
    const resultado = await executeProcedure('sp_ObterAgendaTecnico', {
      TecnicoId: { type: sql.Int, value: req.user.tecnicoId },
      DataInicio: { type: sql.Date, value: inicio },
      DataFim: { type: sql.Date, value: fim },
    });
    res.json(resultado.recordset);
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao consultar agenda.', detalhe: err.message });
  }
});

/**
 * GET /pedidos/:id — detalhe de um pedido (pa) + as suas intervenções (mh).
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  req.logInfo = { accao: `Consultar pedido #${id}`, spNome: 'sp_ObterPedidoDetalhe', parametros: { id } };
  try {
    const resultado = await executeProcedure('sp_ObterPedidoDetalhe', {
      PedidoId: { type: sql.Int, value: id },
    });
    // sp_ObterPedidoDetalhe devolve 2 resultsets: [0] = o pedido, [1] = as intervenções (mh) desse pedido.
    const pedido = resultado.recordsets?.[0]?.[0];
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });
    const intervencoes = resultado.recordsets?.[1] || [];
    res.json({ ...pedido, intervencoes });
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao consultar pedido.', detalhe: err.message });
  }
});

/**
 * POST /pedidos/:id/iniciar — marca o início de uma intervenção (mh).
 * Body: { mhstamp }
 * ":id" (nopat) fica só para contexto/log — quem identifica a intervenção é o mhstamp.
 */
router.post('/:id/iniciar', async (req, res) => {
  const { id } = req.params;
  const { mhstamp } = req.body;
  if (!mhstamp) return res.status(400).json({ erro: 'mhstamp é obrigatório.' });

  req.logInfo = { accao: `Iniciar intervenção — pedido #${id}`, spNome: 'sp_IniciarIntervencao', parametros: { pedidoId: id, mhstamp } };

  try {
    const resultado = await executeProcedure('sp_IniciarIntervencao', {
      MhStamp: { type: sql.VarChar(25), value: mhstamp },
    });
    res.json(resultado.recordset?.[0] || { iniciado: true });
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao iniciar intervenção.', detalhe: err.message });
  }
});

/**
 * POST /pedidos/:id/fotos — upload de uma foto associada à intervenção.
 * Body (multipart): foto (ficheiro), mhstamp
 * Guarda em uploads/{mhstamp}/{AAAAMMDD}_{numerador}.ext
 */
router.post('/:id/fotos', upload.single('foto'), async (req, res) => {
  const { id } = req.params;
  const { mhstamp } = req.body;
  if (!req.file) return res.status(400).json({ erro: 'Ficheiro "foto" em falta.' });
  if (!mhstamp) return res.status(400).json({ erro: 'mhstamp é obrigatório.' });

  const extensao = path.extname(req.file.originalname) || '.jpg';
  const { caminhoCompleto, nomeFicheiro } = proximoNomeFicheiro(mhstamp, extensao);
  fs.renameSync(req.file.path, caminhoCompleto);

  req.logInfo = {
    accao: `Upload de foto — pedido #${id}`,
    spNome: null,
    parametros: { pedidoId: id, mhstamp, ficheiro: nomeFicheiro, tamanhoKB: Math.round(req.file.size / 1024) },
  };

  res.status(201).json({ guardado: true, caminho: caminhoCompleto });
});

/**
 * POST /pedidos/:id/concluir — fecha a intervenção (mh), associando o relatório
 * e a assinatura do cliente.
 * Body: { mhstamp, relatorio, assinaturaBase64 }
 */
router.post('/:id/concluir', async (req, res) => {
  const { id } = req.params;
  const { mhstamp, relatorio, assinaturaBase64 } = req.body;
  if (!mhstamp) return res.status(400).json({ erro: 'mhstamp é obrigatório.' });
  if (!assinaturaBase64) return res.status(400).json({ erro: 'assinaturaBase64 é obrigatória.' });

  const { caminhoCompleto: caminhoAssinatura } = proximoNomeFicheiro(mhstamp, '.png');
  fs.writeFileSync(caminhoAssinatura, Buffer.from(assinaturaBase64, 'base64'));

  req.logInfo = {
    accao: `Concluir intervenção — pedido #${id}`,
    spNome: 'sp_ConcluirIntervencao',
    parametros: { pedidoId: id, mhstamp },
  };

  try {
    const resultado = await executeProcedure('sp_ConcluirIntervencao', {
      MhStamp: { type: sql.VarChar(25), value: mhstamp },
      PedidoId: { type: sql.Int, value: id },
      Relatorio: { type: sql.NVarChar(sql.MAX), value: relatorio || null },
    });
    res.json({ ...(resultado.recordset?.[0] || { concluido: true }), assinatura: caminhoAssinatura });
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao concluir intervenção.', detalhe: err.message });
  }
});

module.exports = router;
