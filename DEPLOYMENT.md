# Guia de Implantação

Este documento descreve o passo a passo para clonar o repositório e executar a aplicação usando Docker Compose.

## 1. Pré-requisitos

- Git instalado
- Docker instalado e em execução
- Docker Compose disponível (Docker Desktop já inclui)
- No Windows, execute os comandos no PowerShell ou no terminal Git Bash

## 2. Clonar o repositório

Abra um terminal e execute:

```powershell
cd C:\Users\<seu-usuario>\Desktop
git clone https://github.com/usuario/75ARS---ENG---UDESC.git
cd 75ARS---ENG---UDESC
```

## 3. Inspecionar os arquivos principais

- `docker-compose.yml` - define os serviços e dependências
- `nginx/nginx.conf` - configuração do API Gateway
- `servico-clientes/` - serviço Node.js
- `servico-produtos/` - serviço Java Spring Boot
- `servico-pedidos/` - serviço Java Spring Boot
- `frontend/` - frontend estático servido pelo Nginx
- `init.sql` - script de inicialização do banco PostgreSQL

## 4. Subir a aplicação

No diretório raiz do projeto, execute:

```powershell
docker-compose up -d
```

Isso irá:

- subir o container `postgres-db`
- buildar e iniciar `servico-clientes`
- buildar e iniciar `servico-produtos`
- buildar e iniciar `servico-pedidos`
- rodar o `api-gateway` Nginx

## 5. Esperar os serviços estarem prontos

Aguarde alguns minutos para que a compilação dos serviços e a inicialização do banco se completem.

Verifique o status com:

```powershell
docker-compose ps
```

## 6. Testar a aplicação

### Health check do gateway

```powershell
curl http://localhost:8080/health
```

Resposta esperada:

```json
{"status":"ok"}
```

### Acessar o frontend

Abra no navegador:

```text
http://localhost:8080/
```

### Testar endpoints via gateway

```powershell
curl http://localhost:8080/api/clientes/
curl http://localhost:8080/api/produtos/
curl http://localhost:8080/api/pedidos/
```

## 7. Parar a aplicação

Para desligar todos os containers:

```powershell
docker-compose down
```

## 8. Logs e debugging

### Ver todos os logs

```powershell
docker-compose logs -f
```

### Ver logs de um container específico

```powershell
docker logs -f api-gateway
docker logs -f servico-clientes
docker logs -f servico-produtos
docker logs -f servico-pedidos
```

## 9. Observações importantes

- A aplicação expõe apenas a porta `8080` externamente através do gateway Nginx.
- Os serviços internos usam as portas:
  - `servico-clientes`: `3000`
  - `servico-produtos`: `8081`
  - `servico-pedidos`: `8082`
- O PostgreSQL fica em `5432` internamente.
- O frontend se comunica com os microsserviços através do gateway em `http://localhost:8080/api`.

## 10. Requisitos de rede

- Não é necessário expor as portas internas diretamente no host.
- O gateway Nginx faz o roteamento para os serviços internos.
- Se quiser acessar diretamente os serviços para debug local, use `docker exec -it <container> /bin/sh` ou `bash`.
