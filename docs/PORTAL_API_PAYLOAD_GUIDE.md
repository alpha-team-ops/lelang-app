# Portal API Payload Guide
## Lengkap dari Login hingga Auction Access

**Status:** ✅ Complete & Ready  
**Last Updated:** 2026-01-29  
**Organization:** ORG-ALPHACORP-001  

---

## 📋 Daftar Isi
1. [Portal User Login](#1-portal-user-login)
2. [Get Portal Auctions List](#2-get-portal-auctions-list)
3. [Get Single Auction Detail](#3-get-single-auction-detail)
4. [Place Bid](#4-place-bid)
5. [Get Bid Activity](#5-get-bid-activity)
6. [Get User Bid History](#6-get-user-bid-history)
7. [Complete Flow Example](#-complete-flow-example)
8. [Error Responses](#-error-responses)
9. [Data Reference](#-data-reference)

---

## 1. Portal User Login

### Endpoint
```http
POST /api/v1/auth/portal-login
```

### Request Headers
```http
Content-Type: application/json
```

### Request Body
```json
{
  "fullName": "Arif Permana",
  "corporateIdNip": "23232323",
  "directorate": "IT Directorate",
  "invitationCode": "PORT-DAFCCFAA43FC"
}
```

### Request Validation Rules
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| fullName | string | Yes | Min 3 chars, max 100 chars |
| corporateIdNip | string | Yes | Globally unique, alphanumeric, max 50 chars |
| directorate | string | Yes | Non-empty, valid directorate |
| invitationCode | string | Yes | Must be valid & active |

### Response (201 Created - New User)
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "portalToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJuYW1lIjoiQXJpZiBQZXJtYW5hIiwiY29ycG9yYXRlSWROaXAiOiIyMzIzMjMyMyIsImRpcmVjdG9yYXRlIjoiSVQgRGlyZWN0b3JhdGUiLCJvcmdhbml6YXRpb25Db2RlIjoiT1JHLUFMUEhBQ09SUC0wMDEiLCJ1c2VyVHlwZSI6IlBPUlRBTCIsImlhdCI6MTcwNjUwNDAwMCwiZXhwIjoxNzA2NTA3NjAwfQ.SIGNATURE_HERE",
    "expiresIn": 3600,
    "message": "User registered successfully",
    "isNewUser": true
  }
}
```

### Response (200 OK - Existing User)
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "portalToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJuYW1lIjoiQXJpZiBQZXJtYW5hIiwiY29ycG9yYXRlSWROaXAiOiIyMzIzMjMyMyIsImRpcmVjdG9yYXRlIjoiSVQgRGlyZWN0b3JhdGUiLCJvcmdhbml6YXRpb25Db2RlIjoiT1JHLUFMUEhBQ09SUC0wMDEiLCJ1c2VyVHlwZSI6IlBPUlRBTCIsImlhdCI6MTcwNjUwNDAwMCwiZXhwIjoxNzA2NTA3NjAwfQ.SIGNATURE_HERE",
    "expiresIn": 3600,
    "message": "User loaded successfully",
    "isNewUser": false
  }
}
```

### Portal Token Content (Decoded - Backend Only)
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Arif Permana",
  "corporateIdNip": "23232323",
  "directorate": "IT Directorate",
  "organizationCode": "ORG-ALPHACORP-001",
  "userType": "PORTAL",
  "iat": 1706504000,
  "exp": 1706507600
}
```

### Response (400 Bad Request - Invalid Invitation Code)
```json
{
  "success": false,
  "error": "Invalid or inactive invitation code",
  "code": "INVALID_INVITATION_CODE"
}
```

### Response (422 Unprocessable Entity - Validation Error)
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "fullName": ["The full name field is required."],
    "corporateIdNip": ["The corporate id nip field is required."]
  }
}
```

### Business Rules
- ✅ Check if user dengan NIP + organization yang sama sudah ada
- ✅ Jika ada: Update nama jika berbeda, refresh token
- ✅ Jika tidak: Create user baru dengan status ACTIVE
- ✅ Token valid 1 jam (3600 detik)
- ✅ Invitation code harus aktif (portal_invitation_active = true)
- ✅ Token tidak bisa di-refresh (harus login ulang setelah 1 jam)

---

## 2. Get Portal Auctions List

### Endpoint
```http
GET /api/v1/auctions/portal/list?page=1&limit=10&sort=endTime&order=asc&category=Elektronik
```

### Request Headers
```http
Authorization: Bearer <PORTAL_TOKEN>
Content-Type: application/json
```

### Query Parameters
| Parameter | Type | Default | Required | Description |
|-----------|------|---------|----------|-------------|
| page | number | 1 | No | Halaman (mulai dari 1) |
| limit | number | 10 | No | Items per page (max: 50) |
| sort | string | endTime | No | Field: endTime, currentBid, createdAt |
| order | string | asc | No | asc atau desc |
| category | string | - | No | Filter by category |

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "61f3d1d1-3c3a-4629-8ec5-3f53667148fb",
      "title": "Laptop ASUS ROG Gaming",
      "description": "High performance gaming laptop in excellent condition",
      "category": "Elektronik",
      "condition": "Sangat Baik",
      "currentBid": 8500000,
      "reservePrice": 7500000,
      "status": "LIVE",
      "endTime": "2026-01-30T15:30:00Z",
      "participantCount": 12,
      "images": [
        "https://minio.example.com/auctions/image1.jpg",
        "https://minio.example.com/auctions/image2.jpg"
      ]
    },
    {
      "id": "71f3d1d1-3c3a-4629-8ec5-3f53667148fc",
      "title": "Samsung Galaxy S24 Ultra",
      "description": "Smartphone flagship terbaru dengan 5G support",
      "category": "Elektronik",
      "condition": "Baru",
      "currentBid": 12000000,
      "reservePrice": 11000000,
      "status": "LIVE",
      "endTime": "2026-01-31T10:00:00Z",
      "participantCount": 25,
      "images": [
        "https://minio.example.com/auctions/s24-1.jpg",
        "https://minio.example.com/auctions/s24-2.jpg"
      ]
    },
    {
      "id": "81f3d1d1-3c3a-4629-8ec5-3f53667148fd",
      "title": "iPad Pro 12.9 inch M2",
      "description": "Tablet premium dengan Apple Pencil",
      "category": "Elektronik",
      "condition": "Bagus",
      "currentBid": 5500000,
      "reservePrice": 5000000,
      "status": "LIVE",
      "endTime": "2026-02-01T14:20:00Z",
      "participantCount": 8,
      "images": [
        "https://minio.example.com/auctions/ipad-1.jpg"
      ]
    },
    {
      "id": "91f3d1d1-3c3a-4629-8ec5-3f53667148fe",
      "title": "Apple Watch Series 9",
      "description": "Smartwatch terbaru dengan AI health features",
      "category": "Elektronik",
      "condition": "Baru",
      "currentBid": 3500000,
      "reservePrice": 3000000,
      "status": "LIVE",
      "endTime": "2026-02-02T09:15:00Z",
      "participantCount": 15,
      "images": [
        "https://minio.example.com/auctions/watch-1.jpg"
      ]
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Response (400 Bad Request - Invalid Category)
```json
{
  "success": false,
  "error": "Invalid category",
  "code": "INVALID_PARAMETER"
}
```

### Response (401 Unauthorized - Missing Token)
```json
{
  "success": false,
  "error": "Missing authorization token",
  "code": "MISSING_TOKEN"
}
```

### Supported Categories
- Elektronik
- Jam Tangan
- Furniture
- Fotografi
- Seni
- Perhiasan
- Koleksi
- Lainnya

### Penting ⚠️
- ❌ **organizationCode TIDAK ada** di response
- ✅ Hanya auction dari org user (extracted dari token) yang ditampilkan
- ✅ Hanya status LIVE/ENDING yang ditampilkan
- ✅ Pagination included
- ✅ Images array kosong jika tidak ada gambar

---

## 3. Get Single Auction Detail

### Endpoint
```http
GET /api/v1/auctions/portal/61f3d1d1-3c3a-4629-8ec5-3f53667148fb
```

### Request Headers
```http
Authorization: Bearer <PORTAL_TOKEN>
Content-Type: application/json
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "61f3d1d1-3c3a-4629-8ec5-3f53667148fb",
    "title": "Laptop ASUS ROG Gaming",
    "description": "High performance gaming laptop in excellent condition. Intel Core i9-13900K, RTX 4090, 32GB DDR5 RAM, 1TB NVMe SSD, 144Hz display",
    "category": "Elektronik",
    "condition": "Sangat Baik",
    "currentBid": 8500000,
    "reservePrice": 7500000,
    "status": "LIVE",
    "endTime": "2026-01-30T15:30:00Z",
    "participantCount": 12,
    "images": [
      "https://minio.example.com/auctions/image1.jpg",
      "https://minio.example.com/auctions/image2.jpg",
      "https://minio.example.com/auctions/image3.jpg"
    ]
  }
}
```

### Response (404 Not Found)
```json
{
  "success": false,
  "error": "Auction not found",
  "code": "AUCTION_NOT_FOUND"
}
```

### Response (401 Unauthorized)
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "code": "INVALID_TOKEN"
}
```

---

## 4. Place Bid

### Endpoint
```http
POST /api/v1/bids/place
```

### Request Headers
```http
Authorization: Bearer <PORTAL_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "auctionId": "61f3d1d1-3c3a-4629-8ec5-3f53667148fb",
  "bidAmount": 9000000
}
```

### Request Validation
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| auctionId | string (UUID) | Yes | Must be valid auction ID |
| bidAmount | number | Yes | Must be > currentBid and >= currentBid + increment |

### Response (201 Created - Success)
```json
{
  "success": true,
  "data": {
    "id": "bid-uuid-12345678-9abc-def0-1234-567890abcdef",
    "auctionId": "61f3d1d1-3c3a-4629-8ec5-3f53667148fb",
    "bidAmount": 9000000,
    "status": "CURRENT",
    "timestamp": "2026-01-28T10:30:00Z"
  }
}
```

### Bid Validation Example
```
Current Bid: 8,500,000
Bid Increment: 250,000
Minimum Next Bid: 8,500,000 + 250,000 = 8,750,000

User Bid: 9,000,000
Result: ✅ ACCEPTED (9,000,000 >= 8,750,000)
```

### Response (400 Bad Request - Bid Too Low)
```json
{
  "success": false,
  "error": "Bid amount must be at least 8750000",
  "code": "BID_TOO_LOW"
}
```

### Response (400 Bad Request - Auction Not Live)
```json
{
  "success": false,
  "error": "Cannot bid on non-LIVE auction",
  "code": "AUCTION_NOT_LIVE"
}
```

### Response (400 Bad Request - Auction Already Ended)
```json
{
  "success": false,
  "error": "Auction already ended",
  "code": "BID_AFTER_END"
}
```

### Response (403 Forbidden - Cannot Bid Own Auction)
```json
{
  "success": false,
  "error": "You cannot bid on your own auction",
  "code": "CANNOT_BID_OWN_AUCTION"
}
```

### Response (403 Forbidden - Account Inactive)
```json
{
  "success": false,
  "error": "Your account is not active",
  "code": "ACCOUNT_INACTIVE"
}
```

### Response (404 Not Found - Auction Not Found)
```json
{
  "success": false,
  "error": "Auction not found",
  "code": "AUCTION_NOT_FOUND"
}
```

### Response (429 Too Many Requests - Rate Limit)
```json
{
  "success": false,
  "error": "Too many bids. Maximum 10 bids per minute",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### Response (401 Unauthorized - Invalid Token)
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "code": "INVALID_TOKEN"
}
```

### Business Rules
- ✅ Bid amount harus > current bid
- ✅ Bid amount harus >= current_bid + bid_increment
- ✅ Auction status harus LIVE atau ENDING
- ✅ User tidak boleh bid pada auction mereka sendiri (seller check)
- ✅ Account user harus ACTIVE
- ✅ Auction tidak boleh sudah ended
- ✅ Rate limit: 10 bids per minute per user
- ✅ Atomic transaction: previous bid marked OUTBID, notifications created
- ✅ Participant count auto-incremented

---

## 5. Get Bid Activity

### Endpoint
```http
GET /api/v1/bids/activity?auctionId=61f3d1d1-3c3a-4629-8ec5-3f53667148fb&page=1&limit=10
```

### Request Headers
```http
Content-Type: application/json
```

**Catatan:** Endpoint ini PUBLIC - tidak perlu authentication

### Query Parameters
| Parameter | Type | Default | Required | Description |
|-----------|------|---------|----------|-------------|
| auctionId | string (UUID) | - | No | Filter by specific auction |
| page | number | 1 | No | Halaman |
| limit | number | 10 | No | Items per page (max: 50) |

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "bid-uuid-12345678-9abc-def0-1234-567890abcdef",
      "auctionId": "61f3d1d1-3c3a-4629-8ec5-3f53667148fb",
      "bidderId": "550e8400-e29b-41d4-a716-446655440000",
      "bidderName": "Arif Permana",
      "bidAmount": 9000000,
      "status": "CURRENT",
      "timestamp": "2026-01-28T10:30:00Z"
    },
    {
      "id": "bid-uuid-87654321-9abc-def0-1234-567890abcdef",
      "auctionId": "61f3d1d1-3c3a-4629-8ec5-3f53667148fb",
      "bidderId": "660e8400-e29b-41d4-a716-446655440001",
      "bidderName": "Budi Santoso",
      "bidAmount": 8750000,
      "status": "OUTBID",
      "timestamp": "2026-01-28T09:45:00Z"
    },
    {
      "id": "bid-uuid-56789012-9abc-def0-1234-567890abcdef",
      "auctionId": "61f3d1d1-3c3a-4629-8ec5-3f53667148fb",
      "bidderId": "770e8400-e29b-41d4-a716-446655440002",
      "bidderName": "Citra Dewi",
      "bidAmount": 8500000,
      "status": "OUTBID",
      "timestamp": "2026-01-28T09:15:00Z"
    },
    {
      "id": "bid-uuid-34567890-9abc-def0-1234-567890abcdef",
      "auctionId": "61f3d1d1-3c3a-4629-8ec5-3f53667148fb",
      "bidderId": "880e8400-e29b-41d4-a716-446655440003",
      "bidderName": "Dwi Hartono",
      "bidAmount": 8250000,
      "status": "OUTBID",
      "timestamp": "2026-01-28T08:30:00Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

### Response (400 Bad Request - Invalid Auction ID)
```json
{
  "success": false,
  "error": "Invalid auction ID format",
  "code": "INVALID_PARAMETER"
}
```

---

## 6. Get User Bid History

### Endpoint
```http
GET /api/v1/bids/user/550e8400-e29b-41d4-a716-446655440000?page=1&limit=10
```

### Request Headers
```http
Content-Type: application/json
```

**Catatan:** Endpoint ini PUBLIC - tidak perlu authentication

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "bid-uuid-12345678-9abc-def0-1234-567890abcdef",
      "auctionId": "61f3d1d1-3c3a-4629-8ec5-3f53667148fb",
      "auctionTitle": "Laptop ASUS ROG Gaming",
      "bidAmount": 9000000,
      "status": "CURRENT",
      "timestamp": "2026-01-28T10:30:00Z"
    },
    {
      "id": "bid-uuid-11111111-9abc-def0-1234-567890abcdef",
      "auctionId": "71f3d1d1-3c3a-4629-8ec5-3f53667148fc",
      "auctionTitle": "Samsung Galaxy S24 Ultra",
      "bidAmount": 12500000,
      "status": "OUTBID",
      "timestamp": "2026-01-27T14:15:00Z"
    },
    {
      "id": "bid-uuid-22222222-9abc-def0-1234-567890abcdef",
      "auctionId": "81f3d1d1-3c3a-4629-8ec5-3f53667148fd",
      "auctionTitle": "iPad Pro 12.9 inch",
      "bidAmount": 5750000,
      "status": "CURRENT",
      "timestamp": "2026-01-26T11:45:00Z"
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## 🔄 Complete Flow Example

### Step-by-Step Manual Testing

#### 1. Login Portal User
```bash
curl -X POST http://localhost:8000/api/v1/auth/portal-login \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Arif Permana",
    "corporateIdNip": "23232323",
    "directorate": "IT Directorate",
    "invitationCode": "PORT-DAFCCFAA43FC"
  }'
```

**Save response:**
```bash
PORTAL_TOKEN="<token_dari_response>"
```

#### 2. Get Auction List
```bash
curl -X GET "http://localhost:8000/api/v1/auctions/portal/list?page=1&limit=10" \
  -H "Authorization: Bearer $PORTAL_TOKEN"
```

**Simpan auction ID dari response:**
```bash
AUCTION_ID="61f3d1d1-3c3a-4629-8ec5-3f53667148fb"
```

#### 3. Get Single Auction Detail
```bash
curl -X GET "http://localhost:8000/api/v1/auctions/portal/$AUCTION_ID" \
  -H "Authorization: Bearer $PORTAL_TOKEN"
```

#### 4. Place Bid
```bash
curl -X POST http://localhost:8000/api/v1/bids/place \
  -H "Authorization: Bearer $PORTAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "auctionId": "'$AUCTION_ID'",
    "bidAmount": 9000000
  }'
```

#### 5. Get Bid Activity
```bash
curl -X GET "http://localhost:8000/api/v1/bids/activity?auctionId=$AUCTION_ID" \
  -H "Content-Type: application/json"
```

#### 6. Get User Bid History
```bash
curl -X GET "http://localhost:8000/api/v1/bids/user/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json"
```

### Bash Script Lengkap
```bash
#!/bin/bash

BASE_URL="http://localhost:8000"
INVITE_CODE="PORT-DAFCCFAA43FC"
NIP="23232323"
FULL_NAME="Arif Permana"
DIRECTORATE="IT Directorate"

echo "=========================================="
echo "Portal API Complete Flow Test"
echo "=========================================="

# 1. Login
echo -e "\n[1] Portal Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/portal-login" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "'$FULL_NAME'",
    "corporateIdNip": "'$NIP'",
    "directorate": "'$DIRECTORATE'",
    "invitationCode": "'$INVITE_CODE'"
  }')

PORTAL_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.portalToken')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.userId')
IS_NEW=$(echo $LOGIN_RESPONSE | jq -r '.data.isNewUser')

echo "✓ Login successful"
echo "  User ID: $USER_ID"
echo "  Is New: $IS_NEW"
echo "  Token: ${PORTAL_TOKEN:0:50}..."

# 2. Get Auction List
echo -e "\n[2] Get Portal Auctions..."
AUCTIONS=$(curl -s -X GET "$BASE_URL/api/v1/auctions/portal/list?page=1&limit=5" \
  -H "Authorization: Bearer $PORTAL_TOKEN")

TOTAL=$(echo $AUCTIONS | jq -r '.pagination.total')
AUCTION_ID=$(echo $AUCTIONS | jq -r '.data[0].id')
AUCTION_TITLE=$(echo $AUCTIONS | jq -r '.data[0].title')

echo "✓ Retrieved auctions"
echo "  Total: $TOTAL"
echo "  First Auction: $AUCTION_TITLE"
echo "  Auction ID: $AUCTION_ID"

# 3. Get Single Auction
echo -e "\n[3] Get Single Auction Detail..."
AUCTION_DETAIL=$(curl -s -X GET "$BASE_URL/api/v1/auctions/portal/$AUCTION_ID" \
  -H "Authorization: Bearer $PORTAL_TOKEN")

CURRENT_BID=$(echo $AUCTION_DETAIL | jq -r '.data.currentBid')
RESERVE=$(echo $AUCTION_DETAIL | jq -r '.data.reservePrice')
END_TIME=$(echo $AUCTION_DETAIL | jq -r '.data.endTime')
PARTICIPANT_COUNT=$(echo $AUCTION_DETAIL | jq -r '.data.participantCount')

echo "✓ Retrieved auction details"
echo "  Title: $AUCTION_TITLE"
echo "  Current Bid: Rp$CURRENT_BID"
echo "  Reserve: Rp$RESERVE"
echo "  End Time: $END_TIME"
echo "  Participants: $PARTICIPANT_COUNT"

# 4. Place Bid
echo -e "\n[4] Place Bid..."
BID_AMOUNT=$((CURRENT_BID + 250000))

BID_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/bids/place" \
  -H "Authorization: Bearer $PORTAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "auctionId": "'$AUCTION_ID'",
    "bidAmount": '$BID_AMOUNT'
  }')

BID_SUCCESS=$(echo $BID_RESPONSE | jq -r '.success')

if [ "$BID_SUCCESS" = "true" ]; then
  BID_ID=$(echo $BID_RESPONSE | jq -r '.data.id')
  echo "✓ Bid placed successfully"
  echo "  Bid ID: $BID_ID"
  echo "  Amount: Rp$BID_AMOUNT"
else
  ERROR=$(echo $BID_RESPONSE | jq -r '.error')
  echo "✗ Bid failed: $ERROR"
fi

# 5. Get Bid Activity
echo -e "\n[5] Get Bid Activity..."
ACTIVITY=$(curl -s -X GET "$BASE_URL/api/v1/bids/activity?auctionId=$AUCTION_ID&limit=5" \
  -H "Content-Type: application/json")

TOTAL_BIDS=$(echo $ACTIVITY | jq -r '.pagination.total')
HIGHEST_BID=$(echo $ACTIVITY | jq -r '.data[0].bidAmount')
HIGHEST_BIDDER=$(echo $ACTIVITY | jq -r '.data[0].bidderName')

echo "✓ Retrieved bid activity"
echo "  Total Bids: $TOTAL_BIDS"
echo "  Highest Bid: Rp$HIGHEST_BID by $HIGHEST_BIDDER"

# 6. Get User Bid History
echo -e "\n[6] Get User Bid History..."
HISTORY=$(curl -s -X GET "$BASE_URL/api/v1/bids/user/$USER_ID?limit=10" \
  -H "Content-Type: application/json")

MY_BIDS=$(echo $HISTORY | jq -r '.pagination.total')

echo "✓ Retrieved bid history"
echo "  Your Total Bids: $MY_BIDS"

echo -e "\n=========================================="
echo "✅ All tests completed successfully!"
echo "=========================================="
```

---

## ⚠️ Error Responses

### Common Error Codes

| Code | HTTP | Description | Solution |
|------|------|-------------|----------|
| INVALID_INVITATION_CODE | 400 | Kode undangan invalid/tidak aktif | Verifikasi kode undangan dengan admin |
| VALIDATION_ERROR | 422 | Ada field yang kosong/invalid | Periksa semua field required |
| AUCTION_NOT_FOUND | 404 | Auction tidak ada | Gunakan auction ID yang benar |
| BID_TOO_LOW | 400 | Bid kurang dari minimum | Bid harus >= currentBid + increment |
| AUCTION_NOT_LIVE | 400 | Auction tidak dalam status LIVE | Tunggu auction dibuka |
| CANNOT_BID_OWN_AUCTION | 403 | User adalah penjual | Tidak boleh bid auction sendiri |
| ACCOUNT_INACTIVE | 403 | Akun user tidak aktif | Hubungi admin |
| BID_AFTER_END | 400 | Auction sudah ended | Auction sudah selesai |
| RATE_LIMIT_EXCEEDED | 429 | Terlalu banyak bid dalam 1 menit | Tunggu beberapa detik |
| MISSING_TOKEN | 401 | Authorization header tidak ada | Sertakan token di header |
| INVALID_TOKEN | 401 | Token invalid/expired | Login kembali |
| INVALID_PARAMETER | 400 | Parameter query invalid | Periksa format parameter |

### Example Error Response
```json
{
  "success": false,
  "error": "Bid amount must be at least 8750000",
  "code": "BID_TOO_LOW"
}
```

---

## 📊 Data Reference

### Test Data

| Item | Value |
|------|-------|
| Organization Code | ORG-ALPHACORP-001 |
| Invitation Code | PORT-DAFCCFAA43FC |
| Portal User Name | Arif Permana |
| Corporate ID/NIP | 23232323 |
| Directorate | IT Directorate |
| Total Auctions | 20 |
| Total Bids | 150+ |
| Portal Token Expiry | 3600 seconds (1 hour) |

### Sample Auction Data
```json
{
  "id": "61f3d1d1-3c3a-4629-8ec5-3f53667148fb",
  "title": "Laptop ASUS ROG Gaming",
  "currentBid": 8500000,
  "reservePrice": 7500000,
  "bidIncrement": 250000,
  "participantCount": 12,
  "endTime": "2026-01-30T15:30:00Z"
}
```

### Bid Validation Calculation
```
Current Bid: 8,500,000
Bid Increment: 250,000

Minimum Next Bid: 8,500,000 + 250,000 = 8,750,000

Valid Bids:
  - 8,750,000 ✅
  - 9,000,000 ✅
  - 10,000,000 ✅
  
Invalid Bids:
  - 8,500,000 ❌ (tidak lebih tinggi dari current)
  - 8,700,000 ❌ (tidak mencapai minimum increment)
```

### Categories Available
```
- Elektronik
- Jam Tangan
- Furniture
- Fotografi
- Seni
- Perhiasan
- Koleksi
- Lainnya
```

---

## 🔐 Security Notes

### Organization Code
- ❌ **TIDAK ada** di API response
- ✅ Tersimpan **INTERNAL di JWT token**
- ✅ Backend otomatis filter auction berdasarkan org dari token
- ✅ Portal user hanya bisa akses auction org mereka

### Token Management
- ✅ Token valid **1 jam**
- ✅ Tidak bisa di-refresh
- ✅ Harus login ulang setelah expired
- ✅ Signed dengan secret key backend
- ✅ Signature invalid jika token dimodifikasi

### Rate Limiting
- ✅ **10 bids per minute** per user
- ✅ Counter reset setiap minute
- ✅ Return 429 jika limit exceeded

---

## 📝 Frontend Integration Notes

### Session Storage
```javascript
// Save portal token after login
localStorage.setItem('portalToken', response.data.portalToken);

// Use token in all requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('portalToken')}`,
  'Content-Type': 'application/json'
};

// Clear on logout
localStorage.removeItem('portalToken');
```

### Error Handling
```javascript
if (response.code === 'INVALID_TOKEN') {
  // Token expired, redirect to login
  window.location.href = '/portal/login';
}

if (response.code === 'BID_TOO_LOW') {
  // Show validation error to user
  showError(`Bid minimum: Rp${response.details.minimumBid}`);
}
```

### Auto-Logout After Expiry
```javascript
// Set timeout untuk 1 jam
setTimeout(() => {
  localStorage.removeItem('portalToken');
  // Redirect ke login
}, 3600000);
```

---

## ✅ Checklist untuk Testing

- [ ] Login dengan invitation code berhasil
- [ ] Token diterima dan tersimpan
- [ ] Auction list tampil tanpa error
- [ ] Single auction detail terload
- [ ] Bid placement berhasil
- [ ] Bid validation working (BID_TOO_LOW error)
- [ ] Bid activity tampil dengan benar
- [ ] User bid history tampil
- [ ] Token expired after 1 hour
- [ ] Cross-org access prevented
- [ ] Rate limiting working (10 bids/minute)
- [ ] Seller cannot bid own auction
- [ ] Invalid invitation code rejected

---

## 📞 Support

Jika ada error atau pertanyaan:
1. Periksa portal token masih valid (< 1 jam)
2. Pastikan invitation code aktif
3. Verifikasi auction ID format (UUID)
4. Cek bid amount >= currentBid + increment
5. Review error code dari API response

---

**Last Updated:** 2026-01-29  
**Status:** ✅ Complete & Verified  
**Ready for:** Frontend Integration Testing
