document.addEventListener('DOMContentLoaded', function() {
    // Verificar se a API está disponível
    checkApiHealth().then(isHealthy => {
        if (!isHealthy) {
            console.warn('Backend não está disponível. Usando dados de exemplo.');
            loadMockStats();
        } else {
            // Configurar eventos
            setupEventListeners();
            
            // Carregar estatísticas
            loadStats();
            
            // Carregar áreas para o modal
            loadAreas();
        }
    });
});

function setupEventListeners() {
    // Modal de notificação
    document.getElementById('notify-btn').addEventListener('click', openNotifyModal);
    document.getElementById('close-notify-modal').addEventListener('click', closeNotifyModal);
    document.getElementById('cancel-notify').addEventListener('click', closeNotifyModal);
    document.getElementById('notify-form').addEventListener('submit', handleNotifySubmit);
    
    // Fechar modal clicando fora
    document.getElementById('notify-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeNotifyModal();
        }
    });
}

async function loadStats() {
    try {
        // Carregar estatísticas em paralelo usando a nova API
        const [vagasAtivas, areas, eventos] = await Promise.all([
            ApiUtils.get('/vagas/ativas'),
            ApiUtils.get('/areas'),
            ApiUtils.get('/eventos')
        ]);
        
        // Atualizar contadores com animação
        animateCounter('vagas-count', vagasAtivas.length);
        animateCounter('areas-count', areas.length);
        animateCounter('eventos-count', eventos.length);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        loadMockStats();
    }
}

function loadMockStats() {
    // Dados de exemplo caso a API não esteja disponível
    animateCounter('vagas-count', 5);
    animateCounter('areas-count', 3);
    animateCounter('eventos-count', 2);
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let currentValue = 0;
    const increment = Math.ceil(targetValue / 30);
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
        }
        element.textContent = currentValue;
    }, 50);
}

async function loadAreas() {
    try {
        const areas = await ApiUtils.get('/areas');
        
        const select = document.getElementById('notify-area');
        select.innerHTML = '<option value="">Todas as áreas</option>';
        
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

function openNotifyModal() {
    document.getElementById('notify-modal').classList.remove('hidden');
    document.getElementById('notify-email').focus();
}

function closeNotifyModal() {
    document.getElementById('notify-modal').classList.add('hidden');
    document.getElementById('notify-form').reset();
}

async function handleNotifySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email').trim();
    const areaId = formData.get('area');
    
    if (!email) {
        alert('Por favor, informe seu e-mail.');
        return;
    }
    
    try {
        const data = {
            email: email,
            areaId: areaId || null
        };
        
        await ApiUtils.post('/notificacoes', data);
        
        alert('Cadastro realizado com sucesso! Você receberá notificações sobre novas vagas.');
        closeNotifyModal();
        
    } catch (error) {
        console.error('Erro ao cadastrar notificação:', error);
        alert('Erro ao cadastrar. Tente novamente mais tarde.');
    }
}