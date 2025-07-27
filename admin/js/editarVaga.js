document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    checkAuth();
    
    // Obter ID da vaga da URL
    const vagaId = getVagaIdFromURL();
    
    if (!vagaId) {
        showMessage('ID da vaga não encontrado na URL.', 'error');
        return;
    }
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados
    loadAreas();
    loadVagaDetails(vagaId);
    loadCandidatos(vagaId);
});

let currentVaga = null;
let candidatos = [];
let filteredCandidatos = [];

function checkAuth() {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
}

function getVagaIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function setupEventListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Formulário de edição da vaga
    document.getElementById('vaga-form').addEventListener('submit', handleEditVaga);
    
    // Busca de candidatos
    document.getElementById('search-candidatos').addEventListener('input', debounce(filterCandidatos, 300));
    document.getElementById('search-btn').addEventListener('click', filterCandidatos);
    
    // Enter no campo de busca
    document.getElementById('search-candidatos').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            filterCandidatos();
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
        const areas = await ApiUtils.get('/areas');
        
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
        showMessage('Erro ao carregar áreas.', 'error');
    }
}

async function loadVagaDetails(vagaId) {
    try {
        currentVaga = await ApiUtils.get(`/vagas/${vagaId}`);
        displayVagaDetails(currentVaga);
        
    } catch (error) {
        console.error('Erro ao carregar vaga:', error);
        showMessage('Erro ao carregar dados da vaga.', 'error');
    }
}

function displayVagaDetails(vaga) {
    // Atualizar título da página
    document.getElementById('page-title').textContent = `Editando: ${vaga.titulo}`;
    document.title = `Editar ${vaga.titulo} - Sistema RH`;
    
    // Preencher formulário
    document.getElementById('vaga-id').value = vaga.id;
    document.getElementById('vaga-titulo').value = vaga.titulo;
    document.getElementById('vaga-area').value = vaga.area.id;
    document.getElementById('vaga-descricao').value = vaga.descricao || '';
    
    // Atualizar informações da sidebar
    document.getElementById('vaga-status').innerHTML = createStatusBadge(vaga.status);
    document.getElementById('info-area').textContent = vaga.area.nome;
    document.getElementById('info-data').textContent = formatDate(vaga.dataCriacao);
    document.getElementById('info-candidatos').textContent = vaga.candidatos ? vaga.candidatos.length : 0;
    
    // Mostrar conteúdo
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');
}

function createStatusBadge(status) {
    const statusMap = {
        'ATIVA': { text: 'Ativa', class: 'status-ativa' },
        'INATIVA': { text: 'Inativa', class: 'status-inativa' },
        'CONTRATADA': { text: 'Contratada', class: 'status-contratada' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-ativa' };
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

async function loadCandidatos(vagaId) {
    try {
        candidatos = await ApiUtils.get(`/vagas/${vagaId}/candidatos`);
        filteredCandidatos = [...candidatos];
        
        displayCandidatos();
        updateCandidatosCount();
        
    } catch (error) {
        console.error('Erro ao carregar candidatos:', error);
        showEmptyCandidatos();
    } finally {
        document.getElementById('candidatos-loading').classList.add('hidden');
    }
}

function displayCandidatos() {
    const candidatosList = document.getElementById('candidatos-list');
    const emptyCandidatos = document.getElementById('empty-candidatos');
    
    if (filteredCandidatos.length === 0) {
        candidatosList.classList.add('hidden');
        emptyCandidatos.classList.remove('hidden');
        return;
    }
    
    candidatosList.innerHTML = '';
    
    filteredCandidatos.forEach(candidato => {
        const candidatoItem = createCandidatoItem(candidato);
        candidatosList.appendChild(candidatoItem);
    });
    
    candidatosList.classList.remove('hidden');
    emptyCandidatos.classList.add('hidden');
}

function createCandidatoItem(candidato) {
    const div = document.createElement('div');
    div.className = 'candidato-item';
    
    const temCurriculo = candidato.caminhoCurriculo && candidato.nomeArquivoCurriculo;
    
    div.innerHTML = `
        <div class="candidato-info">
            <div class="candidato-nome">${escapeHtml(candidato.nome)}</div>
            <div class="candidato-data">Candidatou-se em ${formatDate(candidato.dataInscricao)}</div>
        </div>
        <div class="candidato-actions">
            ${temCurriculo ? 
                `<a href="${ApiUtils.getUploadUrl(candidato.caminhoCurriculo)}" target="_blank" class="download-btn">
                    📄 Download CV
                </a>` :
                `<span class="download-btn disabled">Sem currículo</span>`
            }
        </div>
    `;
    
    return div;
}

function filterCandidatos() {
    const searchTerm = document.getElementById('search-candidatos').value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredCandidatos = [...candidatos];
    } else {
        filteredCandidatos = candidatos.filter(candidato =>
            candidato.nome.toLowerCase().includes(searchTerm)
        );
    }
    
    displayCandidatos();
    updateCandidatosCount();
}

function updateCandidatosCount() {
    document.getElementById('candidatos-count').textContent = filteredCandidatos.length;
}

function showEmptyCandidatos() {
    document.getElementById('candidatos-list').classList.add('hidden');
    document.getElementById('empty-candidatos').classList.remove('hidden');
    updateCandidatosCount();
}

async function handleEditVaga(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const vagaId = formData.get('id') || document.getElementById('vaga-id').value;
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
        
        const updatedVaga = await ApiUtils.put(`/vagas/${vagaId}`, vagaData);
        currentVaga = updatedVaga;
        
        // Atualizar informações da sidebar
        document.getElementById('info-area').textContent = updatedVaga.area.nome;
        document.getElementById('page-title').textContent = `Editando: ${updatedVaga.titulo}`;
        
        showMessage('Vaga atualizada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao atualizar vaga:', error);
        showMessage(error.message || 'Erro ao atualizar vaga. Tente novamente.', 'error');
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
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