-- Tabelas de infraestrutura da API (logs e dispositivos).
-- Idempotente: pode ser corrido várias vezes sem partir nada.
-- As tabelas de NEGÓCIO (Equipamentos, Pedidos, etc.) não estão aqui —
-- ficam a cargo do desenho feito diretamente na base de dados do cliente.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'LogsAplicacao')
BEGIN
    CREATE TABLE LogsAplicacao (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        DataHora DATETIME NOT NULL DEFAULT GETDATE(),
        Utilizador NVARCHAR(100) NULL,
        DispositivoId NVARCHAR(100) NULL,
        Accao NVARCHAR(200) NOT NULL,
        SpNome NVARCHAR(100) NULL,
        Parametros NVARCHAR(MAX) NULL,
        Sucesso BIT NOT NULL,
        DuracaoMs INT NULL,
        Erro NVARCHAR(MAX) NULL
    );

    CREATE INDEX IX_LogsAplicacao_DataHora ON LogsAplicacao (DataHora);
    CREATE INDEX IX_LogsAplicacao_Utilizador ON LogsAplicacao (Utilizador);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DispositivosApp')
BEGIN
    CREATE TABLE DispositivosApp (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TecnicoId INT NOT NULL,
        DispositivoId NVARCHAR(100) NOT NULL UNIQUE,
        NomeDispositivo NVARCHAR(150) NULL,
        Plataforma NVARCHAR(20) NULL,
        VersaoApp NVARCHAR(20) NULL,
        PushToken NVARCHAR(300) NULL,
        PrimeiroAcesso DATETIME NOT NULL DEFAULT GETDATE(),
        UltimaAtividade DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO
