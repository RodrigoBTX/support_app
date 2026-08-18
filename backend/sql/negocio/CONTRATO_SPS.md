# Stored Procedures de negócio — contrato esperado pela API

Estes SPs não são criados por nós — ficam a teu cargo, porque dependem do desenho
real da tua base de dados (tabelas de Equipamentos, Pedidos, Utilizadores, etc.).
Esta lista é o "contrato": nomes, parâmetros de entrada e colunas que a API espera
receber de volta. Enquanto não existirem, os endpoints correspondentes devolvem
erro 500 — é normal e esperado nesta fase.

Não há ficheiros `.sql` de exemplo nesta pasta de propósito, para não teres dados
ou estruturas fictícias a limpar depois — parte do zero com o teu esquema real.

---

## sp_ValidarUtilizador
Entrada: `@Username NVARCHAR(100)`, `@Password NVARCHAR(200)`
Saída (1 linha se válido, 0 linhas se inválido): `Username`, `TecnicoId`, `Nome`
Usado por: `POST /auth/login`

## sp_ObterEquipamentos
Entrada: `@Pesquisa NVARCHAR(200) = NULL`
Saída (várias linhas): `Codigo`, `Nome`, `Cliente`, `Localizacao`, `Estado`
Usado por: `GET /equipamentos`

## sp_ObterEquipamento
Entrada: `@Codigo NVARCHAR(50)`
Saída (1 linha): `Codigo`, `Nome`, `Cliente`, `Localizacao`, `NumeroSerie`, `DataInstalacao`, `Estado`
Usado por: `GET /equipamentos/:codigo`

## sp_ObterHistoricoEquipamento
Entrada: `@Codigo NVARCHAR(50)`
Saída (várias linhas): `PedidoId`, `Tipo`, `DataHora`, `TecnicoNome`, `Estado`
Usado por: `GET /equipamentos/:codigo/historico`

## sp_ObterPedidosTecnico
Entrada: `@TecnicoId INT`, `@Estado NVARCHAR(30) = NULL`
Saída (várias linhas): `PedidoId`, `EquipamentoCodigo`, `EquipamentoNome`, `Cliente`, `DataHora`, `Prioridade`, `Estado`
Usado por: `GET /pedidos/agendados`

## sp_ObterAgendaTecnico
Entrada: `@TecnicoId INT`, `@Data DATE`
Saída (várias linhas): `PedidoId`, `HoraInicio`, `HoraFim`, `EquipamentoNome`, `Cliente`, `Estado`
Usado por: `GET /pedidos/agenda`

## sp_ObterPedidoDetalhe
Entrada: `@PedidoId INT`
Saída (1 linha): `PedidoId`, `EquipamentoCodigo`, `EquipamentoNome`, `Cliente`, `Tipo`, `Prioridade`, `Descricao`, `Estado`, `DataHora`
Usado por: `GET /pedidos/:id`

## sp_CriarPedido
Entrada: `@EquipamentoCodigo NVARCHAR(50)`, `@TecnicoId INT`, `@Tipo NVARCHAR(50)`, `@Prioridade NVARCHAR(20)`, `@Descricao NVARCHAR(MAX)`
Saída (1 linha): `PedidoId`
Usado por: `POST /pedidos`

## sp_RegistarFoto
Entrada: `@PedidoId INT`, `@CaminhoFicheiro NVARCHAR(400)`, `@DataHora DATETIME`
Usado por: `POST /pedidos/:id/fotos`

## sp_ConcluirPedido
Entrada: `@PedidoId INT`, `@TecnicoId INT`, `@CaminhoAssinatura NVARCHAR(400)`, `@DataHora DATETIME`
Saída (1 linha, opcional): `PedidoId`, `Estado`
Usado por: `POST /pedidos/:id/concluir`

---

Os SPs de infraestrutura (`sp_InserirLog`, `sp_ObterLogs`, `sp_LimparLogsAntigos`,
`sp_RegistarDispositivo`, `sp_ObterDispositivosLigados`) já estão prontos em
`backend/sql/infra/` — não precisas de os escrever.
