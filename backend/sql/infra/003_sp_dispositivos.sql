CREATE OR ALTER PROCEDURE sp_RegistarDispositivo
    @TecnicoId INT,
    @DispositivoId NVARCHAR(100),
    @NomeDispositivo NVARCHAR(150) = NULL,
    @Plataforma NVARCHAR(20) = NULL,
    @VersaoApp NVARCHAR(20) = NULL,
    @PushToken NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM DispositivosApp WHERE DispositivoId = @DispositivoId)
    BEGIN
        UPDATE DispositivosApp
        SET TecnicoId = @TecnicoId,
            NomeDispositivo = @NomeDispositivo,
            Plataforma = @Plataforma,
            VersaoApp = @VersaoApp,
            PushToken = ISNULL(@PushToken, PushToken),
            UltimaAtividade = GETDATE()
        WHERE DispositivoId = @DispositivoId;
    END
    ELSE
    BEGIN
        INSERT INTO DispositivosApp (TecnicoId, DispositivoId, NomeDispositivo, Plataforma, VersaoApp, PushToken)
        VALUES (@TecnicoId, @DispositivoId, @NomeDispositivo, @Plataforma, @VersaoApp, @PushToken);
    END
END
GO

CREATE OR ALTER PROCEDURE sp_ObterDispositivosLigados
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 50 *
    FROM DispositivosApp
    ORDER BY UltimaAtividade DESC;
END
GO
