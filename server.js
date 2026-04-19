#!/usr/bin/env node
/**
 * MAX DASHBOARD - Servidor con Módulos IMSS
 * Incluye API REST para: Correspondencia, Vacaciones, Pases, Contratación
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DASHBOARD_DIR = __dirname;
const DATA_DIR = path.join(DASHBOARD_DIR, 'data', 'correspondencia');
const VAC_DIR = path.join(DASHBOARD_DIR, 'data', 'vacaciones');
const PASES_DIR = path.join(DASHBOARD_DIR, 'data', 'pases');
const CONTR_DIR = path.join(DASHBOARD_DIR, 'data', 'contratacion');

// Asegurar directorios
[DATA_DIR, VAC_DIR, PASES_DIR, CONTR_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ===== UTILIDADES =====
function readFile(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return null; }
}

function writeFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ===== MIME TYPES =====
const mimeTypes = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.woff': 'font/woff'
};

// ===== API HANDLERS =====

// Normalize: strip accents for search matching
function normalize(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// GET /api/correspondencia/personal - Buscar personal (con búsqueda)
function apiGetPersonal(query) {
  const data = readFile(path.join(DATA_DIR, 'personal.json'));
  if (!data) return { error: 'No se encontró datos de personal' };
  
  let empleados = data.empleados || [];
  const search = (query.q || '');
  const searchNorm = normalize(search);
  const matricula = query.matricula || '';
  
  if (matricula) {
    empleados = empleados.filter(e => e.matricula === matricula);
  } else if (search) {
    empleados = empleados.filter(e => 
      normalize(e.nombre).includes(searchNorm) || 
      e.matricula.includes(search) ||
      normalize(e.puesto).includes(searchNorm) ||
      e.categoria.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  return { total: data.totalRegistros, resultados: empleados.length, empleados };
}

// GET /api/correspondencia/documentos - Catálogo de documentos
function apiGetDocumentos() {
  const data = readFile(path.join(DATA_DIR, 'documentos.json'));
  return data || { error: 'No se encontró catálogo de documentos' };
}

// GET /api/correspondencia/registros - Obtener registros
function apiGetRegistros(query) {
  const data = readFile(path.join(DATA_DIR, 'registros.json'));
  if (!data) return { registros: [], ultimoId: 0 };
  
  let registros = data.registros || [];
  const mes = query.mes;
  const anio = query.anio;
  const tipo = query.tipo;
  const matricula = query.matricula;
  const buscar = (query.buscar || '');
  const buscarNorm = normalize(buscar);
  
  if (mes && anio) {
    registros = registros.filter(r => {
      const f = new Date(r.fechaCaptura);
      return f.getMonth() + 1 === parseInt(mes) && f.getFullYear() === parseInt(anio);
    });
  }
  if (tipo) registros = registros.filter(r => r.tipoDocumento === tipo);
  if (matricula) registros = registros.filter(r => r.matricula === matricula);
  if (buscar) {
    registros = registros.filter(r => 
      normalize(r.nombre || '').includes(buscarNorm) ||
      r.matricula.includes(buscar) ||
      (r.folio || '').toLowerCase().includes(buscar.toLowerCase()) ||
      normalize(r.observaciones || '').includes(buscarNorm)
    );
  }
  
  return { total: registros.length, registros };
}

// POST /api/correspondencia/registros - Crear registro
function apiCreateRegistro(body) {
  const data = readFile(path.join(DATA_DIR, 'registros.json')) || { registros: [], ultimoId: 0 };
  
  const id = ++data.ultimoId;
  const registro = {
    id,
    fechaCaptura: body.fechaCaptura || new Date().toISOString().split('T')[0],
    matricula: body.matricula,
    nombre: body.nombre,
    categoria: body.categoria,
    puesto: body.puesto,
    horario: body.horario,
    descanso: body.descanso,
    tipoDocumento: body.tipoDocumento,
    fechaInicio: body.fechaInicio,
    fechaTermino: body.fechaTermino,
    dias: body.dias || 0,
    folio: body.folio || '',
    observaciones: body.observaciones || '',
    quienRecibe: body.quienRecibe || '',
    presencias: body.presencias || '',
    creadoPor: body.creadoPor || 'Moisés',
    creadoEn: new Date().toISOString(),
    qrGenerado: true
  };
  
  data.registros.push(registro);
  writeFile(path.join(DATA_DIR, 'registros.json'), data);
  
  return { success: true, registro };
}

// PUT /api/correspondencia/registros/:id - Actualizar registro
function apiUpdateRegistro(id, body) {
  const data = readFile(path.join(DATA_DIR, 'registros.json'));
  if (!data) return { error: 'No hay registros' };
  
  const idx = data.registros.findIndex(r => r.id === id);
  if (idx === -1) return { error: 'Registro no encontrado' };
  
  Object.assign(data.registros[idx], body, { modificadoEn: new Date().toISOString() });
  writeFile(path.join(DATA_DIR, 'registros.json'), data);
  
  return { success: true, registro: data.registros[idx] };
}

// DELETE /api/correspondencia/registros/:id - Eliminar registro
function apiDeleteRegistro(id) {
  const data = readFile(path.join(DATA_DIR, 'registros.json'));
  if (!data) return { error: 'No hay registros' };
  
  const idx = data.registros.findIndex(r => r.id === id);
  if (idx === -1) return { error: 'Registro no encontrado' };
  
  const eliminado = data.registros.splice(idx, 1)[0];
  writeFile(path.join(DATA_DIR, 'registros.json'), data);
  
  return { success: true, eliminado };
}

// GET /api/correspondencia/indicadores - Indicadores ANP
function apiGetIndicadores(query) {
  const data = readFile(path.join(DATA_DIR, 'registros.json'));
  if (!data) return { indicadores: {} };
  
  const registros = data.registros || [];
  const mes = parseInt(query.mes) || new Date().getMonth() + 1;
  const anio = parseInt(query.anio) || new Date().getFullYear();
  
  const filtrados = registros.filter(r => {
    const f = new Date(r.fechaCaptura);
    return f.getMonth() + 1 === mes && f.getFullYear() === anio;
  });
  
  const indicadores = {};
  filtrados.forEach(r => {
    if (!indicadores[r.tipoDocumento]) {
      indicadores[r.tipoDocumento] = { count: 0, dias: 0, empleados: new Set() };
    }
    indicadores[r.tipoDocumento].count++;
    indicadores[r.tipoDocumento].dias += (r.dias || 0);
    indicadores[r.tipoDocumento].empleados.add(r.matricula);
  });
  
  // Convertir Sets a counts
  Object.keys(indicadores).forEach(k => {
    indicadores[k].empleadosUnicos = indicadores[k].empleados.size;
    delete indicadores[k].empleados;
  });
  
  const totalRegistros = filtrados.length;
  const totalDias = filtrados.reduce((sum, r) => sum + (r.dias || 0), 0);
  const empleadosUnicos = new Set(filtrados.map(r => r.matricula)).size;
  
  return { 
    mes, anio, 
    totalRegistros, 
    totalDias, 
    empleadosUnicos,
    desglose: indicadores 
  };
}

// POST /api/correspondencia/personal/import - Importar personal masivo
function apiImportPersonal(body) {
  const data = readFile(path.join(DATA_DIR, 'personal.json')) || { totalRegistros: 0, empleados: [], categorias: {} };
  
  if (body.empleados && Array.isArray(body.empleados)) {
    data.empleados = body.empleados;
    data.totalRegistros = body.empleados.length;
  }
  if (body.categorias) {
    data.categorias = body.categorias;
  }
  data.ultimoUpdate = new Date().toISOString().split('T')[0];
  
  writeFile(path.join(DATA_DIR, 'personal.json'), data);
  return { success: true, total: data.totalRegistros };
}

// ===== GENERIC CRUD HELPERS =====
function crudGet(dataDir, fileName, arrayKey, query, filters) {
  const data = readFile(path.join(dataDir, fileName));
  const items = data ? (data[arrayKey] || []) : [];
  let filtered = items;
  if (filters) {
    filters.forEach(f => {
      if (query[f]) filtered = filtered.filter(item => item[f] === query[f]);
    });
  }
  return { [arrayKey]: filtered, total: filtered.length };
}

function crudCreate(dataDir, fileName, arrayKey, body) {
  const data = readFile(path.join(dataDir, fileName)) || { [arrayKey]: [], ultimoId: 0 };
  if (!data.ultimoId) data.ultimoId = 0;
  const id = ++data.ultimoId;
  const item = { id, ...body, creadoEn: new Date().toISOString() };
  if (!data[arrayKey]) data[arrayKey] = [];
  data[arrayKey].push(item);
  writeFile(path.join(dataDir, fileName), data);
  return { success: true, id, [arrayKey.slice(0, -1)]: item };
}

function crudUpdate(dataDir, fileName, arrayKey, id, body) {
  const data = readFile(path.join(dataDir, fileName));
  if (!data || !data[arrayKey]) return { error: 'No encontrado' };
  const idx = data[arrayKey].findIndex(item => item.id === id);
  if (idx === -1) return { error: 'No encontrado' };
  Object.assign(data[arrayKey][idx], body, { modificadoEn: new Date().toISOString() });
  writeFile(path.join(dataDir, fileName), data);
  return { success: true };
}

function crudDelete(dataDir, fileName, arrayKey, id) {
  const data = readFile(path.join(dataDir, fileName));
  if (!data || !data[arrayKey]) return { success: true };
  const idx = data[arrayKey].findIndex(item => item.id === id);
  if (idx !== -1) { data[arrayKey].splice(idx, 1); writeFile(path.join(dataDir, fileName), data); }
  return { success: true };
}

// Helper to read body from request
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(e); }
    });
  });
}

function jsonResponse(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ===== HTTP SERVER =====
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  // ===== API ROUTES =====
  
  // Chat
  if (pathname === '/api/chat' && req.method === 'POST') {
    try {
      const { message } = await readBody(req);
      jsonResponse(res, { response: "Módulo IMSS activo. 📋", timestamp: Date.now() });
    } catch (e) { jsonResponse(res, { error: 'Invalid JSON' }, 400); }
    return;
  }
  
  // Status
  if (pathname === '/api/status') {
    jsonResponse(res, { status: 'online', version: '4.0', modulos: ['correspondencia','vacaciones','pases','contratacion'], uptime: process.uptime(), timestamp: Date.now() });
    return;
  }
  
  // ===== CATEGORÍAS / SUELDOS =====
  if (pathname === '/api/categorias' && req.method === 'GET') {
    jsonResponse(res, readFile(path.join(DASHBOARD_DIR, 'data', 'categorias.json')) || {});
    return;
  }
  if (pathname === '/api/sueldos' && req.method === 'GET') {
    jsonResponse(res, readFile(path.join(DASHBOARD_DIR, 'data', 'sueldos.json')) || {});
    return;
  }
  
  // ===== CORRESPONDENCIA API =====
  if (pathname === '/api/correspondencia/personal' && req.method === 'GET') {
    jsonResponse(res, apiGetPersonal(query)); return;
  }
  if (pathname === '/api/correspondencia/personal/import' && req.method === 'POST') {
    try { const body = await readBody(req); jsonResponse(res, apiImportPersonal(body)); }
    catch (e) { jsonResponse(res, { error: e.message }, 400); }
    return;
  }
  if (pathname === '/api/correspondencia/documentos' && req.method === 'GET') {
    jsonResponse(res, apiGetDocumentos()); return;
  }
  if (pathname === '/api/correspondencia/registros' && req.method === 'GET') {
    jsonResponse(res, apiGetRegistros(query)); return;
  }
  if (pathname === '/api/correspondencia/registros' && req.method === 'POST') {
    try { const body = await readBody(req); jsonResponse(res, apiCreateRegistro(body), 201); }
    catch (e) { jsonResponse(res, { error: e.message }, 400); }
    return;
  }
  if (pathname === '/api/correspondencia/indicadores' && req.method === 'GET') {
    jsonResponse(res, apiGetIndicadores(query)); return;
  }
  // Correspondencia registros by ID
  const corrMatch = pathname.match(/^\/api\/correspondencia\/registros\/(\d+)$/);
  if (corrMatch) {
    const id = parseInt(corrMatch[1]);
    if (req.method === 'PUT') {
      try { const body = await readBody(req); const r = apiUpdateRegistro(id, body); jsonResponse(res, r, r.error ? 404 : 200); }
      catch (e) { jsonResponse(res, { error: e.message }, 400); }
      return;
    }
    if (req.method === 'DELETE') {
      const r = apiDeleteRegistro(id); jsonResponse(res, r, r.error ? 404 : 200); return;
    }
  }
  
  // ===== VACACIONES API =====
  if (pathname === '/api/vacaciones/registros' && req.method === 'GET') {
    const result = crudGet(VAC_DIR, 'vacaciones.json', 'registros', query, ['matricula','estatus']);
    jsonResponse(res, result); return;
  }
  if (pathname === '/api/vacaciones/registros' && req.method === 'POST') {
    try { const body = await readBody(req); const r = crudCreate(VAC_DIR, 'vacaciones.json', 'registros', body); jsonResponse(res, r, 201); }
    catch (e) { jsonResponse(res, { error: e.message }, 400); }
    return;
  }
  const vacMatch = pathname.match(/^\/api\/vacaciones\/registros\/(\d+)$/);
  if (vacMatch) {
    const id = parseInt(vacMatch[1]);
    if (req.method === 'DELETE') { crudDelete(VAC_DIR, 'vacaciones.json', 'registros', id); jsonResponse(res, { success: true }); return; }
    if (req.method === 'PUT') {
      try { const body = await readBody(req); crudUpdate(VAC_DIR, 'vacaciones.json', 'registros', id, body); jsonResponse(res, { success: true }); }
      catch (e) { jsonResponse(res, { error: e.message }, 400); }
      return;
    }
  }
  // Vacaciones memos
  if (pathname === '/api/vacaciones/memos' && req.method === 'GET') {
    const result = crudGet(VAC_DIR, 'vacaciones.json', 'memos', query, []);
    jsonResponse(res, result); return;
  }
  if (pathname === '/api/vacaciones/memos' && req.method === 'POST') {
    try { const body = await readBody(req); const r = crudCreate(VAC_DIR, 'vacaciones.json', 'memos', body); jsonResponse(res, r, 201); }
    catch (e) { jsonResponse(res, { error: e.message }, 400); }
    return;
  }
  
  // ===== PASES API =====
  if (pathname === '/api/pases/pases' && req.method === 'GET') {
    const result = crudGet(PASES_DIR, 'pases.json', 'pases', query, ['departamento','fecha','estatus']);
    jsonResponse(res, result); return;
  }
  if (pathname === '/api/pases/pases' && req.method === 'POST') {
    try { const body = await readBody(req); const r = crudCreate(PASES_DIR, 'pases.json', 'pases', body); jsonResponse(res, r, 201); }
    catch (e) { jsonResponse(res, { error: e.message }, 400); }
    return;
  }
  const paseMatch = pathname.match(/^\/api\/pases\/pases\/(\d+)$/);
  if (paseMatch) {
    const id = parseInt(paseMatch[1]);
    if (req.method === 'DELETE') { crudDelete(PASES_DIR, 'pases.json', 'pases', id); jsonResponse(res, { success: true }); return; }
    if (req.method === 'PUT') {
      try { const body = await readBody(req); crudUpdate(PASES_DIR, 'pases.json', 'pases', id, body); jsonResponse(res, { success: true }); }
      catch (e) { jsonResponse(res, { error: e.message }, 400); }
      return;
    }
  }
  if (pathname === '/api/pases/departamentos' && req.method === 'GET') {
    const catData = readFile(path.join(DASHBOARD_DIR, 'data', 'categorias.json'));
    jsonResponse(res, catData?.departamentos || []); return;
  }
  
  // ===== CONTRATACIÓN API =====
  if (pathname === '/api/contratacion/solicitudes' && req.method === 'GET') {
    const result = crudGet(CONTR_DIR, 'contratacion.json', 'solicitudes', query, ['tipoSolicitud','estatus']);
    jsonResponse(res, result); return;
  }
  if (pathname === '/api/contratacion/solicitudes' && req.method === 'POST') {
    try { const body = await readBody(req); const r = crudCreate(CONTR_DIR, 'contratacion.json', 'solicitudes', body); jsonResponse(res, r, 201); }
    catch (e) { jsonResponse(res, { error: e.message }, 400); }
    return;
  }
  const contrMatch = pathname.match(/^\/api\/contratacion\/solicitudes\/(\d+)$/);
  if (contrMatch) {
    const id = parseInt(contrMatch[1]);
    if (req.method === 'DELETE') { crudDelete(CONTR_DIR, 'contratacion.json', 'solicitudes', id); jsonResponse(res, { success: true }); return; }
    if (req.method === 'PUT') {
      try { const body = await readBody(req); crudUpdate(CONTR_DIR, 'contratacion.json', 'solicitudes', id, body); jsonResponse(res, { success: true }); }
      catch (e) { jsonResponse(res, { error: e.message }, 400); }
      return;
    }
  }
  
  // ===== STATIC FILES =====
  let filePath = path.join(DASHBOARD_DIR, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') { res.writeHead(404); res.end('Not found'); }
      else { res.writeHead(500); res.end('Server error'); }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   MAX DASHBOARD - Sistema IMSS BCS v4.0        ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📁 Sirviendo: ${DASHBOARD_DIR}`);
  console.log(`🌐 Local:    http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Módulos:');
  console.log('   /correspondencia.html  - Correspondencia IMSS');
  console.log('   /vacaciones.html      - Vacaciones');
  console.log('   /pases.html           - Pases de Entrada/Salida');
  console.log('   /contratacion.html    - Programa de Contratación');
  console.log('');
  console.log('Para acceso público:');
  console.log('  cloudflared tunnel --url http://localhost:' + PORT);
  console.log('');
  console.log('Presiona Ctrl+C para detener');
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Cerrando servidor...');
  server.close();
  process.exit(0);
});