// Leonardo Veita Food & Drink AI Concierge - Frontend Application
document.addEventListener('DOMContentLoaded', () => {
  // State
  let state = {
    conversationId: null,
    budget: 50,
    preference: 'Comida Japonesa / Sushi',
    partyType: 'alone', // 'alone', 'couple', 'group'
    partySize: 1,
    location: '',
    isLoading: false,
  };

  // DOM Elements
  const agentStatusBadge = document.getElementById('agentStatusBadge');
  const agentStatusText = document.getElementById('agentStatusText');
  const sessionIdDisplay = document.getElementById('sessionIdDisplay');
  const btnNewChat = document.getElementById('btnNewChat');

  const budgetInput = document.getElementById('budgetInput');
  const budgetValueDisplay = document.getElementById('budgetValueDisplay');
  const budgetChips = document.querySelectorAll('#budgetChips .chip');

  const prefCards = document.querySelectorAll('#prefGrid .pref-card');
  const customPrefInput = document.getElementById('customPrefInput');

  const partySegBtns = document.querySelectorAll('#partySegmented .seg-btn');
  const groupCounterRow = document.getElementById('groupCounterRow');
  const partyNumDisplay = document.getElementById('partyNumDisplay');
  const btnMinusParty = document.getElementById('btnMinusParty');
  const btnPlusParty = document.getElementById('btnPlusParty');

  const locationInput = document.getElementById('locationInput');
  const btnAutoLocation = document.getElementById('btnAutoLocation');

  const recommendForm = document.getElementById('recommendForm');
  const btnSubmitRecommend = document.getElementById('btnSubmitRecommend');

  const chatBody = document.getElementById('chatBody');
  const welcomeCard = document.getElementById('welcomeCard');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const btnSendMessage = document.getElementById('btnSendMessage');
  const typingIndicator = document.getElementById('typingIndicator');

  const quickSuggestionsBar = document.getElementById('quickSuggestionsBar');
  const suggestionsContainer = document.getElementById('suggestionsContainer');

  // 1. Health Check
  async function checkAgentHealth() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.connected) {
        agentStatusBadge.classList.add('connected');
        agentStatusText.textContent = `Online (${data.agent_name})`;
      } else {
        agentStatusText.textContent = 'Azure Offline';
      }
    } catch (err) {
      console.warn('Erro ao verificar status do agente:', err);
      agentStatusText.textContent = 'Servidor Local';
    }
  }

  // 2. Budget Controls
  function updateBudget(val) {
    const num = Math.max(5, Math.min(5000, Number(val) || 50));
    state.budget = num;
    budgetInput.value = num;
    budgetValueDisplay.textContent = `R$ ${num.toFixed(2).replace('.', ',')}`;

    // Highlight matching chip if any
    budgetChips.forEach(chip => {
      chip.classList.toggle('active', Number(chip.dataset.budget) === num);
    });
  }

  budgetInput.addEventListener('input', (e) => updateBudget(e.target.value));

  budgetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      updateBudget(Number(chip.dataset.budget));
    });
  });

  // 3. Preference Controls
  prefCards.forEach(card => {
    card.addEventListener('click', () => {
      prefCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.preference = card.dataset.pref;
      customPrefInput.value = '';
    });
  });

  customPrefInput.addEventListener('input', (e) => {
    if (e.target.value.trim()) {
      prefCards.forEach(c => c.classList.remove('active'));
      state.preference = e.target.value.trim();
    } else {
      // Re-select first card
      prefCards[0].classList.add('active');
      state.preference = prefCards[0].dataset.pref;
    }
  });

  // 4. Party Size Controls
  partySegBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      partySegBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const party = btn.dataset.party;
      state.partyType = party;

      if (party === 'alone') {
        state.partySize = 1;
        groupCounterRow.style.display = 'none';
      } else if (party === 'couple') {
        state.partySize = 2;
        groupCounterRow.style.display = 'none';
      } else if (party === 'group') {
        state.partySize = Math.max(3, state.partySize);
        partyNumDisplay.textContent = state.partySize;
        groupCounterRow.style.display = 'flex';
      }
    });
  });

  btnMinusParty.addEventListener('click', () => {
    if (state.partySize > 3) {
      state.partySize--;
      partyNumDisplay.textContent = state.partySize;
    }
  });

  btnPlusParty.addEventListener('click', () => {
    if (state.partySize < 50) {
      state.partySize++;
      partyNumDisplay.textContent = state.partySize;
    }
  });

  // 5. Location Auto-detect
  btnAutoLocation.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada no seu navegador.');
      return;
    }

    btnAutoLocation.textContent = '⏳ Localizando...';
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const geo = await res.json();
          const address = geo.address || {};
          const locStr = [
            address.suburb || address.neighbourhood || address.quarter,
            address.city || address.town,
            address.state
          ].filter(Boolean).join(', ');

          locationInput.value = locStr || `Lat ${lat.toFixed(3)}, Lon ${lon.toFixed(3)}`;
          state.location = locationInput.value;
        } catch {
          locationInput.value = 'Minha localização atual';
          state.location = locationInput.value;
        } finally {
          btnAutoLocation.textContent = '📍 Usar minha localização';
        }
      },
      () => {
        btnAutoLocation.textContent = '📍 Usar minha localização';
        alert('Não foi possível obter sua localização. Digite sua cidade/bairro no campo.');
      }
    );
  });

  locationInput.addEventListener('input', (e) => {
    state.location = e.target.value.trim();
  });

  // 6. UI Helpers
  function setSessionId(id) {
    state.conversationId = id;
    if (id) {
      const shortId = id.length > 16 ? `${id.slice(0, 10)}...${id.slice(-4)}` : id;
      sessionIdDisplay.textContent = shortId;
      sessionIdDisplay.title = id;
    } else {
      sessionIdDisplay.textContent = 'Nova';
    }
  }

  function setLoading(loading, text = 'Consultando o agente Leonardo Veita no Azure...') {
    state.isLoading = loading;
    btnSubmitRecommend.disabled = loading;
    btnSendMessage.disabled = loading;
    chatInput.disabled = loading;

    if (loading) {
      typingIndicator.querySelector('.typing-text').textContent = text;
      typingIndicator.style.display = 'flex';
      quickSuggestionsBar.style.display = 'none';
    } else {
      typingIndicator.style.display = 'none';
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      chatBody.scrollTop = chatBody.scrollHeight;
    }, 50);
  }

  function renderMarkdown(content) {
    if (window.marked && typeof window.marked.parse === 'function') {
      return window.marked.parse(content);
    }
    // Fallback simple markdown renderer
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  function appendMessage(role, content) {
    if (welcomeCard) {
      welcomeCard.style.display = 'none';
    }

    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${role === 'user' ? 'user-message' : 'agent-message'}`;

    const avatarEl = document.createElement('div');
    avatarEl.className = 'msg-avatar';
    avatarEl.innerHTML = role === 'user' ? '👤' : '🍽️';

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'msg-bubble';

    if (role === 'user') {
      bubbleEl.textContent = content;
    } else {
      bubbleEl.innerHTML = renderMarkdown(content);
    }

    msgEl.appendChild(avatarEl);
    msgEl.appendChild(bubbleEl);
    chatBody.appendChild(msgEl);

    scrollToBottom();
  }

  // 7. Dynamic Suggestion Chips
  function updateSuggestions(agentReply) {
    suggestionsContainer.innerHTML = '';
    const lower = agentReply.toLowerCase();
    const suggestions = [];

    // If agent asks about nearby places or neighborhood
    if (
      lower.includes('lugar') ||
      lower.includes('próximo') ||
      lower.includes('proximo') ||
      lower.includes('bairro') ||
      lower.includes('cidade') ||
      lower.includes('onde comprar')
    ) {
      const loc = locationInput.value.trim();
      if (loc) {
        suggestions.push(`📍 Sim, me recomende lugares em ${loc}!`);
      } else {
        suggestions.push('📍 Sim! Recomende lugares próximos de mim');
        suggestions.push('🗺️ Na região da Av. Paulista em São Paulo');
      }
    }

    // Cost-benefit and alternatives
    suggestions.push('💰 Quero opções mais baratas');
    suggestions.push('⭐ Lugares com melhor custo-benefício');
    suggestions.push('🔄 Quero ver outras 3 opções');

    suggestions.forEach(text => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'suggestion-chip';
      chip.textContent = text;
      chip.addEventListener('click', () => {
        handleUserMessage(text);
      });
      suggestionsContainer.appendChild(chip);
    });

    quickSuggestionsBar.style.display = 'flex';
    scrollToBottom();
  }

  // 8. Submit Initial Recommendations
  btnSubmitRecommend.addEventListener('click', async () => {
    if (state.isLoading) return;

    const currentLoc = locationInput.value.trim();
    state.location = currentLoc;

    const userSummary = `Orçamento de R$ ${state.budget}, comida/bebida: ${state.preference}, ` +
      (state.partyType === 'alone' ? 'sozinho' : state.partyType === 'couple' ? 'em casal (2 pessoas)' : `em grupo (${state.partySize} pessoas)`) +
      (currentLoc ? ` em ${currentLoc}` : '');

    appendMessage('user', userSummary);
    setLoading(true, 'Buscando até 3 recomendações perfeitas no Azure AI...');

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: state.budget,
          preference: state.preference,
          party_type: state.partyType,
          party_size: state.partySize,
          location: currentLoc,
          conversation_id: state.conversationId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro HTTP ${res.status}`);
      }

      const data = await res.json();
      setSessionId(data.conversation_id);
      appendMessage('agent', data.reply);
      updateSuggestions(data.reply);
    } catch (err) {
      console.error(err);
      appendMessage('agent', `⚠️ **Desculpe, ocorreu um erro ao consultar o agente no Azure:**\n\n${err.message}`);
    } finally {
      setLoading(false);
    }
  });

  // 9. Send Chat Follow-up Message
  async function handleUserMessage(text) {
    const msg = (text || chatInput.value).trim();
    if (!msg || state.isLoading) return;

    chatInput.value = '';
    appendMessage('user', msg);
    setLoading(true, 'Leonardo Veita está processando sua resposta...');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          conversation_id: state.conversationId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro HTTP ${res.status}`);
      }

      const data = await res.json();
      setSessionId(data.conversation_id);
      appendMessage('agent', data.reply);
      updateSuggestions(data.reply);
    } catch (err) {
      console.error(err);
      appendMessage('agent', `⚠️ **Desculpe, erro na comunicação com o Azure:**\n\n${err.message}`);
    } finally {
      setLoading(false);
      chatInput.focus();
    }
  }

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUserMessage();
  });

  // 10. New Conversation Button
  btnNewChat.addEventListener('click', async () => {
    if (confirm('Deseja iniciar uma nova conversa e limpar o histórico atual?')) {
      setSessionId(null);
      chatBody.innerHTML = '';
      if (welcomeCard) {
        chatBody.appendChild(welcomeCard);
        welcomeCard.style.display = 'block';
      }
      quickSuggestionsBar.style.display = 'none';
      chatInput.value = '';
    }
  });

  // Initial Check
  checkAgentHealth();
});
