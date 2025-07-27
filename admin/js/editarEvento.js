document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    checkAuth();
    
    // Obter ID do evento da URL
    const eventoId = getEventoIdFromURL();
    
    if (!eventoId) {
        showMessage('ID do evento não encontrado na URL.', 'error');
        return;
    }
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados
    loadEventoDetails(eventoId);
    loadGaleria(eventoId);
});

let currentEvento = null;
let imagens = [];

function checkAuth() {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
}

function getEventoIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function setupEventListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Formulário de edição do evento
    document.getElementById('evento-form').addEventListener('submit', handleEditEvento);
    
    // Upload de arquivos
    document.getElementById('select-files').addEventListener('click', () => {
        document.getElementById('file-input').click();
    });
    
    document.getElementById('file-input').addEventListener('change', handleFileSelect);
    
    // Drag and drop
    const uploadArea = document.getElementById('upload-area');
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    
    // Modal de imagem
    document.getElementById('close-modal').addEventListener('click', closeImageModal);
    document.getElementById('image-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeImageModal();
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

async function loadEventoDetails(eventoId) {
    try {
        const response = await fetch(`/api/eventos/${eventoId}`);
        
        if (!response.ok) {
            throw new Error('Evento não encontrado');
        }
        
        currentEvento = await response.json();
        displayEventoDetails(currentEvento);
        
    } catch (error) {
        console.error('Erro ao carregar evento:', error);
        showMessage('Erro ao carregar dados do evento.', 'error');
    }
}

function displayEventoDetails(evento) {
    // Atualizar título da página
    document.getElementById('page-title').textContent = `Editando: ${evento.titulo}`;
    document.title = `Editar ${evento.titulo} - Sistema RH`;
    
    // Preencher formulário
    document.getElementById('evento-id').value = evento.id;
    document.getElementById('evento-titulo').value = evento.titulo;
    document.getElementById('evento-descricao').value = evento.descricao || '';
    
    // Atualizar informações da sidebar
    document.getElementById('info-titulo').textContent = evento.titulo;
    document.getElementById('info-data').textContent = formatDate(evento.dataCriacao);
    
    // Mostrar imagem de capa se existir
    if (evento.imagemCapa) {
        const imagemCapa = document.getElementById('imagem-capa');
        imagemCapa.src = `/uploads/${evento.imagemCapa}`;
        imagemCapa.style.display = 'block';
    }
    
    // Mostrar conteúdo
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');
}

async function loadGaleria(eventoId) {
    try {
        const response = await fetch(`/api/eventos/${eventoId}/imagens`);
        imagens = await response.json();
        
        displayGaleria();
        updateImagensCount();
        
    } catch (error) {
        console.error('Erro ao carregar galeria:', error);
        showEmptyGaleria();
    } finally {
        document.getElementById('galeria-loading').classList.add('hidden');
    }
}

function displayGaleria() {
    const galeriaGrid = document.getElementById('galeria-grid');
    const emptyGaleria = document.getElementById('empty-galeria');
    
    if (imagens.length === 0) {
        galeriaGrid.classList.add('hidden');
        emptyGaleria.classList.remove('hidden');
        return;
    }
    
    galeriaGrid.innerHTML = '';
    
    imagens.forEach(imagem => {
        const imagemItem = createImagemItem(imagem);
        galeriaGrid.appendChild(imagemItem);
    });
    
    galeriaGrid.classList.remove('hidden');
    emptyGaleria.classList.add('hidden');
}

function createImagemItem(imagem) {
    const div = document.createElement('div');
    div.className = 'imagem-item';
    
    div.innerHTML = `
        <img src="/uploads/${imagem.caminhoArquivo}" alt="${escapeHtml(imagem.nomeArquivo)}" 
             onclick="openImageModal('/uploads/${imagem.caminhoArquivo}')">
        <div class="imagem-overlay">
            <button class="delete-img-btn" onclick="deleteImagem(${imagem.id})">
                🗑️ Excluir
            </button>
        </div>
    `;
    
    return div;
}

function updateImagensCount() {
    document.getElementById('info-imagens').textContent = imagens.length;
}

function showEmptyGaleria() {
    document.getElementById('galeria-grid').classList.add('hidden');
    document.getElementById('empty-galeria').classList.remove('hidden');
    updateImagensCount();
}

async function handleEditEvento(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const eventoId = formData.get('id') || document.getElementById('evento-id').value;
    const descricao = formData.get('descricao').trim();
    
    try {
        const response = await fetch(`/api/eventos/${eventoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ descricao: descricao })
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || 'Erro ao atualizar evento');
        }
        
        const updatedEvento = await response.json();
        currentEvento = updatedEvento;
        
        showMessage('Evento atualizado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao atualizar evento:', error);
        showMessage(error.message || 'Erro ao atualizar evento. Tente novamente.', 'error');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    uploadImages(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    uploadImages(files);
    e.target.value = ''; // Limpar input
}

async function uploadImages(files) {
    const validFiles = files.filter(file => {
        // Verificar tipo
        if (!file.type.startsWith('image/')) {
            showMessage(`${file.name} não é uma imagem válida.`, 'error');
            return false;
        }
        
        // Verificar tamanho (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showMessage(`${file.name} é muito grande (máx. 5MB).`, 'error');
            return false;
        }
        
        return true;
    });
    
    if (validFiles.length === 0) return;
    
    const eventoId = document.getElementById('evento-id').value;
    
    for (const file of validFiles) {
        try {
            const formData = new FormData();
            formData.append('imagem', file);
            
            const response = await fetch(`/api/eventos/${eventoId}/imagens`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao fazer upload de ${file.name}`);
            }
            
            const novaImagem = await response.json();
            imagens.push(novaImagem);
            
        } catch (error) {
            console.error(`Erro no upload de ${file.name}:`, error);
            showMessage(error.message, 'error');
        }
    }
    
    displayGaleria();
    updateImagensCount();
    showMessage(`${validFiles.length} imagem(ns) adicionada(s) com sucesso!`, 'success');
}

async function deleteImagem(imagemId) {
    const imagem = imagens.find(img => img.id === imagemId);
    if (!imagem) return;
    
    if (!confirm(`Tem certeza que deseja excluir esta imagem?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/eventos/imagens/${imagemId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao excluir imagem');
        }
        
        imagens = imagens.filter(img => img.id !== imagemId);
        
        displayGaleria();
        updateImagensCount();
        showMessage('Imagem excluída com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao excluir imagem:', error);
        showMessage('Erro ao excluir imagem. Tente novamente.', 'error');
    }
}

function openImageModal(imageSrc) {
    document.getElementById('modal-image').src = imageSrc;
    document.getElementById('image-modal').classList.remove('hidden');
}

function closeImageModal() {
    document.getElementById('image-modal').classList.add('hidden');
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