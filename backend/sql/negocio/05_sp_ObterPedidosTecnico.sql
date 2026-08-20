-- Contrato completo em CONTRATO_SPS.md
-- Usado por: GET /pedidos/agendados (Realizada=0) e GET /pedidos/realizadas (Realizada=1, Top=5)
--
-- "Agendados"/"Realizados" vêm de "mh" (intervenções), não de "pa" (pedidos):
-- cada intervenção tem o seu próprio técnico (mh.tecnico) e o seu próprio
-- estado (mh.realizada: 0 = ainda por fazer/agendada, 1 = já
-- realizada/concluída). Um pedido (pa) pode ter várias intervenções (mh) ao
-- longo do tempo, por isso este SP devolve uma linha por intervenção (não
-- por pedido), já juntada com os dados do pedido/equipamento em "pa" (por
-- nopat).
--
-- Nota: usa-se mh.data (dia agendado/realizado da intervenção), não
-- mh.datapat (que é a data de CRIAÇÃO do pedido) — a mesma distinção que já
-- usamos no sp_ObterAgendaTecnico.
--
-- @Realizada é opcional:
--   - NULL  -> devolve tudo (agendadas e já realizadas)
--   - 0     -> só as que ainda faltam fazer — ordenadas da mais próxima para
--     a mais distante (o que vem a seguir primeiro)
--   - 1     -> só as já realizadas — ordenadas da mais recente para a mais
--     antiga (o que foi feito há pouco tempo primeiro)
--
-- @Top é opcional: limita o número de linhas devolvidas (ex: 5 para
-- "Últimas Realizadas" no dashboard). Sem @Top, devolve tudo.

CREATE OR ALTER PROCEDURE sp_ObterPedidosTecnico
    @TecnicoId INT,
    @Realizada BIT = NULL,
    @Top INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Top IS NULL SET @Top = 2147483647;

    IF @Realizada = 1
    BEGIN
        SELECT TOP (@Top)
            mh.mhstamp,
            mh.nopat,
            pa.pastamp,
            pa.mastamp,
            pa.nome    AS Cliente,
            pa.morada,
            pa.local,
            pa.maquina,
            pa.marca,
            pa.serie,
            pa.problema,
            mh.tecnico,
            mh.tecnnm,
            mh.realizada,
            mh.data,
            mh.hora,
            mh.horaf,
            mh.situacao,
            mh.tipo,
            mh.mhtipo,
            mh.psobs,
            mh.relatorio
        FROM mh (NOLOCK)
        INNER JOIN pa (NOLOCK) ON pa.nopat = mh.nopat
        WHERE mh.tecnico = @TecnicoId AND mh.realizada = 1
        ORDER BY mh.data DESC, mh.hora DESC;
    END
    ELSE
    BEGIN
        SELECT TOP (@Top)
            mh.mhstamp,
            mh.nopat,
            pa.pastamp,
            pa.mastamp,
            pa.nome    AS Cliente,
            pa.morada,
            pa.local,
            pa.maquina,
            pa.marca,
            pa.serie,
            pa.problema,
            mh.tecnico,
            mh.tecnnm,
            mh.realizada,
            mh.data,
            mh.hora,
            mh.horaf,
            mh.situacao,
            mh.tipo,
            mh.mhtipo,
            mh.psobs,
            mh.relatorio
        FROM mh (NOLOCK)
        INNER JOIN pa (NOLOCK) ON pa.nopat = mh.nopat
        WHERE
            mh.tecnico = @TecnicoId
            AND (@Realizada IS NULL OR mh.realizada = @Realizada)
        ORDER BY mh.data ASC, mh.hora ASC;
    END
END
GO