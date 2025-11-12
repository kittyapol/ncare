#!/bin/bash

# Pharmacy ERP System - Development Server Start Script

set -e

echo "=================================="
echo "Starting Pharmacy ERP System"
echo "=================================="
echo ""

# Check if Docker services are running
if ! docker ps | grep -q pharmacy_postgres; then
    echo "Starting Docker services..."
    docker-compose up -d postgres redis
    echo "Waiting for databases to be ready..."
    sleep 5
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server..."
cd services/api
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ../..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
cd apps/web
pnpm dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "=================================="
echo "✅ Development servers started!"
echo "=================================="
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/api/v1/docs"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "=================================="
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
