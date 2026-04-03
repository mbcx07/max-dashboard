#!/bin/bash
# Iniciar Dashboard con conexión a OpenClaw
# 100% GRATIS usando Cloudflare Tunnel

echo "=========================================="
echo "   MAX DASHBOARD - INICIANDO SERVIDOR"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directorio del dashboard
DASHBOARD_DIR="/home/ubuntu/.openclaw/workspace/max-dashboard"

# Verificar si cloudflared existe
if [ ! -f /tmp/cloudflared ]; then
    echo -e "${YELLOW}Descargando cloudflared...${NC}"
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o /tmp/cloudflared
    chmod +x /tmp/cloudflared
fi

# Verificar si el puerto 3000 está en uso
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}El puerto 3000 está en uso. Deteniendo proceso anterior...${NC}"
    lsof -ti :3000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Iniciar servidor del dashboard
echo -e "${GREEN}Iniciando servidor del dashboard...${NC}"
cd "$DASHBOARD_DIR"

# Crear servidor simple si no existe node
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js no está instalado. Instalando...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Instalar ws si no está
if [ ! -d "node_modules" ] || [ ! -d "node_modules/ws" ]; then
    echo -e "${YELLOW}Instalando dependencias...${NC}"
    npm install ws --save 2>/dev/null || npm install --force ws
fi

# Iniciar servidor en background
echo -e "${GREEN}Iniciando servidor WebSocket...${NC}"
node server.js &
SERVER_PID=$!
sleep 2

# Verificar que el servidor está corriendo
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}Error: El servidor no pudo iniciar${NC}"
    echo "Intentando con Python..."
    python3 -m http.server 3000 &
    SERVER_PID=$!
    sleep 2
fi

echo ""
echo -e "${GREEN}Servidor local iniciado en http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Creando tunnel público con Cloudflare...${NC}"
echo -e "${YELLOW}(Esto puede tomar unos segundos)${NC}"
echo ""

# Iniciar Cloudflare Tunnel
/tmp/cloudflared tunnel --url http://localhost:3000 2>&1 | tee /tmp/cloudflared-output.txt &
TUNNEL_PID=$!

# Esperar y capturar la URL
sleep 5
URL=$(grep -o 'https://[^.]*\.trycloudflare\.com' /tmp/cloudflared-output.txt | head -1)

if [ -n "$URL" ]; then
    echo ""
    echo "=========================================="
    echo -e "${GREEN}   ¡DASHBOARD CONECTADO A MAX!${NC}"
    echo "=========================================="
    echo ""
    echo -e "URL Pública: ${GREEN}$URL${NC}"
    echo ""
    echo "Esta URL es GRATIS y funciona desde cualquier lugar."
    echo "El dashboard está conectado con OpenClaw."
    echo ""
    echo "Presiona Ctrl+C para detener"
    echo "=========================================="
else
    echo ""
    echo -e "${YELLOW}El tunnel está iniciando...${NC}"
    echo "Revisa el output arriba para ver la URL pública"
fi

# Mantener el script corriendo
wait $TUNNEL_PID