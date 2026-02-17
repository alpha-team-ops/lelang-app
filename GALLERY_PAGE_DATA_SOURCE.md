# 📊 Gallery Page - Card Data Sources

## 📍 Location & Cards

**File:** [GalleryPage.tsx](src/pages/admin/auctions/GalleryPage.tsx#L320-L350)

Cards yang di-display di Gallery Page:
```
┌─────────────────────────────────────┐
│ Total Auctions │ Total Bids │ Total Revenue │
└─────────────────────────────────────┘
```

---

## 🔗 Data Flow

### **Cards yang di-display:**

```
Line 329:  Total Bids
           {statsData?.totalBids || 0}

Line 346:  Total Revenue
           Rp {(statsData?.totalVolume / 1000000).toFixed(0)}M
```

### **Data Source - statsData:**

**Line 188 (GalleryPage.tsx):**
```typescript
const data = await statsService.getDashboardStats();
setStatsData(data);
```

### **Endpoint:**
```
GET /api/v1/admin/stats
```

### **Response Fields:**
```typescript
interface DashboardStats {
  totalAuctions: number;      // Jumlah auction total
  activeAuctions: number;     // Auction yang sedang LIVE
  totalBids: number;          // ← Ditampilkan di card (line 329)
  totalVolume: number;        // ← Ditampilkan di card (line 346)
  completedAuctions: number;
  pendingAuctions: number;
  cancelledAuctions: number;
  averageBidsPerAuction: number;
}
```

---

## 📋 Perbandingan: OverviewPage vs GalleryPage

| Aspek | OverviewPage | GalleryPage |
|-------|------------|-----------|
| **File** | [OverviewPage.tsx](src/pages/admin/dashboard/OverviewPage.tsx) | [GalleryPage.tsx](src/pages/admin/auctions/GalleryPage.tsx) |
| **Endpoint** | `GET /admin/stats` | `GET /admin/stats` |
| **Service** | `statsService.getDashboardStats()` | `statsService.getDashboardStats()` |
| **Card: Total Revenue** | Line 463 | Line 346 |
| **Value** | `stats?.volumeToday` | `statsData?.totalVolume` |
| **Format** | Currency IDR + Filter (Today/7Days) | Divide by 1M + "M" suffix |
| **Issue** | Needs `volumeToday` field | Using `totalVolume` (all time) |

---

## ⚠️ Issue Found

**Gallery Page card menampilkan:**
```
Total Revenue
Rp {(statsData?.totalVolume / 1000000).toFixed(0)}M
```

**Problem:**
- `totalVolume` = Total **semua waktu**, bukan "today"
- Harusnya filter berdasarkan periode (today, 7days, month)

**Current Code (Line 346):**
```typescript
Rp {(statsData?.totalVolume ? statsData.totalVolume / 1000000 : 0).toFixed(0)}M
```

**Should Be:**
```typescript
// Sama seperti OverviewPage, perlu periode filter
Rp {(statsData?.volumeToday ? statsData.volumeToday / 1000000 : 0).toFixed(0)}M

// Atau tambah selector untuk period:
{revenueFilter === 'today' 
  ? statsData?.volumeToday 
  : statsData?.totalVolume
}
```

---

## 🛠️ Solution

### **Backend harus update response:**

```json
{
  "totalAuctions": 48,
  "activeAuctions": 12,
  "totalBids": 1256,
  "totalVolume": 125600000,        // All time
  "volumeToday": 5000000,          // ← TAMBAH INI
  "volumeSevenDays": 25000000,     // ← TAMBAH INI
  "completedAuctions": 32,
  "pendingAuctions": 4,
  "cancelledAuctions": 0,
  "averageBidsPerAuction": 26
}
```

### **TypeScript Interface Update:**

```typescript
export interface DashboardStats {
  totalAuctions: number;
  activeAuctions: number;
  totalBids: number;
  totalVolume: number;
  completedAuctions: number;
  pendingAuctions: number;
  cancelledAuctions: number;
  averageBidsPerAuction: number;
  // ← ADD THESE:
  volumeToday?: number;
  volumeSevenDays?: number;
  volumeMonth?: number;
}
```

---

## ✅ Summary

| Item | GalleryPage | Data Source |
|------|------------|-------------|
| **Total Bids** | 1,256 | `GET /admin/stats` → `totalBids` |
| **Total Revenue** | Rp 125M | `GET /admin/stats` → `totalVolume` (all time) |
| **Issue** | Should show period-based (today/7days) | Needs Backend to return `volumeToday` |
| **Action** | Wait for Backend to add fields | Add `volumeToday`, `volumeSevenDays` |
