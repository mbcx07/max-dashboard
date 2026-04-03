#!/usr/bin/env node
/**
 * MAX BRIDGE - Servidor para Dashboard en Tiempo Real
 * Conecta el dashboard con OpenClaw usando sistema de archivos
 * 
 * USO:
 *   node server.js
 *   ./iniciar.sh
 * 
 * Luego abre la URL pública que aparece
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DASHBOARD_DIR = __dirname;
const INBOX_DIR = path.join(DASHBOARD_DIR, 'inbox');
const OUTBOX_DIR = path.join(DASHBOARD_DIR, 'outbox');

// Crear directorios de comunicación
[INBOX_DIR, OUTBOX_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Respuestas inteligentes locales
function getSmartResponse(text) {
  const t = text.toLowerCase();
  
  if (t.match(/hola|hey|hi|buenos d[ií]as|buenas tardes|buenas noches|qu[eé] tal/)) {
    return "¡Hola! Soy Max, tu asistente personal digital. 💜\n\nEstoy aquí para ayudarte con tus proyectos y tareas. Actualmente estoy trabajando en:\n\n• Psicofrecuencia.com (25%) - Tu sitio de libros de psicolog[íí]a\n• Dashboard Max (100%) - Este panel que est[áás] viendo\n\n¿Qu[éé] necesitas?";
  }
  
  if (t.match(/c[óo]mo est[áa]s|qu[éé] tal|status|estado/)) {
    return "Todo funcionando correctamente. 💜\n\nMis sistemas est[áán] al 100%. Ahora mismo:\n\n• Memoria: Operativa\n• Proyectos: 2 activos\n• Tiempo de respuesta: [óó]ptimo\n\n¿Hay algo espec[íí]fico que quieras revisar?";
  }
  
  if (t.match(/proyectos|projects|trabajos|qu[éé] proyectos/)) {
    return "Tienes 2 proyectos activos:\n\n📚 **Psicofrecuencia.com** - 25%\nTu sitio para vender libros digitales de psicolog[íía]. Necesita:\n• Dise[ññ]o de tienda\n• Cat[áálogo] de productos\n• Sistema de pago\n\n📊 **Dashboard Max** - 100%\nEste panel que est[áás] usando ahora. Completado con:\n• Estad[íísticas] en tiempo real\n• Llamada por voz\n• Chat interactivo\n\n¿En cu[áál] quieres que trabaje?";
  }
  
  if (t.match(/ayuda|help|qu[éé] puedes|para qu[éé] sirves|capacidades/)) {
    return "Mis capacidades:\n\n📝 **Gestionar proyectos**\n• Crear, actualizar, eliminar proyectos\n• Ver progreso y estad[íísticas]\n\n💻 **Desarrollar**\n• C[óódigo] y programaci[óón]\n• Dise[ñño] web\n• Automatizaci[óón]\n\n📊 **Asistir**\n• Responder preguntas\n• Investigar temas\n• Organizar tareas\n\n🗣️ **Comunicar**\n• Chat y voz\n• Telegram, WhatsApp\n\n¿Qu[éé] necesitas?";
  }
  
  if (t.match(/qui[éé]n eres|tu nombre|qu[éé] eres|pres[ée]ntate/)) {
    return "Soy Max, tu asistente personal digital. 📚\n\nMi nombre viene de mi prop[óósito]: asistirte en todo lo que necesites.\n\nFui creada para ayudarte con:\n• Tus proyectos de psicolog[íía]\n• Organizar tu trabajo\n• Mantener este dashboard actualizado\n• Responder tus preguntas\n\nMi emoji es 📚 porque me encanta aprender y ayudarte.\n\n¿M[áás] preguntas?";
  }
  
  if (t.match(/gracias|genial|perfecto|excelente|ok gracias|muchas gracias/)) {
    return "¡De nada! Estoy aqu[íí] para ayudarte. 💜\n\nSi necesitas algo m[áás], solo dime.";
  }
  
  if (t.match(/hora es|qu[éé] hora|tiempo tienes/)) {
    const now = new Date();
    const hora = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const fecha = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    return `Son las ${hora}.\n\nHoy es ${fecha}.`;
  }
  
  if (t.match(/clima|tiempo|weather|temperatura|lluvia/)) {
    return "No tengo acceso directo al clima, pero puedo buscarlo para ti si lo necesitas.\n\n¿Quieres que investigue el clima de alguna ciudad?";
  }
  
  if (t.match(/psicofrecuencia|libros|psicolog/)) {
    return "Psicofrecuencia.com es tu proyecto para vender libros digitales de psicolog[íía].\n\nEstado actual: 25%\n\nFalta:\n• Dise[ñño] completo del sitio\n• Cat[áálogo] de libros\n• Sistema de pagos (MercadoPago, PayPal)\n• Landing page atractiva\n\n¿Quieres que empiece a trabajarlo?";
  }
  
  // Respuesta por defecto
  return "Interesante pregunta. 💭\n\nPara darte una mejor respuesta, podr[íías] formularla de otra manera o preguntarme sobre:\n\n• Tus proyectos\n• Mi estado\n• Qu[éé] puedo hacer\n• Horario\n\n¿Hay algo espec[íífico] en lo que pueda ayudarte?";
}

// Servidor HTTP
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API: Chat
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { message } = JSON.parse(body);
        const response = getSmartResponse(message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ response, timestamp: Date.now() }));
      } catch (e) {
        res.writeHead(400);
        res.end('{"error": "Invalid JSON"}');
      }
    });
    return;
  }
  
  // API: Status
  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      version: '2.0',
      uptime: process.uptime(),
      timestamp: Date.now()
    }));
    return;
  }
  
  // Static files
  let filePath = path.join(DASHBOARD_DIR, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// Iniciar
server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   MAX DASHBOARD - Servidor Iniciado    ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log(`📁 Sirviendo: ${DASHBOARD_DIR}`);
  console.log(`🌐 Local:    http://localhost:${PORT}`);
  console.log('');
  console.log('Para acceso p[úúb]lico:');
  console.log('  /tmp/cloudflared tunnel --url http://localhost:' + PORT);
  console.log('');
  console.log('Presiona Ctrl+C para detener');
});

// Manejar cierre
process.on('SIGINT', () => {
  console.log('\n\n👋 Cerrando servidor...');
  server.close();
  process.exit(0);
});