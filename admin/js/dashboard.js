document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (!checkAuth()) return;
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados do dashboard
    loadDashboardData();
    
    // Adicionar animações
    addScrollAnimations();
});

function setupEventListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Mostrar nome do usuário
    const username = localStorage.getItem('adminUsername') || 'Admin';
    document.getElementById('username').textContent = username;
}

async function loadDashboardData() {
    try {
        // Carregar estatísticas
        await loadStats();
        
        // Carregar atividades recentes
        await loadRecentActivity();
        
        // Verificar status do sistema
        await checkSystemStatus();
        
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        showMessage('Erro ao carregar dados do dashboard', 'error');
    }
}

async function loadStats() {
    try {
        const stats = await ApiUtils.get('/estatisticas');
        
        // Animar contadores
        animateCounter('total-areas', stats.totalAreas || 0);
        animateCounter('total-vagas', stats.vagasAtivas || 0);
        animateCounter('total-candidatos', stats.totalCandidatos || 0);
        animateCounter('total-eventos', stats.totalEventos || 0);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        
        // Usar fallback para dados individuais
        await loadStatsIndividually();
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
        
        animateCounter('total-areas', areas.length);
        animateCounter('total-vagas', vagas.length);
        animateCounter('total-candidatos', totalCandidatos);
        animateCounter('total-eventos', eventos.length);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas individuais:', error);
        
        // Valores padrão em caso de erro
        document.getElementById('total-areas').textContent = '0';
        document.getElementById('total-vagas').textContent = '0';
        document.getElementById('total-candidatos').textContent = '0';
        document.getElementById('total-eventos').textContent = '0';
    }
}

async function loadRecentActivity() {
    try {
        document.getElementById('activity-loading').classList.remove('hidden');
        
        // Simular atividades recentes (em produção viria da API)
        const activities = await generateMockActivities();
        
        displayActivities(activities);
        
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        showEmptyActivity();
    } finally {
        document.getElementById('activity-loading').classList.add('hidden');
    }
}

async function generateMockActivities() {
    // Simular delay de carregamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const now = new Date();
    
    return [
        {
            type: 'new-vaga',
            icon: '💼',
            title: 'Nova vaga publicada',
            description: 'Desenvolvedor Full Stack - Área de Tecnologia',
            time: formatTimeAgo(new Date(now - 2 * 60 * 60 * 1000)) // 2 horas atrás
        },
        {
            type: 'new-candidate',
            icon: '👤',
            title: 'Novo candidato',
            description: 'João Silva se candidatou para Analista de RH',
            time: formatTimeAgo(new Date(now - 4 * 60 * 60 * 1000)) // 4 horas atrás
        },
        {
            type: 'new-event',
            icon: '🎉',
            title: 'Evento criado',
            description: 'Workshop de Desenvolvimento Profissional',
            time: formatTimeAgo(new Date(now - 1 * 24 * 60 * 60 * 1000)) // 1 dia atrás
        },
        {
            type: 'new-candidate',
            icon: '👤',
            title: 'Novo candidato',
            description: 'Maria Santos se candidatou para Designer UX/UI',
            time: formatTimeAgo(new Date(now - 2 * 24 * 60 * 60 * 1000)) // 2 dias atrás
        }
    ];
}

function displayActivities(activities) {
    const activityList = document.getElementById('activity-list');
    const emptyActivity = document.getElementById('empty-activity');
    
    if (activities.length === 0) {
        showEmptyActivity();
        return;
    }
    
    activityList.innerHTML = '';
    
    activities.forEach((activity, index) => {
        const activityItem = createActivityItem(activity);
        activityItem.style.animationDelay = `${index * 0.1}s`;
        activityList.appendChild(activityItem);
    });
    
    activityList.classList.remove('hidden');
    emptyActivity.classList.add('hidden');
}

function createActivityItem(activity) {
    const div = document.createElement('div');
    div.className = 'activity-item fade-in-up';
    
    div.innerHTML = `
        <div class="activity-icon ${activity.type}">
            ${activity.icon}
        </div>
        <div class="activity-content">
            <div class="activity-title-text">${activity.title}</div>
            <div class="activity-description">${activity.description}</div>
        </div>
        <div class="activity-time">${activity.time}</div>
    `;
    
    return div;
}

function showEmptyActivity() {
    document.getElementById('activity-list').classList.add('hidden');
    document.getElementById('empty-activity').classList.remove('hidden');
}

async function checkSystemStatus() {
    try {
        // Verificar conectividade da API
        await ApiUtils.get('/areas');
        
        // Se chegou até aqui, API está funcionando
        updateSystemStatus('online');
        
    } catch (error) {
        console.error('Sistema com problemas:', error);
        updateSystemStatus('warning');
    }
}

function updateSystemStatus(status) {
    const dbStatus = document.getElementById('db-status');
    
    // Remover classes antigas
    dbStatus.classList.remove('online', 'warning', 'offline');
    
    // Adicionar nova classe
    dbStatus.classList.add(status);
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let currentValue = 0;
    const increment = Math.max(1, Math.ceil(targetValue / 30));
    const duration = 2000; // 2 segundos
    const stepTime = duration / (targetValue / increment);
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
            
            // Adicionar animação de pulse ao final
            element.classList.add('counter-animation');
            setTimeout(() => {
                element.classList.remove('counter-animation');
            }, 500);
        }
        element.textContent = currentValue;
    }, stepTime);
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) {
        return 'Agora mesmo';
    } else if (diffMins < 60) {
        return `${diffMins} min atrás`;
    } else if (diffHours < 24) {
        return `${diffHours}h atrás`;
    } else {
        return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    }
}

function addScrollAnimations() {
    const animateElements = document.querySelectorAll('.fade-in-up');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animateElements.forEach((el) => {
        observer.observe(el);
    });
}

function showMessage(text, type) {
    // Criar elemento de mensagem
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // Inserir no topo da página
    const main = document.querySelector('.main');
    const container = main.querySelector('.container');
    container.insertBefore(message, container.firstChild);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 5000);
}