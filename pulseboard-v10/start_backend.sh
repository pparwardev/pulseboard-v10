#!/bin/bash
cd "$(dirname "$0")/backend"
source venv/bin/activate 2>/dev/null || { echo "❌ No venv found. Run: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"; exit 1; }
echo "🔧 Starting Backend on port 8001..."
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
