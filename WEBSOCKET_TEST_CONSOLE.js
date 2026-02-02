// Test WebSocket Connection - Copy & paste ke DevTools Console

// 1. Check if Echo initialized
console.log('🔍 Echo instance:', window.Echo);

// 2. Check WebSocket status
if (window.Echo?.connector?.socket) {
  console.log('✅ WebSocket found!');
  console.log('📊 WebSocket state:', {
    readyState: window.Echo.connector.socket.readyState, // 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
    url: window.Echo.connector.socket.url,
    protocol: window.Echo.connector.socket.protocol
  });
  
  // Show readable state
  const states = { 0: '🟡 CONNECTING', 1: '🟢 OPEN', 2: '🟠 CLOSING', 3: '🔴 CLOSED' };
  console.log('State:', states[window.Echo.connector.socket.readyState]);
} else {
  console.log('❌ Echo not initialized yet. Please navigate to Auction page.');
}

// 3. List all active listeners
console.log('📡 Listening to channels:', window.Echo?.channels || {});

// 4. Subscribe to test channel
if (window.Echo) {
  console.log('🔗 Subscribing to test channel...');
  window.Echo.channel('test-channel')
    .listen('TestEvent', (data) => {
      console.log('📨 Event received:', data);
    });
  console.log('✅ Subscribed! Waiting for events...');
}
