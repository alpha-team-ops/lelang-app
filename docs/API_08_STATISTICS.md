# Statistics API Documentation

**Version:** 1.0.0  
**Priority:** Phase 5 - Reporting  
**Organization Code:** ORG-DERALY-001  
**Depends on:** API_01_AUTHENTICATION.md, API_03_ORGANIZATION_SETUP.md, API_05_AUCTIONS.md, API_06_BID_ACTIVITY.md, API_07_WINNER_BIDS.md

---

## Overview

Provides dashboard statistics and aggregated data for reporting. Includes auction performance, bidding activity, and overall platform metrics.

**Base URL:** `/api/v1/statistics`

---

## Data Model

```typescript
interface DashboardStats {
  totalAuctions: number;
  activeAuctions: number;
  completedAuctions: number;
  totalBids: number;
  totalRevenue: number;
  averageBidPerAuction: number;
  bidsPerHour: number;
  conversionRate: number;
}

interface AuctionStats {
  auctionId: string;
  title: string;
  startingPrice: number;
  winningBid: number;
  totalBids: number;
  totalParticipants: number;
  bidGrowth: number;
  increasePercentage: number;
  status: string;
  duration: number;
}

interface PeriodStats {
  period: string;
  totalAuctions: number;
  totalBids: number;
  totalRevenue: number;
  averageBid: number;
  topCategory: string;
}
```

---

## Endpoints

### 1. Get Dashboard Statistics
**Endpoint:** `GET /api/v1/statistics/dashboard`

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| period | string | 'today' (today/week/month/year) |
| withCache | boolean | true |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalAuctions": 22,
    "activeAuctions": 6,
    "completedAuctions": 16,
    "totalBids": 342,
    "totalRevenue": 1285500000,
    "averageBidPerAuction": 3759357,
    "bidsPerHour": 14.25,
    "conversionRate": 0.73
  },
  "generatedAt": "2026-01-18T10:30:00Z"
}
```

**Permissions Required:**
- `view_statistics`

---

### 2. Get Statistics by Period
**Endpoint:** `GET /api/v1/statistics/period`

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| startDate | ISO8601 |
| endDate | ISO8601 |
| groupBy | 'day' \| 'week' \| 'month' |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "period": "2026-01-01",
      "totalAuctions": 4,
      "totalBids": 78,
      "totalRevenue": 245000000,
      "averageBid": 3141025,
      "topCategory": "Elektronik"
    }
  ],
  "summary": {
    "totalAuctions": 22,
    "totalBids": 342,
    "totalRevenue": 1285500000
  }
}
```

---

### 3. Get Auction Statistics
**Endpoint:** `GET /api/v1/statistics/auctions`

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| status | string |
| category | string |
| page | number |
| limit | number |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "auctionId": "1",
      "title": "Laptop ASUS ROG Gaming",
      "startingPrice": 8000000,
      "winningBid": 8500000,
      "totalBids": 45,
      "totalParticipants": 15,
      "bidGrowth": 500000,
      "increasePercentage": 6.25,
      "status": "ENDED",
      "duration": 2880
    }
  ],
  "pagination": {
    "total": 22,
    "page": 1,
    "limit": 10
  }
}
```

---

### 4. Get Bid Statistics
**Endpoint:** `GET /api/v1/statistics/bids`

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| auctionId | string |
| period | string |
| groupBy | 'hour' \| 'day' |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalBids": 342,
    "averageBidAmount": 3759357,
    "medianBidAmount": 3500000,
    "highestBid": 8500000,
    "lowestBid": 100000,
    "bidsPerAuction": 15.5,
    "peakHour": "18:00",
    "peakHourBids": 28,
    "bidTrend": "increasing"
  }
}
```

---

### 5. Get Revenue Statistics
**Endpoint:** `GET /api/v1/statistics/revenue`

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| period | string |
| groupBy | 'day' \| 'week' \| 'month' |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 1285500000,
    "averageRevenuePerAuction": 58432954,
    "topAuction": {
      "id": "1",
      "title": "Laptop ASUS ROG Gaming",
      "revenue": 8500000
    },
    "topCategory": {
      "category": "Elektronik",
      "revenue": 485000000
    },
    "revenueGrowth": 15.5
  }
}
```

---

### 6. Get Category Statistics
**Endpoint:** `GET /api/v1/statistics/categories`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "category": "Elektronik",
      "count": 8,
      "totalBids": 128,
      "totalRevenue": 485000000,
      "averagePrice": 60625000
    }
  ]
}
```

---

## Caching Strategy

For performance, cache statistics at application level:

```javascript
// Cache durations
Dashboard stats: 5 minutes
Period stats: 15 minutes
Auction stats: 5 minutes
Bid stats: 10 minutes
Revenue stats: 30 minutes
Category stats: 60 minutes
```

**Cache Invalidation:**
- Clear on new auction creation
- Clear on bid placement
- Clear on status change
- Clear on winner bid status update

---

## Database Schema

```sql
CREATE TABLE statistics_cache (
  id VARCHAR(36) PRIMARY KEY,
  organization_code VARCHAR(50) NOT NULL,
  stat_type VARCHAR(50),
  period VARCHAR(50),
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  FOREIGN KEY (organization_code) REFERENCES organizations(code),
  INDEX idx_organization_code (organization_code),
  INDEX idx_expires_at (expires_at)
);

CREATE TABLE stat_snapshots (
  id VARCHAR(36) PRIMARY KEY,
  organization_code VARCHAR(50) NOT NULL,
  total_auctions INT,
  active_auctions INT,
  completed_auctions INT,
  total_bids INT,
  total_revenue DECIMAL(15,2),
  average_bid DECIMAL(15,2),
  bids_per_hour DECIMAL(8,2),
  conversion_rate DECIMAL(5,2),
  captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_code) REFERENCES organizations(code),
  INDEX idx_organization_code (organization_code),
  INDEX idx_captured_at (captured_at)
);
```

---

## Performance Considerations

1. **Aggregation Queries:** Use database views for common aggregations
2. **Indexing:** Index on organization_code + status + created_at
3. **Pagination:** Always paginate large result sets
4. **Caching:** Cache frequently accessed stats
5. **Materialized Views:** Consider materialized views for slow queries
6. **Time Zone:** Store all times in UTC, convert on response

---

## Testing Checklist

- [ ] Get dashboard stats
- [ ] Get stats for different periods
- [ ] Get auction statistics
- [ ] Get bid statistics
- [ ] Get revenue statistics
- [ ] Get category statistics
- [ ] Cache invalidation on new auction
- [ ] Cache invalidation on bid placement
- [ ] Multi-tenant isolation
- [ ] Permission checks
- [ ] Performance under load

---

## Next APIs

1. [API_09_ANALYTICS.md](API_09_ANALYTICS.md) - Advanced Analytics
