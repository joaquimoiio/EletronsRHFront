document.addEventListener('DOMContentLoaded', function() {
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados iniciais
    loadAreas();
    loadVagas();
});

let allVagas = [];
let filteredVagas = [];

function setupEventListeners() {
    // Filtros
    document.getElementById('area-filter').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('search-btn').addEventListener('click', applyFilters);
    
    // Limpar filtros
    document.getElementById('clear-filters').addEventListener('click', clearFilters);
    
    // Enter no campo de busca
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
}

async function loadAreas() {
    try {
        const areas = await ApiUtils.get('/areas');
        
        const select = document.getElementById('area-filter');
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.nome;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erro ao carregar áreas:', error);
    }
}

async function loadVagas() {
    try {
        showLoading(true);
        
        allVagas = await ApiUtils.get('/vagas/ativas');
        filteredVagas = [...allVagas];
        
        displayVagas();
        
    } catch (error) {
        console.error('Erro ao carregar vagas:', error);
        showEmptyState('Erro ao carregar vagas. Tente novamente mais tarde.');
    } finally {
        showLoading(false);
    }
}

function displayVagas() {
    const vagasGrid = document.getElementById('vagas-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (filteredVagas.length === 0) {
        vagasGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    vagasGrid.innerHTML = '';
    
    filteredVagas.forEach(vaga => {
        const vagaCard = createVagaCard(vaga);
        vagasGrid.appendChild(vagaCard);
    });
    
    vagasGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');
}

function createVagaCard(vaga) {
    const card = document.createElement('div');
    card.className = 'vaga-card';
    
    const description = vaga.descricao || 'Descrição não disponível';
    const truncatedDescription = truncateText(description, 120);
    
    card.innerHTML = `
        <div class="vaga-header">
            <h3 class="vaga-title">${escapeHtml(vaga.titulo)}</h3>
            <span class="vaga-area">${escapeHtml(vaga.area.nome)}</span>
        </div>
        <p class="vaga-description">${escapeHtml(truncatedDescription)}</p>
        <div class="vaga-footer">
            <span class="vaga-date">Publicada em ${formatDate(vaga.dataCriacao)}</span>
            <a href="detalhesVaga.html?id=${vaga.id}" class="vaga-btn">Ver Detalhes</a>
        </div>
    `;
    
    return card;
}

function applyFilters() {
    const areaFilter = document.getElementById('area-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    
    filteredVagas = allVagas.filter(vaga => {
        // Filtro por área
        const matchesArea = !areaFilter || vaga.area.id.toString() === areaFilter;
        
        // Filtro por texto de busca
        const matchesSearch = !searchTerm || 
            vaga.titulo.toLowerCase().includes(searchTerm) ||
            (vaga.descricao && vaga.descricao.toLowerCase().includes(searchTerm));
        
        return matchesArea && matchesSearch;
    });
    
    displayVagas();
}

function clearFilters() {
    document.getElementById('area-filter').value = '';
    document.getElementById('search-input').value = '';
    filteredVagas = [...allVagas];
    displayVagas();
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const vagasGrid = document.getElementById('vagas-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (show) {
        loading.classList.remove('hidden');
        vagasGrid.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showEmptyState(message) {
    const emptyState = document.getElementById('empty-state');
    const emptyStateP = emptyState.querySelector('p');
    
    if (message) {
        emptyStateP.textContent = message;
    }
    
    emptyState.classList.remove('hidden');
    document.getElementById('vagas-grid').classList.add('hidden');
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