# WebSocket Real-time Bidding Setup Guide

## Overview
This guide covers the setup and configuration of real-time bidding with WebSocket using Laravel Reverb and Laravel Echo in the Lelang App frontend.

## Installation Status
✅ Dependencies Installed:
- `laravel-echo` - Client-side WebSocket management
- `pusher-js` - WebSocket protocol support

## Configuration

### 1. Environment Variables
Update `.env` file with WebSocket settings:

```env
# WebSocket Configuration - Laravel Reverb
VITE_REVERB_APP_KEY=your_reverb_app_key      # Get from backend/Laravel
VITE_REVERB_HOST=localhost                   # Reverb server host
VITE_REVERB_PORT=8080                        # Reverb server port
VITE_REVERB_SCHEME=http                      # http or https (use https in production)
```

### 2. Backend Configuration
Ensure your Laravel backend has:

1. **Reverb Service** running on specified host:port
   ```bash
   php artisan reverb:start --host=0.0.0.0 --port=8080
   ```

2. **Broadcasting Configuration** in `config/broadcasting.php`:
   ```php
   'reverb' => [
       'driver' => 'reverb',
       'key' => env('REVERB_APP_KEY'),
       'secret' => env('REVERB_APP_SECRET'),
       'app_id' => env('REVERB_APP_ID'),
       'host' => env('REVERB_HOST', '127.0.0.1'),
       'port' => env('REVERB_PORT', 8080),
       'scheme' => env('REVERB_SCHEME', 'http'),
       'useTLS' => env('REVERB_SCHEME') === 'https',
   ],
   ```

3. **Authentication** with Bearer Token (passed in header)

### 3. Frontend Service Setup
The Echo service is initialized in `/src/config/echo.ts`:

```typescript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export const initializeEcho = () => {
  // Returns configured Echo instance
};

export const getEcho = () => {
  // Returns current Echo instance
};

export const disconnectEcho = () => {
  // Cleanly disconnect WebSocket
};
```

## Implementation

### 1. Real-time Auction Hook
Location: `/src/hooks/useRealtimeAuction.ts`

**Features:**
- WebSocket subscription to auction channels
- Real-time event listeners: `bid.placed`, `auction.updated`, `auction.ended`
- Automatic connection status tracking
- Error handling and logging

**Usage:**
```typescript
const { isConnected, error } = useRealtimeAuction(auctionId, (eventData) => {
  // Handle bid.placed event
  updateAuctionState(eventData);
});
```

### 2. Polling Fallback Hook
Location: `/src/hooks/useAuctionPolling.ts`

**Features:**
- 500ms polling interval
- Enabled when WebSocket disconnected
- Fetches from `/api/v1/auctions/portal/:id`
- Automatic cleanup

**Usage:**
```typescript
const { usePolling } = useAuctionPolling(auctionId, () => {
  // Called on each poll if disconnected
});
```

### 3. Integration in Components

#### AuctionModal.tsx
```typescript
// Real-time updates with fallback
const { isConnected, error } = useRealtimeAuction(auctionId, (eventData) => {
  setLiveAuction(eventData);
});

const { usePolling } = useAuctionPolling(auctionId, () => {
  // Polling fallback
});

// Display connection status
<span>{isConnected ? '🟢 Real-time' : usePolling ? '🟡 Polling' : '⚪ Connecting'}</span>
```

#### AuctionList.tsx
```typescript
// Real-time updates for each auction in list
auction.forEach(a => {
  subscribeToAuction(a.id, (updates) => {
    updateAuctionInList(a.id, updates);
  });
});
```

## WebSocket Channels & Events

### Auction Channel
**Subscribe to:** `private-auction.{auctionId}`

**Events:**
1. **bid.placed**
   - Triggered when new bid submitted
   - Payload: `{ currentBid, bidder, timestamp, participantCount }`

2. **auction.updated**
   - Triggered when auction status changes
   - Payload: `{ status, currentBid, participantCount, endTime }`

3. **auction.ended**
   - Triggered when auction ends
   - Payload: `{ status, winner, finalBid, timestamp }`

### Example Backend Broadcasting (Laravel):
```php
// In BidService or similar
broadcast(new BidPlaced($auction, $bid));

// Event class
class BidPlaced implements ShouldBroadcast {
    public function broadcastOn() {
        return new PrivateChannel("auction.{$this->auction->id}");
    }
    
    public function broadcastAs() {
        return 'bid.placed';
    }
}
```

## Error Handling

### WebSocket Connection Errors
```typescript
const { error } = useRealtimeAuction(auctionId, eventHandler);

if (error) {
  console.error('WebSocket Error:', error);
  // Fallback to polling automatically handled
}
```

### Fallback Strategy
1. **Primary:** WebSocket (real-time)
2. **Secondary:** Polling every 500ms
3. **Both fail:** Show error toast to user

## Testing

### 1. Check WebSocket Connection
```typescript
// In browser console
const echo = window.Echo;
echo.connector.socket.readyState; // Should be 1 (OPEN)
```

### 2. Test Event Subscription
```typescript
// Listen to private channel
Echo.private(`auction.123`)
  .listen('bid.placed', (e) => {
    console.log('New bid:', e);
  });
```

### 3. Verify Polling Fallback
```typescript
// Disconnect WebSocket and verify polling starts
window.Echo.disconnect();
// Check network tab - should see API calls every 500ms
```

## Troubleshooting

### Issue: Connection Status Shows "⚪ Connecting..."
**Solution:**
1. Verify `VITE_REVERB_*` environment variables in `.env`
2. Check backend Reverb service is running: `php artisan reverb:start`
3. Check browser console for connection errors
4. Verify network allows WebSocket connections

### Issue: Polling not triggered when WebSocket fails
**Solution:**
1. Check if `useAuctionPolling` hook is properly initialized
2. Verify authentication token is being sent
3. Check API endpoint `/api/v1/auctions/portal/:id` returns data

### Issue: Events not received
**Solution:**
1. Verify backend broadcasting is configured correctly
2. Check channel name matches: `private-auction.{auctionId}`
3. Verify user has permission to access auction
4. Check WebSocket connection status in browser DevTools

## Performance Considerations

1. **Connection Pooling:** Echo automatically manages connections
2. **Memory:** Polling disabled when WebSocket active
3. **Battery (Mobile):** Reduced polling interval (500ms) vs API calls every second
4. **Network:** WebSocket binary protocol more efficient than REST

## Security

### Authentication
- Bearer token passed in WebSocket handshake headers
- Private channels require user authentication
- Events only broadcast to authenticated users

### Authorization
- Backend validates user can access auction channel
- Bid placement validates user permissions
- Auction updates only shown to participants

## Migration Guide

### From HTTP Polling to WebSocket
Current state → Expected state:
- ❌ REST API polling every second → ✅ WebSocket real-time (0ms latency)
- ❌ Higher bandwidth usage → ✅ Binary protocol (lower bandwidth)
- ❌ Battery drain on mobile → ✅ Efficient connection

## Files Modified

1. `/src/config/echo.ts` - New: Echo service initialization
2. `/src/hooks/useRealtimeAuction.ts` - New: WebSocket hook + polling hook
3. `/src/pages/portal/AuctionModal.tsx` - Updated: Real-time integration
4. `.env` - Updated: WebSocket configuration
5. `.env.example` - Updated: WebSocket configuration template

## Next Steps

1. ✅ WebSocket service configured
2. ✅ Real-time hooks created
3. ✅ AuctionModal integrated
4. 🟨 Integrate AuctionList.tsx with WebSocket
5. 🟨 Create countdown timer component
6. 🟨 Create bid form with validation
7. 🟨 Create bid activity feed
8. 🟨 Test end-to-end real-time updates

