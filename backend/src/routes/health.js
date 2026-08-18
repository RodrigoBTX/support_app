const express = require('express');
const { getPool } = require('../db/pool');

const router = express.Router();

/**
 * GET /health
 * Usado pela app (ecrã de Configuração) e pelo backoffice para confirmar que a API
 * está no ar e consegue mesmo falar com o SQL Server — não só que o processo está vivo.
 */
router.get('/health', async (req, res) => {
  const resultado = { api: 'ok', sqlServer: 'desconhecido', timestamp: new Date().toISOString() };
  try {
    await getPool();
    resultado.sqlServer = 'ok';
    res.json(resultado);
  } catch (err) {
    resultado.sqlServer = 'falhou';
    resultado.detalhe = err.message;
    res.status(503).json(resultado);
  }
});

module.exports = router;
