document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    checkAuth();
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados iniciais
    loadAreas();
    loadVagas();
});

let areas = [];
let vagas = [];
let filteredVagas = [];

function checkAuth() {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
}

function setupEventListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Formulário de nova vaga
    document.getElementById('vaga-form').addEventListener('submit', handleCreateVaga);
    
    // Filtro de status
    document.getElementById('status-filter').addEventListener('change', applyStatusFilter);
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
        areas = await ApiUtils.get('/areas');
        
        const select = document.getElementById('vaga-area');
        select.innerHTML = '<option value="">Selecione uma área</option>';
        
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.nome;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erro ao carregar áreas:', error);
        showMessage('Erro ao carregar áreas. Verifique se existem áreas cadastradas.', 'error');
    }
}

async function loadVagas() {
    try {
        showLoading(true);
        vagas = await ApiUtils.get('/vagas');
        filteredVagas = [...vagas];
        
        displayVagas();
        updateCounter();
        
    } catch (error) {
        console.error('Erro ao carregar vagas:', error);
        showMessage('Erro ao carregar vagas. Tente novamente.', 'error');
        showEmptyState();
    } finally {
        showLoading(false);
    }
}

function displayVagas() {
    const vagasList = document.getElementById('vagas-list');
    const emptyState = document.getElementById('empty-state');
    
    if (filteredVagas.length === 0) {
        showEmptyState();
        return;
    }
    
    vagasList.innerHTML = '';
    
    filteredVagas.forEach(vaga => {
        const vagaItem = createVagaItem(vaga);
        vagasList.appendChild(vagaItem);
    });
    
    vagasList.classList.remove('hidden');
    emptyState.classList.add('hidden');
}

function createVagaItem(vaga) {
    const div = document.createElement('div');
    div.className = 'vaga-item';
    
    const area = areas.find(a => a.id === vaga.area.id);
    const areaName = area ? area.nome : vaga.area.nome;
    
    const description = vaga.descricao || 'Sem descrição';
    const truncatedDescription = truncateText(description, 150);
    
    div.innerHTML = `
        <div class="vaga-header">
            <h4 class="vaga-title">${escapeHtml(vaga.titulo)}</h4>
            <span class="vaga-status status-${vaga.status.toLowerCase()}">${getStatusText(vaga.status)}</span>
        </div>
        <div class="vaga-meta">
            <div>
                <span class="vaga-area">${escapeHtml(areaName)}</span>
                <span> • Publicada em ${formatDate(vaga.dataCriacao)}</span>
            </div>
            <span>${vaga.candidatos ? vaga.candidatos.length : 0} candidato(s)</span>
        </div>
        <p class="vaga-description">${escapeHtml(truncatedDescription)}</p>
        <div class="vaga-actions">
            <a href="editarVaga.html?id=${vaga.id}" class="action-btn edit-btn">Editar</a>
            ${createStatusActions(vaga)}
            <button class="action-btn delete-btn" onclick="deleteVaga(${vaga.id})">Excluir</button>
        </div>
    `;
    
    return div;
}

function createStatusActions(vaga) {
    if (vaga.status === 'ATIVA') {
        return `
            <button class="action-btn inactivate-btn" onclick="changeVagaStatus(${vaga.id}, 'INATIVA')">Inativar</button>
            <button class="action-btn contract-btn" onclick="changeVagaStatus(${vaga.id}, 'CONTRATADA')">Contratar</button>
        `;
    }
    return '';
}

function getStatusText(status) {
    const statusMap = {
        'ATIVA': 'Ativa',
        'INATIVA': 'Inativa',
        'CONTRATADA': 'Contratada'
    };
    return statusMap[status] || status;
}

function applyStatusFilter() {
    const statusFilter = document.getElementById('status-filter').value;
    
    if (!statusFilter) {
        filteredVagas = [...vagas];
    } else {
        filteredVagas = vagas.filter(vaga => vaga.status === statusFilter);
    }
    
    displayVagas();
    updateCounter();
}

async function handleCreateVaga(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const titulo = formData.get('titulo').trim();
    const areaId = formData.get('areaId');
    const descricao = formData.get('descricao').trim();
    
    if (!titulo || !areaId) {
        showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    try {
        const vagaData = {
            titulo: titulo,
            area: { id: parseInt(areaId) },
            descricao: descricao || null
        };
        
        const newVaga = await ApiUtils.post('/vagas', vagaData);
        vagas.unshift(newVaga);
        
        showMessage('Vaga publicada com sucesso!', 'success');
        e.target.reset();
        
        // Atualizar filtros se necessário
        applyStatusFilter();
        
    } catch (error) {
        console.error('Erro ao criar vaga:', error);
        showMessage(error.message || 'Erro ao publicar vaga. Tente novamente.', 'error');
    }
}

async function changeVagaStatus(vagaId, newStatus) {
    const vaga = vagas.find(v => v.id === vagaId);
    if (!vaga) return;
    
    const statusMessages = {
        'INATIVA': 'inativar',
        'CONTRATADA': 'marcar como contratada'
    };
    
    if (!confirm(`Tem certeza que deseja ${statusMessages[newStatus]} a vaga "${vaga.titulo}"?`)) {
        return;
    }
    
    try {
        await ApiUtils.patch(`/vagas/${vagaId}/status`, { status: newStatus });
        
        // Atualizar vaga local
        const vagaIndex = vagas.findIndex(v => v.id === vagaId);
        if (vagaIndex !== -1) {
            vagas[vagaIndex].status = newStatus;
        }
        
        showMessage('Status da vaga alterado com sucesso!', 'success');
        applyStatusFilter();
        
    } catch (error) {
        console.error('Erro ao alterar status da vaga:', error);
        showMessage(error.message || 'Erro ao alterar status. Tente novamente.', 'error');
    }
}

async function deleteVaga(vagaId) {
    const vaga = vagas.find(v => v.id === vagaId);
    if (!vaga) return;
    
    if (!confirm(`Tem certeza que deseja excluir a vaga "${vaga.titulo}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        await ApiUtils.delete(`/vagas/${vagaId}`);
        vagas = vagas.filter(v => v.id !== vagaId);
        
        showMessage('Vaga excluída com sucesso!', 'success');
        applyStatusFilter();
        
    } catch (error) {
        console.error('Erro ao excluir vaga:', error);
        showMessage(error.message || 'Erro ao excluir vaga. Tente novamente.', 'error');
    }
}

function showEmptyState() {
    document.getElementById('vagas-list').classList.add('hidden');
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
    document.getElementById('total-vagas').textContent = filteredVagas.length;
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

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text || '';
    }
    return text.substring(0, maxLength) + '...';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}