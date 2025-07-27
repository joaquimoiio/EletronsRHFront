document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // Verificar se já está logado
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        window.location.href = 'dashboard.html';
        return;
    }

    loginForm.addEventListener('submit', handleLogin);

    function handleLogin(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Validação simples
        if (!username || !password) {
            showError('Por favor, preencha todos os campos');
            return;
        }

        // Credenciais de exemplo (em produção, seria validado no backend)
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminUsername', username);
            window.location.href = 'dashboard.html';
        } else {
            showError('Usuário ou senha incorretos');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    // Limpar erro quando usuário começar a digitar
    usernameInput.addEventListener('input', () => {
        errorMessage.classList.add('hidden');
    });

    passwordInput.addEventListener('input', () => {
        errorMessage.classList.add('hidden');
    });
});