document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (!checkAuth()) return;
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados iniciais
    loadAreas();
    loadVagas();
    loadStats();
});

let areas = [];
let allVagas = [];
let filteredVagas = [];
let vagaToDelete = null;
let statusAction = null;
let candidatosModalVaga = null;
let candidatoParaChamar = null;

function setupEventListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Mostrar nome do usuário
    const username = localStorage.getItem('adminUsername') || 'Admin';
    document.getElementById('username').textContent = username;
    
    // Formulário de nova vaga
    document.getElementById('vaga-form').addEventListener('submit', handleCreateVaga);
    
    // Validação em tempo real
    document.getElementById('vaga-titulo').addEventListener('input', validateTitulo);
    document.getElementById('vaga-area').addEventListener('change', validateArea);
    
    // Filtros
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('area-filter').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('search-btn').addEventListener('click', applyFilters);
    document.getElementById('clear-filters').addEventListener('click', clearFilters);
    
    // Enter no campo de busca
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    // Modais
    setupModalEvents();
}

function setupModalEvents() {
    // Modal de status
    document.getElementById('close-status-modal').addEventListener('click', closeStatusModal);
    document.getElementById('cancel-status').addEventListener('click', closeStatusModal);
    document.getElementById('confirm-status').addEventListener('click', handleStatusConfirm);
    
    // Modal de exclusão
    document.getElementById('close-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete').addEventListener('click', handleDeleteVaga);
    
    // Modal de candidatos
    document.getElementById('close-candidatos-modal').addEventListener('click', closeCandidatosModal);
    document.getElementById('search-candidatos').addEventListener('input', debounce(searchCandidatos, 300));
    
    // Filtro de status de candidatos
    document.getElementById('status-candidatos-filter').addEventListener('change', searchCandidatos);
    
    // Fechar modais clicando fora
    document.getElementById('status-modal').addEventListener('click', function(e) {
        if (e.target === this) closeStatusModal();
    });
    
    document.getElementById('delete-modal').addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModal();
    });
    
    document.getElementById('candidatos-modal').addEventListener('click', function(e) {
        if (e.target === this) closeCandidatosModal();
    });
}

async function loadAreas() {
    try {
        areas = await ApiUtils.get('/areas');
        
        const vagaAreaSelect = document.getElementById('vaga-area');
        const filterAreaSelect = document.getElementById('area-filter');
        
        // Limpar opções existentes
        vagaAreaSelect.innerHTML = '<option value="">Selecione uma área</option>';
        filterAreaSelect.innerHTML = '<option value="">Todas as áreas</option>';
        
        areas.forEach(area => {
            const option1 = document.createElement('option');
            option1.value = area.id;
            option1.textContent = area.nome;
            vagaAreaSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = area.id;
            option2.textContent = area.nome;
            filterAreaSelect.appendChild(option2);
        });
        
    } catch (error) {
        console.error('Erro ao carregar áreas:', error);
        showMessage('Erro ao carregar áreas. Verifique se existem áreas cadastradas.', 'error');
    }
}

async function loadVagas() {
    try {
        showLoading(true);
        allVagas = await ApiUtils.get('/vagas');
        filteredVagas = [...allVagas];
        
        displayVagas();
        updateCounter();
        updateResultsInfo();
        
    } catch (error) {
        console.error('Erro ao carregar vagas:', error);
        showMessage('Erro ao carregar vagas. Tente novamente.', 'error');
        showEmptyState();
    } finally {
        showLoading(false);
    }
}

async function loadStats() {
    try {
        const vagas = await ApiUtils.get('/vagas');
        
        const ativas = vagas.filter(v => v.status === 'ATIVA').length;
        const contratadas = vagas.filter(v => v.status === 'CONTRATADA').length;
        
        // Usar os novos contadores do DTO
        const totalCandidatos = vagas.reduce((total, vaga) => {
            return total + (vaga.candidatosCount || 0);
        }, 0);
        
        animateCounter('total-vagas', vagas.length);
        animateCounter('vagas-ativas', ativas);
        animateCounter('total-candidatos', totalCandidatos);
        animateCounter('vagas-contratadas', contratadas);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

function displayVagas() {
    const vagasList = document.getElementById('vagas-list');
    const emptyState = document.getElementById('empty-state');
    const resultsInfo = document.getElementById('results-info');
    
    if (filteredVagas.length === 0) {
        showEmptyState();
        resultsInfo.classList.add('hidden');
        return;
    }
    
    vagasList.innerHTML = '';
    
    filteredVagas.forEach((vaga, index) => {
        const vagaItem = createVagaItem(vaga);
        vagaItem.style.animationDelay = `${index * 0.05}s`;
        vagasList.appendChild(vagaItem);
    });
    
    vagasList.classList.remove('hidden');
    emptyState.classList.add('hidden');
    resultsInfo.classList.remove('hidden');
}

function createVagaItem(vaga) {
    const div = document.createElement('div');
    div.className = 'vaga-item fade-in-up';
    
    const area = areas.find(a => a.id === vaga.area.id);
    const areaName = area ? area.nome : vaga.area.nome;
    
    const description = vaga.descricao || 'Sem descrição';
    const truncatedDescription = truncateText(description, 150);
    
    const candidatosCount = vaga.candidatosCount || 0;
    const candidatosChamadosCount = vaga.candidatosChamadosCount || 0;
    
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
            <div class="candidatos-stats">
                <span>${candidatosCount} candidato${candidatosCount !== 1 ? 's' : ''}</span>
                <span class="candidatos-chamados"> • ${candidatosChamadosCount} chamado${candidatosChamadosCount !== 1 ? 's' : ''}</span>
            </div>
        </div>
        <p class="vaga-description">${escapeHtml(truncatedDescription)}</p>
        <div class="vaga-actions">
            <a href="editar-vaga.html?id=${vaga.id}" class="action-btn edit-btn">✏️ Editar</a>
            <button class="action-btn candidatos-btn" onclick="openCandidatosModal(${vaga.id}, '${escapeHtml(vaga.titulo)}')">
                👥 Candidatos (${candidatosCount}/${candidatosChamadosCount})
            </button>
            ${createStatusActions(vaga)}
            <button class="action-btn delete-btn" onclick="openDeleteModal(${vaga.id}, '${escapeHtml(vaga.titulo)}')">
                🗑️ Excluir
            </button>
        </div>
    `;
    
    return div;
}

function createStatusActions(vaga) {
    if (vaga.status === 'ATIVA') {
        return `
            <button class="action-btn status-btn" onclick="openStatusModal(${vaga.id}, 'INATIVA')">
                ⏸️ Inativar
            </button>
            <button class="action-btn contract-btn" onclick="openStatusModal(${vaga.id}, 'CONTRATADA')">
                ✅ Contratar
            </button>
        `;
    } else if (vaga.status === 'INATIVA') {
        return `
            <button class="action-btn contract-btn" onclick="openStatusModal(${vaga.id}, 'ATIVA')">
                ▶️ Ativar
            </button>
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

async function openCandidatosModal(vagaId, vagaTitle) {
    candidatosModalVaga = vagaId;
    document.getElementById('candidatos-modal-title').textContent = `Candidatos - ${vagaTitle}`;
    document.getElementById('candidatos-modal').classList.remove('hidden');
    document.getElementById('search-candidatos').value = '';
    document.getElementById('status-candidatos-filter').value = '';
    
    await loadCandidatos(vagaId);
}

function closeCandidatosModal() {
    document.getElementById('candidatos-modal').classList.add('hidden');
    candidatosModalVaga = null;
}

async function loadCandidatos(vagaId, filtro = '', status = '') {
    try {
        document.getElementById('candidatos-loading').classList.remove('hidden');
        document.getElementById('candidatos-list').classList.add('hidden');
        document.getElementById('candidatos-empty').classList.add('hidden');
        
        let params = [];
        if (filtro) params.push(`filtro=${encodeURIComponent(filtro)}`);
        if (status) params.push(`status=${encodeURIComponent(status)}`);
        
        const queryString = params.length > 0 ? `?${params.join('&')}` : '';
        const candidatos = await ApiUtils.get(`/vagas/${vagaId}/candidatos${queryString}`);
        
        displayCandidatos(candidatos);
        
    } catch (error) {
        console.error('Erro ao carregar candidatos:', error);
        showMessage('Erro ao carregar candidatos.', 'error');
    } finally {
        document.getElementById('candidatos-loading').classList.add('hidden');
    }
}

function displayCandidatos(candidatos) {
    const candidatosList = document.getElementById('candidatos-list');
    const candidatosEmpty = document.getElementById('candidatos-empty');
    
    if (candidatos.length === 0) {
        candidatosList.classList.add('hidden');
        candidatosEmpty.classList.remove('hidden');
        return;
    }
    
    candidatosList.innerHTML = '';
    
    candidatos.forEach(candidato => {
        const candidatoItem = createCandidatoItem(candidato);
        candidatosList.appendChild(candidatoItem);
    });
    
    candidatosList.classList.remove('hidden');
    candidatosEmpty.classList.add('hidden');
}

function createCandidatoItem(candidato) {
    const div = document.createElement('div');
    div.className = 'candidato-item';
    
    const dataInscricao = formatDate(candidato.dataInscricao);
    const dataChamada = candidato.dataChamada ? formatDate(candidato.dataChamada) : null;
    const temCurriculo = candidato.caminhoCurriculo ? true : false;
    
    const statusClass = getStatusClass(candidato.status);
    const statusText = getStatusText(candidato.status);
    
    const statusActions = createStatusActions(candidato);
    
    div.innerHTML = `
        <div class="candidato-header">
            <h5 class="candidato-nome">${escapeHtml(candidato.nome)}</h5>
            <div class="candidato-status">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        </div>
        <div class="candidato-info">
            <div class="candidato-dados">
                <span class="candidato-email">📧 ${escapeHtml(candidato.email)}</span>
                ${candidato.telefone ? `<span class="candidato-telefone">📞 ${escapeHtml(candidato.telefone)}</span>` : ''}
                <div class="candidato-datas">
                    <span class="data-inscricao">Inscrito em: ${dataInscricao}</span>
                    ${dataChamada ? `<span class="data-chamada">Chamado em: ${dataChamada}</span>` : ''}
                </div>
            </div>
            <div class="candidato-acoes">
                ${temCurriculo ? 
                    `<a href="${ApiUtils.getUploadUrl(candidato.caminhoCurriculo)}" target="_blank" class="curriculo-link">📄 Ver Currículo</a>` : 
                    '<span class="no-curriculo">📄 Sem currículo</span>'
                }
                ${statusActions}
            </div>
        </div>
    `;
    
    return div;
}

function getStatusClass(status) {
    const statusClasses = {
        'INSCRITO': 'status-inscrito',
        'CHAMADO': 'status-chamado',
        'REJEITADO': 'status-rejeitado'
    };
    return statusClasses[status] || 'status-inscrito';
}

function getStatusText(status) {
    const statusTexts = {
        'INSCRITO': 'Inscrito',
        'CHAMADO': 'Chamado',
        'REJEITADO': 'Rejeitado'
    };
    return statusTexts[status] || status;
}

function createStatusActions(candidato) {
    if (candidato.status === 'INSCRITO') {
        return `
            <button class="action-btn chamar-btn" onclick="chamarCandidato(${candidato.id})">
                📞 Chamar para Entrevista
            </button>
        `;
    } else if (candidato.status === 'CHAMADO') {
        return `
            <button class="action-btn rejeitar-btn" onclick="alterarStatusCandidato(${candidato.id}, 'REJEITADO')">
                ❌ Rejeitar
            </button>
        `;
    }
    return '';
}

async function chamarCandidato(candidatoId) {
    if (!confirm('Tem certeza que deseja chamar este candidato para entrevista?')) {
        return;
    }
    
    try {
        await ApiUtils.patch(`/candidatos/${candidatoId}/chamar`, {});
        showMessage('Candidato chamado para entrevista com sucesso!', 'success');
        
        // Recarregar lista de candidatos
        if (candidatosModalVaga) {
            const filtro = document.getElementById('search-candidatos').value;
            const status = document.getElementById('status-candidatos-filter').value;
            await loadCandidatos(candidatosModalVaga, filtro, status);
        }
        
        // Recarregar vagas para atualizar contadores
        loadVagas();
        loadStats();
        
    } catch (error) {
        console.error('Erro ao chamar candidato:', error);
        showMessage(error.message || 'Erro ao chamar candidato. Tente novamente.', 'error');
    }
}

async function alterarStatusCandidato(candidatoId, novoStatus) {
    const confirmMessage = novoStatus === 'REJEITADO' ? 
        'Tem certeza que deseja rejeitar este candidato?' :
        `Tem certeza que deseja alterar o status deste candidato para ${novoStatus}?`;
        
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        await ApiUtils.patch(`/candidatos/${candidatoId}/status`, { status: novoStatus });
        showMessage('Status do candidato alterado com sucesso!', 'success');
        
        // Recarregar lista de candidatos
        if (candidatosModalVaga) {
            const filtro = document.getElementById('search-candidatos').value;
            const status = document.getElementById('status-candidatos-filter').value;
            await loadCandidatos(candidatosModalVaga, filtro, status);
        }
        
        // Recarregar vagas para atualizar contadores
        loadVagas();
        loadStats();
        
    } catch (error) {
        console.error('Erro ao alterar status do candidato:', error);
        showMessage(error.message || 'Erro ao alterar status. Tente novamente.', 'error');
    }
}

async function searchCandidatos() {
    if (!candidatosModalVaga) return;
    
    const filtro = document.getElementById('search-candidatos').value.trim();
    const status = document.getElementById('status-candidatos-filter').value;
    await loadCandidatos(candidatosModalVaga, filtro, status);
}

// Resto do código permanece igual...
async function handleCreateVaga(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const titulo = formData.get('titulo').trim();
    const areaId = formData.get('areaId');
    const descricao = formData.get('descricao').trim();
    const submitBtn = e.target.querySelector('.submit-btn');
    
    if (!validateForm()) {
        return;
    }
    
    try {
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').classList.add('hidden');
        submitBtn.querySelector('.btn-loading').classList.remove('hidden');
        
        const vagaData = {
            titulo: titulo,
            area: { id: parseInt(areaId) },
            descricao: descricao || null
        };
        
        const newVaga = await ApiUtils.post('/vagas', vagaData);
        allVagas.unshift(newVaga);
        
        showMessage('Vaga publicada com sucesso!', 'success');
        e.target.reset();
        clearValidation();
        applyFilters();
        loadStats();
        
    } catch (error) {
        console.error('Erro ao criar vaga:', error);
        showMessage(error.message || 'Erro ao publicar vaga. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').classList.remove('hidden');
        submitBtn.querySelector('.btn-loading').classList.add('hidden');
    }
}

// ... continuar com o resto das funções que já existem
function openStatusModal(vagaId, newStatus) {
    const vaga = allVagas.find(v => v.id === vagaId);
    if (!vaga) return;
    
    statusAction = { vagaId, newStatus, vaga };
    
    const modal = document.getElementById('status-modal');
    const title = document.getElementById('status-modal-title');
    const icon = document.getElementById('status-modal-icon');
    const question = document.getElementById('status-modal-question');
    const description = document.getElementById('status-modal-description');
    const confirmBtn = document.getElementById('confirm-status');
    
    // Configurar modal baseado na ação
    switch (newStatus) {
        case 'INATIVA':
            modal.className = 'modal status-modal inativar';
            title.textContent = '⏸️ Inativar Vaga';
            icon.textContent = '⏸️';
            question.textContent = `Inativar a vaga "${vaga.titulo}"?`;
            description.textContent = 'A vaga ficará oculta no site público e não receberá novas candidaturas.';
            confirmBtn.className = 'btn btn-warning';
            confirmBtn.querySelector('.btn-text').textContent = 'Inativar Vaga';
            break;
            
        case 'ATIVA':
            modal.className = 'modal status-modal ativar';
            title.textContent = '▶️ Ativar Vaga';
            icon.textContent = '▶️';
            question.textContent = `Ativar a vaga "${vaga.titulo}"?`;
            description.textContent = 'A vaga ficará visível no site público e receberá candidaturas.';
            confirmBtn.className = 'btn btn-success';
            confirmBtn.querySelector('.btn-text').textContent = 'Ativar Vaga';
            break;
            
        case 'CONTRATADA':
            modal.className = 'modal status-modal contratar';
            title.textContent = '✅ Marcar como Contratada';
            icon.textContent = '✅';
            question.textContent = `Marcar "${vaga.titulo}" como contratada?`;
            description.textContent = 'A vaga será fechada e não receberá mais candidaturas.';
            confirmBtn.className = 'btn btn-success';
            confirmBtn.querySelector('.btn-text').textContent = 'Marcar Contratada';
            break;
    }
    
    modal.classList.remove('hidden');
}

function closeStatusModal() {
    document.getElementById('status-modal').classList.add('hidden');
    statusAction = null;
}

async function handleStatusConfirm() {
    if (!statusAction) return;
    
    const confirmBtn = document.getElementById('confirm-status');
    
    try {
        confirmBtn.disabled = true;
        confirmBtn.querySelector('.btn-text').classList.add('hidden');
        confirmBtn.querySelector('.btn-loading').classList.remove('hidden');
        
        await ApiUtils.patch(`/vagas/${statusAction.vagaId}/status`, { 
            status: statusAction.newStatus 
        });
        
        // Atualizar vaga local
        const vagaIndex = allVagas.findIndex(v => v.id === statusAction.vagaId);
        if (vagaIndex !== -1) {
            allVagas[vagaIndex].status = statusAction.newStatus;
        }
        
        showMessage('Status da vaga alterado com sucesso!', 'success');
        closeStatusModal();
        applyFilters();
        loadStats();
        
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        showMessage(error.message || 'Erro ao alterar status. Tente novamente.', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.querySelector('.btn-text').classList.remove('hidden');
        confirmBtn.querySelector('.btn-loading').classList.add('hidden');
    }
}

function openDeleteModal(vagaId, vagaTitle) {
    vagaToDelete = vagaId;
    document.getElementById('delete-vaga-title').textContent = vagaTitle;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    vagaToDelete = null;
}

async function handleDeleteVaga() {
    if (!vagaToDelete) return;
    
    const confirmBtn = document.getElementById('confirm-delete');
    
    try {
        confirmBtn.disabled = true;
        confirmBtn.querySelector('.btn-text').classList.add('hidden');
        confirmBtn.querySelector('.btn-loading').classList.remove('hidden');
        
        await ApiUtils.delete(`/vagas/${vagaToDelete}`);
        allVagas = allVagas.filter(v => v.id !== vagaToDelete);
        
        showMessage('Vaga excluída com sucesso!', 'success');
        closeDeleteModal();
        applyFilters();
        loadStats();
        
    } catch (error) {
        console.error('Erro ao excluir vaga:', error);
        showMessage(error.message || 'Erro ao excluir vaga. Tente novamente.', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.querySelector('.btn-text').classList.remove('hidden');
        confirmBtn.querySelector('.btn-loading').classList.add('hidden');
    }
}

function applyFilters() {
    const statusFilter = document.getElementById('status-filter').value;
    const areaFilter = document.getElementById('area-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    
    filteredVagas = allVagas.filter(vaga => {
        const matchesStatus = !statusFilter || vaga.status === statusFilter;
        const matchesArea = !areaFilter || vaga.area.id.toString() === areaFilter;
        const matchesSearch = !searchTerm || 
            vaga.titulo.toLowerCase().includes(searchTerm) ||
            (vaga.descricao && vaga.descricao.toLowerCase().includes(searchTerm));
        
        return matchesStatus && matchesArea && matchesSearch;
    });
    
    displayVagas();
    updateCounter();
    updateResultsInfo();
}

function clearFilters() {
    document.getElementById('status-filter').value = '';
    document.getElementById('area-filter').value = '';
    document.getElementById('search-input').value = '';
    
    filteredVagas = [...allVagas];
    applyFilters();
}

function updateCounter() {
    const counter = document.getElementById('vagas-counter');
    const count = filteredVagas.length;
    counter.textContent = `${count} vaga${count !== 1 ? 's' : ''}`;
}

function updateResultsInfo() {
    const resultsText = document.getElementById('results-text');
    const count = filteredVagas.length;
    const total = allVagas.length;
    
    if (count === total) {
        resultsText.textContent = `Exibindo todas as ${count} vaga${count !== 1 ? 's' : ''}`;
    } else {
        resultsText.textContent = `Exibindo ${count} de ${total} vaga${total !== 1 ? 's' : ''}`;
    }
}

function validateForm() {
    const tituloValid = validateTitulo();
    const areaValid = validateArea();
    
    return tituloValid && areaValid;
}

function validateTitulo() {
    const input = document.getElementById('vaga-titulo');
    const feedback = document.getElementById('titulo-feedback');
    const value = input.value.trim();
    
    if (!value) {
        showValidationError(input, feedback, 'Título da vaga é obrigatório');
        return false;
    }
    
    if (value.length < 3) {
        showValidationError(input, feedback, 'Título deve ter pelo menos 3 caracteres');
        return false;
    }
    
    showValidationSuccess(input, feedback, 'Título válido');
    return true;
}

function validateArea() {
    const input = document.getElementById('vaga-area');
    const feedback = document.getElementById('area-feedback');
    const value = input.value;
    
    if (!value) {
        showValidationError(input, feedback, 'Área é obrigatória');
        return false;
    }
    
    showValidationSuccess(input, feedback, 'Área selecionada');
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

function clearValidation() {
    const inputs = ['vaga-titulo', 'vaga-area'];
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        const feedback = document.getElementById(inputId.replace('vaga-', '') + '-feedback');
        
        input.classList.remove('error', 'success');
        if (feedback) {
            feedback.classList.add('hidden');
            feedback.classList.remove('error', 'success');
        }
    });
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showEmptyState() {
    document.getElementById('vagas-list').classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text || '';
    }
    return text.substring(0, maxLength).trim() + '...';
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