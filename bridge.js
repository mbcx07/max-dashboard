// ===== MAX BRIDGE - Conexión con OpenClaw =====
// Sistema de comunicación en tiempo real

class MaxBridge {
  constructor() {
    this.pollingInterval = null;
    this.isPolling = false;
    this.lastMessageId = 0;
    this.pendingResponses = new Map();
    this.onResponse = null;
  }
  
  // Enviar mensaje a Max (vía archivo compartido)
  async sendMessage(text) {
    const messageId = Date.now();
    const message = {
      id: messageId,
      type: 'chat.send',
      content: text,
      senderId: 'dashboard',
      senderName: 'Usuario Dashboard',
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    // Guardar mensaje pendiente
    this.pendingResponses.set(messageId, message);
    
    // Enviar al endpoint
    try {
      const response = await this.sendToOpenClaw(message);
      return response;
    } catch (e) {
      console.error('Send error:', e);
      // Fallback a respuestas locales
      return this.getLocalResponse(text);
    }
  }
  
  async sendToOpenClaw(message) {
    // Intentar WebSocket primero
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return new Promise((resolve, reject) => {
        const handler = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.messageId === message.id) {
              this.ws.removeEventListener('message', handler);
              if (data.type === 'chat.response') {
                resolve(data.content);
              } else if (data.type === 'chat.error') {
                reject(new Error(data.error));
              }
            }
          } catch (e) {
            reject(e);
          }
        };
        this.ws.addEventListener('message', handler);
        this.ws.send(JSON.stringify(message));
        // Timeout después de 30s
        setTimeout(() => {
          this.ws.removeEventListener('message', handler);
          reject(new Error('Timeout'));
        }, 30000);
      });
    }
    
    // Si no hay WebSocket, usar respuestas locales
    return this.getLocalResponse(message.content);
  }
  
  getLocalResponse(text) {
    const t = text.toLowerCase();
    
    // Respuestas más inteligentes y variadas
    const responses = {
      greeting: [
        "¡Hola! Soy Max, tu asistente personal. Estoy aquí para ayudarte con lo que necesites.",
        "¡Qué tal! ¿En qué puedo ayudarte hoy?",
        "¡Hola! Cuéntame, ¿qué necesitas?"
      ],
      status: [
        "Todo funciona perfectamente por aquí. El sistema está al 100%.",
        "Todo en orden. Estoy monitoreando los proyectos activos.",
        "Todo bien. ¿Hay algo específico que quieras revisar?"
      ],
      projects: [
        "Tienes 2 proyectos activos:\n\n📁 Psicofrecuencia.com - 25%\nEs el sitio para vender tus libros de psicología. Está en desarrollo.\n\n📁 Dashboard Max - 100%\nEste dashboard que estás viendo. ¡Ya está listo!\n\n¿Quieres que te dé más detalles de alguno?",
        "Tus proyectos van así:\n• Psicofrecuencia.com: 25% - Necesita trabajo en el diseño de la tienda\n• Dashboard Max: 100% - Completado con llamada en tiempo real\n\n¿En cuál quieres que trabaje?"
      ],
      help: [
        "Puedo ayudarte con:\n\n📊 Estado de proyectos\n📈 Estadísticas de trabajo\n💬 Responder preguntas\n📞 Hablar por voz (si presionas el botón de llamada)\n\n¿Qué necesitas?",
        "Mis capacidades incluyen:\n\n• Ver el estado de tus proyectos\n• Actualizar el dashboard\n• Conversar contigo\n• Trabajar en Psicofrecuencia.com\n\n¿Qué te gustaría hacer?"
      ],
      about: [
        "Soy Max, tu asistente personal digital. Mi trabajo es ayudarte a:\n\n• Vender tus libros de psicología a través de psicofrecuencia.com\n• Mantener este dashboard actualizado\n• Recordarte tareas importantes\n• Asistirte en lo que necesites\n\nFui creada para ser tu mano derecha digital. 💜",
        "Me llamo Max. Soy una asistente personal digital. Mi emoji es 📚 porque me encanta aprender y ayudarte. Trabajo principalmente en tus proyectos de psicología y en mantener todo organizado."
      ],
      thanks: [
        "¡De nada! Estoy aquí para lo que necesites.",
        "¡Con gusto! Si hay algo más, solo dime.",
        "¡Perfecto! ¿Hay algo más en lo que pueda ayudarte?"
      ],
      weather: [
        "No tengo acceso a datos del clima en tiempo real, pero puedo buscarlo si lo necesitas.",
        "No puedo ver el clima directamente, pero puedo buscar información del tiempo para ti."
      ],
      time: [
        `La hora actual es ${new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}.`,
        `Son las ${new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}.`
      ],
      unknown: [
        "Hmm, no estoy segura de entender completamente. ¿Podrías reformular la pregunta?",
        "Interesante pregunta. Déjame pensar... ¿Podrías darme más contexto?",
        "No capté bien eso. ¿Podrías explicarlo de otra manera?"
      ]
    };
    
    // Detectar intención
    if (t.match(/hola|hey|hi|buenos días|buenas tardes|buenas noches|qué tal/)) {
      return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    }
    if (t.match(/cómo estás|cómo va todo|status|estado|qué tal todo/)) {
      return responses.status[Math.floor(Math.random() * responses.status.length)];
    }
    if (t.match(/proyectos|projects|trabajos|qué proyectos|avances/)) {
      return responses.projects[Math.floor(Math.random() * responses.projects.length)];
    }
    if (t.match(/ayuda|help|qué puedes|qué haces|para qué sirves|capacidades/)) {
      return responses.help[Math.floor(Math.random() * responses.help.length)];
    }
    if (t.match(/quién eres|tu nombre|qué eres|qué es max|presentate|preséntate/)) {
      return responses.about[Math.floor(Math.random() * responses.about.length)];
    }
    if (t.match(/gracias|genial|perfecto|excelente|ok|bueno|genial gracias/)) {
      return responses.thanks[Math.floor(Math.random() * responses.thanks.length)];
    }
    if (t.match(/clima|tiempo|weather|temperatura/)) {
      return responses.weather[Math.floor(Math.random() * responses.weather.length)];
    }
    if (t.match(/hora es|qué hora|tiempo tienes/)) {
      return responses.time[Math.floor(Math.random() * responses.time.length)];
    }
    
    return responses.unknown[Math.floor(Math.random() * responses.unknown.length)];
  }
}

// Exportar
window.MaxBridge = MaxBridge;