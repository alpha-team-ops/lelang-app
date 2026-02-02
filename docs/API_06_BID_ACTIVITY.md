# Bid Activity API Documentation

**Version:** 1.0.0  
**Priority:** Phase 3 - Core Business  
**Organization Code:** ORG-DERALY-001  
**Depends on:** API_01_AUTHENTICATION.md, API_03_ORGANIZATION_SETUP.md, API_05_AUCTIONS.md, API_10_PORTAL_AUCTIONS.md

---

## Overview

Manages bidding activity on auctions. Handles bid placement, bid history, and bid status tracking. 

**Important:** Bids are placed by **Portal Users** (public/unauthenticated users who register via invitation code), NOT by Staff users from the dashboard.

**Base URL:** `/api/v1/bids`

---

## Data Model

```typescript
interface BidActivity {
  id: string;
  auctionId: string;
  auctionTitle: string;
  bidder: string;
  bidAmount: number;
  timestamp: Date;
  status: 'CURRENT' | 'OUTBID' | 'WINNING';
}
```

---

## Endpoints

### 1. Get All Bid Activity
**Endpoint:** `GET /api/v1/bids/activity`

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| auctionId | string |
| limit | number |
| sort | string |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "auctionId": "1",
      "auctionTitle": "Laptop ASUS ROG Gaming",
      "bidder": "Pembeli_001",
      "bidAmount": 8500000,
      "timestamp": "2026-01-20T14:30:00Z",
      "status": "OUTBID"
    }
  ]
}
```

---

### 2. Get Bids for Auction
**Endpoint:** `GET /api/v1/bids/auction/:auctionId`

**Response:** All bids for specific auction (newest first)

---

### 3. Place Bid
**Endpoint:** `POST /api/v1/bids/place`

**Authentication:**
- Required: Portal Token (from `/api/v1/auth/portal-login`)
- Header: `Authorization: Bearer <PORTAL_TOKEN>`

**Headers:**
```
Authorization: Bearer <PORTAL_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "auctionId": "1",
  "bidAmount": 9000000
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "new-bid-id",
    "auctionId": "1",
    "bidAmount": 9000000,
    "status": "CURRENT",
    "timestamp": "2026-01-28T10:30:00Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Bid amount must be at least 8750000",
  "code": "BID_TOO_LOW"
}
```

**Validation:**
- bidAmount > currentBid
- bidAmount >= currentBid + bidIncrement
- Auction status = LIVE or ENDING
- User (bidder) is NOT the auction seller (checked by comparing seller user_id with bidder user_id)
- User account ACTIVE

**Business Rules:**
- Auto-set status to CURRENT
- Mark previous highest bid as OUTBID
- Update auction's currentBid, totalBids, participantCount
- Log bid activity
- Notify previous bidder (outbid)
- Notify seller
- Use database transaction (atomic)

**Rate Limiting:**
- 10 bids per minute per user

---

### 4. Get User Bid History
**Endpoint:** `GET /api/v1/bids/user/:userId`

**Response:** All bids placed by user with auction details

---

## Error Codes

```
AUCTION_NOT_FOUND - Auction doesn't exist
BID_TOO_LOW - Bid below minimum increment
AUCTION_NOT_LIVE - Cannot bid on non-LIVE auction
CANNOT_BID_OWN_AUCTION - User is seller
ACCOUNT_INACTIVE - User account not active
BID_AFTER_END - Auction already ended
RATE_LIMIT_EXCEEDED - Too many bids per minute
```

---

## Database Schema

```sql
CREATE TABLE bids (
  id VARCHAR(36) PRIMARY KEY,
  auction_id VARCHAR(36) NOT NULL,
  bidder_id VARCHAR(36) NOT NULL COMMENT 'Portal user ID',
  bid_amount DECIMAL(15,2) NOT NULL,
  status ENUM('CURRENT','OUTBID','WINNING') DEFAULT 'CURRENT',
  bid_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (bidder_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_auction_id (auction_id),
  INDEX idx_bidder_id (bidder_id),
  INDEX idx_timestamp (bid_timestamp)
);

CREATE TABLE bid_notifications (
  id VARCHAR(36) PRIMARY KEY,
  bid_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL COMMENT 'Recipient user ID (portal or staff)',
  notification_type VARCHAR(50) COMMENT 'OUTBID, SELLER_NEW_BID, etc',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

---

## User Types in Bidding

### Portal User (Bidder)
- Created via `/api/v1/auth/portal-login`
- Fields: id, fullName, corporateIdNip, directorate, organizationCode, status
- Can place bids on auctions
- Reference: `bids.bidder_id` → `users.id`

### Staff User (Seller/Admin)
- Created via `/api/v1/organization/setup` or staff management
- Fields: id, name, email, role, organization_code, status
- Creates auctions (becomes seller)
- Reference: `auctions.seller` → `users.id`

**Validation:** Seller (`auctions.seller`) and Bidder (`bids.bidder_id`) must be different users to prevent self-bidding.

---

## Testing Checklist

- [ ] Get all bid activity
- [ ] Get bids for specific auction
- [ ] Place bid successfully
- [ ] Reject bid below minimum
- [ ] Reject bid on non-LIVE auction
- [ ] Reject seller bidding on own auction
- [ ] Update currentBid correctly
- [ ] Mark previous bid as OUTBID
- [ ] Rate limiting enforcement
- [ ] Database transaction atomicity
- [ ] Notification sending
- [ ] User bid history

---

## Next APIs

1. [API_07_WINNER_BIDS.md](API_07_WINNER_BIDS.md) - Winners & Payments
