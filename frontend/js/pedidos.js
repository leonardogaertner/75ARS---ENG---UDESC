// js/pedidos.js

// Aguarda a disponibilidade de window.api
async function aguardarAPI(timeout = 5000) {
    const inicio = Date.now();
    while (!window.api) {
        if (Date.now() - inicio > timeout) {
            throw new Error('API não carregou no tempo esperado');
        }
        await new Promise(r => setTimeout(r, 50));
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('[pedidos.js] DOM carregado. Aguardando API...');
        await aguardarAPI();
        console.log('[pedidos.js] API disponível. Carregando pedidos...');
        
        carregarPedidos();
        carregarFormulariosPedido();
        
        const form = document.getElementById('form-pedido');
        if(form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const clienteNode = document.getElementById('cliente-pedido');
                const produtoNode = document.getElementById('produto-pedido');
                const statusNode = document.getElementById('status-pedido');
                
                const clienteId = parseInt(clienteNode.value);
                const idProduto = parseInt(produtoNode.value);
                const quantidade = parseInt(document.getElementById('quantidade-pedido').value);
                const status = statusNode.value || 'CRIADO';
                const preco = parseFloat(produtoNode.options[produtoNode.selectedIndex].dataset.preco || 0);
                const valorTotal = preco * quantidade;

                try {
                    await window.api.post('pedidos', '', { clienteId, idProduto, quantidade, valorTotal, status });
                    alert('Pedido criado com sucesso!');
                    app.toggleActionPanel('panel-novo-pedido');
                    form.reset();
                    carregarPedidos();
                } catch(e) {
                    alert(`Erro ao criar pedido: ${e.message}`);
                }
            });
        }
    } catch (error) {
        console.error('[pedidos.js] Erro ao inicializar:', error);
        const tbody = document.querySelector('#tabela-pedidos tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center font-data" style="color:red">Erro ao carregar módulo: ${error.message}</td></tr>`;
        }
    }
});

async function carregarFormulariosPedido() {
    try {
        const clientes = await window.api.get('clientes', '') || [];
        const selCliente = document.getElementById('cliente-pedido');
        selCliente.innerHTML = '<option value="">Selecione um cliente</option>' + 
            clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
            
        const produtos = await window.api.get('produtos', '') || [];
        const selProduto = document.getElementById('produto-pedido');
        selProduto.innerHTML = '<option value="">Selecione um produto</option>' + 
            produtos.map(p => `<option value="${p.id}" data-preco="${p.preco}">${p.nome} (R$ ${p.preco})</option>`).join('');
    } catch(e) {
        console.error("Erro ao carregar selects:", e);
    }
}

async function carregarPedidos() {
    const tbody = document.querySelector('#tabela-pedidos tbody');
    if(!tbody) return;
    
    try {
        const [pedidos, produtos] = await Promise.all([
            window.api.get('pedidos', ''),
            window.api.get('produtos', '')
        ]);
        const mapaProdutos = (produtos || []).reduce((map, produto) => {
            map[produto.id] = produto;
            return map;
        }, {});
        
        tbody.innerHTML = '';
        if(!pedidos || pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center font-data">Nenhum pedido efetuado.</td></tr>';
            return;
        }
        
        pedidos.forEach(p => {
             const produto = mapaProdutos[p.idProduto] || {};
             const nomeProduto = produto.nome || `#${p.idProduto}`;
             const precoUnitario = produto.preco != null ? parseFloat(produto.preco) : p.quantidade ? parseFloat(p.valorTotal) / p.quantidade : 0;
             const statusClass = p.status === 'PAGO' ? 'status-pago' : p.status === 'CANCELADO' ? 'status-cancelado' : 'status-criado';
             const detalheId = `detalhes-pedido-${p.id}`;

             const tr = document.createElement('tr');
             tr.innerHTML = `
                <td>#${p.id}</td>
                <td>${p.clienteId}</td>
                <td>${app.formatCurrency(p.valorTotal)}</td>
                <td><span class="badge ${statusClass}">${p.status}</span></td>
                <td>${app.formatDate(p.dataPedido)}</td>
                <td><button type="button" class="details-button" data-pedido='${JSON.stringify({
                    produto: nomeProduto,
                    quantidade: p.quantidade,
                    valorUnitario: precoUnitario,
                    valorTotal: p.valorTotal
                }).replace(/'/g, '&#39;')}' onclick="abrirModalDetalhes(this)">🔍</button></td>
             `;
             tbody.appendChild(tr);
        });
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center font-data" style="color:red">Erro ao carregar: ${e.message}</td></tr>`;
    }
}

function abrirModalDetalhes(button) {
    try {
        const dados = JSON.parse(button.dataset.pedido);
        document.getElementById('modal-produto-nome').textContent = dados.produto;
        document.getElementById('modal-produto-quantidade').textContent = dados.quantidade;
        document.getElementById('modal-produto-preco').textContent = app.formatCurrency(dados.valorUnitario);
        document.getElementById('modal-produto-total').textContent = app.formatCurrency(dados.valorTotal);
        document.getElementById('pedido-detalhes-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao abrir modal de detalhes:', error);
    }
}

function fecharModalDetalhes() {
    document.getElementById('pedido-detalhes-modal').classList.add('hidden');
} 
