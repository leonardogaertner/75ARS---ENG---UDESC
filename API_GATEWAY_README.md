# 🏗️ API Gateway - Arquitetura de Microsserviços UDESC

## 📋 Resumo da Solução Implementada

Esta solução implementa um **API Gateway centralizado usando Nginx** como ponto de entrada único para todos os microsserviços, bloqueando acesso direto às portas internas e expondo apenas a porta **8080**.

---

## 📂 Estrutura de Arquivos Criados

```
project-root/
├── docker-compose.yml           ✅ (ATUALIZADO - agora com todos os serviços)
├── nginx/
│   └── nginx.conf               ✅ (NOVO - configuração do API Gateway)
├── servico-clientes/
│   ├── Dockerfile               ✅ (NOVO)
│   └── src/
│       └── index.js
├── servico-produtos/
│   ├── Dockerfile               ✅ (NOVO)
│   └── pom.xml
├── servico-pedidos/
│   ├── Dockerfile               ✅ (NOVO)
│   └── pom.xml
├── frontend/
│   └── js/
│       └── api.js               ✅ (ATUALIZADO - usa gateway único)
└── init.sql
```

---

## 🚀 Como Executar

### 1. **Iniciar a Infraestrutura Completa**

```bash
# A partir da raiz do projeto
docker-compose up -d
```

Isso vai inicializar:
- ✅ PostgreSQL (porta 5432 - interna)
- ✅ Serviço de Clientes (porta 3000 - interna apenas)
- ✅ Serviço de Produtos (porta 8081 - interna apenas)
- ✅ Serviço de Pedidos (porta 8082 - interna apenas)
- ✅ **API Gateway Nginx** (porta **8080 - ÚNICA exposta externamente**)

### 2. **Acessar a Aplicação**

**Frontend:** http://localhost:8080/

**API Gateway (Health Check):** http://localhost:8080/health

---

## 🔐 Roteamento de Requisições

O Nginx roteia as requisições da seguinte forma:

| Caminho no Gateway | Microsserviço | Porta Interna |
|:--|:--|:--|
| `http://localhost:8080/api/clientes/**` | servico-clientes | 3000 |
| `http://localhost:8080/api/produtos/**` | servico-produtos | 8081 |
| `http://localhost:8080/api/pedidos/**` | servico-pedidos | 8082 |

---

## 📡 Funcionalidades do API Gateway (nginx.conf)

✅ **CORS Completo** - Headers CORS configurados para aceitar requisições do frontend
✅ **Rate Limiting** - 10 requisições por segundo (burst de 20)
✅ **Gzip Compression** - Respostas JSON comprimidas automaticamente
✅ **Health Check** - Endpoint `/health` para monitoramento
✅ **Proxy Headers** - X-Real-IP, X-Forwarded-For, X-Forwarded-Proto, etc.
✅ **Timeouts Configurados** - 60s para conexão/leitura/escrita
✅ **Buffering** - Otimizado para alto throughput

---

## 🔄 Frontend API - Novo Endpoint Único

O arquivo [frontend/js/api.js](frontend/js/api.js) foi atualizado para usar:

```javascript
const GATEWAY_BASE_URL = 'http://localhost:8080/api';
```

**Antes:**
```javascript
api.get('clientes', '/endpoint')  // → http://localhost:3000/endpoint
api.get('produtos', '/endpoint')  // → http://localhost:8081/endpoint
api.get('pedidos', '/endpoint')   // → http://localhost:8082/endpoint
```

**Depois:**
```javascript
api.get('clientes', '/endpoint')  // → http://localhost:8080/api/clientes/endpoint
api.get('produtos', '/endpoint')  // → http://localhost:8080/api/produtos/endpoint
api.get('pedidos', '/endpoint')   // → http://localhost:8080/api/pedidos/endpoint
```

---

## 🔧 Segurança - Portas Bloqueadas

As portas dos microsserviços **NÃO estão expostas** no docker-compose.yml:

```yaml
# ❌ REMOVIDO - Portas não estão expostas
# servico-clientes:
#   ports:
#     - "3000:3000"  # ← BLOQUEADO
#
# servico-produtos:
#   ports:
#     - "8081:8081"  # ← BLOQUEADO
```

Apenas a porta do Nginx está exposta:
```yaml
api-gateway:
  ports:
    - "8080:8080"  # ✅ ÚNICA PORTA EXPOSTA
```

---

## 📊 Monitoramento

### Verificar se o Gateway está respondendo:
```bash
curl http://localhost:8080/health
```

**Resposta esperada:**
```json
{"status":"ok"}
```

### Ver logs do Nginx:
```bash
docker logs api-gateway
```

### Testar roteamento:
```bash
# Clientes
curl http://localhost:8080/api/clientes/list

# Produtos
curl http://localhost:8080/api/produtos/list

# Pedidos
curl http://localhost:8080/api/pedidos/list
```

---

## 🛑 Parar a Infraestrutura

```bash
docker-compose down
```

---

## 📝 Notas Importantes

1. **Rede Interna Docker:** Todos os serviços estão conectados via `microsservicos-network` bridge, permitindo comunicação interna transparente pelo nome do container.

2. **Variáveis de Ambiente:** Os microsserviços recebem as credenciais do banco via variáveis de ambiente no docker-compose.yml.

3. **Schemas PostgreSQL:** No arquivo `init.sql`, certifique-se de criar schemas separados (clientes, produtos, pedidos) para cada microsserviço.

4. **CORS em Produção:** Para produção, substitua `'*'` por um domínio específico no nginx.conf:
   ```nginx
   add_header 'Access-Control-Allow-Origin' 'https://seu-dominio.com' always;
   ```

---

## ✅ Arquitetura Implementada

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (HTML/JS)                   │
│              Requisições para http://localhost:8080     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────────┐
         │   API GATEWAY - NGINX (8080)    │
         │  (ÚNICO PONTO DE ENTRADA)       │
         └────┬──────────────┬─────────┬───┘
              │              │         │
       ┌──────▼──┐    ┌──────▼──┐  ┌──▼────────┐
       │Clientes │    │Produtos │  │  Pedidos  │
       │(Node.js)│    │(Spring) │  │ (Spring)  │
       │:3000    │    │:8081    │  │  :8082    │
       └──────┬──┘    └──────┬──┘  └──┬────────┘
              │              │         │
              └──────────────┼─────────┘
                             │
                    ┌────────▼────────┐
                    │  PostgreSQL     │
                    │  (único banco)  │
                    │     :5432       │
                    └─────────────────┘
```

---

**Desenvolvido como:** Arquitetura de Microsserviços para UDESC (2026)
**Padrão de Projeto:** API Gateway Pattern
**Tecnologias:** Docker, Nginx, Node.js, Java/Spring Boot, PostgreSQL
