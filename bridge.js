// ===== MAX DASHBOARD - REAL-TIME BRIDGE =====
// Sistema de comunicación con OpenClaw vía archivo JSON

class MaxBridge {
  constructor() {
    this.messageId = 0;
    this.pendingMessages = [];
    this.callbackId = 0;
    this.callbacks = {};
    this.isPolling = false;
    this.lastTimestamp = Date.now();
  }
  
  // Enviar mensaje a Max (vía archivo)
  async sendMessage(text) {
    const msgId = `msg_${Date.now()}_${++this.messageId}`;
    const messageFile = `chat_${msgId}.json`;
    
    try {
      // Guardar mensaje en archivo
      const response = await fetch('chat-api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          messageId: msgId,
          content: text,
          senderId: 'dashboard',
          senderName: 'Dashboard User',
          timestamp: Date.now()
        })
      });
      
      return { success: true, messageId: msgId };
    } catch (e) {
      console.error('Send error:', e);
      return { success: false, error: e.message };
    }
  }
  
  // Polling para respuestas
  async startPolling(onMessage) {
    this.isPolling = true;
    
    const poll = async () => {
      if (!this.isPolling) return;
      
      try {
        const response = await fetch(`data.json?t=${Date.now()}`);
        const data = await response.json();
        
        if (data.lastMessage && data.lastMessage.timestamp > this.lastTimestamp) {
          this.lastTimestamp = data.lastMessage.timestamp;
          onMessage(data.lastMessage);
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
      
      setTimeout(poll, 1000);
    };
    
    poll();
  }
  
  stopPolling() {
    this.isPolling = false;
  }
}

// Export para uso global
window.MaxBridge = MaxBridge;