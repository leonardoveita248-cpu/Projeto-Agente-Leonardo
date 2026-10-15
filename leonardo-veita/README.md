# 🍽️ Leonardo Veita - AI Food & Drink Concierge

Sistema Fullstack completo (Backend FastAPI + Frontend Web Moderno) integrado ao seu Agente de IA hospedado no **Azure AI Projects** (`leonardo-veita`).

---

## ✨ Funcionalidades

1. **Recomendação Inteligente baseada em Parâmetros**:
   - **Orçamento (R$)**: Seletores rápidos e campo customizado.
   - **Preferências**: Cards visuais com 1 clique (Japonês, Hambúrguer, Pizza, Carnes, Saudável, Café/Doces, Drinks) ou texto livre.
   - **Companhia**: Sozinho, Em dupla ou Em grupo (com contador de participantes).
   - **Localização (Opcional)**: Sugere automaticamente locais da sua cidade/bairro.

2. **Continuidade de Conversa Multi-Turn (Azure AI Sessions)**:
   - O agente recomenda até **3 opções** respeitando o orçamento e pessoas.
   - Pergunta se você deseja recomendações de **lugares próximos**.
   - Ao responder (ex: *"Sim, recomende lugares em Pinheiros"* ou clicando nos botões de sugestão rápida), o agente mantém a memória da sessão e traz restaurantes reais com links e faixas de preço!

3. **Design Premium & Moderno**:
   - Tema Dark com estética gastronômica sofisticada (tons âmbar, ouro e ardósia).
   - Glassmorphism, microanimações e renderização completa de Markdown.
   - Botões de ação contextual sugeridos automaticamente após cada resposta.

---

## 🚀 Como Executar

### Opção 1: Atalho Rápido (Windows)
Dê um duplo clique no arquivo:
```
iniciar.bat
```
Ele abrirá o navegador em `http://localhost:8000` e iniciará o servidor backend automaticamente.

---

### Opção 2: Linha de Comando (Terminal)
No diretório do projeto, execute:

```powershell
# Ativar o ambiente virtual e rodar o servidor
.venv\Scripts\python.exe server.py
```

Em seguida, acesse no seu navegador:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## 📁 Estrutura do Projeto

```
leonardo-veita/
│
├── agente.py          # Script original de conexão com Azure AI
├── server.py          # Backend FastAPI com endpoints REST e sessões Azure
├── iniciar.bat        # Inicializador 1-clique para Windows
├── README.md          # Documentação do projeto
│
└── static/            # Frontend Web (sem necessidade de build Node)
    ├── index.html     # Estrutura HTML5 semântica e acessível
    ├── style.css      # Design System CSS, Dark mode & Glassmorphism
    └── app.js         # Lógica reativa, chamadas de API e sugestões
```

---

## 🔌 Endpoints da API

- `GET /api/health`: Verifica status da conexão com o agente no Azure AI.
- `POST /api/recommend`: Envia os parâmetros iniciais (orçamento, preferência, pessoas, localização) e inicia a sessão.
- `POST /api/chat`: Envia mensagens de continuação na mesma sessão (`conversation_id`).
- `POST /api/new-conversation`: Cria uma nova sessão no Azure AI Copilot.
