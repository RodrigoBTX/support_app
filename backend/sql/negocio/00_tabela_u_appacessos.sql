-- Tabela de acessos à app (utilizadores/técnicos que fazem login).
-- str_stamp gerado automaticamente em cada INSERT, tal como pediste.
-- Idempotente: podes correr este script mais do que uma vez sem partir nada.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'u_appacessos')
BEGIN
    CREATE TABLE u_appacessos (
        str_stamp  VARCHAR(25)   NOT NULL DEFAULT (LEFT(NEWID(), 25)) PRIMARY KEY,
        u_user     NVARCHAR(100) NOT NULL,
        u_password NVARCHAR(200) NOT NULL,
        cm4stamp   VARCHAR(25)   NULL
    );

    -- Impede dois registos com o mesmo utilizador.
    CREATE UNIQUE INDEX IX_u_appacessos_user ON u_appacessos (u_user);
END
GO
