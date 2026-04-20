// ===== MAX APP v3 - Dashboard Principal =====

// Profile Management
const PROFILES = {
  moises: { name: 'Moisés', emoji: '📚', color: '#34d399' },
  luisana: { name: 'Luisana', emoji: '👩‍🍳', color: '#fbbf24' },
  valentina: { name: 'Valentina', emoji: '🦄', color: '#ff6bb5' },
  amelia: { name: 'Amelia', emoji: '🎮', color: '#a855f7' }
};

let currentProfile = localStorage.getItem('maxProfile') || 'moises';
let chatHistory = JSON.parse(localStorage.getItem('maxChatHistory') || '[]');
let bridge = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initBridge();
  loadProfile();
  renderMessages();
  initEmojis();
  initInput();
});

function initBridge() {
  if (typeof MaxBridge !== 'undefined') {
    bridge = new MaxBridge();
  }
}

function loadProfile() {
  const profile = PROFILES[currentProfile];
  if (!profile) { currentProfile = 'moises'; }
  
  document.getElementById('profileScreen').classList.add('hidden');
  document.getElementById('appContainer').classList.add('active');
  
  const p = PROFILES[currentProfile];
  document.getElementById('headerEmoji').textContent = p.emoji;
  document.getElementById('profileNameSetting').textContent = p.name;
  
  localStorage.setItem('maxProfile', currentProfile);
}

function handleProfileClick(profile, emoji) {
  currentProfile = profile;
  loadProfile();
  // Welcome is handled by index.html overlay for personalized messages
}

function switchProfile() {
  hideSettings();
  document.getElementById('profileScreen').classList.remove('hidden');
  document.getElementById('appContainer').classList.remove('active');
}

// ===== MESSAGES =====
function renderMessages() {
  const container = document.getElementById('chatMessages');
  if (chatHistory.length === 0) {
    addMaxMessage(`¡Hola! Soy Max, tu asistente personal. 📚\n\nPuedo ayudarte con:\n• 📋 Correspondencia IMSS (nuevo módulo)\n• 📊 Estado de tus proyectos\n• 💬 Conversar contigo\n\nPresiona 📋 en el header para ir al módulo de Correspondencia.`);
    return;
  }
  container.innerHTML = '';
  chatHistory.forEach(msg => {
    const div = document.createElement('div');
    div.className = `message ${msg.from === 'user' ? 'from-user' : 'from-max'} fade-in`;
    const time = new Date(msg.time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `<span class="message-text">${formatMsg(msg.text)}</span>
      <span class="message-meta"><span class="message-time">${time}</span>${msg.from === 'user' ? '<span class="check-mark">✓✓</span>' : ''}</span>`;
    container.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;
}

function formatMsg(text) {
  return text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function addMaxMessage(text) {
  chatHistory.push({ from: 'max', text, time: Date.now() });
  saveChat();
  renderMessages();
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  
  chatHistory.push({ from: 'user', text, time: Date.now() });
  input.value = '';
  input.style.height = 'auto';
  renderMessages();
  
  // Get response
  if (bridge) {
    bridge.getLocalResponse(text).then(response => {
      chatHistory.push({ from: 'max', text: response, time: Date.now() });
      saveChat();
      renderMessages();
    });
  } else {
    setTimeout(() => {
      const responses = [
        "Interesante pregunta. Déjame pensar... 🤔",
        "Entendido. ¿Necesitas algo más?",
        "¡Claro! Estoy procesando tu solicitud.",
        "Hmm, eso es algo en lo que puedo ayudarte. ¿Quieres más detalles?"
      ];
      addMaxMessage(responses[Math.floor(Math.random() * responses.length)]);
    }, 1000);
  }
}

function saveChat() {
  localStorage.setItem('maxChatHistory', JSON.stringify(chatHistory.slice(-100)));
}

// ===== INPUT =====
function initInput() {
  const input = document.getElementById('chatInput');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 90) + 'px';
  });
}

// ===== EMOJIS =====
function initEmojis() {
  const emojis = ['😀','😂','🥰','😎','🤔','👍','❤️','🔥','🎉','💯','📚','💻','🌙','☀️','🎵','🍕','⚽','🎬','✅','👋','🙏','💪','🤝','💡','📋','🏥','📊','🔔'];
  const grid = document.getElementById('emojiGrid');
  if (!grid) return;
  emojis.forEach(e => {
    const span = document.createElement('span');
    span.className = 'emoji-item';
    span.textContent = e;
    span.onclick = () => {
      document.getElementById('chatInput').value += e;
      toggleEmojiPicker();
    };
    grid.appendChild(span);
  });
}

function toggleEmojiPicker() {
  document.getElementById('emojiPicker').classList.toggle('show');
}

// ===== SETTINGS =====
function showSettings() {
  document.getElementById('settingsModal').classList.add('show');
}

function hideSettings() {
  document.getElementById('settingsModal').classList.remove('show');
}

function clearChat() {
  if (confirm('¿Borrar todos los mensajes?')) {
    chatHistory = [];
    saveChat();
    renderMessages();
    hideSettings();
  }
}

function showAvatarPicker() {
  hideSettings();
  const picker = document.getElementById('avatarPicker');
  const emojis = ['📚','👩‍🍳','👩‍🎨','🎮','🤖','👨‍💻','🌟','🔥','💡','🎵','🐱','🦊','🐼','🦁','🐸','🦄','🐺','🦋','🌺','🍀','🎯','⚔️','🎸','🚀','💎','🌙'];
  picker.innerHTML = emojis.map(e => 
    `<div class="avatar-option" onclick="setAvatar('${e}')">${e}</div>`
  ).join('');
  document.getElementById('avatarModal').classList.add('show');
}

function setAvatar(emoji) {
  document.getElementById('headerEmoji').textContent = emoji;
  hideAvatarPicker();
}

function hideAvatarPicker() {
  document.getElementById('avatarModal').classList.remove('show');
}

function showWallpaperPicker() {
  hideSettings();
  document.getElementById('wallpaperModal').classList.add('show');
}

function hideWallpaperPicker() {
  document.getElementById('wallpaperModal').classList.remove('show');
}

function uploadAvatar() {
  document.getElementById('avatarUpload').click();
}

function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById('headerEmoji').innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    hideAvatarPicker();
  };
  reader.readAsDataURL(file);
}

function attachFile() {
  document.getElementById('fileInput').click();
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('fileName').textContent = file.name;
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById('previewImage').src = ev.target.result;
      document.getElementById('previewImage').style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    document.getElementById('previewImage').style.display = 'none';
  }
  document.getElementById('filePreview').classList.add('show');
}

function cancelFile() {
  document.getElementById('filePreview').classList.remove('show');
  document.getElementById('fileInput').value = '';
}

function sendFile() {
  cancelFile();
  addMaxMessage("Adjunto recibido. 📎 Lo revisaré y te confirmo.");
}

// ===== VOICE =====
function startVoiceCall() {
  document.getElementById('callModal').classList.add('show');
}

function endCall() {
  document.getElementById('callModal').classList.remove('show');
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'settingsModal') hideSettings();
  if (e.target.id === 'avatarModal') hideAvatarPicker();
  if (e.target.id === 'wallpaperModal') hideWallpaperPicker();
});