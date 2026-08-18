-- SPs de infraestrutura: logging e limpeza. Idempotente (CREATE OR ALTER).

CREATE OR ALTER PROCEDURE sp_InserirLog
    @Utilizador NVARCHAR(100) = NULL,
    @DispositivoId NVARCHAR(100) = NULL,
    @Accao NVARCHAR(200),
    @SpNome NVARCHAR(100) = NULL,
    @Parametros NVARCHAR(MAX) = NULL,
    @Sucesso BIT,
    @DuracaoMs INT = NULL,
    @Erro NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO LogsAplicacao (Utilizador, DispositivoId, Accao, SpNome, Parametros, Sucesso, DuracaoMs, Erro)
    VALUES (@Utilizador, @DispositivoId, @Accao, @SpNome, @Parametros, @Sucesso, @DuracaoMs, @Erro);
END
GO

CREATE OR ALTER PROCEDURE sp_ObterLogs
    @Utilizador NVARCHAR(100) = NULL,
    @Accao NVARCHAR(200) = NULL,
    @Estado NVARCHAR(20) = NULL, -- 'ok' | 'erro' | NULL (todos)
    @Desde DATETIME = NULL,
    @Pagina INT = 1,
    @PorPagina INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM LogsAplicacao
    WHERE (@Utilizador IS NULL OR Utilizador = @Utilizador)
      AND (@Accao IS NULL OR Accao LIKE '%' + @Accao + '%')
      AND (@Desde IS NULL OR DataHora >= @Desde)
      AND (
            @Estado IS NULL
            OR (@Estado = 'ok' AND Sucesso = 1)
            OR (@Estado = 'erro' AND Sucesso = 0)
          )
    ORDER BY DataHora DESC
    OFFSET (@Pagina - 1) * @PorPagina ROWS FETCH NEXT @PorPagina ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_LimparLogsAntigos
    @Dias INT = 90
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM LogsAplicacao WHERE DataHora < DATEADD(DAY, -@Dias, GETDATE());
END
GO
