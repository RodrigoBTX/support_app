const fs = require('fs');
const path = require('path');
const { sql, executeProcedure } = require('../db/pool');

const FALLBACK_LOG_DIR = path.join(__dirname, '..', '..', 'logs');

/**
 * Regista uma ação da aplicação. Vai sempre primeiro para a tabela LogsAplicacao (via sp_InserirLog),
 * porque é isso que o backoffice consulta. Se a própria ligação à BD falhar, cai para um ficheiro
 * local rotativo por dia — só para não perdermos rasto de erros de infraestrutura.
 */
async function registarLog({ utilizador, dispositivoId, accao, spNome, parametros, sucesso, duracaoMs, erro }) {
  try {
    await executeProcedure('sp_InserirLog', {
      Utilizador: { type: sql.NVarChar(100), value: utilizador || null },
      DispositivoId: { type: sql.NVarChar(100), value: dispositivoId || null },
      Accao: { type: sql.NVarChar(200), value: accao },
      SpNome: { type: sql.NVarChar(100), value: spNome || null },
      Parametros: { type: sql.NVarChar(sql.MAX), value: parametros ? JSON.stringify(parametros) : null },
      Sucesso: { type: sql.Bit, value: sucesso },
      DuracaoMs: { type: sql.Int, value: duracaoMs || null },
      Erro: { type: sql.NVarChar(sql.MAX), value: erro || null },
    });
  } catch (dbErr) {
    logParaFicheiro({ utilizador, accao, spNome, sucesso, erro: erro || dbErr.message });
  }
}

function logParaFicheiro(entry) {
  try {
    if (!fs.existsSync(FALLBACK_LOG_DIR)) fs.mkdirSync(FALLBACK_LOG_DIR, { recursive: true });
    const ficheiro = path.join(FALLBACK_LOG_DIR, `${new Date().toISOString().slice(0, 10)}.log`);
    const linha = JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n';
    fs.appendFileSync(ficheiro, linha);
  } catch (_) {
    // último recurso — se nem isto funcionar, não há mais nada a fazer aqui.
  }
}

module.exports = { registarLog };
