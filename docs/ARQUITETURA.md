# Arquitetura — Módulo de Suporte

## Visão geral

Uma instalação por cliente. Cada cliente tem a sua própria API a correr no seu
próprio servidor Windows, ligada ao seu próprio SQL Server. A app móvel nunca
fala diretamente com o SQL Server — fala sempre com a API via HTTPS.

```
[App Android/iOS] --HTTPS--> [API Node/Express no servidor do cliente] --SPs--> [SQL Server do cliente]
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

Login por utilizador/password (validado via `sp_ValidarUtilizador`), devolve
um JWT que a app guarda em `SecureStore` e envia em todos os pedidos
seguintes (`Authorization: Bearer ...`). Duração do token definida em
`API_JWT_EXPIRES_IN` no `.env` — **por decidir**: expira ao fim de X dias, ou
sessão longa até logout manual (ver dúvidas em aberto no README).

## Backoffice

Servido pela própria API (rotas `/backoffice/*`), acessível localmente no
servidor do cliente (ou remotamente, consoante a solução de acesso externo
escolhida). Mostra: estado da API e da ligação à BD, comparação entre SPs
esperados e SPs existentes na base de dados (com botão para reinstalar/
reparar), dispositivos que comunicaram recentemente, e os logs de atividade
com filtros e detalhe de parâmetros por clique.

## Acesso externo (API do cliente acessível pela app fora da rede local)

Duas opções em cima da mesa, ainda por decidir caso a caso por cliente:

1. **DynDNS + port-forwarding** — mais simples de entender, mas expõe uma
   porta do servidor do cliente diretamente à internet; exige HTTPS a sério
   (não certificados autoassinados) e firewall bem configurado.
2. **Cloudflare Tunnel** (recomendado) — não é preciso abrir nenhuma porta no
   router do cliente, HTTPS tratado automaticamente, mais seguro e mais fácil
   de replicar de instalação em instalação.

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
