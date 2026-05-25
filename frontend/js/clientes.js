// js/clientes.js
let editingClienteId = null;

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
        console.log('[clientes.js] DOM carregado. Aguardando API...');
        await aguardarAPI();
        console.log('[clientes.js] API disponível. Carregando clientes...');
        
        carregarClientes();
        
        const form = document.getElementById('form-cliente');
        const tabela = document.querySelector('#tabela-clientes tbody');

        if (tabela) {
            tabela.addEventListener('click', handleClienteTabelaClick);
        }

        if(form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nome = document.getElementById('nome-cliente').value;
                const email = document.getElementById('email-cliente').value;
                
                try {
                    if (editingClienteId) {
                        await window.api.put('clientes', `/${editingClienteId}`, { nome, email });
                    } else {
                        await window.api.post('clientes', '', { nome, email });
                    }

                    console.log('API call - Cliente salvo:', { nome, email, id: editingClienteId });
                    alert(`Cliente ${editingClienteId ? 'atualizado' : 'salvo'} com sucesso!`);
                    app.toggleActionPanel('panel-novo-cliente');
                    form.reset();
                    editingClienteId = null;
                    carregarClientes();
                } catch(e) {
                    alert(`Erro ao salvar cliente: ${e.message}`);
                }
            });
        }
    } catch (error) {
        console.error('[clientes.js] Erro ao inicializar:', error);
        const tbody = document.querySelector('#tabela-clientes tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center font-data" style="color:red">Erro ao carregar módulo: ${error.message}</td></tr>`;
        }
    }
});

async function carregarClientes() {
    const tbody = document.querySelector('#tabela-clientes tbody');
    if(!tbody) return;
    
    try {
        console.log('[carregarClientes] Iniciando...');
        const clientes = await window.api.get('clientes', '');
        console.log('[carregarClientes] Clientes carregados:', clientes);
        
        tbody.innerHTML = '';
        if(clientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center font-data">Nenhum cliente cadastrado.</td></tr>';
            return;
        }
        
        clientes.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.id}</td>
                <td>${c.nome}</td>
                <td>${c.email}</td>
                <td class="text-right d-flex justify-between" style="justify-content: flex-end;">
                    <button class="link-action" data-action="edit" data-id="${c.id}">Editar</button>
                    <button class="link-action" data-action="delete" data-id="${c.id}">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center font-data" style="color:red">Erro ao carregar dados da API: ${e.message}</td></tr>`;
    }
}

async function handleClienteTabelaClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;
    if (!id || !action) return;

    if (action === 'edit') {
        const nome = button.closest('tr').querySelector('td:nth-child(2)').textContent;
        const email = button.closest('tr').querySelector('td:nth-child(3)').textContent;

        editingClienteId = id;
        document.getElementById('nome-cliente').value = nome;
        document.getElementById('email-cliente').value = email;
        app.toggleActionPanel('panel-novo-cliente');
    }

    if (action === 'delete') {
        const confirmed = confirm('Deseja excluir este cliente?');
        if (!confirmed) return;

        try {
            await window.api.delete('clientes', `/${id}`);
            carregarClientes();
        } catch (e) {
            alert(`Erro ao excluir cliente: ${e.message}`);
        }
    }
}
