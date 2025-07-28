document.addEventListener('DOMContentLoaded', function() {
    // Obter ID do evento da URL
    const eventoId = getEventoIdFromURL();
    
    if (!eventoId) {
        showErrorState();
        return;
    }
    
    // Carregar dados do evento
    loadEventoDetails(eventoId);
    loadGaleria(eventoId);
});

let currentEvento = null;
let imagens = [];

function getEventoIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function loadEventoDetails(eventoId) {
    try {
        console.log('Carregando evento ID:', eventoId);
        showLoading(true);
        
        currentEvento = await ApiUtils.get(`/eventos/${eventoId}`);
        console.log('Evento carregado:', currentEvento);
        
        displayEventoDetails(currentEvento);
        showLoading(false);
        
    } catch (error) {
        console.error('Erro ao carregar evento:', error);
        showLoading(false);
        showErrorState();
    }
}

function displayEventoDetails(evento) {
    // Atualizar título e breadcrumb
    const breadcrumbTitle = document.getElementById('breadcrumb-title');
    const eventoTitulo = document.getElementById('evento-titulo');
    
    if (breadcrumbTitle) {
        breadcrumbTitle.textContent = evento.titulo;
    }
    
    if (eventoTitulo) {
        eventoTitulo.textContent = evento.titulo;
    }
    
    // Atualizar título da página
    document.title = `${evento.titulo} - Sistema RH`;
    
    // Atualizar data
    const dataFormatada = formatDate(evento.dataCriacao);
    const eventoData = document.getElementById('evento-data');
    const infoData = document.getElementById('info-data');
    
    if (eventoData) {
        eventoData.textContent = `Criado em: ${dataFormatada}`;
    }
    
    if (infoData) {
        infoData.textContent = dataFormatada;
    }
    
    // Atualizar descrição
    const eventoDescricao = document.getElementById('evento-descricao');
    if (eventoDescricao) {
        if (evento.descricao && evento.descricao.trim()) {
            eventoDescricao.innerHTML = formatDescription(evento.descricao);
        } else {
            eventoDescricao.innerHTML = '<p>Aguarde mais informações sobre este evento em breve.</p>';
        }
    }
    
    // Mostrar imagem de capa se existir
    const eventoCapa = document.getElementById('evento-capa');
    const placeholderCapa = document.getElementById('placeholder-capa');
    
    if (evento.imagemCapa && eventoCapa) {
        eventoCapa.src = ApiUtils.getUploadUrl(evento.imagemCapa);
        eventoCapa.classList.remove('hidden');
        if (placeholderCapa) {
            placeholderCapa.style.display = 'none';
        }
    } else if (placeholderCapa) {
        placeholderCapa.style.display = 'flex';
        if (eventoCapa) {
            eventoCapa.classList.add('hidden');
        }
    }
    
    // Mostrar conteúdo
    const eventoContent = document.getElementById('evento-content');
    if (eventoContent) {
        eventoContent.classList.remove('hidden');
    }
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

async function loadGaleria(eventoId) {
    try {
        console.log('Carregando galeria para evento ID:', eventoId);
        showGaleriaLoading(true);
        
        imagens = await ApiUtils.get(`/eventos/${eventoId}/imagens`);
        console.log('Imagens carregadas:', imagens);
        
        displayGaleria();
        updateImagensCount();
        showGaleriaLoading(false);
        
    } catch (error) {
        console.error('Erro ao carregar galeria:', error);
        imagens = [];
        displayGaleria();
        updateImagensCount();
        showGaleriaLoading(false);
    }
}

function displayGaleria() {
    const galeriaGrid = document.getElementById('galeria-grid');
    const emptyGaleria = document.getElementById('empty-galeria');
    
    if (!galeriaGrid) {
        console.error('Elemento galeria-grid não encontrado');
        return;
    }
    
    if (imagens.length === 0) {
        galeriaGrid.classList.add('hidden');
        if (emptyGaleria) {
            emptyGaleria.classList.remove('hidden');
        }
        return;
    }
    
    // Limpar grid
    galeriaGrid.innerHTML = '';
    
    // Adicionar cada imagem como um card
    imagens.forEach((imagem, index) => {
        const fotoCard = createFotoCard(imagem, index);
        galeriaGrid.appendChild(fotoCard);
    });
    
    galeriaGrid.classList.remove('hidden');
    if (emptyGaleria) {
        emptyGaleria.classList.add('hidden');
    }
    
    console.log(`${imagens.length} fotos adicionadas à galeria`);
}

function createFotoCard(imagem, index) {
    const card = document.createElement('div');
    card.className = 'foto-card fade-in';
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Nome do arquivo sem extensão para exibição
    const nomeExibicao = imagem.nomeArquivo.replace(/\.[^/.]+$/, "");
    
    card.innerHTML = `
        <div class="foto-image-container">
            <img src="${ApiUtils.getUploadUrl(imagem.caminhoArquivo)}" 
                 alt="${escapeHtml(imagem.nomeArquivo)}" 
                 class="foto-image"
                 loading="lazy"
                 onerror="this.parentElement.parentElement.style.display='none'">
            <div class="foto-overlay">
                <button class="foto-expand-btn" onclick="openPhotoModal('${escapeHtml(imagem.caminhoArquivo)}', '${escapeHtml(imagem.nomeArquivo)}')">
                    🔍 Ver ampliada
                </button>
            </div>
        </div>
        <div class="foto-info">
            <h4 class="foto-title">${escapeHtml(nomeExibicao)}</h4>
            <span class="foto-number">Foto ${index + 1} de ${imagens.length}</span>
        </div>
    `;
    
    return card;
}

function updateImagensCount() {
    const infoImagens = document.getElementById('info-imagens');
    if (infoImagens) {
        const count = imagens.length;
        infoImagens.textContent = `${count} foto${count !== 1 ? 's' : ''}`;
    }
}

function showGaleriaLoading(show) {
    const galeriaLoading = document.getElementById('galeria-loading');
    const galeriaGrid = document.getElementById('galeria-grid');
    
    if (show) {
        if (galeriaLoading) galeriaLoading.classList.remove('hidden');
        if (galeriaGrid) galeriaGrid.classList.add('hidden');
    } else {
        if (galeriaLoading) galeriaLoading.classList.add('hidden');
    }
}

// Modal para foto expandida (opcional)
function openPhotoModal(caminhoArquivo, nomeArquivo) {
    const modal = document.getElementById('photo-modal');
    const modalPhoto = document.getElementById('modal-photo');
    const modalPhotoName = document.getElementById('modal-photo-name');
    
    if (modal && modalPhoto) {
        modalPhoto.src = ApiUtils.getUploadUrl(caminhoArquivo);
        modalPhoto.alt = nomeArquivo;
        
        if (modalPhotoName) {
            modalPhotoName.textContent = nomeArquivo;
        }
        
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        
        // Adicionar classe ao body para evitar scroll
        document.body.style.overflow = 'hidden';
    }
}

function closePhotoModal() {
    const modal = document.getElementById('photo-modal');
    
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        
        // Restaurar scroll do body
        document.body.style.overflow = 'auto';
    }
}

// Fechar modal com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePhotoModal();
    }
});

function showLoading(show) {
    const loading = document.getElementById('loading');
    const eventoContent = document.getElementById('evento-content');
    
    if (show) {
        if (loading) loading.classList.remove('hidden');
        if (eventoContent) eventoContent.classList.add('hidden');
    } else {
        if (loading) loading.classList.add('hidden');
        if (eventoContent) eventoContent.classList.remove('hidden');
    }
}

function showErrorState() {
    const loading = document.getElementById('loading');
    const eventoContent = document.getElementById('evento-content');
    const errorState = document.getElementById('error-state');
    
    if (loading) loading.classList.add('hidden');
    if (eventoContent) eventoContent.classList.add('hidden');
    if (errorState) errorState.classList.remove('hidden');
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