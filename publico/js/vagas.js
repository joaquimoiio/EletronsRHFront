document.addEventListener('DOMContentLoaded', function() {
    // Variáveis globais
    let allVagas = [];
    let filteredVagas = [];
    let areas = [];
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados iniciais
    loadAreas();
    loadVagas();
});

function setupEventListeners() {
    // Filtros
    document.getElementById('area-filter').addEventListener('change', applyFilters);
    document.getElementById('sort-filter').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('search-btn').addEventListener('click', applyFilters);
    
    // Limpar filtros
    document.getElementById('clear-filters').addEventListener('click', clearFilters);
    document.getElementById('empty-clear-filters').addEventListener('click', clearFilters);
    
    // Retry
    document.getElementById('retry-btn').addEventListener('click', loadVagas);
    
    // Enter no campo de busca
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
}

async function loadAreas() {
    try {
        areas = await ApiUtils.get('/areas');
        
        const select = document.getElementById('area-filter');
        // Limpar opções existentes (exceto a primeira)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
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
        hideStates();
        
        allVagas = await ApiUtils.get('/vagas/ativas');
        filteredVagas = [...allVagas];
        
        displayVagas();
        updateResultsInfo();
        
    } catch (error) {
        console.error('Erro ao carregar vagas:', error);
        showErrorState();
    } finally {
        showLoading(false);
    }
}

function displayVagas() {
    const vagasGrid = document.getElementById('vagas-grid');
    
    if (filteredVagas.length === 0) {
        showEmptyState();
        return;
    }
    
    vagasGrid.innerHTML = '';
    
    filteredVagas.forEach(vaga => {
        const vagaCard = createVagaCard(vaga);
        vagasGrid.appendChild(vagaCard);
    });
    
    // Mostrar grid e ocultar outros estados
    vagasGrid.classList.remove('hidden');
    document.getElementById('results-info').classList.remove('hidden');
    hideStates();
}

function createVagaCard(vaga) {
    const card = document.createElement('div');
    card.className = 'vaga-card fade-in';
    
    // Truncar descrição
    const description = vaga.descricao || 'Descrição não disponível';
    const truncatedDescription = truncateText(description, 150);
    
    // Encontrar área
    const area = areas.find(a => a.id === vaga.area.id);
    const areaName = area ? area.nome : vaga.area.nome || 'Área não especificada';
    
    card.innerHTML = `
        <div class="vaga-header">
            <h3 class="vaga-title">${escapeHtml(vaga.titulo)}</h3>
            <span class="vaga-area">${escapeHtml(areaName)}</span>
        </div>
        <p class="vaga-description">${escapeHtml(truncatedDescription)}</p>
        <div class="vaga-footer">
            <div class="vaga-meta">
                <span class="vaga-date">Publicada em ${formatDate(vaga.dataCriacao)}</span>
                <span class="vaga-status">Status: Ativa</span>
            </div>
            <a href="detalhes-vaga.html?id=${vaga.id}" class="vaga-btn">Ver Detalhes</a>
        </div>
    `;
    
    return card;
}

function applyFilters() {
    const areaFilter = document.getElementById('area-filter').value;
    const sortFilter = document.getElementById('sort-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    
    // Aplicar filtros
    filteredVagas = allVagas.filter(vaga => {
        // Filtro por área
        const matchesArea = !areaFilter || vaga.area.id.toString() === areaFilter;
        
        // Filtro por texto de busca
        const matchesSearch = !searchTerm || 
            vaga.titulo.toLowerCase().includes(searchTerm) ||
            (vaga.descricao && vaga.descricao.toLowerCase().includes(searchTerm));
        
        return matchesArea && matchesSearch;
    });
    
    // Aplicar ordenação
    switch (sortFilter) {
        case 'titulo':
            filteredVagas.sort((a, b) => a.titulo.localeCompare(b.titulo));
            break;
        case 'area':
            filteredVagas.sort((a, b) => a.area.nome.localeCompare(b.area.nome));
            break;
        case 'recente':
        default:
            filteredVagas.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
            break;
    }
    
    displayVagas();
    updateResultsInfo();
}

function clearFilters() {
    document.getElementById('area-filter').value = '';
    document.getElementById('sort-filter').value = 'recente';
    document.getElementById('search-input').value = '';
    
    filteredVagas = [...allVagas];
    applyFilters();
}

function updateResultsInfo() {
    const resultsText = document.getElementById('results-text');
    const count = filteredVagas.length;
    const total = allVagas.length;
    
    if (count === total) {
        resultsText.textContent = `${count} vaga${count !== 1 ? 's' : ''} encontrada${count !== 1 ? 's' : ''}`;
    } else {
        resultsText.textContent = `${count} de ${total} vaga${total !== 1 ? 's' : ''} encontrada${count !== 1 ? 's' : ''}`;
    }
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    
    if (show) {
        loading.classList.remove('hidden');
        hideStates();
    } else {
        loading.classList.add('hidden');
    }
}

function showEmptyState() {
    document.getElementById('empty-state').classList.remove('hidden');
    document.getElementById('vagas-grid').classList.add('hidden');
    document.getElementById('results-info').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
}

function showErrorState() {
    document.getElementById('error-state').classList.remove('hidden');
    hideStates();
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