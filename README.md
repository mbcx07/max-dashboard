# 🚀 Max Dashboard - Conexión en Tiempo Real

## Inicio Rápido (1 comando)

```bash
cd /home/ubuntu/.openclaw/workspace/max-dashboard
chmod +x iniciar.sh
./iniciar.sh
```

## ¿Qué hace?

1. **Inicia un servidor local** en el puerto 3000
2. **Crea un tunnel público GRATIS** con Cloudflare
3. **Conecta el dashboard** con OpenClaw (tu IA real)

## Te da una URL pública como:
```
https://xxxx-xxxx.trycloudflare.com
```

## Características

✅ **100% GRATIS** - No requiere cuenta
✅ **Funciona desde cualquier lugar** - Celular, PC, etc.
✅ **Conectado a Max** - Respuestas inteligentes reales
✅ **Voz en tiempo real** - Llamada tipo Jarvis
✅ **Archivos** - Sube archivos al dashboard

## Estructura

```
max-dashboard/
├── server.js      # Servidor WebSocket
├── voice.js       # Sistema de voz
├── bridge.js      # Respuestas inteligentes
├── index.html     # Dashboard principal
├── styles.css     # Estilos cyberpunk
└── iniciar.sh     # Script de inicio
```

## Puertos

- **3000**: Servidor del dashboard
- **18800**: WebSocket de OpenClaw (automático)

## Troubleshooting

### El tunnel no inicia
```bash
pkill -f cloudflared
./iniciar.sh
```

### El servidor no inicia
```bash
npm install ws
node server.js
```

### No hay conexión con OpenClaw
Asegúrate de que OpenClaw esté corriendo:
```bash
openclaw status
```