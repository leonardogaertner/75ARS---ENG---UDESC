// js/pedidos.js
document.addEventListener('DOMContentLoaded', () => {
    carregarPedidos();
    carregarFormulariosPedido();
    
    const form = document.getElementById('form-pedido');
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clienteNode = document.getElementById('cliente-pedido');
            const produtoNode = document.getElementById('produto-pedido');
            
            const cliente = clienteNode.options[clienteNode.selectedIndex].text;
            const idProduto = parseInt(produtoNode.value);
            const quantidade = parseInt(document.getElementById('quantidade-pedido').value);
            const preco = parseFloat(produtoNode.options[produtoNode.selectedIndex].dataset.preco || 0);
            const valorTotal = preco * quantidade;

            try {
                await window.api.post('pedidos', '', { cliente, idProduto, quantidade, valorTotal, status: 'CRIADO' });
                alert('Pedido criado com sucesso!');
                app.toggleActionPanel('panel-novo-pedido');
                form.reset();
                carregarPedidos();
            } catch(e) {
                alert(`Erro ao criar pedido: ${e.message}`);
            }
        });
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
        const pedidos = await window.api.get('pedidos', '');
        
        tbody.innerHTML = '';
        if(pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center font-data">Nenhum pedido efetuado.</td></tr>';
            return;
        }
        
        pedidos.forEach(p => {
             const tr = document.createElement('tr');
             tr.innerHTML = `
                <td>#${p.id}</td>
                <td>${p.cliente}</td>
                <td>${app.formatCurrency(p.valorTotal)}</td>
                <td>${app.formatDate(p.dataPedido)}</td>
             `;
             tbody.appendChild(tr);
        });
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center font-data" style="color:red">Erro ao carregar: ${e.message}</td></tr>`;
    }
}
