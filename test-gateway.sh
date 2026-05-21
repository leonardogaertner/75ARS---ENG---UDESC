#!/bin/bash
# TESTES RÁPIDOS - API Gateway

echo "🧪 TESTE 1: Verificar se o Gateway está online"
curl -s http://localhost:8080/health | jq . || echo "❌ Gateway não responde"
echo -e "\n"

echo "🧪 TESTE 2: Preflight CORS (OPTIONS)"
curl -s -X OPTIONS http://localhost:8080/api/clientes/list \
  -H "Origin: http://localhost" \
  -H "Access-Control-Request-Method: GET" \
  -v 2>&1 | grep -i "access-control" || echo "❌ CORS headers ausentes"
echo -e "\n"

echo "🧪 TESTE 3: Status do Serviço de Clientes (via Gateway)"
curl -s http://localhost:8080/api/clientes/health || echo "❌ Serviço clientes não responde via gateway"
echo -e "\n"

echo "🧪 TESTE 4: Status do Serviço de Produtos (via Gateway)"
curl -s http://localhost:8080/api/produtos/health || echo "❌ Serviço produtos não responde via gateway"
echo -e "\n"

echo "🧪 TESTE 5: Status do Serviço de Pedidos (via Gateway)"
curl -s http://localhost:8080/api/pedidos/health || echo "❌ Serviço pedidos não responde via gateway"
echo -e "\n"

echo "🧪 TESTE 6: Verificar que portas internas estão bloqueadas"
echo "Tentando acessar clientes direto na 3000 (deve falhar):"
timeout 2 curl -s http://localhost:3000/health || echo "✅ Porta 3000 bloqueada corretamente"
echo -e "\n"

echo "🧪 TESTE 7: Verificar logs do Nginx"
docker logs api-gateway | tail -20
echo -e "\n"

echo "✅ Testes completos!"
