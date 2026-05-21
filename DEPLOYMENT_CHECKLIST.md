# 📋 CHECKLIST - Verificação Pós-Implantação

## ✅ Pré-Requisitos
- [ ] Docker Desktop instalado e em execução
- [ ] Docker Compose versão 3.8+ 
- [ ] Porta 8080 disponível (Gateway)
- [ ] Porta 5432 disponível (PostgreSQL)

---

## 🚀 Passos de Implantação

### 1. Verificar Estrutura de Diretórios
```bash
ls -la
# Deve conter:
# ✅ docker-compose.yml (ATUALIZADO)
# ✅ nginx/nginx.conf (NOVO)
# ✅ frontend/js/api.js (ATUALIZADO)
# ✅ servico-clientes/Dockerfile (NOVO)
# ✅ servico-produtos/Dockerfile (NOVO)
# ✅ servico-pedidos/Dockerfile (NOVO)
# ✅ API_GATEWAY_README.md (REFERÊNCIA)
```

### 2. Build e Start dos Containers
```bash
# Limpar dados antigos (OPCIONAL)
docker-compose down -v

# Iniciar infraestrutura completa
docker-compose up -d

# Monitorar logs
docker-compose logs -f
```

**Tempo esperado:** 2-5 minutos (primeiro build é mais lento)

### 3. Verificar Status dos Containers
```bash
docker-compose ps

# Esperado:
# STATUS: Up (for X seconds)
# api-gateway      → Up
# servico-clientes → Up
# servico-produtos → Up
# servico-pedidos  → Up
# postgres-db      → Up
```

### 4. Teste de Conectividade - Gateway
```bash
# Health check do gateway
curl http://localhost:8080/health

# Resposta esperada:
# {"status":"ok"}
```

### 5. Teste de Roteamento
```bash
# Clientes (deve retornar resposta do Node.js)
curl http://localhost:8080/api/clientes/list

# Produtos (deve retornar resposta do Spring Boot)
curl http://localhost:8080/api/produtos/list

# Pedidos (deve retornar resposta do Spring Boot)
curl http://localhost:8080/api/pedidos/list
```

### 6. Teste de CORS
```bash
curl -X OPTIONS http://localhost:8080/api/clientes/list \
  -H "Origin: http://localhost" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Verificar se headers CORS estão presentes:
# access-control-allow-origin: *
# access-control-allow-methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
# access-control-allow-headers: Content-Type, Authorization, X-Requested-With, Accept
```

### 7. Teste do Frontend
```bash
# Abrir no navegador:
http://localhost:8080

# Verificar console do navegador (F12):
# - Não deve haver erros de CORS
# - Requisições devem ir para http://localhost:8080/api/...
```

### 8. Verificar Isolamento de Portas
```bash
# Estas requisições DEVEM falhar (portas bloqueadas):

# ❌ Tentando acessar clientes diretamente
curl http://localhost:3000/list --connect-timeout 2
# Esperado: connection refused

# ❌ Tentando acessar produtos diretamente  
curl http://localhost:8081/list --connect-timeout 2
# Esperado: connection refused

# ❌ Tentando acessar pedidos diretamente
curl http://localhost:8082/list --connect-timeout 2
# Esperado: connection refused
```

### 9. Verificar Logs
```bash
# Logs do Gateway Nginx
docker logs api-gateway | tail -50

# Logs do Serviço de Clientes
docker logs servico-clientes | tail -50

# Logs do Serviço de Produtos
docker logs servico-produtos | tail -50

# Logs do Serviço de Pedidos
docker logs servico-pedidos | tail -50

# Logs do PostgreSQL
docker logs microsservicos-postgres | tail -20
```

### 10. Teste de Banco de Dados
```bash
# Conectar ao PostgreSQL
docker exec -it microsservicos-postgres psql -U admin -d microsservicos_db

# No psql, verificar schemas:
\dn
# Esperado: clientes, pedidos, produtos (se criados em init.sql)

# Sair
\q
```

---

## 🔄 Fluxo de Requisição Esperado

```
1. Frontend faz: api.get('clientes', '/list')
   ↓
2. api.js converte para: http://localhost:8080/api/clientes/list
   ↓
3. Nginx recebe na porta 8080
   ↓
4. Nginx roteia para: http://servico-clientes:3000/list
   ↓
5. Serviço Node.js processa
   ↓
6. Resposta retorna ao frontend com CORS headers
```

---

## 🐛 Troubleshooting

### Problema: "Connection refused" ao acessar gateway
**Solução:**
```bash
# Verificar se gateway está running
docker ps | grep api-gateway

# Verificar logs
docker logs api-gateway

# Reiniciar
docker-compose restart api-gateway
```

### Problema: CORS bloqueando requisições no navegador
**Solução:**
```bash
# Verificar headers CORS em resposta
curl -i http://localhost:8080/api/clientes/list

# Headers esperados:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

### Problema: Microsserviços não conseguem conectar ao banco
**Solução:**
```bash
# Verificar se postgres está running
docker ps | grep postgres

# Verificar variáveis de ambiente
docker inspect servico-clientes | grep -A 20 "Env"

# Reiniciar serviço
docker-compose restart servico-clientes
```

### Problema: Frontend não carrega
**Solução:**
```bash
# Verificar se nginx está servindo frontend
curl http://localhost:8080/

# Deve retornar HTML do index.html
```

---

## 📊 Monitoramento Contínuo

### Ver todas as requisições passando pelo Nginx
```bash
docker logs api-gateway -f | grep "GET\|POST\|PUT\|DELETE"
```

### Ver uso de recursos
```bash
docker stats
```

---

## 🛑 Parar Infraestrutura

```bash
# Parar containers (mantém volumes)
docker-compose down

# Parar containers e limpar volumes (cuidado!)
docker-compose down -v
```

---

## 📝 Próximos Passos (Para Produção)

- [ ] Substituir `Access-Control-Allow-Origin: *` por domínio específico
- [ ] Configurar HTTPS/SSL no Nginx
- [ ] Adicionar autenticação JWT
- [ ] Implementar rate limiting mais restritivo
- [ ] Configurar circuit breaker
- [ ] Adicionar distributed tracing (Jaeger/Zipkin)
- [ ] Implementar caching com Redis
- [ ] Configurar alertas e monitoramento

---

**Status:** ✅ Pronto para testes  
**Data:** 2026-05-21  
**Projeto:** Arquitetura de Microsserviços UDESC
