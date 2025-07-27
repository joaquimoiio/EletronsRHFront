document.addEventListener('DOMContentLoaded', function() {
    // Carregar eventos
    loadEventos();
});

let eventos = [];

async function loadEventos() {
    try {
        showLoading(true);
        
        const response = await fetch('/api/eventos');
        if (!response.ok) {
            throw new Error('Erro ao carregar eventos');
        }
        
        eventos = await response.json();
        displayEventos();
        
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showEmptyState();
    } finally {
        showLoading(false);
    }
}

function displayEventos() {
    const eventosGrid = document.getElementById('eventos-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (eventos.length === 0) {
        eventosGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    eventosGrid.innerHTML = '';
    
    eventos.forEach(evento => {
        const eventoCard = createEventoCard(evento);
        eventosGrid.appendChild(eventoCard);
    });
    
    eventosGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');
}

function createEventoCard(evento) {
    const card = document.createElement('div');
    card.className = 'evento-card';
    
    const description = evento.descricao || 'Aguarde mais informações sobre este evento em breve.';
    const truncatedDescription = truncateText(description, 150);
    
    // Determinar imagem
    let imagemHtml;
    if (evento.imagemCapa) {
        imagemHtml = `<img src="/uploads/${evento.imagemCapa}" alt="${escapeHtml(evento.titulo)}" class="evento-image">`;
    } else {
        imagemHtml = `<div class="placeholder-image">🎉</div>`;
    }
    
    card.innerHTML = `
        ${imagemHtml}
        <div class="evento-content">
            <div class="evento-header">
                <h3 class="evento-title">${escapeHtml(evento.titulo)}</h3>
                <span class="evento-date">Criado em ${formatDate(evento.dataCriacao)}</span>
            </div>
            <p class="evento-description">${escapeHtml(truncatedDescription)}</p>
            <div class="evento-footer">
                <a href="detalhesEvento.html?id=${evento.id}" class="evento-btn">Ver Detalhes</a>
            </div>
        </div>
    `;
    
    return card;
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const eventosGrid = document.getElementById('eventos-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (show) {
        loading.classList.remove('hidden');
        eventosGrid.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showEmptyState() {
    const emptyState = document.getElementById('empty-state');
    const eventosGrid = document.getElementById('eventos-grid');
    
    emptyState.classList.remove('hidden');
    eventosGrid.classList.add('hidden');
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text || '';
    }
    return text.substring(0, maxLength) + '...';
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