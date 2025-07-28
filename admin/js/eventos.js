document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (!checkAuth()) return;
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados iniciais
    loadEventos();
    loadStats();
});

let eventos = [];
let eventoToDelete = null;
let currentEventoGallery = null;

function setupEventListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Mostrar nome do usuário
    const username = localStorage.getItem('adminUsername') || 'Admin';
    document.getElementById('username').textContent = username;
    
    // Formulário de novo evento
    document.getElementById('evento-form').addEventListener('submit', handleCreateEvento);
    
    // Validação em tempo real
    document.getElementById('evento-titulo').addEventListener('input', validateTitulo);
    
    // Modal de edição
    document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
    document.getElementById('cancel-edit').addEventListener('click', closeEditModal);
    document.getElementById('edit-form').addEventListener('submit', handleEditEvento);
    
    // Modal de galeria
    document.getElementById('close-gallery-modal').addEventListener('click', closeGalleryModal);
    document.getElementById('upload-form').addEventListener('submit', handleUploadImage);
    
    // Modal de exclusão
    document.getElementById('close-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete').addEventListener('click', handleDeleteEvento);
    
    // Fechar modais clicando fora
    setupModalCloseEvents();
}

function setupModalCloseEvents() {
    document.getElementById('edit-modal').addEventListener('click', function(e) {
        if (e.target === this) closeEditModal();
    });
    
    document.getElementById('gallery-modal').addEventListener('click', function(e) {
        if (e.target === this) closeGalleryModal();
    });
    
    document.getElementById('delete-modal').addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModal();
    });
}

async function loadEventos() {
    try {
        showLoading(true);
        eventos = await ApiUtils.get('/eventos');
        displayEventos();
        updateCounter();
        
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showMessage('Erro ao carregar eventos. Tente novamente.', 'error');
        showEmptyState();
    } finally {
        showLoading(false);
    }
}

async function loadStats() {
    try {
        const allEventos = await ApiUtils.get('/eventos');
        
        let eventosComFotos = 0;
        let totalFotos = 0;
        
        for (const evento of allEventos) {
            try {
                const imagens = await ApiUtils.get(`/eventos/${evento.id}/imagens`);
                if (imagens.length > 0) {
                    eventosComFotos++;
                    totalFotos += imagens.length;
                }
            } catch (error) {
                console.error(`Erro ao carregar imagens do evento ${evento.id}:`, error);
            }
        }
        
        // Animar contadores
        animateCounter('total-eventos', allEventos.length);
        animateCounter('eventos-com-fotos', eventosComFotos);
        animateCounter('total-fotos', totalFotos);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Valores padrão em caso de erro
        document.getElementById('total-eventos').textContent = '0';
        document.getElementById('eventos-com-fotos').textContent = '0';
        document.getElementById('total-fotos').textContent = '0';
    }
}

function displayEventos() {
    const eventosList = document.getElementById('eventos-list');
    const emptyState = document.getElementById('empty-state');
    
    if (eventos.length === 0) {
        showEmptyState();
        return;
    }
    
    eventosList.innerHTML = '';
    
    eventos.forEach((evento, index) => {
        const eventoItem = createEventoItem(evento);
        eventoItem.style.animationDelay = `${index * 0.1}s`;
        eventosList.appendChild(eventoItem);
    });
    
    eventosList.classList.remove('hidden');
    emptyState.classList.add('hidden');
}

function createEventoItem(evento) {
    const div = document.createElement('div');
    div.className = 'evento-item fade-in-up';
    
    const description = evento.descricao || 'Aguarde mais informações sobre este evento em breve.';
    const truncatedDescription = truncateText(description, 150);
    
    // Determinar imagem
    let imagemHtml;
    if (evento.imagemCapa) {
        imagemHtml = `<img src="${ApiUtils.getUploadUrl(evento.imagemCapa)}" alt="${escapeHtml(evento.titulo)}" class="evento-image">`;
    } else {
        imagemHtml = `<div class="placeholder-image">🎉</div>`;
    }
    
    div.innerHTML = `
        ${imagemHtml}
        <div class="evento-content">
            <div class="evento-header">
                <h4 class="evento-title">${escapeHtml(evento.titulo)}</h4>
                <span class="evento-date">${formatDate(evento.dataCriacao)}</span>
            </div>
            <p class="evento-description">${escapeHtml(truncatedDescription)}</p>
            <div class="evento-actions">
                <button class="action-btn edit-btn" onclick="openEditModal(${evento.id})">
                    ✏️ Editar
                </button>
                <button class="action-btn gallery-btn" onclick="openGalleryModal(${evento.id})">
                    📸 Galeria
                </button>
                <button class="action-btn delete-btn" onclick="openDeleteModal(${evento.id}, '${escapeHtml(evento.titulo)}')">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `;
    
    return div;
}

async function handleCreateEvento(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const titulo = formData.get('titulo').trim();
    const submitBtn = e.target.querySelector('.submit-btn');
    
    if (!validateTitulo()) {
        return;
    }
    
    try {
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').classList.add('hidden');
        submitBtn.querySelector('.btn-loading').classList.remove('hidden');
        
        const newEvento = await ApiUtils.postFormData('/eventos', formData);
        eventos.unshift(newEvento);
        
        showMessage('Evento criado com sucesso!', 'success');
        e.target.reset();
        clearValidation('evento-titulo');
        displayEventos();
        updateCounter();
        loadStats();
        
        // Destacar novo evento
        setTimeout(() => {
            const firstEventoItem = document.querySelector('.evento-item:first-child');
            if (firstEventoItem) {
                firstEventoItem.classList.add('success-highlight');
            }
        }, 100);
        
    } catch (error) {
        console.error('Erro ao criar evento:', error);
        showMessage(error.message || 'Erro ao criar evento. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').classList.remove('hidden');
        submitBtn.querySelector('.btn-loading').classList.add('hidden');
    }
}

function openEditModal(eventoId) {
    const evento = eventos.find(e => e.id === eventoId);
    if (!evento) return;
    
    document.getElementById('edit-evento-id').value = evento.id;
    document.getElementById('edit-evento-descricao').value = evento.descricao || '';
    document.getElementById('edit-modal').classList.remove('hidden');
    document.getElementById('edit-evento-descricao').focus();
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    document.getElementById('edit-form').reset();
}

async function handleEditEvento(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const eventoId = parseInt(document.getElementById('edit-evento-id').value);
    const descricao = formData.get('descricao').trim();
    const submitBtn = document.querySelector('#edit-modal .btn-primary');
    
    try {
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').classList.add('hidden');
        submitBtn.querySelector('.btn-loading').classList.remove('hidden');
        
        const updatedEvento = await ApiUtils.put(`/eventos/${eventoId}`, { descricao: descricao });
        const index = eventos.findIndex(e => e.id === eventoId);
        if (index !== -1) {
            eventos[index] = { ...eventos[index], ...updatedEvento };
        }
        
        showMessage('Evento atualizado com sucesso!', 'success');
        closeEditModal();
        displayEventos();
        
    } catch (error) {
        console.error('Erro ao atualizar evento:', error);
        showMessage(error.message || 'Erro ao atualizar evento. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').classList.remove('hidden');
        submitBtn.querySelector('.btn-loading').classList.add('hidden');
    }
}

async function openGalleryModal(eventoId) {
    const evento = eventos.find(e => e.id === eventoId);
    if (!evento) return;
    
    currentEventoGallery = eventoId;
    document.getElementById('gallery-evento-id').value = eventoId;
    document.querySelector('#gallery-modal .modal-title').textContent = `📸 Galeria - ${evento.titulo}`;
    document.getElementById('gallery-modal').classList.remove('hidden');
    
    await loadGalleryImages(eventoId);
}

function closeGalleryModal() {
    document.getElementById('gallery-modal').classList.add('hidden');
    document.getElementById('upload-form').reset();
    currentEventoGallery = null;
}

async function loadGalleryImages(eventoId) {
    try {
        const imagens = await ApiUtils.get(`/eventos/${eventoId}/imagens`);
        displayGalleryImages(imagens);
    } catch (error) {
        console.error('Erro ao carregar imagens:', error);
        document.getElementById('gallery-images').innerHTML = '';
        document.getElementById('gallery-empty').classList.remove('hidden');
    }
}

function displayGalleryImages(imagens) {
    const galleryGrid = document.getElementById('gallery-images');
    const emptyGallery = document.getElementById('gallery-empty');
    
    if (imagens.length === 0) {
        galleryGrid.innerHTML = '';
        emptyGallery.classList.remove('hidden');
        return;
    }
    
    galleryGrid.innerHTML = '';
    
    imagens.forEach(imagem => {
        const galleryItem = createGalleryItem(imagem);
        galleryGrid.appendChild(galleryItem);
    });
    
    emptyGallery.classList.add('hidden');
}

function createGalleryItem(imagem) {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    
    div.innerHTML = `
        <img src="${ApiUtils.getUploadUrl(imagem.caminhoArquivo)}" alt="${escapeHtml(imagem.nomeArquivo)}" loading="lazy">
        <div class="gallery-item-actions">
            <button class="gallery-delete-btn" onclick="deleteGalleryImage(${imagem.id})" title="Excluir imagem">
                ×
            </button>
        </div>
    `;
    
    return div;
}

async function handleUploadImage(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const eventoId = document.getElementById('gallery-evento-id').value;
    const submitBtn = e.target.querySelector('.btn');
    
    if (!formData.get('imagem') || !formData.get('imagem').name) {
        showMessage('Por favor, selecione uma imagem.', 'error');
        return;
    }
    
    try {
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').classList.add('hidden');
        submitBtn.querySelector('.btn-loading').classList.remove('hidden');
        
        await ApiUtils.postFormData(`/eventos/${eventoId}/imagens`, formData);
        
        showMessage('Imagem adicionada com sucesso!', 'success');
        e.target.reset();
        await loadGalleryImages(eventoId);
        loadStats(); // Atualizar estatísticas
        
    } catch (error) {
        console.error('Erro ao adicionar imagem:', error);
        showMessage(error.message || 'Erro ao adicionar imagem. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').classList.remove('hidden');
        submitBtn.querySelector('.btn-loading').classList.add('hidden');
    }
}

async function deleteGalleryImage(imagemId) {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;
    
    try {
        await ApiUtils.delete(`/eventos/imagens/${imagemId}`);
        showMessage('Imagem excluída com sucesso!', 'success');
        
        if (currentEventoGallery) {
            await loadGalleryImages(currentEventoGallery);
            loadStats(); // Atualizar estatísticas
        }
    } catch (error) {
        console.error('Erro ao excluir imagem:', error);
        showMessage(error.message || 'Erro ao excluir imagem. Tente novamente.', 'error');
    }
}

function openDeleteModal(eventoId, eventoTitle) {
    eventoToDelete = eventoId;
    document.getElementById('delete-evento-title').textContent = eventoTitle;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    eventoToDelete = null;
}

async function handleDeleteEvento() {
    if (!eventoToDelete) return;
    
    const submitBtn = document.getElementById('confirm-delete');
    
    try {
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').classList.add('hidden');
        submitBtn.querySelector('.btn-loading').classList.remove('hidden');
        
        await ApiUtils.delete(`/eventos/${eventoToDelete}`);
        eventos = eventos.filter(e => e.id !== eventoToDelete);
        
        showMessage('Evento excluído com sucesso!', 'success');
        closeDeleteModal();
        displayEventos();
        updateCounter();
        loadStats();
        
    } catch (error) {
        console.error('Erro ao excluir evento:', error);
        showMessage(error.message || 'Erro ao excluir evento. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').classList.remove('hidden');
        submitBtn.querySelector('.btn-loading').classList.add('hidden');
    }
}

function validateTitulo() {
    const input = document.getElementById('evento-titulo');
    const feedback = document.getElementById('titulo-feedback');
    const value = input.value.trim();
    
    if (!value) {
        showValidationError(input, feedback, 'Título do evento é obrigatório');
        return false;
    }
    
    if (value.length < 3) {
        showValidationError(input, feedback, 'Título deve ter pelo menos 3 caracteres');
        return false;
    }
    
    showValidationSuccess(input, feedback, 'Título válido');
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
    const feedback = document.getElementById(inputId.replace('evento-', '') + '-feedback');
    
    input.classList.remove('error', 'success');
    if (feedback) {
        feedback.classList.add('hidden');
        feedback.classList.remove('error', 'success');
    }
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
    document.getElementById('eventos-list').classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');
}

function updateCounter() {
    const counter = document.getElementById('eventos-counter');
    const count = eventos.length;
    counter.textContent = `${count} evento${count !== 1 ? 's' : ''}`;
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