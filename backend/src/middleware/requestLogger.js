const { registarLog } = require('../services/logService');

/**
 * Middleware global: mede a duração de cada pedido e regista-o.
 * Cada rota deve preencher req.logInfo = { accao, spNome, parametros } antes de responder,
 * para que o log fique descritivo em vez de só "GET /pedidos".
 */
function requestLogger(req, res, next) {
  const inicio = Date.now();
  res.on('finish', () => {
    const duracaoMs = Date.now() - inicio;
    const sucesso = res.statusCode < 400;
    const info = req.logInfo || {};
    registarLog({
      utilizador: req.user?.username || info.utilizador,
      dispositivoId: req.headers['x-device-id'],
      accao: info.accao || `${req.method} ${req.originalUrl}`,
      spNome: info.spNome,
      parametros: info.parametros,
      sucesso,
      duracaoMs,
      erro: sucesso ? null : info.erro || `HTTP ${res.statusCode}`,
    }).catch(() => {});
  });
  next();
}

module.exports = requestLogger;
