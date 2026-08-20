-- Contrato completo em CONTRATO_SPS.md
-- Usado por: GET /pedidos/agenda?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
--
-- A agenda junta DUAS fontes diferentes (tal como o próprio ERP faz):
--   - "mx" (marcações gerais do técnico — nem sempre ligadas a um pedido de
--     assistência, ex: reuniões, deslocações)
--   - "mh" (intervenções de pedidos de assistência agendadas/realizadas —
--     liga-se a "pa" por nopat, tal como no sp_ObterHistoricoEquipamento e no
--     sp_ObterPedidosTecnico)
--
-- Aceita um INTERVALO de datas (não só um dia) para a app conseguir pintar
-- pontos no calendário do mês todo com um único pedido, em vez de andar a
-- pedir dia a dia. @DataFim é opcional — se não vier, usa-se @DataInicio
-- (comportamento de "um único dia", como antes).
--
-- Devolve uma linha por registo (de qualquer uma das duas origens), com
-- "Origem" a indicar de onde veio ('Marcacao' ou 'Intervencao'). Os campos
-- que só existem numa das origens ficam a NULL na outra.

CREATE OR ALTER PROCEDURE sp_ObterAgendaTecnico
    @TecnicoId INT,
    @DataInicio DATE,
    @DataFim DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @DataFim IS NULL SET @DataFim = @DataInicio;

    SELECT
        'Marcacao'      AS Origem,
        mx.data         AS Data,
        mx.hinicio      AS HoraInicio,
        mx.hfim         AS HoraFim,
        mx.mxstamp      AS MxStamp,
        mx.ind          AS MxInd,
        mx.clnome       AS MxClNome,
        mx.coddiv       AS MxCodDiv,
        mx.inicio       AS MxInicio,
        mx.fim          AS MxFim,
        mx.texto        AS MxTexto,
        mx.ckeyid       AS MxCkeyId,
        mx.apriv        AS MxApriv,
        mx.userno       AS MxUserNo,
        mx.username     AS MxUserName,
        NULL            AS MhId,
        NULL            AS MhNome,
        NULL            AS MhTipo,
        NULL            AS MhRelatorio,
        NULL            AS MhRealizada,
        NULL            AS MhNopat,
        NULL            AS PaMastamp
    FROM mx (NOLOCK)
    WHERE mx.tecnico = @TecnicoId
      AND mx.data >= @DataInicio
      AND mx.data < DATEADD(DAY, 1, @DataFim)

    UNION ALL

    SELECT
        'Intervencao'   AS Origem,
        mh.data         AS Data,
        mh.hora         AS HoraInicio,
        mh.horaf        AS HoraFim,
        NULL            AS MxStamp,
        NULL            AS MxInd,
        NULL            AS MxClNome,
        NULL            AS MxCodDiv,
        NULL            AS MxInicio,
        NULL            AS MxFim,
        NULL            AS MxTexto,
        NULL            AS MxCkeyId,
        NULL            AS MxApriv,
        NULL            AS MxUserNo,
        NULL            AS MxUserName,
        mh.mhid         AS MhId,
        mh.nome         AS MhNome,
        mh.mhtipo       AS MhTipo,
        mh.relatorio    AS MhRelatorio,
        mh.realizada    AS MhRealizada,
        mh.nopat        AS MhNopat,
        pa.mastamp      AS PaMastamp
    FROM mh (NOLOCK)
    LEFT JOIN pa (NOLOCK) ON pa.nopat = mh.nopat
    WHERE mh.tecnico = @TecnicoId
      AND mh.data >= @DataInicio
      AND mh.data < DATEADD(DAY, 1, @DataFim)

    ORDER BY Data, HoraInicio;
END
GO