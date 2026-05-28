// js/produtos.js
let editingProdutoId = null;
let editingProdutoQuantidade = 0;
let editingProdutoDescricao = '';

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
        console.log('[produtos.js] DOM carregado. Aguardando API...');
        await aguardarAPI();
        console.log('[produtos.js] API disponível. Carregando produtos...');
        
        carregarProdutos();
        
        const form = document.getElementById('form-produto');
        const tabela = document.querySelector('#tabela-produtos tbody');

        if (tabela) {
            tabela.addEventListener('click', handleProdutoTabelaClick);
        }

        if(form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nome = document.getElementById('nome-produto').value;
                const preco = parseFloat(document.getElementById('preco-produto').value);
                const payload = {
                    nome,
                    preco,
                    quantidadeEstoque: editingProdutoId ? editingProdutoQuantidade : 0,
                    descricao: editingProdutoId ? editingProdutoDescricao : ''
                };
                
                try {
                    if (editingProdutoId) {
                        await window.api.put('produtos', `/${editingProdutoId}`, payload);
                    } else {
                        await window.api.post('produtos', '', payload);
                    }
                    console.log('API call - Produto salvo:', { nome, preco, id: editingProdutoId });
                    alert(`Produto ${editingProdutoId ? 'atualizado' : 'salvo'} com sucesso!`);
                    app.toggleActionPanel('panel-novo-produto');
                    form.reset();
                    editingProdutoId = null;
                    editingProdutoQuantidade = 0;
                    editingProdutoDescricao = '';
                    carregarProdutos(); // Recarregar tabela
                } catch(e) {
                    alert(`Erro ao salvar produto: ${e.message}`);
                }
            });
        }
    } catch (error) {
        console.error('[produtos.js] Erro ao inicializar:', error);
        const tbody = document.querySelector('#tabela-produtos tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center font-data" style="color:red">Erro ao carregar módulo: ${error.message}</td></tr>`;
        }
    }
});

async function carregarProdutos() {
    const tbody = document.querySelector('#tabela-produtos tbody');
    if(!tbody) return;

    try {
        const produtos = await window.api.get('produtos', '');
        
        tbody.innerHTML = '';
        if(produtos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center font-data">Nenhum produto cadastrado.</td></tr>';
            return;
        }
        
        produtos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.id}</td>
                <td>${p.nome}</td>
                <td>${app.formatCurrency(p.preco)}</td>
                <td class="text-right">
                    <div class="d-flex justify-between" style="justify-content: flex-end;">
                        <button class="link-action" data-action="edit" data-id="${p.id}" data-preco="${p.preco}" data-quantidade="${p.quantidadeEstoque}" data-descricao="${p.descricao || ''}">Editar</button>
                        <button class="link-action" data-action="delete" data-id="${p.id}">Excluir</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center font-data" style="color:red">Erro ao carregar da API: ${e.message}</td></tr>`;
    }
}

async function handleProdutoTabelaClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;
    if (!id || !action) return;

    if (action === 'edit') {
        const nome = button.closest('tr').querySelector('td:nth-child(2)').textContent;
        const preco = parseFloat(button.dataset.preco || '0');
        editingProdutoQuantidade = parseInt(button.dataset.quantidade || '0', 10);
        editingProdutoDescricao = button.dataset.descricao || '';
        document.getElementById('preco-produto').value = preco;
        app.toggleActionPanel('panel-novo-produto');
    }

    if (action === 'delete') {
        const confirmed = confirm('Deseja excluir este produto?');
        if (!confirmed) return;

        try {
            await window.api.delete('produtos', `/${id}`);
            carregarProdutos();
        } catch (e) {
            alert(`Erro ao excluir produto: ${e.message}`);
        }
    }
}
