// Configuração da API para área administrativa
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

// Verificar autenticação
function checkAuth() {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Fazer logout
function handleLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUsername');
        window.location.href = 'login.html';
    }
}

// Utilitários para mensagens
function showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    const main = document.querySelector('.main');
    const container = main.querySelector('.container');
    container.insertBefore(message, container.firstChild);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 5000);
}

// Utilitário para escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Utilitário para formatação de data
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Utilitário para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}