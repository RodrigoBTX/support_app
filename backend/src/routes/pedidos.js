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
 * GET /pedidos/agendados — próximos pedidos agendados do técnico autenticado.
 */
router.get('/agendados', async (req, res) => {
  req.logInfo = { accao: 'Consultar pedidos agendados', spNome: 'sp_ObterPedidosTecnico' };
  try {
    const resultado = await executeProcedure('sp_ObterPedidosTecnico', {
      TecnicoId: { type: sql.Int, value: req.user.tecnicoId },
      Estado: { type: sql.NVarChar(30), value: 'Agendado' },
    });
    res.json(resultado.recordset);
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao consultar pedidos agendados.', detalhe: err.message });
  }
});

/**
 * GET /pedidos/agenda?data=YYYY-MM-DD — agenda do técnico para um dia.
 */
router.get('/agenda', async (req, res) => {
  const data = req.query.data || new Date().toISOString().slice(0, 10);
  req.logInfo = { accao: `Consultar agenda ${data}`, spNome: 'sp_ObterAgendaTecnico', parametros: { data } };
  try {
    const resultado = await executeProcedure('sp_ObterAgendaTecnico', {
      TecnicoId: { type: sql.Int, value: req.user.tecnicoId },
      Data: { type: sql.Date, value: data },
    });
    res.json(resultado.recordset);
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao consultar agenda.', detalhe: err.message });
  }
});

/**
 * GET /pedidos/:id — detalhe de um pedido.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  req.logInfo = { accao: `Consultar pedido #${id}`, spNome: 'sp_ObterPedidoDetalhe', parametros: { id } };
  try {
    const resultado = await executeProcedure('sp_ObterPedidoDetalhe', {
      PedidoId: { type: sql.Int, value: id },
    });
    if (!resultado.recordset?.length) return res.status(404).json({ erro: 'Pedido não encontrado.' });
    res.json(resultado.recordset[0]);
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao consultar pedido.', detalhe: err.message });
  }
});

/**
 * POST /pedidos — cria um novo pedido de assistência.
 * Body: { equipamentoCodigo, tipo, prioridade, descricao }
 */
router.post('/', async (req, res) => {
  const { equipamentoCodigo, tipo, prioridade, descricao } = req.body;
  req.logInfo = { accao: 'Criar pedido', spNome: 'sp_CriarPedido', parametros: { equipamentoCodigo, tipo, prioridade } };
  try {
    const resultado = await executeProcedure('sp_CriarPedido', {
      EquipamentoCodigo: { type: sql.NVarChar(50), value: equipamentoCodigo },
      TecnicoId: { type: sql.Int, value: req.user.tecnicoId },
      Tipo: { type: sql.NVarChar(50), value: tipo },
      Prioridade: { type: sql.NVarChar(20), value: prioridade },
      Descricao: { type: sql.NVarChar(sql.MAX), value: descricao },
    });
    res.status(201).json(resultado.recordset?.[0] || { criado: true });
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao criar pedido.', detalhe: err.message });
  }
});

/**
 * POST /pedidos/:id/fotos — upload de uma foto associada à intervenção.
 * Guarda o ficheiro em uploads/{ano}/{mes}/{pedidoId}/ e regista o caminho via sp_RegistarFoto.
 */
router.post('/:id/fotos', upload.single('foto'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ erro: 'Ficheiro "foto" em falta.' });

  const agora = new Date();
  const pastaDestino = path.join(uploadsPath, String(agora.getFullYear()), String(agora.getMonth() + 1).padStart(2, '0'), String(id));
  fs.mkdirSync(pastaDestino, { recursive: true });

  const nomeFinal = `${agora.getTime()}_${req.file.originalname}`;
  const caminhoFinal = path.join(pastaDestino, nomeFinal);
  fs.renameSync(req.file.path, caminhoFinal);

  req.logInfo = {
    accao: `Upload de foto — pedido #${id}`,
    spNome: 'sp_RegistarFoto',
    parametros: { pedidoId: id, ficheiro: nomeFinal, tamanhoKB: Math.round(req.file.size / 1024) },
  };

  try {
    await executeProcedure('sp_RegistarFoto', {
      PedidoId: { type: sql.Int, value: id },
      CaminhoFicheiro: { type: sql.NVarChar(400), value: caminhoFinal },
      DataHora: { type: sql.DateTime, value: agora },
    });
    res.status(201).json({ guardado: true, caminho: caminhoFinal });
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao registar foto.', detalhe: err.message });
  }
});

/**
 * POST /pedidos/:id/concluir — fecha o pedido, associando assinatura do cliente.
 * Body: { assinaturaBase64 }
 */
router.post('/:id/concluir', async (req, res) => {
  const { id } = req.params;
  const { assinaturaBase64 } = req.body;
  if (!assinaturaBase64) return res.status(400).json({ erro: 'assinaturaBase64 é obrigatória.' });

  const agora = new Date();
  const pastaDestino = path.join(uploadsPath, String(agora.getFullYear()), String(agora.getMonth() + 1).padStart(2, '0'), String(id));
  fs.mkdirSync(pastaDestino, { recursive: true });
  const caminhoAssinatura = path.join(pastaDestino, `assinatura_${agora.getTime()}.png`);
  fs.writeFileSync(caminhoAssinatura, Buffer.from(assinaturaBase64, 'base64'));

  req.logInfo = { accao: `Concluir pedido #${id}`, spNome: 'sp_ConcluirPedido', parametros: { pedidoId: id } };

  try {
    const resultado = await executeProcedure('sp_ConcluirPedido', {
      PedidoId: { type: sql.Int, value: id },
      TecnicoId: { type: sql.Int, value: req.user.tecnicoId },
      CaminhoAssinatura: { type: sql.NVarChar(400), value: caminhoAssinatura },
      DataHora: { type: sql.DateTime, value: agora },
    });
    res.json(resultado.recordset?.[0] || { concluido: true });
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao concluir pedido.', detalhe: err.message });
  }
});

module.exports = router;
