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
    document.getElementById('sort-select').addEventListener('change', applySorting);
    
    // Retry
    document.getElementById('retry-btn').addEventListener('click', loadEventos);
}

async function loadEventos() {
    try {
        showLoading(true);
        hideStates();
        
        allEventos = await ApiUtils.get('/eventos');
        filteredEventos = [...allEventos];
        
        applySorting();
        displayEventos();
        updateEventsCount();
        
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showErrorState();
    } finally {
        showLoading(false);
    }
}

function displayEventos() {
    if (filteredEventos.length === 0) {
        showEmptyState();
        return;
    }
    
    // Mostrar featured event se houver eventos
    if (filteredEventos.length > 0) {
        displayFeaturedEvento(filteredEventos[0]);
        displayRegularEventos(filteredEventos.slice(1));
    }
    
    // Mostrar elementos
    document.getElementById('filter-bar').classList.remove('hidden');
    document.getElementById('eventos-grid').classList.remove('hidden');
    
    if (filteredEventos.length > 1) {
        document.getElementById('featured-evento').classList.remove('hidden');
    }
    
    hideStates();
}

function displayFeaturedEvento(evento) {
    const featuredContainer = document.getElementById('featured-evento');
    
    if (!evento) {
        featuredContainer.classList.add('hidden');
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
}

function displayRegularEventos(eventos) {
    const eventosGrid = document.getElementById('eventos-grid');
    
    eventosGrid.innerHTML = '';
    
    eventos.forEach(evento => {
        const eventoCard = createEventoCard(evento);
        eventosGrid.appendChild(eventoCard);
    });
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
    const sortValue = document.getElementById('sort-select').value;
    
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
    
    if (filteredEventos.length > 0) {
        displayEventos();
    }
}

function updateEventsCount() {
    const eventsCount = document.getElementById('events-count');
    const count = filteredEventos.length;
    
    eventsCount.textContent = `${count} evento${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    
    if (show) {
        loading.classList.remove('hidden');
        hideStates();
        document.getElementById('filter-bar').classList.add('hidden');
        document.getElementById('eventos-grid').classList.add('hidden');
        document.getElementById('featured-evento').classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showEmptyState() {
    document.getElementById('empty-state').classList.remove('hidden');
    document.getElementById('eventos-grid').classList.add('hidden');
    document.getElementById('featured-evento').classList.add('hidden');
    document.getElementById('filter-bar').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
}

function showErrorState() {
    document.getElementById('error-state').classList.remove('hidden');
    hideStates();
    document.getElementById('filter-bar').classList.add('hidden');
}

function hideStates() {
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
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