document.addEventListener('DOMContentLoaded', function() {
    // Configurar eventos
    setupEventListeners();
    
    // Carregar estatísticas
    loadStats();
    
    // Carregar áreas para o modal
    loadAreas();
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
        // Carregar estatísticas em paralelo
        const [vagasData, areasData, eventosData] = await Promise.all([
            fetch('/api/vagas/ativas').then(r => r.json()).catch(() => []),
            fetch('/api/areas').then(r => r.json()).catch(() => []),
            fetch('/api/eventos').then(r => r.json()).catch(() => [])
        ]);
        
        // Atualizar contadores com animação
        animateCounter('vagas-count', vagasData.length);
        animateCounter('areas-count', areasData.length);
        animateCounter('eventos-count', eventosData.length);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Mostrar valores padrão em caso de erro
        document.getElementById('vagas-count').textContent = '0';
        document.getElementById('areas-count').textContent = '0';
        document.getElementById('eventos-count').textContent = '0';
    }
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
        const response = await fetch('/api/areas');
        const areas = await response.json();
        
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
        const response = await fetch('/api/notificacoes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                areaId: areaId || null
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao cadastrar notificação');
        }
        
        alert('Cadastro realizado com sucesso! Você receberá notificações sobre novas vagas.');
        closeNotifyModal();
        
    } catch (error) {
        console.error('Erro ao cadastrar notificação:', error);
        alert('Erro ao cadastrar. Tente novamente mais tarde.');
    }
}