const pool = require('../config/database');

const SCHEMA = process.env.DB_SCHEMA || 'public';

const ClienteModel = {
    // Cria a tabela se não existir
    createTable: async () => {
        try {
            // Primeira, cria o schema se não existir
            const createSchemaQuery = `CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`;
            await pool.query(createSchemaQuery);
            console.log(`[ClienteModel] Schema ${SCHEMA} criado/verificado com sucesso`);

            // Depois, cria a tabela
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS ${SCHEMA}.clientes (
                    id SERIAL PRIMARY KEY,
                    nome VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    telefone VARCHAR(20),
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            await pool.query(createTableQuery);
            console.log(`[ClienteModel] Tabela ${SCHEMA}.clientes criada/verificada com sucesso`);
        } catch (error) {
            console.error(`[ClienteModel] Erro ao criar schema/tabela:`, error.message);
            throw error;
        }
    },

    create: async (cliente) => {
        const { nome, email, telefone } = cliente;
        const query = `INSERT INTO ${SCHEMA}.clientes (nome, email, telefone) VALUES ($1, $2, $3) RETURNING *`;
        const values = [nome, email, telefone];
        try {
            const res = await pool.query(query, values);
            return res.rows[0];
        } catch (error) {
            console.error(`[ClienteModel.create] Erro:`, error.message);
            throw error;
        }
    },

    findAll: async () => {
        const query = `SELECT * FROM ${SCHEMA}.clientes ORDER BY id ASC`;
        try {
            const res = await pool.query(query);
            return res.rows;
        } catch (error) {
            console.error(`[ClienteModel.findAll] Erro:`, error.message);
            throw error;
        }
    },

    findById: async (id) => {
        const query = `SELECT * FROM ${SCHEMA}.clientes WHERE id = $1`;
        try {
            const res = await pool.query(query, [id]);
            return res.rows[0];
        } catch (error) {
            console.error(`[ClienteModel.findById] Erro:`, error.message);
            throw error;
        }
    },

    update: async (id, cliente) => {
        const { nome, email, telefone } = cliente;
        const query = `UPDATE ${SCHEMA}.clientes SET nome = $1, email = $2, telefone = $3 WHERE id = $4 RETURNING *`;
        const values = [nome, email, telefone, id];
        try {
            const res = await pool.query(query, values);
            return res.rows[0];
        } catch (error) {
            console.error(`[ClienteModel.update] Erro:`, error.message);
            throw error;
        }
    },

    delete: async (id) => {
        const query = `DELETE FROM ${SCHEMA}.clientes WHERE id = $1 RETURNING *`;
        try {
            const res = await pool.query(query, [id]);
            return res.rows[0];
        } catch (error) {
            console.error(`[ClienteModel.delete] Erro:`, error.message);
            throw error;
        }
    }
};

// Auto-cria a tabela ao iniciar o módulo para facilitar
ClienteModel.createTable().catch(err => console.error("Erro ao criar a tabela clientes:", err));

module.exports = ClienteModel;
