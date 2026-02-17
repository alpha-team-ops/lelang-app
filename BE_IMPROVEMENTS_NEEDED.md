# Backend Improvements - Required Updates for Bid Placement & Token Management

## 🚨 Critical Issues

### 1. **POST `/api/v1/bids/place` - Infinite Loop/Timeout**
**Status:** 🔴 CRITICAL  
**Problem:** Request times out after 10 seconds with no response

**Root Cause:** 
- Possible infinite loop in bid processing
- Database lock without timeout
- Missing transaction handling

**Solution Required:**
```php
// bidrController.php OR bidService.php

public function place(Request $request)
{
    // 1. Validate input
    $validated = $request->validate([
        'auction_id' => 'required|string|exists:auctions,id',
        'bid_amount' => 'required|integer|min:1',
    ]);

    try {
        DB::beginTransaction();
        
        // 2. Lock auction row (important: prevents race condition)
        $auction = Auction::lockForUpdate()
            ->find($validated['auction_id']);
        
        if (!$auction || $auction->status !== 'LIVE') {
            return response()->json([
                'success' => false,
                'error' => 'Auction not available',
                'code' => 'AUCTION_NOT_LIVE'
            ], 400);
        }
        
        // 3. Validate bid amount (before database write)
        if ($validated['bid_amount'] <= $auction->current_bid) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Bid must be higher than current bid',
                'code' => 'BID_TOO_LOW'
            ], 400);
        }
        
        // 4. Create bid record
        $bid = Bid::create([
            'auction_id' => $auction->id,
            'user_id' => auth()->id(),
            'amount' => $validated['bid_amount'],
            'created_at' => now(),
        ]);
        
        // 5. Update auction (atomic operation)
        $auction->update([
            'current_bid' => $validated['bid_amount'],
            'current_bidder_id' => auth()->id(),
            'last_bid_at' => now(),
        ]);
        
        // 6. Optional: Update user bidding stats
        // User::where('id', auth()->id())->increment('total_bids');
        
        DB::commit();
        
        // 7. Return success response
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $bid->id,
                'bidAmount' => $bid->amount,
                'status' => 'success',
                'timestamp' => $bid->created_at->toIso8601String(),
            ]
        ], 201);
        
    } catch (Exception $e) {
        DB::rollBack();
        
        // Log error for debugging
        \Log::error('Bid placement error', [
            'user_id' => auth()->id(),
            'auction_id' => $validated['auction_id'] ?? null,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        
        return response()->json([
            'success' => false,
            'error' => 'Failed to place bid',
            'code' => 'BID_PLACEMENT_FAILED'
        ], 500);
    }
}
```

**Testing Endpoint:**
```bash
TOKEN="your_token_here"

curl -X POST http://localhost:8000/api/v1/bids/place \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "auction_id": "49fbe6e1-84dc-4d25-a3b3-19f546b4c38e",
    "bid_amount": 1500000
  }' \
  -w "\nStatus: %{http_code}\n"
```

---

### 2. **POST `/api/v1/auth/refresh` - Token Refresh Endpoint (MISSING)**
**Status:** 🔴 CRITICAL  
**Problem:** Frontend needs token refresh, but endpoint doesn't exist or broken

**Solution Required:**
```php
// routes/api.php
Route::post('/auth/refresh', [AuthController::class, 'refresh']);

// AuthController.php
public function refresh(Request $request)
{
    try {
        $validated = $request->validate([
            'refreshToken' => 'required|string',
        ]);
        
        // 1. Decode refresh token
        $payload = JWT::decode(
            $validated['refreshToken'],
            config('auth.jwt_secret'),
            ['HS256']
        );
        
        // 2. Verify token type
        if ($payload->type !== 'refresh' || $payload->exp < time()) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or expired refresh token'
            ], 401);
        }
        
        // 3. Generate new access token
        $user = User::find($payload->user_id);
        if (!$user || !$user->is_active) {
            return response()->json([
                'success' => false,
                'error' => 'User not found or inactive'
            ], 401);
        }
        
        $accessToken = $this->generateAccessToken($user);
        
        // 4. Return new token
        return response()->json([
            'success' => true,
            'data' => [
                'accessToken' => $accessToken,
                'expiresIn' => 3600,
                'tokenType' => 'Bearer',
            ]
        ]);
        
    } catch (Exception $e) {
        \Log::error('Token refresh failed', ['error' => $e->getMessage()]);
        
        return response()->json([
            'success' => false,
            'error' => 'Token refresh failed'
        ], 401);
    }
}
```

**Testing Endpoint:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

---

## 🟠 High Priority Issues

### 3. **CORS Configuration Needs Improvement**
**Current Status:** Minimal, only allows `*`  
**Required:** Specific origin allowlist

**Update `config/cors.php` or middleware:**
```php
'allowed_origins' => [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://' . ($_ENV['APP_FRONTEND_URL'] ?? 'localhost'),
],

'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],

'allowed_headers' => [
    'Content-Type',
    'Authorization',
    'X-Portal-Code',
    'X-Requested-With',
    'Accept',
],

'exposed_headers' => [
    'X-Total-Count',
    'X-Page-Number',
],

'max_age' => 86400, // 24 hours

'supports_credentials' => true,
```

---

### 4. **Add Request Logging & Monitoring**
**Purpose:** Debug slow/failing requests

**Create `app/Http/Middleware/LogRequests.php`:**
```php
class LogRequests
{
    public function handle(Request $request, Closure $next)
    {
        $start = microtime(true);
        
        $response = $next($request);
        
        $duration = (microtime(true) - $start) * 1000; // milliseconds
        
        // Log slow requests (> 1 second)
        if ($duration > 1000) {
            \Log::warning('Slow request detected', [
                'method' => $request->method(),
                'path' => $request->path(),
                'duration_ms' => round($duration, 2),
                'user_id' => auth()->id(),
                'status' => $response->status(),
            ]);
        }
        
        // Log errors
        if ($response->status() >= 500) {
            \Log::error('Server error', [
                'method' => $request->method(),
                'path' => $request->path(),
                'status' => $response->status(),
            ]);
        }
        
        return $response;
    }
}

// Register in kernel.php
protected $middleware = [
    // ...
    \App\Http\Middleware\LogRequests::class,
];
```

---

### 5. **Database Query Optimization**
**Problem:** Getting highest bid from ALL auctions could be slow

**Optimize queries with indexes:**
```sql
-- Add indexes for common queries
ALTER TABLE auctions 
ADD INDEX idx_org_status_bid (organization_id, status, current_bid);

ALTER TABLE auctions
ADD INDEX idx_org_status_created (organization_id, status, created_at);

ALTER TABLE bids
ADD INDEX idx_auction_created (auction_id, created_at);
```

**Optimized query example:**
```php
// Bad - slow
$auctions = Auction::all();
$highest = $auctions->max('current_bid');

// Good - fast
$highest = Auction::where('organization_id', auth()->user()->organization_id)
    ->where('status', 'LIVE')
    ->select('id', 'title', 'current_bid', 'current_bidder_id')
    ->orderByDesc('current_bid')
    ->with('currentBidder:id,name') // Eager load
    ->first();
```

---

### 6. **Field Naming Consistency Check**
**Current:** Frontend sends `auction_id` and `bid_amount` (snake_case) ✅

**Verify backend accepts these exact fields:**
```php
// Double-check in requests
$validated = $request->validate([
    'auction_id' => 'required|...',  // ← Exact field name
    'bid_amount' => 'required|...',  // ← Exact field name
]);
```

---

## 📋 Implementation Checklist

- [ ] **CRITICAL #1:** Fix bid placement endpoint (`/bids/place`)
  - [ ] Add DB locking
  - [ ] Add transaction handling
  - [ ] Test with curl
  - [ ] Check logs for errors
  
- [ ] **CRITICAL #2:** Add `/auth/refresh` endpoint
  - [ ] Implement token refresh logic
  - [ ] Return correct response format
  - [ ] Test token refresh flow
  
- [ ] **HIGH #3:** Improve CORS config
  - [ ] Update allowed origins
  - [ ] Add missing headers
  
- [ ] **HIGH #4:** Add request logging
  - [ ] Create LogRequests middleware
  - [ ] Register in kernel
  - [ ] Test logging output
  
- [ ] **HIGH #5:** Optimize database queries
  - [ ] Add indexes
  - [ ] Refactor slow queries
  
- [ ] **HIGH #6:** Verify field naming
  - [ ] Check API request validation
  - [ ] Update docs if needed

---

## 🧪 Testing After Implementation

```bash
# 1. Test token refresh
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' | jq -r '.data.accessToken')

# 2. Test bid placement
curl -X POST http://localhost:8000/api/v1/bids/place \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"auction_id":"test-id","bid_amount":1000000}' \
  -w "\nResponse time: %{time_total}s\n"

# 3. Check error logs
tail -f storage/logs/laravel.log | grep -E "ERROR|WARNING"
```

---

## 📞 Questions?

If you need clarification on any of these improvements, check:
1. Backend framework docs (Laravel/Laravel Lumen)
2. JWT token implementation docs
3. Database indexing best practices
