#!/bin/bash

# Test WebSocket Connection
echo "🧪 Testing WebSocket Connection..."
echo ""

# Check if Reverb server is running
echo "1️⃣ Checking Reverb server connection..."
curl -s -i http://localhost:8080/health 2>&1 | head -5
echo ""

# Check if frontend can reach it
echo "2️⃣ Testing CORS headers..."
curl -s -i -X OPTIONS http://localhost:8080 \
  -H "Origin: http://localhost:5174" \
  -H "Access-Control-Request-Method: GET" 2>&1 | head -10
echo ""

# Show frontend dev server status
echo "3️⃣ Frontend dev server status..."
curl -s -I http://localhost:5174 | head -3
echo ""

# Test WebSocket endpoint
echo "4️⃣ Testing WebSocket endpoint..."
curl -s -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  http://localhost:8080/app/4l015glwhsub2cclqsxd 2>&1 | head -15
echo ""

echo "✅ WebSocket connection test complete!"
echo ""
echo "📝 Console check:"
echo "   1. Open http://localhost:5174 in browser"
echo "   2. Open DevTools (F12)"
echo "   3. Go to Console tab"
echo "   4. Run: window.Echo?.connector?.socket?.readyState"
echo "   5. Should show: 1 (OPEN) or 0 (CONNECTING)"
echo ""
echo "   Or check Network tab:"
echo "   - Look for WebSocket connection to ws://localhost:8080/..."
