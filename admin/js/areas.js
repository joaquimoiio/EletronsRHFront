document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    checkAuth();
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar áreas
    loadAreas();
});

let areas = [];

function checkAuth() {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
}

function setupEventListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Formulário de nova área
    document.getElementById('area-form').addEventListener('submit', handleCreateArea);
    
    // Modal de edição
    document.getElementById('close-modal').addEventListener('click', closeEditModal);
    document.getElementById('cancel-edit').addEventListener('click', closeEditModal);
    document.getElementById('edit-form').addEventListener('submit', handleEditArea);
    
    // Fechar modal clicando fora
    document.getElementById('edit-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });
}

function handleLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUsername');
        window.location.href = 'login.html';
    }
}

async function loadAreas() {
    try {
        showLoading(true);
        const response = await fetch('/api/areas');
        
        if (!response.ok) {
            throw new Error('Erro ao carregar áreas');
        }
        
        areas = await response.json();
        displayAreas();
        updateCounter();
        
    } catch (error) {
        console.error('Erro ao carregar áreas:', error);
        showMessage('Erro ao carregar áreas. Tente novamente.', 'error');
        showEmptyState();
    } finally {
        showLoading(false);
    }
}

function displayAreas() {
    const areasList = document.getElementById('areas-list');
    const emptyState = document.getElementById('empty-state');
    
    if (areas.length === 0) {
        showEmptyState();
        return;
    }
    
    areasList.innerHTML = '';
    
    areas.forEach(area => {
        const areaItem = createAreaItem(area);
        areasList.appendChild(areaItem);
    });
    
    areasList.classList.remove('hidden');
    emptyState.classList.add('hidden');
}

function createAreaItem(area) {
    const div = document.createElement('div');
    div.className = 'area-item';
    div.innerHTML = `
        <span class="area-name">${escapeHtml(area.nome)}</span>
        <div class="area-actions">
            <button class="edit-btn" onclick="openEditModal(${area.id})">Editar</button>
            <button class="delete-btn" onclick="deleteArea(${area.id})">Excluir</button>
        </div>
    `;
    return div;
}

function showEmptyState() {
    document.getElementById('areas-list').classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function updateCounter() {
    document.getElementById('total-areas').textContent = areas.length;
}

async function handleCreateArea(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const nome = formData.get('nome').trim();
    
    if (!nome) {
        showMessage('Por favor, informe o nome da área.', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/areas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nome: nome })
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || 'Erro ao criar área');
        }
        
        const newArea = await response.json();
        areas.push(newArea);
        
        showMessage('Área cadastrada com sucesso!', 'success');
        e.target.reset();
        displayAreas();
        updateCounter();
        
    } catch (error) {
        console.error('Erro ao criar área:', error);
        showMessage(error.message || 'Erro ao cadastrar área. Tente novamente.', 'error');
    }
}

function openEditModal(areaId) {
    const area = areas.find(a => a.id === areaId);
    if (!area) return;
    
    document.getElementById('edit-area-id').value = area.id;
    document.getElementById('edit-area-nome').value = area.nome;
    document.getElementById('edit-modal').classList.remove('hidden');
    document.getElementById('edit-area-nome').focus();
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    document.getElementById('edit-form').reset();
}

async function handleEditArea(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const areaId = parseInt(formData.get('id') || document.getElementById('edit-area-id').value);
    const nome = formData.get('nome').trim();
    
    if (!nome) {
        showMessage('Por favor, informe o nome da área.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/areas/${areaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nome: nome })
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || 'Erro ao atualizar área');
        }
        
        const updatedArea = await response.json();
        const index = areas.findIndex(a => a.id === areaId);
        if (index !== -1) {
            areas[index] = updatedArea;
        }
        
        showMessage('Área atualizada com sucesso!', 'success');
        closeEditModal();
        displayAreas();
        
    } catch (error) {
        console.error('Erro ao atualizar área:', error);
        showMessage(error.message || 'Erro ao atualizar área. Tente novamente.', 'error');
    }
}

async function deleteArea(areaId) {
    const area = areas.find(a => a.id === areaId);
    if (!area) return;
    
    if (!confirm(`Tem certeza que deseja excluir a área "${area.nome}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/areas/${areaId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || 'Erro ao excluir área');
        }
        
        areas = areas.filter(a => a.id !== areaId);
        
        showMessage('Área excluída com sucesso!', 'success');
        displayAreas();
        updateCounter();
        
    } catch (error) {
        console.error('Erro ao excluir área:', error);
        showMessage(error.message || 'Erro ao excluir área. Tente novamente.', 'error');
    }
}

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type}`;
    message.classList.remove('hidden');
    
    setTimeout(() => {
        message.classList.add('hidden');
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}