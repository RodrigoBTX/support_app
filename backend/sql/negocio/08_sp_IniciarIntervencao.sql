-- Contrato completo em CONTRATO_SPS.md
-- Usado por: POST /pedidos/:id/iniciar
--
-- Marca o início de uma intervenção já existente (mh) — regista a
-- data/hora de início no próprio servidor (não confiamos na hora do
-- telemóvel do técnico). Equivalente ao update que a app antiga fazia:
--   update mh set data=GetDate(), hora='HH:MM' where mhstamp = @MhStamp
--
-- Envolvido em transação explícita (TRY/CATCH + ROLLBACK): hoje é um único
-- UPDATE, já atómico por si só, mas isto deixa o SP pronto para o dia em que
-- precisar de mais do que uma escrita, sem risco de ficar a meio.

CREATE OR ALTER PROCEDURE sp_IniciarIntervencao
    @MhStamp VARCHAR(25)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; -- qualquer erro em runtime cancela a transação toda automaticamente

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE mh
        SET
            data = GETDATE(),
            hora = FORMAT(GETDATE(), 'HH:mm')
        WHERE mhstamp = @MhStamp;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW; -- devolve o erro real à API, que o mostra e regista no log
    END CATCH

    -- devolve a linha atualizada, para a app confirmar o que ficou gravado
    SELECT mhstamp, nopat, tecnico, data, hora, horaf, realizada
    FROM mh (nolock)
    WHERE mhstamp = @MhStamp;
END
GO
