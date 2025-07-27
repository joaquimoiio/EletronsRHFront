document.addEventListener('DOMContentLoaded', function() {
    // Obter ID do evento da URL
    const eventoId = getEventoIdFromURL();
    
    if (!eventoId) {
        showErrorState();
        return;
    }
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados do evento
    loadEventoDetails(eventoId);
    loadGaleria(eventoId);
});

let currentEvento = null;
let imagens = [];
let currentImageIndex = 0;

function getEventoIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function setupEventListeners() {
    // Modal de imagem
    document.getElementById('close-modal').addEventListener('click', closeImageModal);
    document.getElementById('prev-image').addEventListener('click', () => navigateImage(-1));
    document.getElementById('next-image').addEventListener('click', () => navigateImage(1));
    
    // Fechar modal clicando fora da imagem
    document.getElementById('image-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeImageModal();
        }
    });
    
    // Navegação por teclado
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('image-modal');
        if (!modal.classList.contains('hidden')) {
            switch(e.key) {
                case 'Escape':
                    closeImageModal();
                    break;
                case 'ArrowLeft':
                    navigateImage(-1);
                    break;
                case 'ArrowRight':
                    navigateImage(1);
                    break;
            }
        }
    });
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
        showErrorState();
    }
}

function displayEventoDetails(evento) {
    // Atualizar título e breadcrumb
    document.getElementById('breadcrumb-title').textContent = evento.titulo;
    document.getElementById('evento-titulo').textContent = evento.titulo;
    document.title = `${evento.titulo} - Sistema RH`;
    
    // Atualizar data
    const dataFormatada = formatDate(evento.dataCriacao);
    document.getElementById('evento-data').textContent = `Criado em ${dataFormatada}`;
    document.getElementById('info-data').textContent = dataFormatada;
    
    // Atualizar descrição
    const descricaoElement = document.getElementById('evento-descricao');
    if (evento.descricao && evento.descricao.trim()) {
        descricaoElement.innerHTML = formatDescription(evento.descricao);
    } else {
        descricaoElement.innerHTML = '<p>Aguarde mais informações sobre este evento em breve.</p>';
    }
    
    // Mostrar imagem de capa se existir
    if (evento.imagemCapa) {
        const eventoCapa = document.getElementById('evento-capa');
        eventoCapa.src = `/uploads/${evento.imagemCapa}`;
        eventoCapa.classList.remove('hidden');
        document.getElementById('placeholder-capa').style.display = 'none';
    }
    
    // Mostrar conteúdo
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('evento-content').classList.remove('hidden');
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
        const response = await fetch(`/api/eventos/${eventoId}/imagens`);
        
        if (!response.ok) {
            console.warn('Erro ao carregar galeria, mas evento existe');
            imagens = [];
        } else {
            imagens = await response.json();
        }
        
        displayGaleria();
        updateImagensCount();
        
    } catch (error) {
        console.error('Erro ao carregar galeria:', error);
        imagens = [];
        displayGaleria();
        updateImagensCount();
    }
}

function displayGaleria() {
    const galeriaGrid = document.getElementById('galeria-grid');
    const emptyGaleria = document.getElementById('empty-galeria');
    
    if (imagens.length === 0) {
        galeriaGrid.innerHTML = '';
        emptyGaleria.classList.remove('hidden');
        return;
    }
    
    galeriaGrid.innerHTML = '';
    
    imagens.forEach((imagem, index) => {
        const imagemItem = createGaleriaItem(imagem, index);
        galeriaGrid.appendChild(imagemItem);
    });
    
    emptyGaleria.classList.add('hidden');
}

function createGaleriaItem(imagem, index) {
    const div = document.createElement('div');
    div.className = 'galeria-item';
    div.onclick = () => openImageModal(index);
    
    div.innerHTML = `
        <img src="/uploads/${imagem.caminhoArquivo}" alt="${escapeHtml(imagem.nomeArquivo)}" loading="lazy">
        <div class="galeria-overlay">
            <span>🔍</span>
        </div>
    `;
    
    return div;
}

function updateImagensCount() {
    document.getElementById('info-imagens').textContent = `${imagens.length} foto${imagens.length !== 1 ? 's' : ''}`;
}

function openImageModal(imageIndex) {
    if (imagens.length === 0) return;
    
    currentImageIndex = imageIndex;
    updateModalImage();
    document.getElementById('image-modal').classList.remove('hidden');
    
    // Mostrar/ocultar botões de navegação
    const prevBtn = document.getElementById('prev-image');
    const nextBtn = document.getElementById('next-image');
    
    prevBtn.style.display = imagens.length > 1 ? 'block' : 'none';
    nextBtn.style.display = imagens.length > 1 ? 'block' : 'none';
}

function closeImageModal() {
    document.getElementById('image-modal').classList.add('hidden');
}

function navigateImage(direction) {
    if (imagens.length <= 1) return;
    
    currentImageIndex += direction;
    
    if (currentImageIndex >= imagens.length) {
        currentImageIndex = 0;
    } else if (currentImageIndex < 0) {
        currentImageIndex = imagens.length - 1;
    }
    
    updateModalImage();
}

function updateModalImage() {
    if (currentImageIndex >= 0 && currentImageIndex < imagens.length) {
        const imagem = imagens[currentImageIndex];
        document.getElementById('modal-image').src = `/uploads/${imagem.caminhoArquivo}`;
    }
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}