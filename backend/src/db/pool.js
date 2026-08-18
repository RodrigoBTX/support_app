const sql = require('mssql');
const { sql: sqlConfig } = require('../config/env');

/**
 * Pool de ligação único e partilhado por toda a API.
 * Todas as queries desta aplicação passam por Stored Procedures — nunca SQL dinâmico.
 */
let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    const config = {
      server: sqlConfig.server,
      port: sqlConfig.port,
      database: sqlConfig.database,
      user: sqlConfig.user,
      password: sqlConfig.password,
      options: {
        encrypt: sqlConfig.encrypt,
        trustServerCertificate: sqlConfig.trustServerCertificate,
        ...(sqlConfig.instanceName ? { instanceName: sqlConfig.instanceName } : {}),
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };
    poolPromise = new sql.ConnectionPool(config).connect();
    poolPromise.catch((err) => {
      // Permite tentar reconectar numa próxima chamada em vez de ficar preso num erro antigo.
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

/**
 * Executa uma Stored Procedure com parâmetros nomeados.
 * @param {string} spName - nome da stored procedure, ex: "sp_ObterEquipamentos"
 * @param {Record<string, {type: any, value: any}>} params
 */
async function executeProcedure(spName, params = {}) {
  const pool = await getPool();
  const request = pool.request();
  for (const [name, { type, value }] of Object.entries(params)) {
    request.input(name, type, value);
  }
  return request.execute(spName);
}

module.exports = { sql, getPool, executeProcedure };
