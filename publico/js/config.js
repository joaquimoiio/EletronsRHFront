// publico/js/config.js
// Configuração da API
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api',
    UPLOAD_URL: 'http://localhost:8080/uploads'
};

// Utilitários para requisições
const ApiUtils = {
    // Fazer requisição GET
    async get(endpoint) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Erro ao buscar ${endpoint}:`, error);
            throw error;
        }
    },

    // Fazer requisição POST com JSON
    async post(endpoint, data) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Erro ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Erro ao enviar para ${endpoint}:`, error);
            throw error;
        }
    },

    // Fazer requisição POST com FormData (para uploads)
    async postFormData(endpoint, formData) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Erro ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Erro ao enviar formulário para ${endpoint}:`, error);
            throw error;
        }
    },

    // Fazer requisição PUT
    async put(endpoint, data) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Erro ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Erro ao atualizar ${endpoint}:`, error);
            throw error;
        }
    },

    // Fazer requisição PATCH
    async patch(endpoint, data) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Erro ${response.status}`);
            }
            
            // PATCH pode retornar vazio
            const text = await response.text();
            return text ? JSON.parse(text) : {};
        } catch (error) {
            console.error(`Erro ao atualizar ${endpoint}:`, error);
            throw error;
        }
    },

    // Fazer requisição DELETE
    async delete(endpoint) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Erro ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error(`Erro ao deletar ${endpoint}:`, error);
            throw error;
        }
    },

    // Gerar URL para uploads
    getUploadUrl(path) {
        return `${API_CONFIG.UPLOAD_URL}/${path}`;
    }
};

// Verificar se a API está disponível
async function checkApiHealth() {
    try {
        await fetch(`${API_CONFIG.BASE_URL}/areas`);
        return true;
    } catch (error) {
        console.warn('API não está disponível:', error);
        return false;
    }
}