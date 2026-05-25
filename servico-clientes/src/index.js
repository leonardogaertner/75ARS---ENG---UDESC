require('dotenv').config();
const express = require('express');
const cors = require('cors');

const clientesRoutes = require('./routes/clientesRoutes');
const ClienteModel = require('./models/clienteModel');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Logs de inicialização
console.log('[Server] Configurações:');
console.log(`  - DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  - DB_PORT: ${process.env.DB_PORT || 5432}`);
console.log(`  - DB_NAME: ${process.env.DB_NAME || 'microsservicos_db'}`);
console.log(`  - DB_SCHEMA: ${process.env.DB_SCHEMA || 'public'}`);
console.log(`  - PORT: ${PORT}`);

// Rotas
app.use('/', clientesRoutes);

// Middleware para tratamento de erros global
app.use((err, req, res, next) => {
    console.error('[Server] Erro não tratado:', err);
    res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
});

// Função para retry com backoff exponencial
async function retryOperation(operation, maxRetries = 10, initialDelay = 2000) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            const delay = initialDelay * Math.pow(2, attempt - 1);
            console.log(`[Server] Tentativa ${attempt}/${maxRetries} falhou. Aguardando ${delay}ms...`);
            console.log(`[Server] Erro: ${error.message}`);
            
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

// Inicializar servidor com verificação do banco de dados
async function iniciarServidor() {
    try {
        console.log('[Server] Aguardando inicialização do banco de dados...');
        
        // Retry com backoff exponencial para aguardar PostgreSQL
        await retryOperation(() => ClienteModel.createTable());
        
        console.log('[Server] Banco de dados inicializado com sucesso!');
        
        app.listen(PORT, () => {
            console.log(`[Server] Microsserviço de Clientes rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error('[Server] Erro crítico ao inicializar:', error.message);
        process.exit(1);
    }
}

iniciarServidor();
