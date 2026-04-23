#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Starting PulseBoard V10..."

# Start backend
echo "📦 Starting Backend..."
./start_backend.sh &
BACKEND_PID=$!
echo $BACKEND_PID > backend.pid

# Wait for backend
sleep 3

# Start frontend
echo "🎨 Starting Frontend..."
./start_frontend.sh &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid

echo ""
echo "✅ PulseBoard V10 Started!"
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend: http://localhost:8001"
echo "📚 API Docs: http://localhost:8001/docs"
echo ""
echo "To stop: kill \$(cat backend.pid frontend.pid)"

wait
