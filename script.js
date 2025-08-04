// Variáveis globais
const header = document.getElementById('header');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const nav = document.getElementById('nav');
const contactForm = document.getElementById('contactForm');

// Estado do menu mobile
let mobileMenuOpen = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Função principal de inicialização
function initializeApp() {
    setupScrollEffects();
    setupMobileMenu();
    setupSmoothScrolling();
    setupFormHandling();
    setupAnimations();
    setupNavigation();
}

// Efeitos de scroll
function setupScrollEffects() {
    window.addEventListener('scroll', handleScroll);
}

function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Header background change
    if (scrollTop > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    // Animate elements on scroll
    animateOnScroll();
    
    // Update active navigation
    updateActiveNavigation();
}

// Menu mobile
function setupMobileMenu() {
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Criar overlay para menu mobile
    createMobileNavOverlay();
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', function(e) {
        if (mobileMenuOpen && !e.target.closest('.header')) {
            closeMobileMenu();
        }
    });
    
    // Fechar menu no resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && mobileMenuOpen) {
            closeMobileMenu();
        }
    });
}

function createMobileNavOverlay() {
    const mobileNav = document.createElement('div');
    mobileNav.className = 'mobile-nav';
    mobileNav.id = 'mobile-nav';
    
    // Copiar links da navegação
    const navLinks = nav.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const mobileLink = link.cloneNode(true);
        mobileLink.addEventListener('click', closeMobileMenu);
        mobileNav.appendChild(mobileLink);
    });
    
    document.body.appendChild(mobileNav);
}

function toggleMobileMenu() {
    if (mobileMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    mobileMenuOpen = true;
    mobileMenuBtn.classList.add('active');
    document.getElementById('mobile-nav').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    mobileMenuOpen = false;
    mobileMenuBtn.classList.remove('active');
    document.getElementById('mobile-nav').classList.remove('active');
    document.body.style.overflow = '';
}

// Smooth scrolling
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Fechar menu mobile se estiver aberto
                if (mobileMenuOpen) {
                    closeMobileMenu();
                }
            }
        });
    });
}

// Navegação ativa
function updateActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - header.offsetHeight - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.pageYOffset >= sectionTop && 
            window.pageYOffset < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Animações
function setupAnimations() {
    // Observador de interseção para animações
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        }
    );
    
    // Observar elementos que devem ser animados
    const animatedElements = document.querySelectorAll(
        '.section-header, .service-card, .benefit-card, .value-card, .contact-card'
    );
    
    animatedElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

function animateOnScroll() {
    // Animação dos cards de estatísticas no hero
    const statsCards = document.querySelectorAll('.stat-item');
    const heroSection = document.querySelector('.hero');
    
    if (heroSection) {
        const heroRect = heroSection.getBoundingClientRect();
        const isHeroVisible = heroRect.top < window.innerHeight && heroRect.bottom > 0;
        
        if (isHeroVisible) {
            statsCards.forEach((card, index) => {
                const delay = index * 100;
                setTimeout(() => {
                    card.style.transform = 'translateY(0)';
                    card.style.opacity = '1';
                }, delay);
            });
        }
    }
}

// Manipulação de formulários
function setupFormHandling() {
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
        
        // Validação em tempo real
        const inputs = contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
    }
}

function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);
    
    // Validar formulário
    if (!validateForm(data)) {
        return;
    }
    
    // Mostrar loading
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    
    // Simular envio (substituir por chamada real da API)
    setTimeout(() => {
        // Resetar botão
        submitBtn.classList.remove('loading');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Mostrar mensagem de sucesso
        showMessage('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
        
        // Limpar formulário
        contactForm.reset();
        
    }, 2000);
}

function validateForm(data) {
    let isValid = true;
    
    // Validar nome
    if (!data.name || data.name.trim().length < 2) {
        showFieldError('name', 'Nome deve ter pelo menos 2 caracteres');
        isValid = false;
    }
    
    // Validar email
    if (!data.email || !isValidEmail(data.email)) {
        showFieldError('email', 'Digite um email válido');
        isValid = false;
    }
    
    // Validar mensagem
    if (!data.message || data.message.trim().length < 10) {
        showFieldError('message', 'Mensagem deve ter pelo menos 10 caracteres');
        isValid = false;
    }
    
    return isValid;
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    clearFieldError(e);
    
    switch (field.type) {
        case 'email':
            if (value && !isValidEmail(value)) {
                showFieldError(field.name, 'Email inválido');
            }
            break;
        case 'text':
            if (field.name === 'name' && value && value.length < 2) {
                showFieldError(field.name, 'Nome muito curto');
            }
            break;
        case 'textarea':
            if (value && value.length < 10) {
                showFieldError(field.name, 'Mensagem muito curta');
            }
            break;
    }
}

function clearFieldError(e) {
    const field = e.target;
    const errorElement = document.querySelector(`#${field.name}-error`);
    
    if (errorElement) {
        errorElement.remove();
    }
    
    field.style.borderColor = '';
}

function showFieldError(fieldName, message) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    
    if (field) {
        field.style.borderColor = '#ef4444';
        
        // Remover erro anterior se existir
        const existingError = document.querySelector(`#${fieldName}-error`);
        if (existingError) {
            existingError.remove();
        }
        
        // Criar novo elemento de erro
        const errorElement = document.createElement('div');
        errorElement.id = `${fieldName}-error`;
        errorElement.className = 'field-error';
        errorElement.style.color = '#ef4444';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '0.25rem';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(message, type = 'success') {
    // Remover mensagem anterior se existir
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Criar nova mensagem
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    // Inserir antes do formulário
    const formContainer = contactForm.parentNode;
    formContainer.insertBefore(messageElement, contactForm);
    
    // Remover mensagem após 5 segundos
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 5000);
    
    // Scroll para a mensagem
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Navegação e utilidades
function setupNavigation() {
    // Destacar seção atual na navegação
    updateActiveNavigation();
    
    // Hover effects nos cards
    setupCardHoverEffects();
}

function setupCardHoverEffects() {
    const cards = document.querySelectorAll('.service-card, .benefit-card, .value-card, .contact-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

// Utility functions
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Performance optimization
const debouncedScroll = debounce(handleScroll, 10);
window.removeEventListener('scroll', handleScroll);
window.addEventListener('scroll', debouncedScroll);

// Error handling
window.addEventListener('error', function(e) {
    console.error('Erro JavaScript:', e.error);
    // Em produção, você pode enviar erros para um serviço de monitoramento
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise rejeitada:', e.reason);
    e.preventDefault();
});

// Lazy loading para imagens (se necessário no futuro)
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        imageObserver.observe(img);
    });
}

// Acessibilidade
function setupAccessibility() {
    // Navegação por teclado
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenuOpen) {
            closeMobileMenu();
        }
    });
    
    // Focus management
    const focusableElements = document.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.style.outline = '2px solid #2563eb';
            this.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', function() {
            this.style.outline = '';
            this.style.outlineOffset = '';
        });
    });
}

// Inicializar acessibilidade
setupAccessibility();

// Service Worker (para cache futuro)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registrado'))
        //     .catch(error => console.log('SW falhou'));
    });
}