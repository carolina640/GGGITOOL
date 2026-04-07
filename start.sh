#!/bin/bash
export PATH="/opt/homebrew/opt/node@25/bin:$PATH"

echo "Iniciando Asistente ASC · SFC..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Check for .env in backend
if [ ! -f "backend/.env" ]; then
  echo "ERROR: Crea backend/.env con tu ANTHROPIC_API_KEY"
  echo "       Copia backend/.env.example y agrega tu key"
  echo ""
  exit 1
fi

if grep -q "placeholder" backend/.env; then
  echo "ERROR: Actualiza ANTHROPIC_API_KEY en backend/.env (actualmente tiene 'placeholder')"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
  echo "Instalando dependencias del backend..."
  cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "Instalando dependencias del frontend..."
  cd frontend && npm install && cd ..
fi

# Start both servers
echo "Iniciando servidores..."
cd "$SCRIPT_DIR/backend" && node server.js &
BACKEND_PID=$!

cd "$SCRIPT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "Asistente ASC corriendo en http://localhost:5173"
echo "Backend API en http://localhost:3001"
echo ""
echo "Presiona Ctrl+C para detener."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
