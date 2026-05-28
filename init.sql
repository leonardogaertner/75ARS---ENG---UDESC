--DROP SCHEMA IF EXISTS clientes CASCADE;
--DROP SCHEMA IF EXISTS produtos CASCADE;
--DROP SCHEMA IF EXISTS pedidos CASCADE;


-- Criação dos Schemas para manter o isolamento lógico exigido por microsserviços
CREATE SCHEMA IF NOT EXISTS clientes;
CREATE SCHEMA IF NOT EXISTS produtos;
CREATE SCHEMA IF NOT EXISTS pedidos;

-- ==========================================
-- SCHEMA: clientes (Consumido pelo serviço Node.js)
-- ==========================================
CREATE TABLE clientes.cliente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefone VARCHAR(20)
);

-- ==========================================
-- SCHEMA: produtos (Consumido pelo serviço Spring Boot 1)
-- ==========================================
CREATE TABLE produtos.produto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
);

-- ==========================================
-- SCHEMA: pedidos (Consumido pelo serviço Spring Boot 2)
-- ==========================================
CREATE TABLE pedidos.pedido (
    id SERIAL PRIMARY KEY,
    -- Referência lógica ao Cliente (Soft Reference). Não usamos FK cruzando schemas em microsserviços.
    cliente_id INTEGER NOT NULL, 
    -- Referência lógica ao Produto (Soft Reference).
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);