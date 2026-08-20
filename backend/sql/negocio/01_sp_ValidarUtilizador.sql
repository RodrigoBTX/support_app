-- Contrato completo em CONTRATO_SPS.md
-- Usado por: POST /auth/login
--
-- Valida contra a tabela u_appacessos, e junta com cm4 (por cm4stamp) para
-- trazer os dados reais do técnico: número (cm), nome, abreviatura (cmdesc)
-- e email. Devolve 0 linhas se as credenciais forem inválidas, ou 1 linha se
-- forem válidas.

CREATE OR ALTER PROCEDURE sp_ValidarUtilizador
    @Username NVARCHAR(100),
    @Password NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        t.u_user   AS Username,
        a.cm       AS TecnicoId,
        a.nome     AS Nome,
        a.cmdesc   AS Abreviatura,
        a.email    AS Email
    FROM u_appacessos t (NOLOCK)
    INNER JOIN cm4 a (NOLOCK) ON t.cm4stamp = a.cm4stamp
    WHERE
        t.u_user = @Username
        AND t.u_password = @Password;
END
GO