document.addEventListener('DOMContentLoaded', function() {
    // Variáveis globais
    let allEventos = [];
    let filteredEventos = [];
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar eventos
    loadEventos();
});

function setupEventListeners() {
    // Sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', applySorting);
    }
    
    // Retry
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', loadEventos);
    }
}

async function loadEventos() {
    try {
        console.log('Iniciando carregamento de eventos...');
        showSkeletonLoading(true);
        hideAllStates();
        
        // Carregar eventos da API
        allEventos = await ApiUtils.get('/eventos');
        console.log('Eventos carregados:', allEventos);
        
        filteredEventos = [...allEventos];
        
        // Pequeno delay para mostrar o skeleton (opcional)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Ocultar skeleton e mostrar conteúdo
        showSkeletonLoading(false);
        
        if (filteredEventos.length === 0) {
            showEmptyState();
        } else {
            applySorting();
            displayEventos();
            updateEventsCount();
            showFilterBar();
        }
        
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showSkeletonLoading(false);
        showErrorState();
    }
}

function showSkeletonLoading(show) {
    const loading = document.getElementById('loading');
    
    if (show) {
        // Mostrar skeleton
        if (loading) {
            loading.classList.remove('hidden');
            // Criar skeleton cards se não existirem
            if (loading.children.length === 0) {
                createSkeletonCards();
            }
        }
        hideAllStates();
    } else {
        // Ocultar skeleton
        if (loading) {
            loading.classList.add('hidden');
        }
    }
}

function createSkeletonCards() {
    const loading = document.getElementById('loading');
    if (!loading) return;
    
    // Limpar conteúdo existente
    loading.innerHTML = '';
    
    // Criar 3 skeleton cards
    for (let i = 0; i < 3; i++) {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'evento-skeleton';
        
        skeletonCard.innerHTML = `
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-date"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 70%;"></div>
            </div>
        `;
        
        loading.appendChild(skeletonCard);
    }
}

function displayEventos() {
    console.log('Exibindo eventos:', filteredEventos.length);
    
    if (filteredEventos.length === 0) {
        showEmptyState();
        return;
    }
    
    // Exibir evento em destaque se houver mais de um evento
    if (filteredEventos.length > 1) {
        displayFeaturedEvento(filteredEventos[0]);
        displayRegularEventos(filteredEventos.slice(1));
    } else {
        // Se só há um evento, não mostrar como destaque
        hideFeaturedEvento();
        displayRegularEventos(filteredEventos);
    }
    
    // Mostrar elementos principais
    showEventosGrid();
    hideAllStates();
}

function displayFeaturedEvento(evento) {
    const featuredContainer = document.getElementById('featured-evento');
    
    if (!evento || !featuredContainer) {
        hideFeaturedEvento();
        return;
    }
    
    const description = evento.descricao || 'Aguarde mais informações sobre este evento em breve.';
    const truncatedDescription = truncateText(description, 200);
    
    // Determinar imagem
    let imagemHtml;
    if (evento.imagemCapa) {
        imagemHtml = `<img src="${ApiUtils.getUploadUrl(evento.imagemCapa)}" alt="${escapeHtml(evento.titulo)}" class="featured-image">`;
    } else {
        imagemHtml = `<div class="featured-image placeholder-image">🎉</div>`;
    }
    
    featuredContainer.innerHTML = `
        <div class="featured-card fade-in">
            <div class="featured-badge">Destaque</div>
            <div class="featured-content">
                ${imagemHtml}
                <div class="featured-info">
                    <h2 class="featured-title">${escapeHtml(evento.titulo)}</h2>
                    <p class="featured-description">${escapeHtml(truncatedDescription)}</p>
                    <div class="featured-meta">
                        <span class="evento-date">Criado em ${formatDate(evento.dataCriacao)}</span>
                        <a href="detalhes-evento.html?id=${evento.id}" class="evento-btn">Ver Detalhes</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    featuredContainer.classList.remove('hidden');
}

function displayRegularEventos(eventos) {
    const eventosGrid = document.getElementById('eventos-grid');
    
    if (!eventosGrid) {
        console.error('Grid de eventos não encontrado');
        return;
    }
    
    // Limpar grid
    eventosGrid.innerHTML = '';
    
    eventos.forEach((evento, index) => {
        const eventoCard = createEventoCard(evento);
        // Adicionar delay de animação
        eventoCard.style.animationDelay = `${index * 0.1}s`;
        eventosGrid.appendChild(eventoCard);
    });
    
    console.log(`${eventos.length} eventos adicionados ao grid`);
}

function createEventoCard(evento) {
    const card = document.createElement('div');
    card.className = 'evento-card fade-in';
    
    const description = evento.descricao || 'Aguarde mais informações sobre este evento em breve.';
    const truncatedDescription = truncateText(description, 120);
    
    // Determinar imagem
    let imagemHtml;
    if (evento.imagemCapa) {
        imagemHtml = `<img src="${ApiUtils.getUploadUrl(evento.imagemCapa)}" alt="${escapeHtml(evento.titulo)}" class="evento-image">`;
    } else {
        imagemHtml = `<div class="placeholder-image">🎉</div>`;
    }
    
    card.innerHTML = `
        ${imagemHtml}
        <div class="evento-content">
            <div class="evento-header">
                <h3 class="evento-title">${escapeHtml(evento.titulo)}</h3>
                <div class="evento-date">Criado em ${formatDate(evento.dataCriacao)}</div>
            </div>
            <p class="evento-description">${escapeHtml(truncatedDescription)}</p>
            <div class="evento-footer">
                <div class="evento-meta">
                    <div class="galeria-count">
                        <span>📸</span>
                        <span>Galeria disponível</span>
                    </div>
                </div>
                <a href="detalhes-evento.html?id=${evento.id}" class="evento-btn">Ver Detalhes</a>
            </div>
        </div>
    `;
    
    return card;
}

function applySorting() {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;
    
    const sortValue = sortSelect.value;
    
    switch (sortValue) {
        case 'titulo':
            filteredEventos.sort((a, b) => a.titulo.localeCompare(b.titulo));
            break;
        case 'antigo':
            filteredEventos.sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao));
            break;
        case 'recente':
        default:
            filteredEventos.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
            break;
    }
    
    console.log('Eventos ordenados:', sortValue);
    
    // Só re-exibir se já temos eventos carregados
    if (filteredEventos.length > 0 && !document.getElementById('loading').classList.contains('hidden') === false) {
        displayEventos();
    }
}

function updateEventsCount() {
    const eventsCount = document.getElementById('events-count');
    if (!eventsCount) return;
    
    const count = filteredEventos.length;
    eventsCount.textContent = `${count} evento${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
}

function showFilterBar() {
    const filterBar = document.getElementById('filter-bar');
    if (filterBar) {
        filterBar.classList.remove('hidden');
    }
}

function showEventosGrid() {
    const eventosGrid = document.getElementById('eventos-grid');
    if (eventosGrid) {
        eventosGrid.classList.remove('hidden');
    }
}

function hideFeaturedEvento() {
    const featuredEvento = document.getElementById('featured-evento');
    if (featuredEvento) {
        featuredEvento.classList.add('hidden');
    }
}

function showEmptyState() {
    console.log('Mostrando estado vazio');
    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
        emptyState.classList.remove('hidden');
    }
    
    hideAllOtherStates();
}

function showErrorState() {
    console.log('Mostrando estado de erro');
    const errorState = document.getElementById('error-state');
    if (errorState) {
        errorState.classList.remove('hidden');
    }
    
    hideAllOtherStates();
}

function hideAllStates() {
    const emptyState = document.getElementById('empty-state');
    const errorState = document.getElementById('error-state');
    
    if (emptyState) emptyState.classList.add('hidden');
    if (errorState) errorState.classList.add('hidden');
}

function hideAllOtherStates() {
    const filterBar = document.getElementById('filter-bar');
    const eventosGrid = document.getElementById('eventos-grid');
    const featuredEvento = document.getElementById('featured-evento');
    
    if (filterBar) filterBar.classList.add('hidden');
    if (eventosGrid) eventosGrid.classList.add('hidden');
    if (featuredEvento) featuredEvento.classList.add('hidden');
}

// Funções utilitárias
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