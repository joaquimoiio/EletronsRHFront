# Sistema RH - Frontend

## 🎨 Design e UX

### Paleta de Cores
- **🟡 Amarelo Principal:** `#d69e2e` - Botões, destaques, calls-to-action
- **⚪ Branco:** `#ffffff` - Fundos de cards, áreas de conteúdo
- **🔵 Azul Escuro:** `#1a365d` - Cabeçalhos, títulos, elementos de navegação
- **🌫️ Cinza Claro:** `#f8f9fa` - Fundo geral, áreas secundárias

### Tipografia
- **Fonte Principal:** Georgia (serif) - Elegante e profissional
- **Hierarquia:** Tamanhos bem definidos para melhor legibilidade
- **Peso:** Normal (400) e Medium (500) para contraste visual

### Filosofia de Design
- ✨ **Clean e Minimalista** - Foco no conteúdo essencial
- 📱 **Mobile First** - Responsivo em todos os dispositivos
- 🎯 **Usabilidade** - Interface intuitiva e fácil navegação
- 🚀 **Performance** - Carregamento rápido e otimizado

## 🚀 Funcionalidades

### 🌐 Área Pública

#### 🏠 Página Inicial (`publico/html/index.html`)
- **Hero Section** atrativa com call-to-action
- **Estatísticas em tempo real** (vagas, áreas, eventos)
- **Cards de features** com ícones e descrições
- **Modal de notificações** para receber alertas de vagas
- **Design responsivo** para todos os dispositivos

#### 💼 Lista de Vagas (`publico/html/vagas.html`)
- **Filtro por área** da empresa
- **Busca por texto** no título e descrição
- **Cards informativos** com área, data e descrição
- **Paginação automática** para grandes listas
- **Links diretos** para detalhes das vagas

#### 📋 Detalhes da Vaga (`publico/html/detalhesVaga.html`)
- **Breadcrumb navigation** para melhor UX
- **Informações completas** da vaga
- **Formulário de candidatura** com upload de PDF
- **Validação de arquivos** (tipo e tamanho)
- **Feedback visual** de sucesso/erro

#### 🎉 Lista de Eventos (`publico/html/eventos.html`)
- **Grid responsivo** de eventos
- **Imagens de capa** chamativas
- **Informações resumidas** com data
- **Hover effects** para melhor interação

#### 🖼️ Detalhes do Evento (`publico/html/detalhesEvento.html`)
- **Galeria de imagens** com modal
- **Descrição completa** formatada
- **Design imersivo** com foco visual
- **Navegação intuitiva** entre imagens

### 👨‍💼 Área Administrativa

#### 🔐 Login Administrativo (`admin/html/login.html`)
- **Design elegante** com gradiente
- **Validação em tempo real** dos campos
- **Feedback de erros** contextual
- **Autenticação simples** (admin/admin123)

#### 📊 Dashboard (`admin/html/dashboard.html`)
- **Estatísticas visuais** com contadores animados
- **Cards de navegação** para cada seção
- **Design profissional** com hierarquia clara
- **Logout seguro** com confirmação

#### 🏢 Gestão de Áreas (`admin/html/areas.html`)
- **CRUD completo** (Create, Read, Update, Delete)
- **Modal de edição** inline
- **Validação de duplicidade** 
- **Confirmação de exclusão** para segurança
- **Contador dinâmico** de áreas

#### 💼 Gestão de Vagas (`admin/html/vagas.html`)
- **Formulário intuitivo** de criação
- **Lista organizada** com filtros por status
- **Ações rápidas** (inativar, contratar, excluir)
- **Status visuais** com cores significativas
- **Link direto** para edição detalhada

#### ✏️ Edição de Vagas (`admin/html/editarVaga.html`)
- **Formulário completo** de edição
- **Seção de candidatos** com filtro por nome
- **Download de currículos** em PDF
- **Informações da vaga** em sidebar
- **Navegação contextual**

#### 🎉 Gestão de Eventos (`admin/html/eventos.html`)
- **Upload de imagem de capa**
- **Grid visual** dos eventos
- **Ações de edição e exclusão**
- **Preview das imagens**

#### 🖼️ Edição de Eventos (`admin/html/editarEvento.html`)
- **Editor de descrição** rico
- **Galeria de imagens** gerenciável
- **Upload múltiplo** de fotos
- **Organização visual** do conteúdo

## 🛠️ Tecnologias e Recursos

### Tecnologias Utilizadas
- **HTML5** - Estrutura semântica moderna
- **CSS3** - Estilização avançada com Flexbox/Grid
- **JavaScript ES6+** - Interatividade e manipulação DOM
- **Fetch API** - Comunicação com backend
- **File API** - Upload de arquivos
- **LocalStorage** - Persistência de sessão

### Recursos Implementados
- ✅ **Responsividade total** para mobile/tablet/desktop
- ✅ **Upload de arquivos** com validação
- ✅ **Filtros dinâmicos** e busca em tempo real
- ✅ **Modais interativos** para edição
- ✅ **Animações CSS** suaves e profissionais
- ✅ **Validação de formulários** client-side
- ✅ **Feedback visual** para todas as ações
- ✅ **Loading states** durante requisições
- ✅ **Error handling** completo
- ✅ **Navegação breadcrumb** contextual

## 🔗 Integração com Backend

### Base URL da API
```javascript
const API_BASE_URL = 'http://localhost:8080';
```

### Endpoints Principais
- `GET /api/areas` - Listar áreas
- `GET /api/vagas/ativas` - Vagas ativas
- `POST /api/candidaturas` - Enviar candidatura
- `GET /api/eventos` - Listar eventos

### Estrutura de Requisições
```javascript
// Exemplo de requisição GET
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error('Erro na requisição');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

// Exemplo de upload de arquivo
async function uploadFile(formData) {
    try {
        const response = await fetch('/api/candidaturas', {
            method: 'POST',
            body: formData // FormData com arquivo
        });
        return await response.json();
    } catch (error) {
        console.error('Erro no upload:', error);
        throw error;
    }
}
```

## 📱 Responsividade

### Breakpoints
```css
/* Mobile First */
/* Base: 320px+ */

/* Tablet */
@media (max-width: 768px) {
    .grid { grid-template-columns: 1fr; }
    .nav { flex-direction: column; }
}

/* Desktop */
@media (min-width: 1024px) {
    .container { max-width: 1200px; }
    .grid { grid-template-columns: repeat(3, 1fr); }
}
```

### Componentes Responsivos
- **Navigation** - Colapsa em mobile
- **Cards** - Stack verticalmente
- **Forms** - Campos se expandem
- **Tables** - Scroll horizontal
- **Modals** - Ocupam tela completa

## 🎯 Guia de Uso

### 1. Configuração Inicial

#### Clonar/Baixar Arquivos
```bash
# Estrutura de pastas deve ser mantida
frontend/
├── admin/
└── publico/
```

#### Configurar URL do Backend
Editar em cada arquivo JS:
```javascript
const API_BASE_URL = 'http://localhost:8080'; // Alterar se necessário
```

### 2. Executar Localmente

#### Servidor Local Simples
```bash
# Usando Python
python -m http.server 8000

# Usando Node.js
npx serve .

# Usando PHP
php -S localhost:8000
```

#### Acessar Aplicação
- **Público:** `http://localhost:8000/publico/html/index.html`
- **Admin:** `http://localhost:8000/admin/html/login.html`

### 3. Deploy em Produção

#### Nginx
```nginx
server {
    listen 80;
    server_name rh.empresa.com;
    root /var/www/sistema-rh-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /publico/html/index.html;
    }

    location /admin {
        try_files $uri $uri/ /admin/html/login.html;
    }

    # Cache para assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache
```apache
<VirtualHost *:80>
    ServerName rh.empresa.com
    DocumentRoot /var/www/sistema-rh-frontend
    
    <Directory /var/www/sistema-rh-frontend>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

## 🔧 Personalização

### Alterar Cores
Editar variáveis CSS em cada arquivo:
```css
:root {
    --primary-color: #d69e2e;    /* Amarelo principal */
    --secondary-color: #1a365d;  /* Azul escuro */
    --background-color: #f8f9fa;  /* Cinza claro */
    --text-color: #2d3748;       /* Texto principal */
}
```

### Adicionar Novas Páginas
1. Criar HTML na pasta apropriada
2. Criar CSS específico
3. Criar JS para interatividade
4. Seguir padrão de nomenclatura

### Modificar Layout
- **Grid CSS** para layouts complexos
- **Flexbox** para alinhamentos
- **Media queries** para responsividade

## 🧪 Testes e Validação

### Testes Manuais
- ✅ Testar em Chrome, Firefox, Safari, Edge
- ✅ Validar responsividade em diferentes tamanhos
- ✅ Verificar upload de arquivos
- ✅ Testar todos os formulários
- ✅ Validar navegação entre páginas

### Ferramentas de Validação
- **HTML:** [W3C Markup Validator](https://validator.w3.org/)
- **CSS:** [CSS Validator](https://jigsaw.w3.org/css-validator/)
- **Acessibilidade:** [WAVE](https://wave.webaim.org/)
- **Performance:** [PageSpeed Insights](https://pagespeed.web.dev/)

### Performance
- **Otimização de imagens** - WebP quando possível
- **Minificação CSS/JS** - Para produção
- **Lazy loading** - Para conteúdo não crítico
- **Cache headers** - Para assets estáticos

## 🔒 Segurança Frontend

### Validações Implementadas
- ✅ **Sanitização de inputs** antes de exibir
- ✅ **Validação de tipos de arquivo** no upload
- ✅ **Verificação de tamanho** de arquivos
- ✅ **Escape de HTML** em conteúdo dinâmico
- ✅ **Timeout de sessão** administrativa

### Boas Práticas
```javascript
// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Validar upload de arquivo
function validateFile(file) {
    const allowedTypes = ['application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido');
    }
    
    if (file.size > maxSize) {
        throw new Error('Arquivo muito grande');
    }
}
```

## 📞 Suporte e Manutenção

### Debugging
- **Console do navegador** para erros JavaScript
- **Network tab** para verificar requisições
- **Responsive design mode** para testar mobile

### Logs de Frontend
```javascript
// Configurar logging em produção
const DEBUG = false; // Alterar para false em produção

function log(message, type = 'info') {
    if (DEBUG || type === 'error') {
        console[type](message);
    }
}
```

### Atualizações
- **Versioning** de arquivos CSS/JS
- **Cache busting** em atualizações
- **Backup** antes de alterações

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

**🎨 Interface desenvolvida com foco na experiência do usuário**

**👥 Contribuições são bem-vindas!**