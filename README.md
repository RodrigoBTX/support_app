# Módulo de Suporte — Gestão de Equipamentos e Assistência

App móvel (Android/iOS) e API para gerir equipamentos e pedidos de
assistência técnica (manutenções, avarias, intervenções), com instalação
dedicada por cliente.

## Componentes

- **`app/`** — aplicação React Native (Expo). Ecrãs: configuração da
  ligação, login, dashboard, equipamentos (com pesquisa e leitura de QR
  code), detalhe do equipamento, agenda, novo pedido, detalhe/conclusão do
  pedido (com fotos e assinatura do cliente), perfil.
- **`backend/`** — API Node.js/Express instalada no servidor de cada
  cliente. Fala com o SQL Server do cliente exclusivamente através de
  Stored Procedures, guarda fotos/assinaturas em disco, regista logs de
  toda a atividade, e expõe um backoffice web local para monitorização.
- **`docs/`** — mockups aprovados dos ecrãs e notas de arquitetura,
  configuração, instalação e testes.

## Como está organizado

```
app/        → projeto Expo (React Native)
backend/
  src/      → código da API
  sql/      → scripts SQL (infraestrutura pronta + contrato dos SPs de negócio)
  installer/→ instalação como serviço do Windows
docs/
  mockups/  → HTML estático dos ecrãs aprovados, só para referência visual
  ARQUITETURA.md
  INSTALACAO_E_TESTES.md
```

## Por onde começar

Ver `docs/INSTALACAO_E_TESTES.md` para o passo a passo completo — testar a
API, depois desenvolver os SPs de negócio (contrato em
`backend/sql/negocio/CONTRATO_SPS.md`), depois testar a instalação como
serviço, e só no fim testar a app.

## Princípios do projeto

- Uma instalação da API por cliente, ligada apenas ao SQL Server desse cliente.
- A app móvel só conhece o endereço da API — nunca vê credenciais de SQL Server.
- Toda a leitura/escrita na base de dados passa por Stored Procedures.
- Sem dados fictícios em código nenhum — o projeto está pronto para dados reais.
