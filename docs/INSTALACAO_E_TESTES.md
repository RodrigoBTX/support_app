# Configuração, instalação e testes

Este documento acompanha a ordem que definiste: primeiro testar a API,
depois desenvolver e testar os SPs/instalação, só depois testar a app.

## 1. Testar a API localmente (sem instalar nada no servidor do cliente)

Pré-requisitos: Node.js 18+ instalado, acesso a uma instância SQL Server
(pode ser uma local/de testes, não precisa de ser já a do cliente).

```
cd backend
npm install
copy .env.example .env
```

Edita o `.env` com os dados da tua instância de testes:
- `SQL_SERVER`, `SQL_INSTANCE` (opcional), `SQL_PORT` (1433 por omissão),
  `SQL_DATABASE`, `SQL_USER`, `SQL_PASSWORD`
- `API_JWT_SECRET` — qualquer string longa aleatória, só para desenvolvimento

Instala a infraestrutura (tabelas e SPs de logs/dispositivos):
```
npm run sql:install
```

Arranca a API:
```
npm run dev
```

Confirma que está tudo a funcionar:
```
curl http://localhost:4000/health
```
Deve devolver `{"api":"ok","sqlServer":"ok",...}`. Se `sqlServer` vier
`"falhou"`, revê os dados do `.env` — o `detalhe` do erro costuma ser directo
(ex: login falhado, instância não encontrada, firewall a bloquear a porta).

## 2. Desenvolver os SPs de negócio

Os SPs de infraestrutura (logs, dispositivos) já vêm prontos em
`backend/sql/infra/`. Os SPs de negócio (equipamentos, pedidos, utilizadores)
ficam por desenvolver — o contrato exato de cada um (parâmetros de entrada e
colunas de saída esperadas) está em `backend/sql/negocio/CONTRATO_SPS.md`.
À medida que fores criando cada SP na tua base de dados, o endpoint
correspondente na API passa a funcionar sem precisares de tocar em código —
por exemplo, assim que `sp_ObterEquipamentos` existir, `GET /equipamentos`
já devolve dados reais.

Para testar um endpoint isoladamente sem a app, usa `curl` ou uma ferramenta
como o Postman/Insomnia, por exemplo:
```
curl http://localhost:4000/equipamentos
curl -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d "{\"username\":\"joao\",\"password\":\"...\",\"deviceId\":\"teste-1\"}"
```

## 3. Testar a instalação (infraestrutura + serviço Windows)

Depois de validares a API localmente, testa o caminho de instalação real:
1. Copia a pasta `backend/` para o servidor de destino (ou uma VM de testes
   com Windows).
2. Segue `backend/installer/servico-windows.md` — instala dependências,
   corre `npm run sql:install`, regista o serviço via NSSM.
3. Confirma `http://localhost:4000/health` no próprio servidor, e depois a
   partir de outra máquina na mesma rede (para validar que a porta está
   acessível).
4. Testa o botão "Reinstalar / Verificar SPs" no backoffice (`/backoffice`)
   depois de teres alguns SPs de negócio criados — confirma que aparecem
   como "Encontrado".

Nesta fase ainda não existe o instalador `.exe` automatizado — o script
`npm run sql:install` e o registo manual via NSSM cobrem o mesmo objetivo
enquanto isso não é construído.

## 4. Testar a app

Só depois dos passos anteriores validados. Pré-requisitos: Node.js, Expo CLI
(`npx expo` já trata disso), e um telemóvel com a app **Expo Go** instalada
(Android ou iOS — não precisas de Mac nem de simuladores).

```
cd app
npm install
npx expo start
```

Aparece um QR code no terminal — digitaliza com a câmara (iOS) ou com a app
Expo Go (Android). A app vai pedir o endereço da API no primeiro arranque:
usa o endereço da tua API local acessível na rede (ex: `http://192.168.1.X:4000`,
nunca `localhost`, porque o telemóvel é um dispositivo diferente na rede).

Nenhum ecrã tem dados de exemplo/fictícios — tudo o que vires (ou não vires)
reflete exatamente o que os teus SPs devolverem da base de dados real.

## Notas gerais

- **Sem dados fictícios em lado nenhum deste projeto** — todos os ecrãs e
  endpoints estão prontos para dados reais, não têm arrays de exemplo nem
  respostas simuladas. Se um ecrã aparecer vazio, o mais provável é o SP
  correspondente ainda não existir ou não ter dados para esse filtro.
- Os mockups aprovados (estáticos, só para referência visual) estão em
  `docs/mockups/` — não fazem parte do código da app, servem de guia de
  design ao implementares os componentes reais.
- **Sessão:** sem expiração — o técnico só é desligado com "Terminar sessão"
  manual no Perfil.
- **QR codes:** os códigos dos equipamentos já existem no sistema do
  cliente; a app só os lê (não gera nem imprime etiquetas). O leitor
  (`app/src/screens/LeitorQRScreen.tsx`) passa o valor lido diretamente como
  `Codigo` a `sp_ObterEquipamento` — se o formato real dos códigos vier a ser
  diferente de um simples texto (ex: incluir um prefixo ou ser parte de um
  URL), é só ajustar essa passagem de valor, o resto mantém-se.
- **Acesso externo:** decidido usar HTTP simples (sem HTTPS) via DynDNS +
  port-forwarding — ver `docs/ARQUITETURA.md`. A app já está preparada para
  aceitar tráfego HTTP em Android e iOS.
