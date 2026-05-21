# 🏗️ API Gateway - Microsserviços UDESC

## 📋 Visão Geral

Arquitetura de microsserviços implementada com **API Gateway centralizado usando Nginx** como ponto de entrada único para todos os serviços. A solução expõe apenas a **porta 8080** para o mundo exterior, bloqueando acesso direto aos microsserviços.

### Stack Tecnológico
- **API Gateway:** Nginx 1.25 (porta 8080)
- **Serviço de Clientes:** Node.js/Express (porta 3000 - interna)
- **Serviço de Produtos:** Java/Spring Boot (porta 8081 - interna)
- **Serviço de Pedidos:** Java/Spring Boot (porta 8082 - interna)
- **Banco de Dados:** PostgreSQL (porta 5432 - interna)
- **Orquestração:** Docker Compose

---

## 🚀 Início Rápido

### Pré-requisitos
- Docker Desktop instalado e em execução
- Docker Compose versão 3.8+

### Executar a Aplicação
```bash
# 1. Navegar para pasta do projeto
cd c:\Users\leonardo_gaertner\Desktop\ars\75ARS---ENG---UDESC

# 2. Iniciar infraestrutura completa
docker-compose up -d

# Aguardar 2-5 minutos (builds Docker executando)
```

### Validar Execução
```bash
# Health check do gateway
curl http://localhost:8080/health
# Resposta esperada: {"status":"ok"}

# Acessar frontend
http://localhost:8080/

# Testar roteamento (substitua /list pelo seu endpoint)
curl http://localhost:8080/api/clientes/list
curl http://localhost:8080/api/produtos/list
curl http://localhost:8080/api/pedidos/list
```

### Parar a Infraestrutura
```bash
docker-compose down
```

---

## 🔗 Roteamento de Requisições

O Nginx roteia as requisições da seguinte forma:

| Endpoint | Microsserviço | Porta Interna |
|:--|:--|:--|
| `http://localhost:8080/api/clientes/**` | servico-clientes | 3000 |
| `http://localhost:8080/api/produtos/**` | servico-produtos | 8081 |
| `http://localhost:8080/api/pedidos/**` | servico-pedidos | 8082 |
| `http://localhost:8080/health` | Nginx health check | - |

---

## 📂 Estrutura de Arquivos

```
project-root/
├── docker-compose.yml              # Orquestração dos containers
├── nginx/
│   └── nginx.conf                  # Configuração do API Gateway
├── servico-clientes/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── src/
├── servico-produtos/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── pom.xml
├── servico-pedidos/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── pom.xml
├── frontend/
│   └── js/
│       └── api.js                  # Cliente HTTP atualizado para gateway
├── init.sql                        # Script de inicialização do BD
└── README.md                        # Este arquivo
```

---

## 🏛️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (HTML/JS)                         │
│          Requisições para http://localhost:8080         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────────┐
         │   API GATEWAY - NGINX (8080)    │
         │  (ÚNICO PONTO DE ENTRADA)       │
         │  - CORS Habilitado              │
         │  - Rate Limiting (10 req/s)     │
         │  - Gzip Compression             │
         └────┬──────────────┬─────────┬───┘
              │              │         │
       ┌──────▼──┐    ┌──────▼──┐  ┌──▼────────┐
       │Clientes │    │Produtos │  │  Pedidos  │
       │Node.js  │    │ Spring  │  │  Spring   │
       │:3000    │    │ :8081   │  │  :8082    │
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

## 🔐 Segurança

✅ **Single Entry Point:** Apenas porta 8080 exposta externamente  
✅ **Bloqueio de Portas:** Microsserviços não acessíveis diretamente (3000, 8081, 8082)  
✅ **CORS Configurado:** Headers CORS no Nginx para permitir frontend  
✅ **Rate Limiting:** 10 requisições por segundo por IP (burst de 20)  
✅ **Proxy Headers:** X-Real-IP, X-Forwarded-For, X-Forwarded-Proto  
✅ **Gzip Compression:** Respostas JSON comprimidas automaticamente  

---

## 📡 Configuração do Frontend

O arquivo `frontend/js/api.js` foi atualizado para usar o gateway único:

```javascript
// Endpoint centralizado
const GATEWAY_BASE_URL = 'http://localhost:8080/api';

const API_CONFIG = {
    produtos: `${GATEWAY_BASE_URL}/produtos`,
    pedidos: `${GATEWAY_BASE_URL}/pedidos`,
    clientes: `${GATEWAY_BASE_URL}/clientes`
};

// Uso:
api.get('clientes', '/list')  // → http://localhost:8080/api/clientes/list
api.post('produtos', '/create', data)  // → http://localhost:8080/api/produtos/create
api.delete('pedidos', '/123')  // → http://localhost:8080/api/pedidos/123
```

---

## 🔧 Configuração do Nginx

O arquivo `nginx/nginx.conf` contém:

- **Upstream servers:** Definição dos 3 microsserviços
- **CORS headers:** Permitir requisições do frontend
- **Rate limiting:** Proteção contra abuso (10 req/s)
- **Reverse proxy:** Roteamento inteligente por caminho
- **Headers de proxy:** Forwarding de IP real e protocolo
- **Timeouts:** 60s para conexão, leitura e escrita
- **Buffering:** Otimizado para alto throughput

### Exemplo de localização no nginx.conf:

```nginx
location /api/clientes/ {
    proxy_pass http://servico_clientes/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # ... mais configurações
}
```

---

## 🐛 Troubleshooting

### Problema: "Connection refused" ao acessar http://localhost:8080/health

**Solução:**
```bash
# Verificar se containers estão rodando
docker-compose ps

# Verificar logs do gateway
docker logs api-gateway

# Reiniciar serviço
docker-compose restart api-gateway
```

### Problema: CORS bloqueando requisições no navegador

**Solução:**
```bash
# Verificar se headers CORS estão presentes
curl -i http://localhost:8080/api/clientes/list | grep -i "access-control"

# Headers esperados:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

### Problema: Microsserviços não conseguem conectar ao banco

**Solução:**
```bash
# Verificar se postgres está rodando
docker ps | grep postgres

# Ver logs do serviço
docker logs servico-clientes

# Reiniciar serviço
docker-compose restart servico-clientes
```

### Problema: Tentando acessar serviço diretamente (deveria falhar)

**Esperado - Porta bloqueada:**
```bash
# Estas requisições DEVEM retornar "connection refused"
curl http://localhost:3000/list --connect-timeout 2    # ❌ BLOQUEADO
curl http://localhost:8081/list --connect-timeout 2    # ❌ BLOQUEADO
curl http://localhost:8082/list --connect-timeout 2    # ❌ BLOQUEADO
```

---

## 📊 Monitoramento

### Ver status dos containers
```bash
docker-compose ps
```

### Ver logs em tempo real
```bash
# Todos os serviços
docker-compose logs -f

# Apenas gateway
docker logs -f api-gateway

# Apenas um microsserviço
docker logs -f servico-clientes
```

### Ver uso de recursos
```bash
docker stats
```

### Teste de todas as rotas
```bash
# Health check
curl http://localhost:8080/health

# Clientes
curl http://localhost:8080/api/clientes/list

# Produtos
curl http://localhost:8080/api/produtos/list

# Pedidos
curl http://localhost:8080/api/pedidos/list
```

---

## 🌍 Variáveis de Ambiente

As variáveis estão configuradas no `docker-compose.yml`:

```yaml
# Clientes (Node.js)
environment:
  - NODE_ENV=production
  - DB_HOST=postgres-db
  - DB_PORT=5432
  - DB_USER=admin
  - DB_PASSWORD=admin_password
  - DB_SCHEMA=clientes

# Produtos e Pedidos (Spring Boot)
environment:
  - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres-db:5432/microsservicos_db
  - SPRING_DATASOURCE_USERNAME=admin
  - SPRING_DATASOURCE_PASSWORD=admin_password
  - SPRING_JPA_PROPERTIES_HIBERNATE_DEFAULT_SCHEMA=produtos
```

Para usar um arquivo `.env` separado, crie `.env` na raiz com as mesmas variáveis.

---

## 📝 Scripts Úteis

### Limpar tudo (containers + volumes)
```bash
docker-compose down -v
```

### Rebuild de um serviço específico
```bash
docker-compose up -d --build servico-clientes
```

### Executar comando dentro de um container
```bash
docker exec -it api-gateway sh
docker exec -it servico-clientes bash
docker exec -it servico-produtos bash
```

### Conectar ao PostgreSQL
```bash
docker exec -it microsservicos-postgres psql -U admin -d microsservicos_db

# No psql:
\dn              # Listar schemas
\dt              # Listar tabelas
\q               # Sair
```

---

## 🎯 Casos de Uso Comuns

### Criar um novo pedido
```javascript
// No frontend
api.post('pedidos', '/create', {
    cliente_id: 1,
    produtos: [{id: 1, quantidade: 2}],
    total: 150.00
})
.then(response => console.log('Pedido criado:', response))
.catch(error => console.error('Erro:', error));

// Requisição real:
// POST http://localhost:8080/api/pedidos/create
```

### Listar clientes
```javascript
api.get('clientes', '/list')
.then(clientes => console.log('Clientes:', clientes))
.catch(error => console.error('Erro:', error));

// Requisição real:
// GET http://localhost:8080/api/clientes/list
```

### Atualizar produto
```javascript
api.put('produtos', '/123', {
    nome: 'Novo Nome',
    preco: 99.99
})
.then(response => console.log('Atualizado:', response))
.catch(error => console.error('Erro:', error));

// Requisição real:
// PUT http://localhost:8080/api/produtos/123
```

### Deletar pedido
```javascript
api.delete('pedidos', '/456')
.then(() => console.log('Deletado'))
.catch(error => console.error('Erro:', error));

// Requisição real:
// DELETE http://localhost:8080/api/pedidos/456
```

---

## 🚄 Performance

- ✅ **Latência reduzida:** Single hop via gateway
- ✅ **Compressão:** Gzip automático em respostas JSON
- ✅ **Buffering inteligente:** 4KB buffer por conexão
- ✅ **Timeouts:** 60s para evitar requisições penduradas
- ✅ **Rate limiting:** Proteção contra abuso

---

## 📞 Fluxo de Requisição

```
1. Frontend executa:
   api.get('clientes', '/list')

2. api.js converte para:
   GET http://localhost:8080/api/clientes/list

3. Nginx recebe na porta 8080 e valida CORS

4. Nginx roteia para:
   GET http://servico-clientes:3000/list

5. Serviço Node.js processa e retorna resposta JSON

6. Nginx comprime resposta com Gzip

7. Nginx adiciona headers CORS na resposta

8. Frontend recebe e renderiza dados
```

---

## ✅ Checklist Pós-Implantação

- [ ] `docker-compose ps` mostra todos os serviços como "Up"
- [ ] `curl http://localhost:8080/health` retorna `{"status":"ok"}`
- [ ] Frontend carrega em `http://localhost:8080/`
- [ ] Requisições da API funcionam sem erros CORS
- [ ] Acesso direto aos microsserviços é bloqueado (3000, 8081, 8082)
- [ ] Logs não mostram erros de conexão com BD
- [ ] Rate limiting responde com erro quando limite é excedido

---

## 🔮 Próximos Passos (Para Produção)

- [ ] Configurar HTTPS/SSL no Nginx
- [ ] Implementar autenticação JWT no gateway
- [ ] Adicionar circuit breaker pattern
- [ ] Implementar distributed tracing (Jaeger/Zipkin)
- [ ] Adicionar caching com Redis
- [ ] Configurar alertas e monitoramento (Prometheus/Grafana)
- [ ] Implementar logging centralizado (ELK Stack)
- [ ] Adicionar API versioning (v1, v2, etc.)
- [ ] Configurar backup automático do PostgreSQL

---

## 📚 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `docker-compose.yml` | Orquestração de todos os serviços |
| `nginx/nginx.conf` | Configuração do API Gateway |
| `frontend/js/api.js` | Cliente HTTP centralizado |
| `init.sql` | Script de inicialização do banco |
| `servico-clientes/Dockerfile` | Build do serviço Node.js |
| `servico-produtos/Dockerfile` | Build do serviço Spring Boot |
| `servico-pedidos/Dockerfile` | Build do serviço Spring Boot |

---

## 💡 Padrão de Arquitetura

Esta solução implementa o **API Gateway Pattern**, um dos padrões mais importantes em microsserviços:

**Benefícios:**
- Versioning e evolução independente de serviços
- Segurança centralizada
- Escalabilidade horizontal
- Falha de um serviço não quebra a arquitetura
- Rate limiting e throttling centralizados
- Descoberta de serviços transparente

---

## 📞 Suporte

### Se algo não funcionar:

1. Verifique se Docker está rodando: `docker ps`
2. Veja os logs: `docker-compose logs -f`
3. Reinicie os containers: `docker-compose restart`
4. Limpe tudo e comece do zero: `docker-compose down -v && docker-compose up -d`

---

**Status:** ✅ Pronto para Uso  
**Data:** 21 de Maio de 2026  
**Projeto:** Arquitetura de Microsserviços UDESC - ENG
