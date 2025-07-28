// Configuração da API para área pública
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api',
    UPLOAD_URL: 'http://localhost:8080/uploads'
};

// Utilitários para requisições à API
const ApiUtils = {
    // Fazer requisição GET
    async get(endpoint) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            // Verificar se há conteúdo para fazer parse
            const text = await response.text();
            if (!text.trim()) {
                return null; // Resposta vazia
            }
            
            try {
                return JSON.parse(text);
            } catch (parseError) {
                console.error('Erro ao fazer parse do JSON:', text);
                throw new Error('Resposta inválida do servidor');
            }
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
                // Tentar ler o texto de erro
                let errorMessage;
                try {
                    const errorText = await response.text();
                    errorMessage = errorText || `Erro ${response.status}: ${response.statusText}`;
                } catch {
                    errorMessage = `Erro ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            
            // Verificar se há conteúdo para fazer parse
            const text = await response.text();
            if (!text.trim()) {
                // Resposta vazia indica sucesso para alguns endpoints
                return { success: true, message: 'Operação realizada com sucesso' };
            }
            
            try {
                return JSON.parse(text);
            } catch (parseError) {
                // Se não conseguir fazer parse mas a resposta foi 200, considerar sucesso
                console.warn('Resposta não é JSON válido, mas status OK:', text);
                return { success: true, message: 'Operação realizada com sucesso' };
            }
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
                let errorMessage;
                try {
                    const errorText = await response.text();
                    errorMessage = errorText || `Erro ${response.status}: ${response.statusText}`;
                } catch {
                    errorMessage = `Erro ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            
            // Verificar se há conteúdo para fazer parse
            const text = await response.text();
            if (!text.trim()) {
                return { success: true, message: 'Upload realizado com sucesso' };
            }
            
            try {
                return JSON.parse(text);
            } catch (parseError) {
                // Se não conseguir fazer parse mas a resposta foi 200, considerar sucesso
                console.warn('Resposta não é JSON válido, mas status OK:', text);
                return { success: true, message: 'Upload realizado com sucesso' };
            }
        } catch (error) {
            console.error(`Erro ao enviar formulário para ${endpoint}:`, error);
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