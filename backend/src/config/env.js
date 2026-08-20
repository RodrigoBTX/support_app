require('dotenv').config();

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variável de ambiente em falta: ${name}. Confirma o ficheiro .env (ver .env.example).`);
  }
  return value;
}

module.exports = {
  api: {
    port: Number(process.env.API_PORT || 4000),
    jwtSecret: required('API_JWT_SECRET'),
    // Vazio por omissão = sessão sem expiração (decisão do projeto: mantém-se
    // válida até logout manual). Define API_JWT_EXPIRES_IN no .env (ex: "7d")
    // se um dia quiseres passar a expirar.
    jwtExpiresIn: process.env.API_JWT_EXPIRES_IN || '',
  },
  sql: {
    server: required('SQL_SERVER'),
    instanceName: process.env.SQL_INSTANCE || undefined,
    // "0" ou vazio contam como "não definido" — 0 não é uma porta válida,
    // e ao usar SQL_INSTANCE a porta nem deve ser indicada (ver connectionConfig.js).
    port: process.env.SQL_PORT && Number(process.env.SQL_PORT) > 0 ? Number(process.env.SQL_PORT) : 1433,
    database: required('SQL_DATABASE'),
    user: required('SQL_USER'),
    password: required('SQL_PASSWORD'),
    encrypt: (process.env.SQL_ENCRYPT || 'true') === 'true',
    trustServerCertificate: (process.env.SQL_TRUST_SERVER_CERTIFICATE || 'true') === 'true',
  },
  uploadsPath: process.env.UPLOADS_PATH || './uploads',
  backofficePassword: process.env.BACKOFFICE_PASSWORD || 'admin',
  logRetentionDays: Number(process.env.LOG_RETENTION_DAYS || 90),
};
