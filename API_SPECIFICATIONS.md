# Backend API Specifications - For Implementation

## Required Endpoints

### 1. POST `/api/v1/bids/place` - Place Bid

**Current Status:** ❌ BROKEN (times out after 10 seconds)

**Request Format:**
```json
{
  "auction_id": "49fbe6e1-84dc-4d25-a3b3-19f546b4c38e",
  "bid_amount": 1500000
}
```

**Expected Response (Success 201):**
```json
{
  "success": true,
  "data": {
    "id": "bid-uuid-here",
    "bidAmount": 1500000,
    "status": "success",
    "timestamp": "2026-02-17T10:04:39+07:00"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Bid amount is too low",
  "code": "BID_TOO_LOW",
  "message": "Bid amount is too low"
}
```

**Expected Error Codes:**
- `BID_TOO_LOW` - Bid less than current bid + increment
- `AUCTION_NOT_FOUND` - Auction ID invalid
- `AUCTION_NOT_LIVE` - Auction not in LIVE status
- `CANNOT_BID_OWN_AUCTION` - User cannot bid on own auction
- `ACCOUNT_INACTIVE` - User account not active
- `BID_AFTER_END` - Auction already ended
- `RATE_LIMIT_EXCEEDED` - Too many bids in short time
- `INVALID_TOKEN` - Token expired or invalid
- `MISSING_TOKEN` - No authorization header

**Requirements:**
- ✅ Validate `auction_id` is valid UUID
- ✅ Validate `bid_amount` is integer > 0
- ✅ Lock auction row during bid processing
- ✅ Use database transaction
- ✅ Response within 5 seconds (not 10+)
- ✅ Return correct HTTP status codes
- ✅ Log errors for debugging

---

### 2. POST `/api/v1/auth/refresh` - Refresh Access Token

**Current Status:** ❌ MISSING (endpoint doesn't exist)

**Request Format:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response (Success 200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid or expired refresh token",
  "code": "INVALID_TOKEN"
}
```

**Requirements:**
- ✅ Validate refresh token is valid JWT
- ✅ Check token type is "refresh"
- ✅ Check token not expired
- ✅ Verify user still exists and is active
- ✅ Generate new access token (same duration as login)
- ✅ Return within 2 seconds
- ✅ Log refresh attempts for security

---

## API Response Format Contract

### Standard Success Response
```json
{
  "success": true,
  "data": {
    // endpoint-specific data
  },
  "message": "Optional message",
  "timestamp": "2026-02-17T10:04:39+07:00"
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": "Human-readable error",
  "code": "ERROR_CODE",
  "message": "Optional detailed message",
  "timestamp": "2026-02-17T10:04:39+07:00"
}
```

### HTTP Status Codes
- `200` - OK (for GET, successful refresh)
- `201` - Created (for successful POST like bid creation)
- `400` - Bad Request (validation error, bid too low, etc)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (permission denied)
- `404` - Not Found (resource not found)
- `408` - Request Timeout (client timeout, will retry)
- `429` - Too Many Requests (rate limited, will retry)
- `500` - Server Error (unexpected error, will retry)

---

## Testing with curl

### Test Bid Placement
```bash
# Get fresh token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alpha.dev@deraly.id","password":"Real1Novation!"}' \
  | jq -r '.data.accessToken')

echo "Token: $TOKEN"

# Test bid placement
curl -X POST http://localhost:8000/api/v1/bids/place \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "auction_id": "49fbe6e1-84dc-4d25-a3b3-19f546b4c38e",
    "bid_amount": 1500000
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -w "Response Time: %{time_total}s\n" \
  | jq .
```

### Test Token Refresh
```bash
# Get fresh tokens
RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alpha.dev@deraly.id","password":"Real1Novation!"}')

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.data.refreshToken')

echo "Access Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"

# Test refresh endpoint
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | jq .
```

---

## Database Schema Requirements

### `auctions` table
```sql
-- Must have these columns:
- id (UUID, primary key)
- organization_id (UUID, foreign key)
- status (ENUM: 'DRAFT', 'SCHEDULED', 'LIVE', 'ENDED')
- current_bid (BIGINT, default 0)
- current_bidder_id (UUID, nullable)
- starting_price (BIGINT)
- bid_increment (BIGINT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

-- Required indexes:
CREATE INDEX idx_auctions_org_status_bid 
ON auctions(organization_id, status, current_bid DESC);

CREATE INDEX idx_auctions_org_created 
ON auctions(organization_id, created_at DESC);
```

### `bids` table
```sql
-- Must have these columns:
- id (UUID, primary key)
- auction_id (UUID, foreign key, not null)
- user_id (UUID, foreign key, not null)
- amount (BIGINT, not null)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

-- Required indexes:
CREATE INDEX idx_bids_auction_created 
ON bids(auction_id, created_at DESC);

CREATE INDEX idx_bids_user_created 
ON bids(user_id, created_at DESC);
```

### `users` table
```sql
-- Must have these columns:
- id (UUID, primary key)
- is_active (BOOLEAN, default true)
- created_at (TIMESTAMP)
```

---

## Frontend Integration Points

### How Frontend Sends Requests
1. **Bid Placement:**
   - Sends `auction_id` (UUID) and `bid_amount` (integer)
   - With `Authorization: Bearer {accessToken}`
   - Retries 3 times with 1s, 2s, 4s delays
   - Shows user warning after 5 seconds

2. **Token Refresh:**
   - Automatically triggered on 401 response
   - Sends `refreshToken` from localStorage
   - Retries original request with new token
   - Redirects to login if refresh fails

### Error Handling Strategy
1. If `code` matches known error → Show user-friendly message
2. If response time > 5s → Show "taking longer..." message
3. If 4xx error (except 408/429) → Don't retry
4. If 5xx error → Retry with exponential backoff
5. After 3 retries → Show final error to user

---

## Implementation Checklist

### For Laravel/PHP Backend

- [ ] Fix `/bids/place` endpoint
  - [ ] Validate request fields
  - [ ] Lock auction row: `Auction::lockForUpdate()`
  - [ ] Start transaction: `DB::beginTransaction()`
  - [ ] Validate bid amount
  - [ ] Create bid record
  - [ ] Update auction current_bid
  - [ ] Commit transaction
  - [ ] Return JSON with correct format
  - [ ] Handle exceptions and rollback

- [ ] Add `/auth/refresh` endpoint
  - [ ] Validate refresh token format
  - [ ] Decode JWT token
  - [ ] Check token expiry
  - [ ] Check token type is "refresh"
  - [ ] Find and verify user
  - [ ] Generate new access token
  - [ ] Return JSON with correct format

- [ ] Add database migration
  - [ ] Add indexes for auction queries
  - [ ] Ensure all required columns exist
  - [ ] Test index performance

- [ ] Add error logging
  - [ ] Create LogRequests middleware
  - [ ] Log slow requests (> 1 second)
  - [ ] Log server errors (5xx)
  - [ ] Include user_id and request path

- [ ] Update CORS configuration
  - [ ] Add specific allowed origins
  - [ ] Add all required headers
  - [ ] Set max_age to 24 hours
  - [ ] Enable credentials if needed

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| `/bids/place` response | < 5 seconds | 10+ seconds ❌ |
| `/auth/refresh` response | < 2 seconds | N/A (missing) |
| `/admin/stats` response | < 2 seconds | ~1 second ✅ |
| `/admin/insights` response | < 3 seconds | ~1 second ✅ |

---

## Questions for Backend Developer

1. What framework are you using? (Laravel, Lumen, etc)
2. What's causing the `/bids/place` timeout?
3. Is there a database lock or infinite loop?
4. Do you have request/query logs available?
5. What's the current token expiry time?
6. Is JWT library properly configured?

---

## Related FE Files (for reference)

- `src/data/services/bidService.ts` - Bid service with retry
- `src/pages/portal/AuctionModal.tsx` - Bid form with timeout warning
- `src/config/apiClient.ts` - HTTP client with token refresh
- `BE_IMPROVEMENTS_NEEDED.md` - Detailed implementation guide
- `FE_IMPROVEMENTS_DONE.md` - Summary of FE changes
