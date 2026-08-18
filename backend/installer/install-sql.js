/**
 * Corre os scripts SQL de infraestrutura (backend/sql/infra/*.sql) contra a instância
 * definida no .env. Idempotente — pode ser corrido tantas vezes quantas forem precisas
 * (é o que o instalador Windows faz na primeira instalação, e o que o botão
 * "Reinstalar / Verificar SPs" do backoffice faz depois).
 */
const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const { sql: sqlConfig } = require('../src/config/env');

async function instalarInfraestrutura() {
  const pool = await new sql.ConnectionPool({
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
  }).connect();

  const pastaInfra = path.join(__dirname, '..', 'sql', 'infra');
  const ficheiros = fs.readdirSync(pastaInfra).filter((f) => f.endsWith('.sql')).sort();

  for (const ficheiro of ficheiros) {
    const conteudo = fs.readFileSync(path.join(pastaInfra, ficheiro), 'utf8');
    // "GO" não é T-SQL válido para o driver — separa em lotes, tal como o SSMS faria.
    const lotes = conteudo.split(/^\s*GO\s*$/im).map((s) => s.trim()).filter(Boolean);
    for (const lote of lotes) {
      await pool.request().batch(lote);
    }
    console.log(`Aplicado: ${ficheiro}`);
  }

  await pool.close();
}

if (require.main === module) {
  instalarInfraestrutura()
    .then(() => {
      console.log('Infraestrutura instalada/verificada com sucesso.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Falha a instalar infraestrutura:', err.message);
      process.exit(1);
    });
}

module.exports = { instalarInfraestrutura };
