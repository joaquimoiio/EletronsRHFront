document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('.login-btn');

    // Verificar se já está logado
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        window.location.href = 'areas.html';
        return;
    }

    // Configurar eventos
    setupEventListeners();

    function setupEventListeners() {
        loginForm.addEventListener('submit', handleLogin);
        
        // Limpar erro quando usuário começar a digitar
        usernameInput.addEventListener('input', clearError);
        passwordInput.addEventListener('input', clearError);
        
        // Foco automático no campo usuário
        usernameInput.focus();
    }

    async function handleLogin(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Validação simples
        if (!username || !password) {
            showError('Por favor, preencha todos os campos');
            return;
        }

        // Mostrar loading
        loginBtn.disabled = true;
        clearError();

        try {
            // Simular delay de rede
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Credenciais de exemplo (em produção, seria validado no backend)
            if (username === 'admin' && password === 'admin123') {
                // Login bem-sucedido
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminUsername', username);
                
                // Feedback visual de sucesso
                loginBtn.style.background = 'linear-gradient(135deg, #38a169, #2f855a)';
                loginBtn.innerHTML = '<span>✓ Login realizado!</span>';
                
                // Redirecionar após um breve delay
                setTimeout(() => {
                    window.location.href = 'areas.html';
                }, 500);
                
            } else {
                // Login falhou
                showError('Usuário ou senha incorretos');
                passwordInput.value = '';
                passwordInput.focus();
                
                // Adicionar efeito de shake no container
                document.querySelector('.login-container').style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    document.querySelector('.login-container').style.animation = '';
                }, 500);
            }
        } catch (error) {
            console.error('Erro no login:', error);
            showError('Erro interno. Tente novamente.');
        } finally {
            loginBtn.disabled = false;
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        
        // Auto-hide após 5 segundos
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    function clearError() {
        errorMessage.classList.add('hidden');
    }

    // Adicionar animação de shake
    const shakeKeyframes = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = shakeKeyframes;
    document.head.appendChild(style);

    // Adicionar suporte a Enter nos campos
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });

    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
});