const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'microsservicos_db',
    password: process.env.DB_PASSWORD || 'admin_password',
    port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
    console.log('[Database] Conectado ao banco de dados PostgreSQL com sucesso!');
});

pool.on('error', (err) => {
    console.error('[Database] Erro na conexão do pool:', err);
});

// Teste de conexão ao iniciar
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('[Database] Erro ao testar conexão:', err.message);
    } else {
        console.log('[Database] Teste de conexão bem-sucedido. Hora do servidor:', res.rows[0].now);
    }
});

module.exports = pool;
