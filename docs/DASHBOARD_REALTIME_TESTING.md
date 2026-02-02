# Real-time Dashboard Testing Guide

## Quick Start

### Prerequisites
1. Backend running on `http://localhost:8000`
2. Reverb WebSocket server running on `ws://localhost:8080`
3. Frontend running on `http://localhost:5173`
4. `.env` configured with Reverb credentials

### Environment Check
```bash
# Verify Reverb server is running
curl http://localhost:8080/metrics

# Verify backend API
curl http://localhost:8000/api/v1/auctions

# Verify frontend dev server
curl http://localhost:5173
```

---

## Testing Scenarios

### Scenario 1: Gallery Page Real-time Updates

**Objective**: Verify auction cards update in real-time with new bids

**Steps**:
1. Navigate to Dashboard → Auctions → Gallery
2. Identify an auction in LIVE status
3. Open browser DevTools Console (F12)
4. Trigger a bid via API:
   ```bash
   curl -X POST http://localhost:8000/api/v1/bids \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "auction_id": "AUCTION_UUID",
       "bid_amount": 1000000
     }'
   ```
5. Watch for console logs:
   ```
   💰 Bid placed for auction 3a948821-d49c-4778-960c-e980e610436b
   ```
6. **Expected**: 
   - Card shows blue border with 🔴 LIVE badge
   - Current Price updates immediately
   - Total bids counter increments
   - Participant count increases

**Success Indicators**:
- ✓ Real-time price update within 1 second
- ✓ Bid counter increments immediately
- ✓ No page refresh required
- ✓ Multiple cards can update simultaneously

---

### Scenario 2: Activity Page Bid Feed

**Objective**: Verify real-time bid activity appears in feed

**Steps**:
1. Navigate to Dashboard → Auctions → Activity
2. Place multiple bids in quick succession:
   ```bash
   # Bid 1
   curl -X POST http://localhost:8000/api/v1/bids \
     -H "Authorization: Bearer TOKEN1" \
     -d '{"auction_id": "ID1", "bid_amount": 1000000}'
   
   # Bid 2 (different auction)
   curl -X POST http://localhost:8000/api/v1/bids \
     -H "Authorization: Bearer TOKEN2" \
     -d '{"auction_id": "ID2", "bid_amount": 2000000}'
   ```
3. **Expected**:
   - New bid appears at top of table immediately
   - Most recent bid is always at top
   - Bidder name, amount, and timestamp visible
   - Status shows correct state (CURRENT/WINNING/OUTBID)

**Success Indicators**:
- ✓ Bids appear within 500ms of placement
- ✓ Correct ordering (newest first)
- ✓ All bid details displayed accurately
- ✓ Multiple concurrent bids handled correctly

---

### Scenario 3: Table Page Live Updates

**Objective**: Verify auction table data updates in real-time

**Steps**:
1. Navigate to Dashboard → Auctions → Table
2. Sort by "Current Price" to group LIVE auctions
3. Place a bid on a LIVE auction
4. **Expected**:
   - Current Price column updates immediately
   - Total Bids column increments
   - Participant count increases
   - No row movement (stable position)

**Success Indicators**:
- ✓ Table cells update without re-rendering entire row
- ✓ Row remains in same position
- ✓ Data accurate and current
- ✓ Multiple simultaneous updates handled

---

### Scenario 4: Connection Status Monitoring

**Objective**: Verify WebSocket connection health

**Steps**:
1. Open any dashboard page with LIVE auctions
2. Open DevTools Console
3. Look for connection logs:
   ```
   ✅ Got Echo instance, subscribing to channel...
   ✅ WebSocket connected to auction.{uuid}
   📡 WebSocket connection status: 🟢 OPEN
   ```

**Connection States**:
- 🟢 **OPEN**: WebSocket connected and receiving updates
- 🟡 **CONNECTING**: Attempting to establish connection
- ⚪ **POLLING**: WebSocket unavailable, using fallback polling
- ❌ **ERROR**: Connection failed, check console for details

**Testing Connection Loss**:
1. Open DevTools Network tab
2. Throttle to "Offline"
3. Page should fall back to polling
4. Restore connection
5. **Expected**: Automatic reconnection within 1-2 seconds

---

### Scenario 5: Multiple Auctions Concurrent Updates

**Objective**: Test system stability with multiple simultaneous bids

**Steps**:
1. Open Gallery page with 12+ auctions in LIVE status
2. Run concurrent bid script:
   ```bash
   #!/bin/bash
   for i in {1..10}; do
     AUCTION_ID=$(curl -s http://localhost:8000/api/v1/auctions?status=LIVE | \
       jq -r '.data[0].id')
     curl -X POST http://localhost:8000/api/v1/bids \
       -H "Authorization: Bearer TOKEN$i" \
       -d "{\"auction_id\": \"$AUCTION_ID\", \"bid_amount\": $((1000000 + i*10000))}" &
     sleep 0.5
   done
   wait
   ```
3. **Expected**:
   - All cards update correctly
   - No missing updates
   - No lag or slowdown
   - Browser remains responsive

**Success Indicators**:
- ✓ All bids processed
- ✓ No UI freezing
- ✓ Memory usage stable
- ✓ CPU usage reasonable

---

### Scenario 6: Page Navigation Stability

**Objective**: Verify WebSocket handles page navigation correctly

**Steps**:
1. Navigate to Gallery page
2. Wait for real-time updates (see live badge)
3. Navigate to Activity page
4. Navigate back to Gallery
5. **Expected**:
   - WebSocket reconnects automatically
   - Live badge reappears
   - Updates resume immediately
   - No console errors

**Testing Subscription Cleanup**:
1. Open DevTools Console
2. Look for unmount logs (if implemented)
3. Navigate away from page
4. **Expected**: Clean disconnect, no memory leaks

---

### Scenario 7: Data Consistency Verification

**Objective**: Verify displayed data matches backend reality

**Steps**:
1. Place a bid on an auction via API
2. Observe real-time update on dashboard
3. Query backend API to verify:
   ```bash
   curl http://localhost:8000/api/v1/auctions/{auction_id}
   ```
4. **Expected**: Dashboard values match API response
   - Current bid matches
   - Participant count matches
   - Total bids count matches

**Data Points to Verify**:
- [ ] Current Bid amount
- [ ] Participant Count
- [ ] Total Bids count
- [ ] Last Bid Time
- [ ] Auction Status

---

## Console Log Monitoring

### Expected Log Patterns

**Normal Operation**:
```
🔧 Initializing Echo with config: {...}
✅ Echo initialized successfully
✅ Got Echo instance, subscribing to channel...
✅ WebSocket connected to auction.3a948821-d49c-4778-960c-e980e610436b
📡 WebSocket connection status: 🟢 OPEN
💰 Bid placed for auction 3a948821-d49c-4778-960c-e980e610436b bidAmount: 1000000
```

**Auction Update**:
```
📊 Auction updated: 3a948821-d49c-4778-960c-e980e610436b
{status: 'LIVE', currentBid: 1000000, totalBids: 5, ...}
```

**Auction Ended**:
```
🏁 Auction ended: 3a948821-d49c-4778-960c-e980e610436b
{status: 'ENDED', winner: '...', finalBid: 1500000}
```

### Troubleshooting by Logs

**Log**: `❌ Echo not initialized`
- Solution: Check .env Reverb config
- Action: Refresh page, check backend logs

**Log**: `⚠️ Failed to subscribe to channel`
- Solution: Verify auction ID is valid UUID format
- Action: Check browser network tab for WebSocket errors

**Log**: `Error: WebSocket connection failed`
- Solution: Verify Reverb server running on correct port
- Action: Check Reverb status with curl

---

## Performance Metrics

### Acceptance Criteria

| Metric | Target | Threshold |
|--------|--------|-----------|
| Update Latency | <500ms | <1000ms |
| Card Load Time | <200ms | <500ms |
| Memory Increase | <50MB | <100MB |
| CPU Usage Peak | <30% | <50% |
| WebSocket Reconnect | <2s | <5s |
| Concurrent Bids | 100+ | 50+ |

### Monitoring Tools

**Browser DevTools**:
- Performance tab: Record page interactions
- Network tab: Monitor WebSocket frames
- Memory tab: Track heap size growth
- Console: Monitor error logs

**Commands for Testing**:
```bash
# Monitor WebSocket traffic
# In Chrome DevTools: 
# Network tab → Filter by "ws" type

# Check connection status
curl -i http://localhost:8080/app/4l015glwhsub2cclqsxd?protocol=7

# Verify Reverb metrics
curl http://localhost:8080/metrics | grep connections
```

---

## Regression Testing Checklist

- [ ] Gallery cards display correctly without WebSocket
- [ ] Activity page shows static data if WebSocket unavailable
- [ ] Table view works without real-time updates
- [ ] Page navigation doesn't break auctions context
- [ ] Create/Edit auction still works with real-time enabled
- [ ] Delete auction removes from real-time subscriptions
- [ ] Filter/search works with real-time updates
- [ ] Pagination works correctly
- [ ] Export/PDF generation not affected
- [ ] Mobile responsive view updates in real-time

---

## Debugging Tips

### Enable Detailed Logging

Add to `src/config/echo.ts`:
```typescript
// Add more detailed logging
Echo.channel(`private-auction.${auctionId}`)
  .listen('bid.placed', (data) => {
    console.table(data)  // Show as table
    console.trace()      // Show call stack
  })
```

### Network Tab Analysis

1. Open DevTools → Network tab
2. Filter by `ws` (WebSocket)
3. Click on WebSocket connection
4. View "Messages" to see real-time events
5. Frame should show:
   - Time stamp
   - Event type (subscribe, message, etc.)
   - Event data (bid details)

### Memory Leak Detection

1. DevTools → Memory tab
2. Take heap snapshot before navigation
3. Navigate pages multiple times
4. Take heap snapshot after
5. Compare: should be roughly same size
6. If growing, check for unsubscribed listeners

---

## Common Issues & Solutions

### Issue 1: WebSocket Connection Fails
```
Error: WebSocket connection to ws://localhost:8080 failed
```
**Solutions**:
1. Verify Reverb server running: `ps aux | grep reverb`
2. Check port 8080: `lsof -i :8080`
3. Restart Reverb: `php artisan reverb:start`
4. Check Laravel logs: `tail -f storage/logs/laravel.log`

### Issue 2: No Real-time Updates Appearing
```
💰 Bid placed but no UI update
```
**Solutions**:
1. Check auction status is LIVE: `curl http://localhost:8000/api/v1/auctions`
2. Verify useRealtimeAuction hook mounted: Check console logs
3. Verify bid response includes required fields: `bidAmount`, `currentBid`
4. Check component state updates: Add console.log in setState

### Issue 3: Multiple Subscriptions Error
```
[Error] Multiple subscriptions to same channel
```
**Solutions**:
1. Ensure AuctionCard is separate component (not in loop)
2. Verify useEffect dependencies correct
3. Check for duplicate auction IDs
4. Verify cleanup on unmount

### Issue 4: Memory Growing Continuously
```
Heap size increasing: 50MB → 100MB → 200MB
```
**Solutions**:
1. Unsubscribe from channels on unmount
2. Limit number of concurrent subscriptions
3. Implement connection pooling
4. Monitor for circular references in state

---

## Performance Optimization Tips

1. **Limit Real-time Subscriptions**:
   - Only subscribe to LIVE auctions
   - Unsubscribe when auction ENDED
   - Max 20-30 concurrent subscriptions

2. **Optimize State Updates**:
   - Use `useCallback` to memoize handlers
   - Batch state updates where possible
   - Avoid unnecessary re-renders

3. **Network Optimization**:
   - Enable compression on WebSocket frames
   - Use binary protocol (if supported)
   - Implement message throttling

4. **UI Optimization**:
   - Use React.memo for auction cards
   - Virtual scrolling for large tables
   - Lazy load auction images

---

## Success Criteria

✅ **All Tests Pass** when:
1. Real-time updates appear within 500ms
2. No UI lag during concurrent updates
3. WebSocket reconnects automatically
4. Memory remains stable
5. CPU usage reasonable
6. All data consistent with backend
7. Page navigation smooth
8. No console errors

---

## Sign-Off Template

```
Testing Date: [DATE]
Tester: [NAME]
Environment: Local/Staging/Production

Results:
- Gallery Real-time: [ ] PASS [ ] FAIL [ ] PARTIAL
- Activity Feed: [ ] PASS [ ] FAIL [ ] PARTIAL  
- Table Updates: [ ] PASS [ ] FAIL [ ] PARTIAL
- Connection Stability: [ ] PASS [ ] FAIL [ ] PARTIAL
- Performance: [ ] PASS [ ] FAIL [ ] PARTIAL
- Data Consistency: [ ] PASS [ ] FAIL [ ] PARTIAL

Issues Found: [LIST ANY ISSUES]

Overall Status: [ ] READY FOR PRODUCTION
                 [ ] NEEDS FIXES
                 [ ] BLOCKED
```

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Complete - Ready for Testing
