const express = require('express');
const jwt = require('jsonwebtoken');
const { sql, executeProcedure } = require('../db/pool');
const { api } = require('../config/env');

const router = express.Router();

/**
 * POST /auth/login
 * Body: { username, password, deviceId, deviceName, platform, appVersion, pushToken? }
 *
 * Valida credenciais via sp_ValidarUtilizador (a implementar — ver docs/ARQUITETURA.md
 * para o contrato esperado) e regista/atualiza o dispositivo via sp_RegistarDispositivo.
 */
router.post('/login', async (req, res) => {
  const { username, password, deviceId, deviceName, platform, appVersion, pushToken } = req.body;
  if (!username || !password || !deviceId) {
    return res.status(400).json({ erro: 'username, password e deviceId são obrigatórios.' });
  }

  req.logInfo = { accao: 'Login', spNome: 'sp_ValidarUtilizador', parametros: { username, deviceId } };

  try {
    const resultado = await executeProcedure('sp_ValidarUtilizador', {
      Username: { type: sql.NVarChar(100), value: username },
      Password: { type: sql.NVarChar(200), value: password },
    });

    const utilizador = resultado.recordset?.[0];
    if (!utilizador) {
      req.logInfo.erro = 'Credenciais inválidas';
      return res.status(401).json({ erro: 'Utilizador ou password inválidos.' });
    }

    await executeProcedure('sp_RegistarDispositivo', {
      TecnicoId: { type: sql.Int, value: utilizador.TecnicoId },
      DispositivoId: { type: sql.NVarChar(100), value: deviceId },
      NomeDispositivo: { type: sql.NVarChar(150), value: deviceName || null },
      Plataforma: { type: sql.NVarChar(20), value: platform || null },
      VersaoApp: { type: sql.NVarChar(20), value: appVersion || null },
      PushToken: { type: sql.NVarChar(300), value: pushToken || null },
    });

    // Sessão simples: sem expiração por definição (ver api.jwtExpiresIn no .env).
    // O único fim de sessão é o "Terminar sessão" manual no ecrã de Perfil.
    const opcoesToken = api.jwtExpiresIn ? { expiresIn: api.jwtExpiresIn } : {};
    const token = jwt.sign(
      { username: utilizador.Username, tecnicoId: utilizador.TecnicoId, nome: utilizador.Nome },
      api.jwtSecret,
      opcoesToken
    );

    res.json({
      token,
      utilizador: {
        username: utilizador.Username,
        nome: utilizador.Nome,
        abreviatura: utilizador.Abreviatura,
        tecnicoId: utilizador.TecnicoId,
        email: utilizador.Email,
      },
    });
  } catch (err) {
    req.logInfo.erro = err.message;
    res.status(500).json({ erro: 'Erro ao validar login.', detalhe: err.message });
  }
});

module.exports = router;
