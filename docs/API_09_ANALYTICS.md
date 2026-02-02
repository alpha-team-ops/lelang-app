# Analytics API Documentation

**Version:** 1.0.0  
**Priority:** Phase 5 - Advanced Reporting  
**Organization Code:** ORG-DERALY-001  
**Depends on:** API_01_AUTHENTICATION.md, API_03_ORGANIZATION_SETUP.md, API_05_AUCTIONS.md, API_06_BID_ACTIVITY.md, API_08_STATISTICS.md

---

## Overview

Provides advanced analytics and insights. Includes bid trends, auction performance analysis, bidder metrics, and price comparison tools.

**Base URL:** `/api/v1/analytics`

---

## Data Model

```typescript
interface BidTrend {
  auctionId: string;
  timestamp: Date;
  bidAmount: number;
  participantCount: number;
  bidVelocity: number;
}

interface AuctionPerformance {
  auctionId: string;
  title: string;
  expectedValue: number;
  actualValue: number;
  performanceIndex: number;
  priceGrowth: number;
  participationRate: number;
}

interface BidderMetrics {
  bidderId: string;
  totalBids: number;
  successRate: number;
  averageBidAmount: number;
  totalSpent: number;
  averagePosition: number;
}

interface ConversionMetrics {
  totalViewed: number;
  totalBid: number;
  totalWon: number;
  conversionRate: number;
  winRate: number;
}
```

---

## Endpoints

### 1. Get Bid Trends
**Endpoint:** `GET /api/v1/analytics/bid-trends`

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| auctionId | string |
| period | string (hour/day/week) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "auctionId": "1",
    "title": "Laptop ASUS ROG Gaming",
    "trends": [
      {
        "timestamp": "2026-01-18T10:00:00Z",
        "bidAmount": 8000000,
        "participantCount": 5,
        "bidVelocity": 3
      },
      {
        "timestamp": "2026-01-18T11:00:00Z",
        "bidAmount": 8150000,
        "participantCount": 8,
        "bidVelocity": 5
      }
    ],
    "summary": {
      "startPrice": 8000000,
      "endPrice": 8500000,
      "priceGrowth": 6.25,
      "totalBids": 45,
      "averageBidVelocity": 3.2
    }
  }
}
```

**Bid Velocity:** Number of bids per hour

---

### 2. Get Auction Performance Analysis
**Endpoint:** `GET /api/v1/analytics/auction-performance`

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| status | string |
| category | string |
| page | number |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "auctionId": "1",
      "title": "Laptop ASUS ROG Gaming",
      "expectedValue": 8000000,
      "actualValue": 8500000,
      "performanceIndex": 1.0625,
      "priceGrowth": 6.25,
      "participationRate": 75,
      "totalBids": 45,
      "durationMinutes": 1440
    }
  ],
  "summary": {
    "averagePerformanceIndex": 1.0521,
    "averagePriceGrowth": 5.21,
    "averageParticipationRate": 68
  }
}
```

**Performance Index:** actualValue / expectedValue (>1 = outperformed)

---

### 3. Get Bidder Metrics
**Endpoint:** `GET /api/v1/analytics/bidders`

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| top | number (default 10) |
| orderBy | 'totalSpent' \| 'successRate' \| 'totalBids' |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "bidderId": "CORP-2024-001",
      "bidderName": "Ahmad Rizki",
      "totalBids": 12,
      "successRate": 0.33,
      "totalWins": 4,
      "averageBidAmount": 3500000,
      "totalSpent": 42000000,
      "averagePosition": 2.1,
      "lastBidDate": "2026-01-18T10:30:00Z"
    }
  ]
}
```

---

### 4. Get Conversion Metrics
**Endpoint:** `GET /api/v1/analytics/conversion`

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| period | string |
| category | string |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalViewed": 150,
    "totalBid": 45,
    "totalWon": 15,
    "conversionRate": 0.30,
    "winRate": 0.33,
    "viewToBidRate": 0.30,
    "bidToWinRate": 0.33,
    "trend": "increasing"
  }
}
```

---

### 5. Get Price Comparison
**Endpoint:** `GET /api/v1/analytics/price-comparison`

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| category | string |
| period | string |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "category": "Elektronik",
    "period": "2026-01",
    "auctions": [
      {
        "auctionId": "1",
        "title": "Laptop ASUS ROG Gaming",
        "basePrice": 8000000,
        "sellingPrice": 8500000,
        "markup": 6.25,
        "marketPrice": 8700000,
        "comparison": "below_market"
      }
    ],
    "summary": {
      "averageMarkup": 5.21,
      "averageMarketPrice": 8650000,
      "categoryTrend": "stable"
    }
  }
}
```

---

### 6. Get Top Bidders (Whale Detection)
**Endpoint:** `GET /api/v1/analytics/top-bidders`

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| limit | number (default 5) |
| period | string |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "bidderId": "CORP-2024-001",
      "bidderName": "Ahmad Rizki",
      "totalSpent": 42000000,
      "bidCount": 12,
      "winCount": 4,
      "averageBid": 3500000,
      "riskLevel": "low"
    }
  ],
  "total": 5
}
```

**Risk Level:** Calculated based on bid patterns
- low: Consistent, stable bidding
- medium: Occasional spikes
- high: Erratic behavior, potential fraud

---

### 7. Get Success Rate Metrics
**Endpoint:** `GET /api/v1/analytics/success-rate`

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| category | string |
| period | string |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalAuctions": 22,
    "successfulAuctions": 20,
    "successRate": 0.91,
    "cancelledAuctions": 2,
    "averageParticipants": 12.5,
    "byCategory": [
      {
        "category": "Elektronik",
        "total": 8,
        "successful": 8,
        "rate": 1.0
      }
    ]
  }
}
```

---

### 8. Get Anomaly Detection
**Endpoint:** `GET /api/v1/analytics/anomalies`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "bidAnomalies": [
      {
        "type": "unusual_spike",
        "auctionId": "15",
        "severity": "warning",
        "description": "Bid amount jumped 150% in 5 minutes",
        "timestamp": "2026-01-18T10:30:00Z"
      }
    ],
    "biddingPatternAnomalies": [
      {
        "type": "bidder_pattern",
        "bidderId": "CORP-2024-005",
        "severity": "info",
        "description": "Bidder participated in 5 consecutive auctions",
        "timestamp": "2026-01-18T10:30:00Z"
      }
    ]
  }
}
```

---

## Business Intelligence Features

### Price Elasticity Analysis
```
% Change in Quantity vs % Change in Price
Helps determine optimal starting prices
```

### Bidder Segmentation
```
- Heavy: >10 bids/month, high spending
- Regular: 3-10 bids/month
- Occasional: <3 bids/month
```

### Fraud Detection Signals
```
- Rapid-fire bidding (>20 bids/min)
- Unusual bid patterns
- Price manipulation attempts
- Shill bidding indicators
```

---

## Database Schema

```sql
CREATE TABLE bid_events (
  id VARCHAR(36) PRIMARY KEY,
  auction_id VARCHAR(36) NOT NULL,
  bidder_id VARCHAR(36) NOT NULL,
  bid_amount DECIMAL(15,2),
  bid_velocity INT,
  participant_count INT,
  event_timestamp DATETIME,
  
  FOREIGN KEY (auction_id) REFERENCES auctions(id),
  FOREIGN KEY (bidder_id) REFERENCES staff(id),
  INDEX idx_auction_id (auction_id),
  INDEX idx_event_timestamp (event_timestamp)
);

CREATE TABLE anomaly_logs (
  id VARCHAR(36) PRIMARY KEY,
  anomaly_type VARCHAR(50),
  auction_id VARCHAR(36),
  bidder_id VARCHAR(36),
  severity ENUM('info','warning','critical'),
  description TEXT,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed BOOLEAN DEFAULT FALSE,
  
  INDEX idx_severity (severity),
  INDEX idx_detected_at (detected_at)
);
```

---

## Testing Checklist

- [ ] Get bid trends for auction
- [ ] Get auction performance analysis
- [ ] Get bidder metrics
- [ ] Get conversion metrics
- [ ] Get price comparison
- [ ] Get top bidders (whale detection)
- [ ] Get success rate metrics
- [ ] Get anomaly detection
- [ ] Whale/high-risk bidder identification
- [ ] Fraud detection signals
- [ ] Multi-tenant isolation
- [ ] Permission checks

---

## All APIs Complete

| Phase | APIs | Status |
|-------|------|--------|
| 1 | Authentication, Organization, Staff | ✅ Complete |
| 2 | Roles & Permissions | ✅ Complete |
| 3 | Auctions, Bid Activity | ✅ Complete |
| 4 | Winner Bids | ✅ Complete |
| 5 | Statistics, Analytics | ✅ Complete |

**Total Endpoints:** 47  
**Backend Development Ready:** Yes
