document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    checkAuth();
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar eventos
    loadEventos();
});

let eventos = [];

function checkAuth() {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
}

function setupEventListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Formulário de novo evento
    document.getElementById('evento-form').addEventListener('submit', handleCreateEvento);
}

function handleLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUsername');
        window.location.href = 'login.html';
    }
}

async function loadEventos() {
    try {
        showLoading(true);
        const response = await fetch('/api/eventos');
        
        if (!response.ok) {
            throw new Error('Erro ao carregar eventos');
        }
        
        eventos = await response.json();
        displayEventos();
        updateCounter();
        
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showMessage('Erro ao carregar eventos. Tente novamente.', 'error');
        showEmptyState();
    } finally {
        showLoading(false);
    }
}

function displayEventos() {
    const eventosGrid = document.getElementById('eventos-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (eventos.length === 0) {
        showEmptyState();
        return;
    }
    
    eventosGrid.innerHTML = '';
    
    eventos.forEach(evento => {
        const eventoCard = createEventoCard(evento);
        eventosGrid.appendChild(eventoCard);
    });
    
    eventosGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');
}

function createEventoCard(evento) {
    const card = document.createElement('div');
    card.className = 'evento-card';
    
    const description = evento.descricao || 'Sem descrição disponível';
    const truncatedDescription = truncateText(description, 100);
    
    // Determinar imagem
    let imagemHtml;
    if (evento.imagemCapa) {
        imagemHtml = `<img src="/uploads/${evento.imagemCapa}" alt="${escapeHtml(evento.titulo)}" class="evento-image">`;
    } else {
        imagemHtml = `<div class="placeholder-image">🎉</div>`;
    }
    
    card.innerHTML = `
        ${imagemHtml}
        <div class="evento-content">
            <div class="evento-header">
                <h3 class="evento-title">${escapeHtml(evento.titulo)}</h3>
                <span class="evento-date">${formatDate(evento.dataCriacao)}</span>
            </div>
            <p class="evento-description">${escapeHtml(truncatedDescription)}</p>
            <div class="evento-actions">
                <a href="editarEvento.html?id=${evento.id}" class="action-btn edit-btn">Editar</a>
                <a href="../../publico/html/detalhesEvento.html?id=${evento.id}" target="_blank" class="action-btn view-btn">Visualizar</a>
                <button class="action-btn delete-btn" onclick="deleteEvento(${evento.id})">Excluir</button>
            </div>
        </div>
    `;
    
    return card;
}

async function handleCreateEvento(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const titulo = formData.get('titulo').trim();
    const imagemCapa = formData.get('imagemCapa');
    
    if (!titulo) {
        showMessage('Por favor, informe o título do evento.', 'error');
        return;
    }
    
    try {
        const eventoFormData = new FormData();
        eventoFormData.append('titulo', titulo);
        
        if (imagemCapa && imagemCapa.size > 0) {
            // Validar arquivo
            if (!imagemCapa.type.startsWith('image/')) {
                showMessage('Por favor, envie apenas arquivos de imagem.', 'error');
                return;
            }
            
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (imagemCapa.size > maxSize) {
                showMessage('A imagem deve ter no máximo 5MB.', 'error');
                return;
            }
            
            eventoFormData.append('imagemCapa', imagemCapa);
        }
        
        const response = await fetch('/api/eventos', {
            method: 'POST',
            body: eventoFormData
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || 'Erro ao criar evento');
        }
        
        const newEvento = await response.json();
        eventos.unshift(newEvento);
        
        showMessage('Evento criado com sucesso!', 'success');
        e.target.reset();
        displayEventos();
        updateCounter();
        
        // Redirecionar para edição após 2 segundos
        setTimeout(() => {
            window.location.href = `editarEvento.html?id=${newEvento.id}`;
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao criar evento:', error);
        showMessage(error.message || 'Erro ao criar evento. Tente novamente.', 'error');
    }
}

async function deleteEvento(eventoId) {
    const evento = eventos.find(e => e.id === eventoId);
    if (!evento) return;
    
    if (!confirm(`Tem certeza que deseja excluir o evento "${evento.titulo}"?\n\nEsta ação não pode ser desfeita e todas as imagens do evento também serão excluídas.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/eventos/${eventoId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || 'Erro ao excluir evento');
        }
        
        eventos = eventos.filter(e => e.id !== eventoId);
        
        showMessage('Evento excluído com sucesso!', 'success');
        displayEventos();
        updateCounter();
        
    } catch (error) {
        console.error('Erro ao excluir evento:', error);
        showMessage(error.message || 'Erro ao excluir evento. Tente novamente.', 'error');
    }
}

function showEmptyState() {
    document.getElementById('eventos-grid').classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function updateCounter() {
    document.getElementById('total-eventos').textContent = eventos.length;
}

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type}`;
    message.classList.remove('hidden');
    
    setTimeout(() => {
        message.classList.add('hidden');
    }, 5000);
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text || '';
    }
    return text.substring(0, maxLength) + '...';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}