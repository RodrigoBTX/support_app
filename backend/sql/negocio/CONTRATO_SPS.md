# Stored Procedures de negócio — contrato real

Esta lista reflete os SPs de negócio **já implementados e instalados** na base
de dados real (schema tipo Primavera/PHC: tabelas `ma`, `pa`, `mh`, `mx`,
`cm4`, `u_appacessos`). Cada um tem o seu ficheiro `.sql` nesta pasta, com
comentários a explicar as decisões tomadas.

Não há criação de pedidos (`pa`) pela app — isso continua a ser gerido pelo
ERP. A app trata do que já existe: consultar equipamentos/histórico/agenda, e
registar o **início** e a **conclusão** de intervenções (`mh`), incluindo
fotos e assinatura.

Os SPs de infraestrutura (`sp_InserirLog`, `sp_ObterLogs`,
`sp_LimparLogsAntigos`, `sp_RegistarDispositivo`, `sp_ObterDispositivosLigados`)
já estão prontos em `backend/sql/infra/` e não fazem parte desta lista — são
instalados automaticamente por `npm run sql:install` / pelo botão
"Reinstalar/Verificar SPs" do backoffice.

---

## sp_ValidarUtilizador
Ficheiro: `01_sp_ValidarUtilizador.sql`
Entrada: `@Username NVARCHAR(100)`, `@Password NVARCHAR(200)`
Saída (1 linha se válido, 0 linhas se inválido): `Username`, `TecnicoId` (= `cm4.cm`, número real do técnico), `Nome` (= `cm4.nome`)
Fonte: `u_appacessos` ligada a `cm4` por `cm4stamp`
Usado por: `POST /auth/login`

## sp_ObterEquipamentos
Ficheiro: `02_sp_ObterEquipamentos.sql`
Entrada: `@Pesquisa NVARCHAR(200) = NULL`
Saída (várias linhas, tabela `ma`): `ref`, `design`, `serie`, `tipo`, `marca`, `maquina`, `situacao`, `instal`, `morada`, `local`, `mastamp`
Lógica: sem `@Pesquisa` devolve tudo; com `@Pesquisa` tenta primeiro correspondência exata em `mastamp`/`serie`/`ref` (caso do QR code), e só se não encontrar nada cai para `LIKE` em `serie`/`ref` (pesquisa livre)
Usado por: `GET /equipamentos`, `GET /equipamentos/:codigo`

## sp_ObterHistoricoEquipamento
Ficheiro: `04_sp_ObterHistoricoEquipamento.sql`
Entrada: `@Codigo NVARCHAR(50)` (aceita `mastamp`, `serie` ou `ref`)
Saída (várias linhas): histórico de intervenções reais da tabela `mh`, filtradas pelo `mastamp` do equipamento (via `pa.mastamp = mh.nopat` ligados por `nopat`) — `mhstamp`, `nome`, `nopat`, `tecnico`, `tecnnm`, `marca`, `psobs`, `maquina`, `tipo`, `relatorio`, `hora`, `horaf`, `serie`, `pquem`, `situacao`, `mhtipo`, `datapat`
Lógica: resolve primeiro o `mastamp` exato (mesma prioridade do `sp_ObterEquipamentos`), depois vai a `pa` buscar os `nopat` desse equipamento, e junta com `mh` por `nopat`
Usado por: `GET /equipamentos/:codigo/historico`

## sp_ObterPedidosTecnico
Ficheiro: `05_sp_ObterPedidosTecnico.sql`
Entrada: `@TecnicoId INT`, `@Realizada BIT = NULL` (0 = por fazer, 1 = concluída, NULL = todas), `@Top INT = NULL` (limita o nº de linhas; sem ele devolve tudo)
Saída (várias linhas, uma por intervenção): `mhstamp`, `nopat`, `pastamp`, `mastamp`, `Cliente` (`pa.nome`), `morada`, `local`, `maquina`, `marca`, `serie`, `problema`, `tecnico`, `tecnnm`, `realizada`, `data` (dia agendado/realizado — **não** `datapat`, que é a data de criação do pedido), `hora`, `horaf`, `situacao`, `tipo`, `mhtipo`, `psobs`, `relatorio`
Lógica: fonte é `mh` (não `pa` — a atribuição de técnico está em `mh.tecnico`, não em `pa.tecnico`, que fica muitas vezes vazio), juntada com `pa` por `nopat` para trazer os dados do pedido/equipamento. A ordenação depende de `@Realizada`: ascendente por `data`/`hora` (mais próxima primeiro) quando `0`/`NULL`, descendente (mais recente primeiro) quando `1`
Usado por: `GET /pedidos/agendados` (`Realizada=0`, sem `Top`) e `GET /pedidos/realizadas?top=5` (`Realizada=1`, `Top=5`) — os dois separadores do Início ("Agendadas" / "Últimas Realizadas")

## sp_ObterAgendaTecnico
Ficheiro: `06_sp_ObterAgendaTecnico.sql`
Entrada: `@TecnicoId INT`, `@DataInicio DATE`, `@DataFim DATE = NULL` (sem `@DataFim`, devolve só o dia de `@DataInicio`)
Saída (várias linhas): união de duas origens — marcações gerais (`mx`) e intervenções agendadas/realizadas no intervalo (`mh`, ligada a `pa` por `nopat`). Campos comuns: `Origem` (`'Marcacao'`/`'Intervencao'`), `Data`, `HoraInicio`, `HoraFim`; depois os campos próprios de cada origem (prefixo `Mx`/`Mh`) ficam a `NULL` quando não se aplicam
Usado por: `GET /pedidos/agenda?inicio=&fim=` (a app pede o mês visível do calendário de uma vez, para pintar os pontos dos dias com agendamentos)

## sp_ObterPedidoDetalhe
Ficheiro: `07_sp_ObterPedidoDetalhe.sql`
Entrada: `@PedidoId INT` (= `pa.nopat`)
Saída: **dois resultsets** — 1) a linha do pedido (`pa`, todos os campos reais); 2) todas as intervenções desse pedido (`mh`, por `nopat`, mais recente primeiro). A API junta os dois num só objeto: `{ ...pedido, intervencoes: [...] }`
Usado por: `GET /pedidos/:id`

## sp_IniciarIntervencao
Ficheiro: `08_sp_IniciarIntervencao.sql`
Entrada: `@MhStamp VARCHAR(25)`
Efeito: `UPDATE mh SET data = GETDATE(), hora = <hora atual do servidor>` — marca o início real de uma intervenção já existente (não cria linha nova em `mh`, essa já existe previamente, criada pelo ERP/agendamento)
Saída: a linha atualizada de `mh`
Usado por: `POST /pedidos/:id/iniciar` (body: `{ mhstamp }`)

## sp_ConcluirIntervencao
Ficheiro: `09_sp_ConcluirIntervencao.sql`
Entrada: `@MhStamp VARCHAR(25)`, `@PedidoId INT`, `@Relatorio NVARCHAR(MAX)`
Efeito: `UPDATE mh SET horaf = <hora atual>, nopat = @PedidoId, realizada = 1, relatorio = @Relatorio, ousrdata/ousrhora/usrdata/usrhora = <agora>` — fecha a intervenção. `horaf` é sempre calculado no servidor, nunca vem da app
Saída: a linha atualizada de `mh`
Usado por: `POST /pedidos/:id/concluir` (body: `{ mhstamp, relatorio, assinaturaBase64 }`)

---

## Fotos e assinatura — sem SP próprio

Não há `sp_RegistarFoto`: os ficheiros (fotos + assinatura) só ficam
guardados em disco, no servidor onde a API corre, na pasta configurada em
`UPLOADS_PATH` (a mesma que aparece em Definições no backoffice):

```
{UPLOADS_PATH}/{mhstamp}/{AAAAMMDD}_{numerador}.ext
```

O `mhstamp` identifica a que intervenção pertence a pasta; o numerador conta
quantos ficheiros já existem nessa pasta com a data de hoje e soma 1 (permite
várias fotos/assinaturas no mesmo dia sem se sobreporem). Não existe registo
destes caminhos na base de dados.
Usado por: `POST /pedidos/:id/fotos` (multipart: `foto`, `mhstamp`) e dentro
de `POST /pedidos/:id/concluir` (assinatura em `assinaturaBase64`).

---

## Notas para a app (React Native) — por atualizar

Os ecrãs (`app/src/screens/*.tsx`) ainda esperam os nomes de campos
genéricos originais (`Codigo`/`Nome`/`Cliente`/`PedidoId`/etc.) em vez dos
nomes reais das tabelas (`ref`/`design`/`local`/`nopat`/`mastamp`/`mhstamp`/
etc.) usados neste contrato. Isto fica combinado para ser tratado numa
passagem única, depois de todos os SPs estarem fechados e testados.
