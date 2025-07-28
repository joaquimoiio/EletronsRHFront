document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (!checkAuth()) return;
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar áreas
    loadAreas();
    loadStats();
});

let areas = [];
let areaToDelete = null;

function setupEventListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Mostrar nome do usuário
    const username = localStorage.getItem('adminUsername') || 'Admin';
    document.getElementById('username').textContent = username;
    
    // Formulário de nova área
    document.getElementById('area-form').addEventListener('submit', handleCreateArea);
    
    // Validação em tempo real
    document.getElementById('area-nome').addEventListener('input', validateNome);
    document.getElementById('edit-area-nome').addEventListener('input', validateEditNome);
    
    // Modal de edição
    document.getElementById('close-modal').addEventListener('click', closeEditModal);
    document.getElementById('cancel-edit').addEventListener('click', closeEditModal);
    document.getElementById('edit-form').addEventListener('submit', handleEditArea);
    
    // Modal de exclusão
    document.getElementById('close-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete').addEventListener('click', handleDeleteArea);
    
    // Fechar modais clicando fora
    document.getElementById('edit-modal').addEventListener('click', function(e) {
        if (e.target === this) closeEditModal();
    });
    
    document.getElementById('delete-modal').addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModal();
    });
}

async function loadAreas() {
    try {
        showLoading(true);
        areas = await ApiUtils.get('/areas');
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

async function loadStats() {
    try {
        const [allAreas, allVagas] = await Promise.all([
            ApiUtils.get('/areas'),
            ApiUtils.get('/vagas')
        ]);
        
        // Contar áreas com vagas
        const areasComVagas = allAreas.filter(area => 
            allVagas.some(vaga => vaga.area.id === area.id)
        ).length;
        
        // Animar contadores
        animateCounter('total-areas', allAreas.length);
        animateCounter('areas-com-vagas', areasComVagas);
        animateCounter('total-vagas-areas', allVagas.length);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Valores padrão em caso de erro
        document.getElementById('total-areas').textContent = '0';
        document.getElementById('areas-com-vagas').textContent = '0';
        document.getElementById('total-vagas-areas').textContent = '0';
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
    
    areas.forEach((area, index) => {
        const areaItem = createAreaItem(area);
        areaItem.style.animationDelay = `${index * 0.1}s`;
        areasList.appendChild(areaItem);
    });
    
    areasList.classList.remove('hidden');
    emptyState.classList.add('hidden');
}

function createAreaItem(area) {
    const div = document.createElement('div');
    div.className = 'area-item fade-in-up';
    div.innerHTML = `
        <span class="area-name">${escapeHtml(area.nome)}</span>
        <div class="area-actions">
            <button class="edit-btn" onclick="openEditModal(${area.id})">
                ✏️ Editar
            </button>
            <button class="delete-btn" onclick="openDeleteModal(${area.id}, '${escapeHtml(area.nome)}')">
                🗑️ Excluir
            </button>
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
    const counter = document.getElementById('areas-counter');
    const count = areas.length;
    counter.textContent = `${count} área${count !== 1 ? 's' : ''}`;
}

async function handleCreateArea(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const nome = formData.get('nome').trim();
    const submitBtn = e.target.querySelector('.submit-btn');
    
    if (!validateNome()) {
        return;
    }
    
    try {
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').classList.add('hidden');
        submitBtn.querySelector('.btn-loading').classList.remove('hidden');
        
        const newArea = await ApiUtils.post('/areas', { nome: nome });
        areas.push(newArea);
        
        showMessage('Área cadastrada com sucesso!', 'success');
        e.target.reset();
        clearValidation('area-nome');
        displayAreas();
        updateCounter();
        loadStats();
        
        // Destacar nova área
        setTimeout(() => {
            const lastAreaItem = document.querySelector('.area-item:last-child');
            if (lastAreaItem) {
                lastAreaItem.classList.add('success-highlight');
            }
        }, 100);
        
    } catch (error) {
        console.error('Erro ao criar área:', error);
        showMessage(error.message || 'Erro ao cadastrar área. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').classList.remove('hidden');
        submitBtn.querySelector('.btn-loading').classList.add('hidden');
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
    clearValidation('edit-area-nome');
}

async function handleEditArea(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const areaId = parseInt(document.getElementById('edit-area-id').value);
    const nome = formData.get('nome').trim();
    const submitBtn = document.querySelector('#edit-modal .btn-primary');
    
    if (!validateEditNome()) {
        return;
    }
    
    try {
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').classList.add('hidden');
        submitBtn.querySelector('.btn-loading').classList.remove('hidden');
        
        const updatedArea = await ApiUtils.put(`/areas/${areaId}`, { nome: nome });
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
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').classList.remove('hidden');
        submitBtn.querySelector('.btn-loading').classList.add('hidden');
    }
}

function openDeleteModal(areaId, areaNome) {
    areaToDelete = areaId;
    document.getElementById('delete-area-name').textContent = areaNome;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    areaToDelete = null;
}

async function handleDeleteArea() {
    if (!areaToDelete) return;
    
    const submitBtn = document.getElementById('confirm-delete');
    
    try {
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').classList.add('hidden');
        submitBtn.querySelector('.btn-loading').classList.remove('hidden');
        
        await ApiUtils.delete(`/areas/${areaToDelete}`);
        areas = areas.filter(a => a.id !== areaToDelete);
        
        showMessage('Área excluída com sucesso!', 'success');
        closeDeleteModal();
        displayAreas();
        updateCounter();
        loadStats();
        
    } catch (error) {
        console.error('Erro ao excluir área:', error);
        showMessage(error.message || 'Erro ao excluir área. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').classList.remove('hidden');
        submitBtn.querySelector('.btn-loading').classList.add('hidden');
    }
}

function validateNome() {
    const input = document.getElementById('area-nome');
    const feedback = document.getElementById('nome-feedback');
    const value = input.value.trim();
    
    if (!value) {
        showValidationError(input, feedback, 'Nome da área é obrigatório');
        return false;
    }
    
    if (value.length < 2) {
        showValidationError(input, feedback, 'Nome deve ter pelo menos 2 caracteres');
        return false;
    }
    
    if (areas.some(area => area.nome.toLowerCase() === value.toLowerCase())) {
        showValidationError(input, feedback, 'Já existe uma área com este nome');
        return false;
    }
    
    showValidationSuccess(input, feedback, 'Nome válido');
    return true;
}

function validateEditNome() {
    const input = document.getElementById('edit-area-nome');
    const feedback = document.getElementById('edit-nome-feedback');
    const value = input.value.trim();
    const currentId = parseInt(document.getElementById('edit-area-id').value);
    
    if (!value) {
        showValidationError(input, feedback, 'Nome da área é obrigatório');
        return false;
    }
    
    if (value.length < 2) {
        showValidationError(input, feedback, 'Nome deve ter pelo menos 2 caracteres');
        return false;
    }
    
    if (areas.some(area => area.nome.toLowerCase() === value.toLowerCase() && area.id !== currentId)) {
        showValidationError(input, feedback, 'Já existe uma área com este nome');
        return false;
    }
    
    showValidationSuccess(input, feedback, 'Nome válido');
    return true;
}

function showValidationError(input, feedback, message) {
    input.classList.remove('success');
    input.classList.add('error');
    feedback.classList.remove('success', 'hidden');
    feedback.classList.add('error');
    feedback.textContent = message;
}

function showValidationSuccess(input, feedback, message) {
    input.classList.remove('error');
    input.classList.add('success');
    feedback.classList.remove('error', 'hidden');
    feedback.classList.add('success');
    feedback.textContent = message;
}

function clearValidation(inputId) {
    const input = document.getElementById(inputId);
    const feedback = document.getElementById(inputId.replace('-nome', '') + '-feedback');
    
    input.classList.remove('error', 'success');
    if (feedback) {
        feedback.classList.add('hidden');
        feedback.classList.remove('error', 'success');
    }
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let currentValue = 0;
    const increment = Math.max(1, Math.ceil(targetValue / 20));
    const duration = 1500;
    const stepTime = duration / (targetValue / increment);
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
        }
        element.textContent = currentValue;
    }, stepTime);
}