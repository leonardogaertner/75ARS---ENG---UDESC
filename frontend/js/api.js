// frontend/js/api.js - Gateway functions for the REST Microservices
// Single entry point through API Gateway on port 8080
const GATEWAY_BASE_URL = 'http://localhost:8080/api';

const API_CONFIG = {
    produtos: `${GATEWAY_BASE_URL}/produtos`,
    pedidos: `${GATEWAY_BASE_URL}/pedidos`,
    clientes: `${GATEWAY_BASE_URL}/clientes`
};

const api = {
    async fetch(domain, endpoint, options = {}) {
        const baseUrl = API_CONFIG[domain];
        if (!baseUrl) throw new Error(`Domain ${domain} not configured in api.js`);
        
        const url = `${baseUrl}${endpoint}`;
        
        const fetchOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            console.log(`[API Request] ${options.method || 'GET'} ${url}`);
            const response = await window.fetch(url, fetchOptions);
            
            if (!response.ok) {
                let errorDetails = '';
                try {
                    const text = await response.text();
                    errorDetails = text;
                } catch(e) {}
                throw new Error(`Error ${response.status}: ${errorDetails}`);
            }
            
            if (response.status !== 204) {
                return await response.json();
            }
            return null;

        } catch (error) {
            console.error(`[API Error in ${domain}]`, error);
            // Em uma UI de produção dispararíamos um 'Toast' ou aviso pro user aqui,
            // mas por ser clean/editorial, trataremos no catch de cada tela.
            throw error;
        }
    },

    get(domain, endpoint) {
        return this.fetch(domain, endpoint, { method: 'GET' });
    },

    post(domain, endpoint, data) {
        return this.fetch(domain, endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    put(domain, endpoint, data) {
        return this.fetch(domain, endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete(domain, endpoint) {
        return this.fetch(domain, endpoint, { method: 'DELETE' });
    }
};

window.api = api;
