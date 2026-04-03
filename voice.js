// ===== MAX VOICE - LLAMADA EN TIEMPO REAL =====
// Sistema de conversación continua como llamada telefónica

class MaxVoiceCall {
  constructor(options = {}) {
    this.synthesis = window.speechSynthesis;
    this.recognition = null;
    this.isCallActive = false;
    this.isSpeaking = false;
    this.isListening = false;
    this.voice = null;
    this.onTranscript = options.onTranscript || null;
    this.onResponse = options.onResponse || null;
    this.onStatusChange = options.onStatusChange || null;
    this.getAIResponse = options.getAIResponse || null;
    
    // Configurar reconocimiento continuo
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true; // IMPORTANTE: continuo
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-MX';
      this.setupRecognition();
    }
    
    this.loadVoice();
  }
  
  loadVoice() {
    const voices = this.synthesis.getVoices();
    // Buscar mejor voz femenina en español
    this.voice = voices.find(v => v.lang.startsWith('es') && v.name.toLowerCase().includes('female')) ||
                  voices.find(v => v.lang.startsWith('es') && v.name.toLowerCase().includes('mujer')) ||
                  voices.find(v => v.lang === 'es-MX') ||
                  voices.find(v => v.lang.startsWith('es')) ||
                  voices[0];
    console.log('Voz seleccionada:', this.voice?.name, this.voice?.lang);
  }
  
  setupRecognition() {
    if (!this.recognition) return;
    
    let finalTranscript = '';
    let interimTranscript = '';
    let silenceTimer = null;
    
    this.recognition.onresult = (event) => {
      interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Mostrar texto interim
      if (this.onTranscript) {
        this.onTranscript(interimTranscript, false);
      }
      
      // Si hay texto final, procesar
      if (finalTranscript) {
        const text = finalTranscript.trim();
        finalTranscript = '';
        
        if (this.onTranscript) {
          this.onTranscript(text, true);
        }
        
        // Esperar un poco por más input, luego responder
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (this.isCallActive && !this.isSpeaking) {
            this.processInput(text);
          }
        }, 1000);
      }
    };
    
    this.recognition.onerror = (e) => {
      console.error('Recognition error:', e.error);
      if (e.error === 'no-speech') {
        // Continuar escuchando
        if (this.isCallActive && !this.isSpeaking) {
          this.startListening();
        }
      }
    };
    
    this.recognition.onend = () => {
      // Si la llamada sigue activa, reiniciar reconocimiento
      if (this.isCallActive && !this.isSpeaking) {
        this.startListening();
      }
    };
  }
  
  async processInput(text) {
    if (!text || text.length < 2) return;
    
    this.setStatus('thinking');
    
    // Obtener respuesta de la IA
    let response = '';
    if (this.getAIResponse) {
      response = await this.getAIResponse(text);
    }
    
    if (response) {
      await this.speak(response);
    }
    
    // Continuar escuchando después de hablar
    if (this.isCallActive) {
      this.startListening();
    }
  }
  
  speak(text) {
    return new Promise((resolve) => {
      if (!this.synthesis) {
        resolve();
        return;
      }
      
      this.synthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.voice;
      utterance.rate = 1;
      utterance.pitch = 1.1;
      utterance.lang = 'es-MX';
      
      utterance.onstart = () => {
        this.isSpeaking = true;
        this.setStatus('speaking');
      };
      
      utterance.onend = () => {
        this.isSpeaking = false;
        this.setStatus('listening');
        resolve();
      };
      
      utterance.onerror = () => {
        this.isSpeaking = false;
        this.setStatus('listening');
        resolve();
      };
      
      this.synthesis.speak(utterance);
    });
  }
  
  startListening() {
    if (!this.recognition || this.isSpeaking) return;
    
    try {
      this.isListening = true;
      this.setStatus('listening');
      this.recognition.start();
    } catch (e) {
      // Ya está corriendo, ignorar
      if (e.message.includes('already started')) return;
      console.error('Start listening error:', e);
    }
  }
  
  stopListening() {
    if (this.recognition) {
      this.isListening = false;
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }
  
  // INICIAR LLAMADA
  startCall() {
    if (this.isCallActive) return;
    
    this.isCallActive = true;
    this.setStatus('connecting');
    
    // Saludo inicial
    this.speak('¡Hola! Soy Max, tu asistente personal. ¿En qué puedo ayudarte?').then(() => {
      if (this.isCallActive) {
        this.startListening();
      }
    });
  }
  
  // TERMINAR LLAMADA
  endCall() {
    this.isCallActive = false;
    this.isSpeaking = false;
    this.isListening = false;
    
    this.synthesis.cancel();
    this.stopListening();
    
    this.setStatus('idle');
    
    this.speak('Hasta luego. ¡Que tengas un buen día!');
  }
  
  setStatus(status) {
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }
  
  isSupported() {
    return {
      synthesis: !!this.synthesis,
      recognition: !!this.recognition,
      both: !!this.synthesis && !!this.recognition
    };
  }
}

window.MaxVoiceCall = MaxVoiceCall;

// Cargar voces
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {};
}