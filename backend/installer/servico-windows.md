# Instalar a API como serviço do Windows

O objetivo final é um instalador `.exe` (Inno Setup) que faz tudo isto automaticamente
com um assistente "seguinte, seguinte, concluir". Este documento descreve os passos que
esse instalador vai executar — por agora, para testares manualmente antes de o instalador
estar pronto:

## 1. Preparar a aplicação no servidor
```
xcopy backend C:\SuporteApp\api /E /I
cd C:\SuporteApp\api
npm install --omit=dev
copy .env.example .env
notepad .env    -> preencher SQL_SERVER, SQL_DATABASE, SQL_USER, SQL_PASSWORD, etc.
```

## 2. Instalar a infraestrutura (tabelas + SPs de logs/dispositivos)
```
npm run sql:install
```
Isto corre `installer/install-sql.js`, que aplica os scripts de `backend/sql/infra/`.
É seguro correr outra vez sempre que quiseres reparar ou atualizar uma instalação.

## 3. Registar como serviço (via NSSM)
[NSSM](https://nssm.cc/) — "Non-Sucking Service Manager" — é a forma mais simples e
estável de correr um processo Node.js como serviço do Windows (arranca no boot,
reinicia sozinho se crashar).

```
nssm install SuporteAppAPI "C:\Program Files\nodejs\node.exe" "C:\SuporteApp\api\src\server.js"
nssm set SuporteAppAPI AppDirectory "C:\SuporteApp\api"
nssm set SuporteAppAPI AppStdout "C:\SuporteApp\api\logs\service-out.log"
nssm set SuporteAppAPI AppStderr "C:\SuporteApp\api\logs\service-err.log"
nssm set SuporteAppAPI Start SERVICE_AUTO_START
nssm start SuporteAppAPI
```

## 4. Confirmar
Abre `http://localhost:4000/health` no servidor — deve devolver `{"api":"ok","sqlServer":"ok"}`.
O backoffice fica disponível em `http://localhost:4000/backoffice` (ou o endereço público,
consoante a solução de acesso externo escolhida — Cloudflare Tunnel ou DynDNS).

---

**Nota:** o instalador `.exe` final vai empacotar o Node runtime, o NSSM e este processo
todo num único ficheiro, pedindo apenas os dados de ligação ao SQL Server no ecrã inicial.
Ainda não foi construído — este ficheiro serve de guia para testares a API manualmente
enquanto isso não acontece.
