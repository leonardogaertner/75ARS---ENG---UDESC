# 💾 BLOCOS DE CÓDIGO PRONTOS PARA USO

## 1️⃣ NGINX.CONF

**Salve em:** `nginx/nginx.conf`

```nginx
events {
    worker_connections 1024;
}

http {
    upstream servico_clientes {
        server servico-clientes:3000;
    }

    upstream servico_produtos {
        server servico-produtos:8081;
    }

    upstream servico_pedidos {
        server servico-pedidos:8082;
    }

    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    server {
        listen 8080;
        server_name _;

        gzip on;
        gzip_types text/plain application/json text/javascript;

        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With, Accept' always;

        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With, Accept' always;
            add_header 'Content-Length' '0' always;
            return 204;
        }

        location /health {
            access_log off;
            return 200 '{"status":"ok"}';
            add_header Content-Type application/json;
        }

        location /api/clientes/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://servico_clientes/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $server_name;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }

        location /api/produtos/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://servico_produtos/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $server_name;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }

        location /api/pedidos/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://servico_pedidos/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $server_name;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }

        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ =404;
        }
    }
}
```

---

## 2️⃣ DOCKER-COMPOSE.YML

**Bloco de código para ADICIONAR ao docker-compose.yml existente:**

```yaml
  # Serviço de Clientes (Node.js/Express)
  servico-clientes:
    build:
      context: ./servico-clientes
      dockerfile: Dockerfile
    container_name: servico-clientes
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres-db
      - DB_PORT=5432
      - DB_USER=admin
      - DB_PASSWORD=admin_password
      - DB_NAME=microsservicos_db
      - DB_SCHEMA=clientes
    depends_on:
      - postgres-db
    restart: unless-stopped
    networks:
      - microsservicos-network

  # Serviço de Produtos (Java/Spring Boot)
  servico-produtos:
    build:
      context: ./servico-produtos
      dockerfile: Dockerfile
    container_name: servico-produtos
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres-db:5432/microsservicos_db
      - SPRING_DATASOURCE_USERNAME=admin
      - SPRING_DATASOURCE_PASSWORD=admin_password
      - SPRING_JPA_PROPERTIES_HIBERNATE_DEFAULT_SCHEMA=produtos
    ports:
      - "8081"
    depends_on:
      - postgres-db
    restart: unless-stopped
    networks:
      - microsservicos-network

  # Serviço de Pedidos (Java/Spring Boot)
  servico-pedidos:
    build:
      context: ./servico-pedidos
      dockerfile: Dockerfile
    container_name: servico-pedidos
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres-db:5432/microsservicos_db
      - SPRING_DATASOURCE_USERNAME=admin
      - SPRING_DATASOURCE_PASSWORD=admin_password
      - SPRING_JPA_PROPERTIES_HIBERNATE_DEFAULT_SCHEMA=pedidos
    ports:
      - "8082"
    depends_on:
      - postgres-db
    restart: unless-stopped
    networks:
      - microsservicos-network

  # API Gateway (Nginx)
  api-gateway:
    image: nginx:1.25-alpine
    container_name: api-gateway
    ports:
      - "8080:8080"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend:/usr/share/nginx/html:ro
    depends_on:
      - servico-clientes
      - servico-produtos
      - servico-pedidos
    restart: unless-stopped
    networks:
      - microsservicos-network

networks:
  microsservicos-network:
    driver: bridge
```

**Adicione ao final (se ainda não existir):**
```yaml
volumes:
  postgres_data:
```

---

## 3️⃣ FRONTEND/JS/API.JS

**Substitua todo o conteúdo por:**

```javascript
// frontend/js/api.js - Gateway functions for the REST Microservices
// Single entry point through API Gateway on port 8080
const GATEWAY_BASE_URL = 'http://localhost:8080/api';

const API_CONFIG = {
    produtos: `${GATEWAY_BASE_URL}/produtos`,
    pedidos: `${GATEWAY_BASE_URL}/pedidos`,
    clientes: `${GATEWAY_BASE_URL}/clientes`
};

const api = {
    async fetch(domain, endpoint, options = {}) {
        const baseUrl = API_CONFIG[domain];
        if (!baseUrl) throw new Error(`Domain ${domain} not configured in api.js`);
        
        const url = `${baseUrl}${endpoint}`;
        
        const fetchOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            console.log(`[API Request] ${options.method || 'GET'} ${url}`);
            const response = await window.fetch(url, fetchOptions);
            
            if (!response.ok) {
                let errorDetails = '';
                try {
                    const text = await response.text();
                    errorDetails = text;
                } catch(e) {}
                throw new Error(`Error ${response.status}: ${errorDetails}`);
            }
            
            if (response.status !== 204) {
                return await response.json();
            }
            return null;

        } catch (error) {
            console.error(`[API Error in ${domain}]`, error);
            throw error;
        }
    },

    get(domain, endpoint) {
        return this.fetch(domain, endpoint, { method: 'GET' });
    },

    post(domain, endpoint, data) {
        return this.fetch(domain, endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    put(domain, endpoint, data) {
        return this.fetch(domain, endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete(domain, endpoint) {
        return this.fetch(domain, endpoint, { method: 'DELETE' });
    }
};

window.api = api;
```

---

## 4️⃣ DOCKERFILES

### Dockerfile para `servico-clientes`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Dockerfile para `servico-produtos`:
```dockerfile
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY pom.xml .

COPY src ./src

RUN apk add --no-cache maven && \
    mvn clean package -DskipTests && \
    apk del maven

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "target/servico-produtos-0.0.1-SNAPSHOT.jar"]
```

### Dockerfile para `servico-pedidos`:
```dockerfile
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY pom.xml .

COPY src ./src

RUN apk add --no-cache maven && \
    mvn clean package -DskipTests && \
    apk del maven

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "target/servico-pedidos-0.0.1-SNAPSHOT.jar"]
```

---

## 🚀 COMANDO PARA INICIAR

```bash
docker-compose up -d
```

---

## ✅ VALIDAR COM

```bash
# Health check
curl http://localhost:8080/health

# Teste roteamento
curl http://localhost:8080/api/clientes/list
curl http://localhost:8080/api/produtos/list
curl http://localhost:8080/api/pedidos/list

# Verificar que portas estão bloqueadas
curl http://localhost:3000/ --connect-timeout 2    # ❌ Deve falhar
curl http://localhost:8081/ --connect-timeout 2   # ❌ Deve falhar
curl http://localhost:8082/ --connect-timeout 2   # ❌ Deve falhar
```

---

**Status:** ✅ Pronto para Produção
**Data:** 21 de Maio de 2026
