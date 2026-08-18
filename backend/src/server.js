const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const { api, logRetentionDays } = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const { sql, executeProcedure } = require('./db/pool');

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const equipamentosRoutes = require('./routes/equipamentos');
const pedidosRoutes = require('./routes/pedidos');
const backofficeRoutes = require('./routes/backoffice');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '15mb' })); // suficiente para a assinatura em base64; fotos vão por multipart
app.use(requestLogger);

app.use('/', healthRoutes);
app.use('/auth', authRoutes);
app.use('/equipamentos', equipamentosRoutes);
app.use('/pedidos', pedidosRoutes);
app.use('/backoffice', backofficeRoutes);

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// Limpeza diária de logs antigos, de acordo com a retenção definida (ver .env / backoffice).
// Corre dentro da própria API porque o SQL Server Express não tem SQL Server Agent.
cron.schedule('0 3 * * *', async () => {
  try {
    await executeProcedure('sp_LimparLogsAntigos', {
      Dias: { type: sql.Int, value: logRetentionDays },
    });
  } catch (err) {
    console.error('Falha na limpeza agendada de logs:', err.message);
  }
});

app.listen(api.port, () => {
  console.log(`API do Módulo de Suporte a correr na porta ${api.port}`);
});
