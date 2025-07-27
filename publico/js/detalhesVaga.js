document.addEventListener('DOMContentLoaded', function() {
    // Obter ID da vaga da URL
    const vagaId = getVagaIdFromURL();
    
    if (!vagaId) {
        showErrorState();
        return;
    }
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados da vaga
    loadVagaDetails(vagaId);
});

function getVagaIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function setupEventListeners() {
    // Formulário de candidatura
    document.getElementById('candidatura-form').addEventListener('submit', handleCandidaturaSubmit);
    
    // Validação de arquivo
    document.getElementById('candidato-curriculo').addEventListener('change', validateFile);
}

async function loadVagaDetails(vagaId) {
    try {
        const response = await fetch(`/api/vagas/${vagaId}`);
        
        if (!response.ok) {
            throw new Error('Vaga não encontrada');
        }
        
        const vaga = await response.json();
        displayVagaDetails(vaga);
        
    } catch (error) {
        console.error('Erro ao carregar vaga:', error);
        showErrorState();
    }
}

function displayVagaDetails(vaga) {
    // Atualizar título e breadcrumb
    document.getElementById('breadcrumb-title').textContent = vaga.titulo;
    document.getElementById('vaga-titulo').textContent = vaga.titulo;
    document.title = `${vaga.titulo} - Sistema RH`;
    
    // Atualizar área
    document.getElementById('vaga-area').textContent = vaga.area.nome;
    document.getElementById('info-area').textContent = vaga.area.nome;
    
    // Atualizar datas
    const dataFormatada = formatDate(vaga.dataCriacao);
    document.getElementById('vaga-data').textContent = `Publicada em: ${dataFormatada}`;
    document.getElementById('info-data').textContent = dataFormatada;
    
    // Atualizar descrição
    const descricaoElement = document.getElementById('vaga-descricao');
    if (vaga.descricao && vaga.descricao.trim()) {
        descricaoElement.innerHTML = formatDescription(vaga.descricao);
    } else {
        descricaoElement.textContent = 'Descrição não disponível para esta vaga.';
    }
    
    // Mostrar conteúdo
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('vaga-content').classList.remove('hidden');
}

function formatDescription(description) {
    // Converter quebras de linha em parágrafos
    return description
        .split('\n')
        .map(paragraph => paragraph.trim())
        .filter(paragraph => paragraph.length > 0)
        .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
        .join('');
}

async function handleCandidaturaSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const submitBtn = document.querySelector('.submit-btn');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    
    // Validações
    const nome = formData.get('nome').trim();
    const email = formData.get('email').trim();
    const curriculo = formData.get('curriculo');
    
    if (!nome || !email || !curriculo) {
        showMessage('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Por favor, informe um e-mail válido.', 'error');
        return;
    }
    
    try {
        // Mostrar loading
        submitBtn.disabled = true;
        hideMessages();
        
        // Preparar dados para envio
        const vagaId = getVagaIdFromURL();
        const candidaturaData = new FormData();
        candidaturaData.append('nome', nome);
        candidaturaData.append('email', email);
        candidaturaData.append('curriculo', curriculo);
        candidaturaData.append('vagaId', vagaId);
        
        const response = await fetch('/api/candidaturas', {
            method: 'POST',
            body: candidaturaData
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || 'Erro ao enviar candidatura');
        }
        
        // Sucesso
        showMessage('Candidatura enviada com sucesso! Entraremos em contato em breve.', 'success');
        e.target.reset();
        
    } catch (error) {
        console.error('Erro ao enviar candidatura:', error);
        showMessage(error.message || 'Erro ao enviar candidatura. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

function validateFile(e) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Verificar tipo
    if (file.type !== 'application/pdf') {
        showMessage('Por favor, envie apenas arquivos PDF.', 'error');
        e.target.value = '';
        return;
    }
    
    // Verificar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showMessage('O arquivo deve ter no máximo 5MB.', 'error');
        e.target.value = '';
        return;
    }
    
    hideMessages();
}

function showMessage(text, type) {
    hideMessages();
    
    const messageElement = document.getElementById(`${type}-message`);
    messageElement.textContent = text;
    messageElement.classList.remove('hidden');
    
    // Auto-hide após 5 segundos
    setTimeout(() => {
        messageElement.classList.add('hidden');
    }, 5000);
}

function hideMessages() {
    document.getElementById('success-message').classList.add('hidden');
    document.getElementById('error-message').classList.add('hidden');
}

function showErrorState() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error-state').classList.remove('hidden');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}