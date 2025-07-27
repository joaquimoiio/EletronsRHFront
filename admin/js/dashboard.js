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

async function loadStats() {
    try {
        // Usar a API do backend para estatísticas
        const stats = await ApiUtils.get('/estatisticas');
        
        updateStatCard('total-areas', stats.totalAreas || 0);
        updateStatCard('total-vagas', stats.vagasAtivas || 0);
        updateStatCard('total-candidatos', stats.totalCandidatos || 0);
        updateStatCard('total-eventos', stats.totalEventos || 0);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Fallback para carregar individualmente
        loadStatsIndividually();
    }
}

async function loadStatsIndividually() {
    try {
        const [areas, vagas, eventos] = await Promise.all([
            ApiUtils.get('/areas').catch(() => []),
            ApiUtils.get('/vagas/ativas').catch(() => []),
            ApiUtils.get('/eventos').catch(() => [])
        ]);
        
        // Calcular total de candidatos
        const todasVagas = await ApiUtils.get('/vagas').catch(() => []);
        const totalCandidatos = todasVagas.reduce((total, vaga) => {
            return total + (vaga.candidatos ? vaga.candidatos.length : 0);
        }, 0);
        
        updateStatCard('total-areas', areas.length);
        updateStatCard('total-vagas', vagas.length);
        updateStatCard('total-candidatos', totalCandidatos);
        updateStatCard('total-eventos', eventos.length);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas individuais:', error);
        // Mostrar valores padrão em caso de erro
        updateStatCard('total-areas', '0');
        updateStatCard('total-vagas', '0');
        updateStatCard('total-candidatos', '0');
        updateStatCard('total-eventos', '0');
    }
}

function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        // Animação simples de contagem
        if (typeof value === 'number' && value > 0) {
            animateCounter(element, value);
        } else {
            element.textContent = value;
        }
    }
}

function animateCounter(element, target) {
    let current = 0;
    const increment = Math.max(1, Math.ceil(target / 20));
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 50);
}