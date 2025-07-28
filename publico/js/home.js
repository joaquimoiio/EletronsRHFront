document.addEventListener('DOMContentLoaded', function() {
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados
    loadStats();
    loadAreas();
    
    // Adicionar animações de entrada
    addScrollAnimations();
});

function setupEventListeners() {
    // Modal de notificação
    const notifyBtn = document.getElementById('notify-btn');
    const notifyModal = document.getElementById('notify-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelNotify = document.getElementById('cancel-notify');
    const notifyForm = document.getElementById('notify-form');

    notifyBtn.addEventListener('click', openNotifyModal);
    closeModal.addEventListener('click', closeNotifyModal);
    cancelNotify.addEventListener('click', closeNotifyModal);
    notifyForm.addEventListener('submit', handleNotifySubmit);
    
    // Fechar modal clicando fora
    notifyModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeNotifyModal();
        }
    });

    // Fechar modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !notifyModal.classList.contains('hidden')) {
            closeNotifyModal();
        }
    });
}

async function loadStats() {
    try {
        // Carregar estatísticas da API
        const stats = await ApiUtils.get('/estatisticas');
        
        // Animar contadores
        animateCounter('vagas-count', stats.vagasAtivas || 0);
        animateCounter('areas-count', stats.totalAreas || 0);
        animateCounter('eventos-count', stats.totalEventos || 0);
        animateCounter('candidatos-count', stats.totalCandidatos || 0);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Usar valores padrão em caso de erro
        animateCounter('vagas-count', 5);
        animateCounter('areas-count', 3);
        animateCounter('eventos-count', 2);
        animateCounter('candidatos-count', 25);
    }
}

async function loadAreas() {
    try {
        const areas = await ApiUtils.get('/areas');
        
        const select = document.getElementById('notify-area');
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
        }
        element.textContent = currentValue;
    }, stepTime);
}

function openNotifyModal() {
    const modal = document.getElementById('notify-modal');
    modal.classList.remove('hidden');
    
    // Focar no campo de e-mail
    setTimeout(() => {
        document.getElementById('notify-email').focus();
    }, 100);
}

function closeNotifyModal() {
    const modal = document.getElementById('notify-modal');
    modal.classList.add('hidden');
    
    // Limpar formulário
    document.getElementById('notify-form').reset();
}

async function handleNotifySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email').trim();
    const areaId = formData.get('area');
    
    if (!email) {
        showMessage('Por favor, informe seu e-mail.', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Por favor, informe um e-mail válido.', 'error');
        return;
    }
    
    try {
        const data = {
            email: email,
            areaId: areaId || null
        };
        
        await ApiUtils.post('/notificacoes', data);
        
        showMessage('Cadastro realizado com sucesso! Você receberá notificações sobre novas vagas.', 'success');
        closeNotifyModal();
        
    } catch (error) {
        console.error('Erro ao cadastrar notificação:', error);
        showMessage('Erro ao cadastrar. Tente novamente mais tarde.', 'error');
    }
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(text, type) {
    // Criar elemento de mensagem
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // Inserir no topo da página
    const main = document.querySelector('main');
    main.insertBefore(message, main.firstChild);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 5000);
}

function addScrollAnimations() {
    const animateElements = document.querySelectorAll('.animate-in');
    
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
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}