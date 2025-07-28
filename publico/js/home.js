document.addEventListener('DOMContentLoaded', function() {
    // Forçar ocultação do modal no carregamento
    const notifyModal = document.getElementById('notify-modal');
    if (notifyModal) {
        notifyModal.style.display = 'none';
        notifyModal.classList.add('hidden');
    }
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados
    loadStats();
    loadAreas();
    
    // Adicionar animações de entrada
    addScrollAnimations();
});

function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Modal de notificação
    const notifyBtn = document.getElementById('notify-btn');
    const notifyModal = document.getElementById('notify-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelNotify = document.getElementById('cancel-notify');
    const notifyForm = document.getElementById('notify-form');

    // Verificar se os elementos existem
    console.log('Elementos encontrados:', {
        notifyBtn: !!notifyBtn,
        notifyModal: !!notifyModal,
        closeModal: !!closeModal,
        cancelNotify: !!cancelNotify,
        notifyForm: !!notifyForm
    });

    if (notifyBtn) {
        notifyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão de notificação clicado');
            openNotifyModal();
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão X clicado');
            closeNotifyModal();
        });
    }
    
    if (cancelNotify) {
        cancelNotify.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão cancelar clicado');
            closeNotifyModal();
        });
    }
    
    if (notifyForm) {
        notifyForm.addEventListener('submit', handleNotifySubmit);
    }
    
    // Fechar modal clicando fora
    if (notifyModal) {
        notifyModal.addEventListener('click', function(e) {
            if (e.target === notifyModal) {
                console.log('Clique fora do modal');
                closeNotifyModal();
            }
        });
    }

    // Fechar modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('notify-modal');
            if (modal && !modal.classList.contains('hidden')) {
                console.log('ESC pressionado');
                closeNotifyModal();
            }
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
        if (!select) return;
        
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
    console.log('Abrindo modal...');
    const modal = document.getElementById('notify-modal');
    if (!modal) {
        console.error('Modal não encontrado!');
        return;
    }
    
    // Usar tanto display quanto classe para garantir visibilidade
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
    
    console.log('Modal aberto, classes:', modal.className);
    
    // Focar no campo de e-mail após um pequeno delay
    setTimeout(() => {
        const emailInput = document.getElementById('notify-email');
        if (emailInput) {
            emailInput.focus();
        }
    }, 100);
}

function closeNotifyModal() {
    console.log('Fechando modal...');
    const modal = document.getElementById('notify-modal');
    if (!modal) {
        console.error('Modal não encontrado!');
        return;
    }
    
    // Usar tanto display quanto classe para garantir ocultação
    modal.style.display = 'none';
    modal.classList.add('hidden');
    
    console.log('Modal fechado, classes:', modal.className);
    
    // Limpar formulário
    const form = document.getElementById('notify-form');
    if (form) {
        form.reset();
    }
}

async function handleNotifySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const areaId = formData.get('area');
    
    // Validar email
    if (!email || !email.trim()) {
        showMessage('Por favor, informe seu e-mail.', 'error');
        return;
    }
    
    const emailTrimmed = email.trim();
    if (!validateEmail(emailTrimmed)) {
        showMessage('Por favor, informe um e-mail válido.', 'error');
        return;
    }
    
    try {
        const data = {
            email: emailTrimmed,
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
    // Remover mensagens existentes
    const existingMessages = document.querySelectorAll('.temp-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Criar elemento de mensagem
    const message = document.createElement('div');
    message.className = `message ${type} temp-message`;
    message.textContent = text;
    message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        max-width: 500px;
        text-align: center;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    `;
    
    // Aplicar cores baseadas no tipo
    if (type === 'success') {
        message.style.backgroundColor = '#c6f6d5';
        message.style.color = '#22543d';
        message.style.border = '1px solid #9ae6b4';
    } else if (type === 'error') {
        message.style.backgroundColor = '#fed7d7';
        message.style.color = '#c53030';
        message.style.border = '1px solid #feb2b2';
    }
    
    // Inserir no body
    document.body.appendChild(message);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 5000);
}

function addScrollAnimations() {
    const animateElements = document.querySelectorAll('.animate-in');
    
    if (!window.IntersectionObserver) {
        // Fallback para navegadores antigos
        animateElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
        return;
    }
    
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