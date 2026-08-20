-- Contrato completo em CONTRATO_SPS.md
-- Usado por: GET /equipamentos/:codigo/historico
--
-- Histórico de intervenções reais, a partir da tabela "mh" (uma linha por
-- intervenção técnica). A "mh" não tem mastamp diretamente — liga-se ao
-- pedido de assistência pela "pa" (pa.nopat = mh.nopat), e é a "pa" que tem
-- o mastamp do equipamento. Por isso este SP:
--   1. Resolve o mastamp exato do equipamento a partir de @Codigo (pode ser
--      mastamp, serie ou ref — mesma prioridade usada em sp_ObterEquipamentos).
--   2. Vai a "pa" buscar todos os nopat desse mastamp.
--   3. Junta com "mh" por nopat para trazer as intervenções.
--
-- Se @Codigo corresponder a mais do que uma unidade (ex: um "ref" partilhado
-- por várias séries), usamos apenas a primeira unidade encontrada — a app
-- deve, sempre que possível, chamar isto já com o mastamp exato da unidade
-- escolhida (evita ambiguidade).

CREATE OR ALTER PROCEDURE sp_ObterHistoricoEquipamento
    @Codigo NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MastampResolvido VARCHAR(25);

    SELECT TOP 1 @MastampResolvido = mastamp
    FROM ma (nolock)
    WHERE mastamp = @Codigo OR serie = @Codigo OR ref = @Codigo
    ORDER BY
        CASE
            WHEN mastamp = @Codigo THEN 0
            WHEN serie = @Codigo THEN 1
            ELSE 2
        END;

    IF @MastampResolvido IS NULL
        RETURN;

    SELECT
        mh.mhstamp,
        mh.nome,
        mh.nopat,
        mh.tecnico,
        mh.tecnnm,
        mh.marca,
        mh.psobs,
        mh.maquina,
        mh.tipo,
        mh.relatorio,
        mh.hora,
        mh.horaf,
        mh.serie,
        mh.pquem,
        mh.situacao,
        mh.mhtipo,
        mh.datapat
    FROM mh (nolocK)
    INNER JOIN pa (nolock) ON pa.nopat = mh.nopat
    WHERE pa.mastamp = @MastampResolvido
    ORDER BY mh.datapat DESC, mh.hora DESC;
END
GO