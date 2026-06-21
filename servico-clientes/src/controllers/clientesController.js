// Usar fetch nativo do Node.js 18+ (globalThis.fetch)
const ClienteModel = require('../models/clienteModel');

async function clientePossuiPedidos(id) {
    // Comunicação direta com o serviço de pedidos (sem passar pelo API Gateway)
    const url = `http://servico-pedidos:8082/pedidos/cliente/${id}`;

    try {
        console.log(`[clientePossuiPedidos] Verificando pedidos para cliente: ${id} em ${url}`);
        const response = await fetch(url);
        
        console.log(`[clientePossuiPedidos] Status: ${response.status}`);
        
        // Tratar 404 como "sem pedidos" (é um resultado válido)
        if (response.status === 404) {
            console.log(`[clientePossuiPedidos] Cliente não encontrado ou sem pedidos (404)`);
            return false; // Sem pedidos = pode deletar
        }
        
        if (!response.ok) {
            console.error(`[clientePossuiPedidos] Erro HTTP ${response.status} ao verificar pedidos`);
            throw new Error(`Falha ao verificar pedidos do cliente: ${response.status}`);
        }

        const pedidos = await response.json();
        console.log(`[clientePossuiPedidos] Pedidos retornados:`, pedidos);
        
        const temPedidos = Array.isArray(pedidos) && pedidos.length > 0;
        console.log(`[clientePossuiPedidos] Cliente possui pedidos: ${temPedidos}`);
        
        return temPedidos;
    } catch (error) {
        console.error('[clientePossuiPedidos] Erro ao verificar pedidos do cliente:', error);
        throw error;
    }
}

const clientesController = {
    createCliente: async (req, res) => {
        try {
            const { nome, email} = req.body;
            console.log('[createCliente] Recebido:', { nome, email});
            
            if (!nome || !email) {
                console.warn('[createCliente] Validação falhou: Nome ou email ausentes');
                return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
            }
            
            const novoCliente = await ClienteModel.create({ nome, email});
            console.log('[createCliente] Cliente criado com sucesso:', novoCliente);
            res.status(201).json(novoCliente);
        } catch (error) {
            console.error('[createCliente] Erro ao criar cliente:', error.stack || error.message);
            res.status(500).json({ error: 'Erro interno ao criar o cliente.', details: error.message });
        }
    },

    getClientes: async (req, res) => {
        try {
            console.log('[getClientes] Buscando todos os clientes...');
            const clientes = await ClienteModel.findAll();
            console.log('[getClientes] Clientes encontrados:', clientes.length);
            res.status(200).json(clientes);
        } catch (error) {
            console.error('[getClientes] Erro ao buscar clientes:', error.message);
            res.status(500).json({ error: 'Erro interno ao buscar clientes.', details: error.message });
        }
    },

    getClienteById: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('[getClienteById] Buscando cliente:', id);
            const cliente = await ClienteModel.findById(id);
            if (!cliente) {
                console.warn('[getClienteById] Cliente não encontrado:', id);
                return res.status(404).json({ error: 'Cliente não encontrado.' });
            }
            console.log('[getClienteById] Cliente encontrado:', cliente);
            res.status(200).json(cliente);
        } catch (error) {
            console.error('[getClienteById] Erro ao buscar o cliente:', error.message);
            res.status(500).json({ error: 'Erro interno ao buscar o cliente.', details: error.message });
        }
    },

    updateCliente: async (req, res) => {
        try {
            const { id } = req.params;
            const { nome, email} = req.body;
            console.log('[updateCliente] Atualizando cliente:', id, { nome, email});
            
            const clienteAtualizado = await ClienteModel.update(id, { nome, email});
            
            if (!clienteAtualizado) {
                console.warn('[updateCliente] Cliente não encontrado:', id);
                return res.status(404).json({ error: 'Cliente não encontrado para atualização.' });
            }
            console.log('[updateCliente] Cliente atualizado:', clienteAtualizado);
            res.status(200).json(clienteAtualizado);
        } catch (error) {
            console.error('[updateCliente] Erro ao atualizar cliente:', error.message);
            res.status(500).json({ error: 'Erro interno ao atualizar o cliente.', details: error.message });
        }
    },

    deleteCliente: async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`[deleteCliente] Iniciando deleção do cliente: ${id}`);

            try {
                if (await clientePossuiPedidos(id)) {
                    console.log(`[deleteCliente] Cliente ${id} possui pedidos vinculados. Bloqueando deleção.`);
                    return res.status(409).json({ error: 'Não é possível deletar cliente com pedidos referenciando-o.' });
                }
            } catch (verificacaoError) {
                console.error(`[deleteCliente] Erro ao verificar pedidos do cliente ${id}:`, verificacaoError);
                return res.status(500).json({ error: 'Erro ao verificar pedidos do cliente. Tente novamente.' });
            }

            const clienteDeletado = await ClienteModel.delete(id);
            
            if (!clienteDeletado) {
                console.log(`[deleteCliente] Cliente ${id} não encontrado.`);
                return res.status(404).json({ error: 'Cliente não encontrado para deleção.' });
            }
            
            console.log(`[deleteCliente] Cliente ${id} deletado com sucesso.`);
            res.status(200).json({ message: 'Cliente deletado com sucesso.', cliente: clienteDeletado });
        } catch (error) {
            console.error('[deleteCliente] Erro ao deletar cliente:', error);
            res.status(500).json({ error: 'Erro interno ao deletar o cliente.' });
        }
    }
};

module.exports = clientesController;
