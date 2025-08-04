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
    const candidaturaForm = document.getElementById('candidatura-form');
    candidaturaForm.addEventListener('submit', handleCandidaturaSubmit);
    
    // Validação de arquivo
    const curriculoInput = document.getElementById('candidato-curriculo');
    curriculoInput.addEventListener('change', validateFile);
    
    // Validação em tempo real dos campos
    const nomeInput = document.getElementById('candidato-nome');
    const emailInput = document.getElementById('candidato-email');
    const telefoneInput = document.getElementById('candidato-telefone');
    
    nomeInput.addEventListener('blur', validateNome);
    emailInput.addEventListener('blur', validateEmail);
    telefoneInput.addEventListener('blur', validateTelefone);
    
    // Máscara para telefone
    telefoneInput.addEventListener('input', formatTelefone);
}

async function loadVagaDetails(vagaId) {
    try {
        const vaga = await ApiUtils.get(`/vagas/${vagaId}`);
        displayVagaDetails(vaga);
        
    } catch (error) {
        console.error('Erro ao carregar vaga:', error);
        showErrorState();
    }
}

function displayVagaDetails(vaga) {
    // Atualizar título e breadcrumb
    document.getElementById('breadcrumb-title').textContent = vaga.titulo;
    document.getElementById('vaga-title').textContent = vaga.titulo;
    document.title = `${vaga.titulo} - Sistema RH`;
    
    // Atualizar área
    document.getElementById('vaga-area').textContent = vaga.area.nome;
    document.getElementById('info-area').textContent = vaga.area.nome;
    
    // Atualizar datas
    const dataFormatada = formatDate(vaga.dataCriacao);
    document.getElementById('vaga-date').textContent = `Publicada em: ${dataFormatada}`;
    document.getElementById('info-date').textContent = dataFormatada;
    
    // Atualizar descrição
    const descricaoElement = document.getElementById('vaga-description');
    if (vaga.descricao && vaga.descricao.trim()) {
        descricaoElement.innerHTML = formatDescription(vaga.descricao);
    } else {
        descricaoElement.innerHTML = '<p>Descrição não disponível para esta vaga.</p>';
    }
    
    // Mostrar conteúdo
    document.getElementById('loading-section').classList.add('hidden');
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
    
    // Limpar mensagens anteriores
    hideMessages();
    
    const formData = new FormData(e.target);
    const nome = formData.get('nome').trim();
    const email = formData.get('email').trim();
    const telefone = formData.get('telefone').trim();
    const curriculo = formData.get('curriculo');
    
    // Validações
    if (!validateForm(nome, email, telefone, curriculo)) {
        return;
    }
    
    const submitBtn = document.querySelector('.submit-btn');
    
    try {
        // Mostrar loading
        submitBtn.disabled = true;
        
        // Preparar dados para envio
        const vagaId = getVagaIdFromURL();
        const candidaturaData = new FormData();
        candidaturaData.append('nome', nome);
        candidaturaData.append('email', email);
        candidaturaData.append('telefone', telefone);
        candidaturaData.append('curriculo', curriculo);
        candidaturaData.append('vagaId', vagaId);
        
        await ApiUtils.postFormData('/candidaturas', candidaturaData);
        
        // Sucesso
        showSuccessMessage('Candidatura enviada com sucesso! Entraremos em contato em breve.');
        e.target.reset();
        
        // Adicionar animação de sucesso
        document.querySelector('.candidatura-card').classList.add('success-animation');
        setTimeout(() => {
            document.querySelector('.candidatura-card').classList.remove('success-animation');
        }, 600);
        
    } catch (error) {
        console.error('Erro ao enviar candidatura:', error);
        showErrorMessage(error.message || 'Erro ao enviar candidatura. Tente novamente.');
    } finally {
        submitBtn.disabled = false;
    }
}

function validateForm(nome, email, telefone, curriculo) {
    if (!nome) {
        showErrorMessage('Por favor, informe seu nome completo.');
        document.getElementById('candidato-nome').focus();
        return false;
    }
    
    if (nome.length < 3) {
        showErrorMessage('Nome deve ter pelo menos 3 caracteres.');
        document.getElementById('candidato-nome').focus();
        return false;
    }
    
    if (!email) {
        showErrorMessage('Por favor, informe seu e-mail.');
        document.getElementById('candidato-email').focus();
        return false;
    }
    
    if (!isValidEmail(email)) {
        showErrorMessage('Por favor, informe um e-mail válido.');
        document.getElementById('candidato-email').focus();
        return false;
    }
    
    if (!telefone) {
        showErrorMessage('Por favor, informe seu telefone.');
        document.getElementById('candidato-telefone').focus();
        return false;
    }
    
    if (!isValidTelefone(telefone)) {
        showErrorMessage('Por favor, informe um telefone válido.');
        document.getElementById('candidato-telefone').focus();
        return false;
    }
    
    if (!curriculo || curriculo.size === 0) {
        showErrorMessage('Por favor, anexe seu currículo.');
        document.getElementById('candidato-curriculo').focus();
        return false;
    }
    
    return true;
}

function validateNome() {
    const nome = document.getElementById('candidato-nome').value.trim();
    const input = document.getElementById('candidato-nome');
    
    if (nome && nome.length < 3) {
        input.style.borderColor = '#e53e3e';
        return false;
    } else {
        input.style.borderColor = '#e2e8f0';
        return true;
    }
}

function validateEmail() {
    const email = document.getElementById('candidato-email').value.trim();
    const input = document.getElementById('candidato-email');
    
    if (email && !isValidEmail(email)) {
        input.style.borderColor = '#e53e3e';
        return false;
    } else {
        input.style.borderColor = '#e2e8f0';
        return true;
    }
}

function validateTelefone() {
    const telefone = document.getElementById('candidato-telefone').value.trim();
    const input = document.getElementById('candidato-telefone');
    
    if (telefone && !isValidTelefone(telefone)) {
        input.style.borderColor = '#e53e3e';
        return false;
    } else {
        input.style.borderColor = '#e2e8f0';
        return true;
    }
}

function validateFile(e) {
    const file = e.target.files[0];
    const input = e.target;
    
    if (!file) return;
    
    // Verificar tipo
    if (file.type !== 'application/pdf') {
        showErrorMessage('Por favor, envie apenas arquivos PDF.');
        input.value = '';
        input.style.borderColor = '#e53e3e';
        return false;
    }
    
    // Verificar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showErrorMessage('O arquivo deve ter no máximo 5MB.');
        input.value = '';
        input.style.borderColor = '#e53e3e';
        return false;
    }
    
    // Arquivo válido
    input.style.borderColor = '#38a169';
    hideMessages();
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidTelefone(telefone) {
    // Remove todos os caracteres não numéricos
    const numbersOnly = telefone.replace(/\D/g, '');
    
    // Verifica se tem 10 ou 11 dígitos (com DDD)
    return numbersOnly.length >= 10 && numbersOnly.length <= 11;
}

function formatTelefone(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    
    if (value.length <= 10) {
        // Formato: (XX) XXXX-XXXX
        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
        // Formato: (XX) XXXXX-XXXX
        value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
    
    e.target.value = value;
}

function showSuccessMessage(text) {
    hideMessages();
    const successMessage = document.getElementById('success-message');
    successMessage.textContent = text;
    successMessage.classList.remove('hidden');
    
    // Auto-hide após 10 segundos
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 10000);
}

function showErrorMessage(text) {
    hideMessages();
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = text;
    errorMessage.classList.remove('hidden');
    
    // Auto-hide após 8 segundos
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 8000);
}

function hideMessages() {
    document.getElementById('success-message').classList.add('hidden');
    document.getElementById('error-message').classList.add('hidden');
}

function showErrorState() {
    document.getElementById('loading-section').classList.add('hidden');
    document.getElementById('error-section').classList.remove('hidden');
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