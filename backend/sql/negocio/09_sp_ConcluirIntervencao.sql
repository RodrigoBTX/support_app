-- Contrato completo em CONTRATO_SPS.md
-- Usado por: POST /pedidos/:id/concluir
--
-- Fecha a intervenção (mh) — equivalente ao update da app antiga:
--   data=hoje; horaf=<hora atual do servidor>; nopat=@PedidoId;
--   ousrdata=hoje; ousrhora=<hora atual>; realizada=1; relatorio=@Relatorio;
--   usrdata=hoje; usrhora=<hora atual>
--   where mhstamp=@MhStamp
--
-- Confirmado: ousrdata/ousrhora e usrdata/usrhora ficam ambos com a
-- data/hora atual da conclusão (dois pares de auditoria que coincidem
-- neste caso). "horaf" é sempre a hora do servidor, nunca vem da app.
--
-- Envolvido em transação explícita (TRY/CATCH + ROLLBACK): hoje é um único
-- UPDATE, já atómico por si só, mas isto deixa o SP pronto para o dia em que
-- precisar de mais do que uma escrita (ex: também atualizar "pa"), sem risco
-- de ficar a meio.

CREATE OR ALTER PROCEDURE sp_ConcluirIntervencao
    @MhStamp VARCHAR(25),
    @PedidoId INT,
    @Relatorio NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; -- qualquer erro em runtime cancela a transação toda automaticamente

    DECLARE @Agora DATETIME = GETDATE();
    DECLARE @HoraAgora VARCHAR(5) = FORMAT(@Agora, 'HH:mm');

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE mh
        SET
            data = @Agora,
            horaf = @HoraAgora,
            nopat = @PedidoId,
            ousrdata = @Agora,
            ousrhora = @HoraAgora,
            realizada = 1,
            relatorio = @Relatorio,
            usrdata = @Agora,
            usrhora = @HoraAgora
        WHERE mhstamp = @MhStamp;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW; -- devolve o erro real à API, que o mostra e regista no log
    END CATCH

    SELECT mhstamp, nopat, tecnico, data, hora, horaf, realizada, relatorio
    FROM mh (nolock)
    WHERE mhstamp = @MhStamp;
END
GO
