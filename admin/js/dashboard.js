document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    checkAuth();
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar estatísticas
    loadStats();
});

function checkAuth() {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    
    // Mostrar nome do usuário
    const username = localStorage.getItem('adminUsername') || 'Admin';
    document.getElementById('username').textContent = username;
}

function setupEventListeners() {
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', handleLogout);
}

function handleLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUsername');
        window.location.href = 'login.html';
    }
}

function loadStats() {
    // Carregar estatísticas do backend
    Promise.all([
        fetchAreas(),
        fetchVagas(),
        fetchCandidatos(),
        fetchEventos()
    ]).then(([areas, vagas, candidatos, eventos]) => {
        updateStatCard('total-areas', areas.length);
        updateStatCard('total-vagas', vagas.filter(v => v.status === 'ATIVA').length);
        updateStatCard('total-candidatos', candidatos.length);
        updateStatCard('total-eventos', eventos.length);
    }).catch(error => {
        console.error('Erro ao carregar estatísticas:', error);
        // Mostrar valores padrão em caso de erro
        updateStatCard('total-areas', '0');
        updateStatCard('total-vagas', '0');
        updateStatCard('total-candidatos', '0');
        updateStatCard('total-eventos', '0');
    });
}

function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        
        // Animação simples de contagem
        if (typeof value === 'number' && value > 0) {
            animateCounter(element, value);
        }
    }
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 20;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 50);
}

// Funções para buscar dados do backend
async function fetchAreas() {
    try {
        const response = await fetch('/api/areas');
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar áreas:', error);
        return [];
    }
}

async function fetchVagas() {
    try {
        const response = await fetch('/api/vagas');
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar vagas:', error);
        return [];
    }
}

async function fetchCandidatos() {
    try {
        const response = await fetch('/api/candidatos');
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar candidatos:', error);
        return [];
    }
}

async function fetchEventos() {
    try {
        const response = await fetch('/api/eventos');
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        return [];
    }
}