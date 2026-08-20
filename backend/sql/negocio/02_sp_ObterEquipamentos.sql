-- Contrato completo em CONTRATO_SPS.md
-- Usado por: GET /equipamentos?pesquisa= e  GET /equipamentos/:codigo
-- Um único SP para os dois casos:
--   - Sem @Pesquisa -> devolve tudo.
--   - Com @Pesquisa -> tenta primeiro correspondência EXATA em mastamp/serie/ref
--     (é o caso do QR code, ou quando pesquisas por um código completo).
--   - Se não houver nenhuma correspondência exata, cai para pesquisa
--     aproximada (LIKE) em serie/ref, para quando escreves texto na caixa
--     de pesquisa.

CREATE OR ALTER PROCEDURE sp_ObterEquipamentos
    @Pesquisa NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Pesquisa IS NULL
    BEGIN
        SELECT ref, design, serie, tipo, marca, maquina, situacao, instal, morada, local, mastamp
        FROM ma (nolock);
        RETURN;
    END

    -- Tenta primeiro correspondência exata (ideal para QR code / mastamp)
    IF EXISTS (SELECT 1 FROM ma WHERE mastamp = @Pesquisa OR serie = @Pesquisa OR ref = @Pesquisa)
    BEGIN
        SELECT ref, design, serie, tipo, marca, maquina, situacao, instal, morada, local, mastamp
        FROM ma (nolock)
        WHERE mastamp = @Pesquisa OR serie = @Pesquisa OR ref = @Pesquisa;
        RETURN;
    END

    -- Senão, pesquisa aproximada (para quando escreves texto na caixa de pesquisa)
    SELECT ref, design, serie, tipo, marca, maquina, situacao, instal, morada, local, mastamp
    FROM ma (nolock)
    WHERE serie LIKE '%' + @Pesquisa + '%'
       OR ref   LIKE '%' + @Pesquisa + '%';
END
GO
