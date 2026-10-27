#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Ensure frontend binaries have executable permissions
chmod +x "$FRONTEND_DIR"/node_modules/.bin/* 2>/dev/null || true

# Check or prepare Python virtual environment
PYTHON_BIN=""
if [ -f "$BACKEND_DIR/venv/bin/python" ]; then
    PYTHON_BIN="$BACKEND_DIR/venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="$(command -v python3)"
fi

echo "=================================================="
echo "🛡️  Aegis Bank Intelligence - Starting Services..."
echo "=================================================="

# Function to clean up child processes on exit (Ctrl+C, SIGTERM)
cleanup() {
    echo ""
    echo "Stopping all services..."
    kill $(jobs -p) 2>/dev/null || true
    wait $(jobs -p) 2>/dev/null || true
    echo "All services stopped."
}
trap cleanup SIGINT SIGTERM EXIT

# Start Backend
echo "🚀 Starting FastAPI Backend on http://localhost:8000..."
(
    cd "$BACKEND_DIR"
    if [ -x "$BACKEND_DIR/venv/bin/uvicorn" ]; then
        "$BACKEND_DIR/venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload
    else
        "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    fi
) &
BACKEND_PID=$!

# Start Frontend
echo "⚡ Starting Next.js Frontend on http://localhost:3000..."
(
    cd "$FRONTEND_DIR"
    npm run dev -- -p 3000
) &
FRONTEND_PID=$!

echo ""
echo "✨ Both services are running!"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend:  http://localhost:8000 (Docs: http://localhost:8000/docs)"
echo "Press Ctrl+C to terminate both servers."
echo ""

# Wait for background jobs
wait
