const express = require('express');
const { sql, executeProcedure } = require('../db/pool');
const { autenticar } = require('../middleware/auth');

const router = express.Router();
router.use(autenticar);

/**
 * GET /equipamentos?pesquisa=texto
 * Lista/pesquisa equipamentos via sp_ObterEquipamentos.
 */
router.get('/', async (req, res) => {
  const pesquisa = req.query.pesquisa || null;
  req.logInfo = { accao: 'Consultar equipamentos', spNome: 'sp_ObterEquipamentos', parametros: { pesquisa } };
  try {
    const resultado = await executeProcedure('sp_ObterEquipamentos', {
      Pesquisa: { type: sql.NVarChar(200), value: pesquisa },
    });
    res.json(resultado.recordset);
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao consultar equipamentos.', detalhe: err.message });
  }
});

/**
 * GET /equipamentos/:codigo
 * Aceita o código lido por QR code ou o identificador interno — sp_ObterEquipamento decide.
 */
router.get('/:codigo', async (req, res) => {
  const { codigo } = req.params;
  req.logInfo = { accao: `Consultar equipamento ${codigo}`, spNome: 'sp_ObterEquipamento', parametros: { codigo } };
  try {
    const resultado = await executeProcedure('sp_ObterEquipamento', {
      Codigo: { type: sql.NVarChar(50), value: codigo },
    });
    if (!resultado.recordset?.length) {
      return res.status(404).json({ erro: 'Equipamento não encontrado.' });
    }
    res.json(resultado.recordset[0]);
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao consultar equipamento.', detalhe: err.message });
  }
});

/**
 * GET /equipamentos/:codigo/historico
 * Histórico de intervenções via sp_ObterHistoricoEquipamento.
 */
router.get('/:codigo/historico', async (req, res) => {
  const { codigo } = req.params;
  req.logInfo = { accao: `Histórico do equipamento ${codigo}`, spNome: 'sp_ObterHistoricoEquipamento', parametros: { codigo } };
  try {
    const resultado = await executeProcedure('sp_ObterHistoricoEquipamento', {
      Codigo: { type: sql.NVarChar(50), value: codigo },
    });
    res.json(resultado.recordset);
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao consultar histórico.', detalhe: err.message });
  }
});

module.exports = router;
