-- Contrato completo em CONTRATO_SPS.md
-- Usado por: GET /pedidos/:id
--
-- @PedidoId é o pa.nopat. Devolve DOIS resultsets:
--   1) a linha do pedido (pa)
--   2) todas as intervenções desse pedido (mh, por nopat), mais recente primeiro
-- A API junta os dois num só objeto: { ...pedido, intervencoes: [...] }.

CREATE OR ALTER PROCEDURE sp_ObterPedidoDetalhe
    @PedidoId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pa.pastamp,
        pa.nopat,
        pa.nome,
        pa.pdata,
        pa.phora,
        pa.status,
        pa.fechado,
        pa.morada,
        pa.local,
        pa.ncont,
        pa.maquina,
        pa.marca,
        pa.serie,
        pa.problema,
        pa.pquem,
        pa.psobs,
        pa.situacao,
        pa.mastamp,
        pa.fquem,
        pa.resumo,
        pa.tecnico
    FROM pa (NOLOCK)
    WHERE pa.nopat = @PedidoId;

    SELECT
        mh.mhstamp,
        mh.mhid,
        mh.nome,
        mh.nopat,
        mh.tecnico,
        mh.tecnnm,
        mh.marca,
        mh.psobs,
        mh.maquina,
        mh.tipo,
        mh.relatorio,
        mh.data,
        mh.hora,
        mh.horaf,
        mh.serie,
        mh.pquem,
        mh.situacao,
        mh.mhtipo,
        mh.datapat,
        mh.realizada
    FROM mh (NOLOCK)
    WHERE mh.nopat = @PedidoId
    ORDER BY mh.data DESC, mh.hora DESC;
END
GO