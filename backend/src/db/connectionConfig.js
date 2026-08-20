const { sql: sqlConfig } = require('../config/env');

/**
 * Configuração de ligação partilhada por tudo o que fala com o SQL Server
 * (o pool da API, e o instalador em backend/installer/install-sql.js).
 *
 * Importante: "port" e "instanceName" são mutuamente exclusivos para o driver
 * mssql/tedious — com instância nomeada (ex: SERVIDOR\SQLEXP), a porta é
 * descoberta sozinha via SQL Server Browser (porta UDP 1434). Nunca os dois
 * ao mesmo tempo, ou a ligação falha.
 */
function construirConfigLigacao() {
  return {
    server: sqlConfig.server,
    database: sqlConfig.database,
    user: sqlConfig.user,
    password: sqlConfig.password,
    ...(sqlConfig.instanceName ? {} : { port: sqlConfig.port || 1433 }),
    options: {
      encrypt: sqlConfig.encrypt,
      trustServerCertificate: sqlConfig.trustServerCertificate,
      ...(sqlConfig.instanceName ? { instanceName: sqlConfig.instanceName } : {}),
    },
  };
}

module.exports = { construirConfigLigacao };
