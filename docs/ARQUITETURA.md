# Arquitetura — Módulo de Suporte

## Visão geral

Uma instalação por cliente. Cada cliente tem a sua própria API a correr no seu
próprio servidor Windows, ligada ao seu próprio SQL Server. A app móvel nunca
fala diretamente com o SQL Server — fala sempre com a API.

```
[App Android/iOS] --HTTP--> [API Node/Express no servidor do cliente] --SPs--> [SQL Server do cliente]
                                        |
                                        +--> pasta local (fotos/assinaturas)
                                        +--> backoffice web (health, SPs, dispositivos, logs)
```

## Por que a app não sabe nada do SQL Server

As credenciais e o endereço do SQL Server ficam só na API (ficheiro `.env`,
preenchido no momento da instalação). A app só guarda o endereço da API. Isto
significa: as credenciais do SQL nunca tocam num telemóvel; se a password do
SQL mudar, só se altera num sítio (a API), não em cada dispositivo.

## Tudo por Stored Procedures

A API nunca constrói SQL dinâmico. Toda a leitura e escrita passa por SPs
(ver `backend/sql/negocio/CONTRATO_SPS.md` para o contrato completo dos SPs
de negócio, e `backend/sql/infra/` para os SPs de infraestrutura já prontos).

Vantagens: controlo total do lado da BD sobre o que a API pode fazer,
superfície de ataque menor, e mais fácil de auditar.

## Fotos e assinaturas

Guardadas em disco no servidor do cliente, organizadas por
`uploads/{ano}/{mes}/{pedidoId}/`, com o caminho do ficheiro registado na BD
através do respetivo SP (`sp_RegistarFoto`, `sp_ConcluirPedido`). Não há
armazenamento na cloud nesta fase — considerar backup do disco do servidor
como parte do plano de instalação de cada cliente.

## Logging

Toda a atividade da app (login, consultas, criação/conclusão de pedidos,
uploads) é registada na tabela `LogsAplicacao` via `sp_InserirLog`, chamado
automaticamente por um middleware — as rotas não precisam de o invocar
manualmente, só preenchem `req.logInfo` com uma descrição da ação.

Cada log guarda os parâmetros enviados ao SP (como JSON), o que permite
consultar em detalhe no backoffice o que aconteceu num pedido específico,
mesmo que não haja erro.

Se a própria ligação à BD falhar (portanto não é possível escrever na
tabela de logs), a API cai para um ficheiro local (`backend/logs/AAAA-MM-DD.log`)
como rede de segurança, só para erros de infraestrutura.

A retenção de logs é configurável (30/60/90 dias, definido no backoffice ou
em `LOG_RETENTION_DAYS` no `.env`) e limpa automaticamente todos os dias às
03:00 através de uma tarefa agendada dentro da própria API (`node-cron`),
porque não se pode assumir que o SQL Server Express do cliente tem SQL
Server Agent disponível.

## Autenticação

Login por utilizador/password (validado via `sp_ValidarUtilizador` — a tabela
de onde vêm as credenciais é decidida dentro do próprio SP, a API não sabe
nem precisa de saber qual é), devolve um JWT que a app guarda em
`SecureStore` e envia em todos os pedidos seguintes (`Authorization: Bearer
...`).

**Decisão:** sessão sem expiração — o token fica válido indefinidamente até
o técnico fazer logout manual no ecrã de Perfil. É o comportamento por
omissão (`API_JWT_EXPIRES_IN` vazio no `.env`); se um dia quiseres passar a
expirar sessões, basta preencher essa variável (ex: `7d`).

## Backoffice

Servido pela própria API (rotas `/backoffice/*`), acessível localmente no
servidor do cliente (ou remotamente, consoante a solução de acesso externo
escolhida). Mostra: estado da API e da ligação à BD, comparação entre SPs
esperados e SPs existentes na base de dados (com botão para reinstalar/
reparar), dispositivos que comunicaram recentemente, e os logs de atividade
com filtros e detalhe de parâmetros por clique.

## Acesso externo (API do cliente acessível pela app fora da rede local)

**Decisão:** os dados não precisam de estar protegidos por HTTPS — prioridade
é não complicar a utilização da app (sem certificados para gerir, sem erros
de "ligação não segura" a resolver por cliente). A app comunica em **HTTP
simples** com a API.

Caminho mais direto: **DynDNS + port-forwarding** no router do cliente,
apontando para a porta da API (`API_PORT`, 4000 por omissão). Sem
certificados, sem Cloudflare Tunnel, sem passos extra — é literalmente abrir
uma porta e apontar o DynDNS para lá.

Nota técnica: por omissão, o Android (a partir da versão 9) e o iOS bloqueiam
tráfego HTTP simples nas apps. Já está tratado no `app/app.json`
(`usesCleartextTraffic` no Android, `NSAllowsArbitraryLoads` no iOS) — não
precisas de fazer mais nada para isto funcionar.

Se um dia os requisitos mudarem e precisares de HTTPS (por exemplo, se
passares a lidar com dados mais sensíveis), o caminho mais simples nessa
altura seria um Cloudflare Tunnel (HTTPS automático, sem abrir portas) — mas
não é preciso agora.

## Instalação como serviço do Windows

Ver `backend/installer/servico-windows.md` para os passos manuais (via NSSM)
enquanto o instalador `.exe` automatizado (Inno Setup) não está pronto. O
objetivo final: um único instalador que pede os dados de ligação ao SQL
Server, cria a infraestrutura (tabelas/SPs de logs e dispositivos) e regista
o serviço — tudo num único fluxo "seguinte, seguinte, concluir".

## Notificações push (preparado, não ativado)

A app regista o `pushToken` do dispositivo no login (via `sp_RegistarDispositivo`).
Quando quiseres ativar notificações: criar um projeto Firebase (Android) e
usar a conta de Apple Developer existente (iOS) — a Expo trata da parte de
FCM/APNs automaticamente através do EAS. Falta só: (1) o backend chamar o
serviço de push da Expo quando um pedido é criado/atribuído, e (2) a app
pedir permissão de notificações e obter o token via `expo-notifications`.
