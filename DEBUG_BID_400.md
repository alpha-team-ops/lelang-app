# 🔍 DEBUG: `/api/v1/bids/place` - 400 Bad Request

## 🚨 Problem
```
POST http://localhost:8000/api/v1/bids/place
[HTTP/1.1 400 Bad Request 15ms]
Bid attempt 1/3: Request failed with status code 400
```

---

## 🧐 Possible Causes (Check These)

### **1. MISSING/INVALID AUTH TOKEN**
```
Error Code: MISSING_TOKEN atau INVALID_TOKEN
```
✅ Check in Browser DevTools > Network > Request Headers:
- Should have: `Authorization: Bearer <token>`
- Token should be valid & not expired

**Fix:**
```typescript
// bidService.ts - Make sure token is being attached
const token = localStorage.getItem('accessToken') || localStorage.getItem('portalToken');
console.log('Token attached:', !!token, token?.substring(0, 20) + '...');
```

---

### **2. WRONG FIELD NAMES**
```
Error: validation error atau unexpected field
```

✅ Check frontend sending correct format:
```typescript
// ✅ CORRECT (snake_case)
{
  "auction_id": "uuid-here",
  "bid_amount": 1500000
}

// ❌ WRONG (camelCase)
{
  "auctionId": "uuid-here",
  "bidAmount": 1500000
}
```

Current code di [bidService.ts](src/data/services/bidService.ts#L84-L87):
```typescript
const response = await bidClient.post('/place', {
  auction_id: request.auctionId,  // ✅ Correct
  bid_amount: request.bidAmount,
});
```
Ini sudah benar!

---

### **3. INVALID AUCTION_ID FORMAT**
```
Error Code: AUCTION_NOT_FOUND
```

✅ Check di console:
```typescript
console.log('Sending auction_id:', request.auctionId); // Should be valid UUID
console.log('Sending bid_amount:', request.bidAmount); // Should be number > 0
```

---

### **4. BID AMOUNT TOO LOW**
```
Error Code: BID_TOO_LOW
```

✅ Logic error di backend:
- Bid harus lebih tinggi dari `currentBid + bidIncrement`
- Contoh: current = 1M, increment = 100K → next bid = 1.1M minimum

---

### **5. AUCTION NOT LIVE**
```
Error Code: AUCTION_NOT_LIVE
```

✅ Hanya bisa bid jika status = "LIVE"
- Check di console: apakah auction status benar-benar LIVE?

---

## 🔧 Debugging Steps

### **Step 1: Check Console Logs**
Buka Browser DevTools (F12) → Console:

Lihat output dari:
```typescript
console.log('🚀 Calling bidService.placeBid with:', {
  auctionId: request.auctionId,
  bidAmount: request.bidAmount,
  // ... 
});
```

### **Step 2: Check Network Tab**
DevTools → Network → Filter "place":

1. Click bid placement request
2. **Request** tab:
   - Headers: `Authorization: Bearer ...` ada?
   - Payload: `auction_id` dan `bid_amount` ada?

3. **Response** tab:
   - Apa error message yang dikembalikan backend?
   - Ada `code` field? (BID_TOO_LOW, AUCTION_NOT_LIVE, etc)

### **Step 3: Test dengan curl**
Terminal:
```bash
# Get token dulu
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.data.accessToken')

echo "Token: $TOKEN"

# Test bid placement
curl -X POST http://localhost:8000/api/v1/bids/place \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "auction_id": "AUCTION_ID_HERE",
    "bid_amount": 5000000
  }' | jq .
```

---

## 📋 Checklist

- [ ] **Token ada dan valid?** (check localStorage)
- [ ] **Field names benar?** (snake_case: `auction_id`, `bid_amount`)
- [ ] **Auction ID valid UUID?** (format: `uuid-v4`)
- [ ] **Bid amount valid?** (harus > currentBid + increment)
- [ ] **Auction status LIVE?** (bukan DRAFT/ENDED)
- [ ] **Backend logs ada error message?** (check server logs)

---

## 🎯 Next Steps

1. **Buka DevTools → Network**
2. **Coba place bid lagi**
3. **Copy response error message**
4. **Share error message di sini** → Saya bisa fix eksak masalahnya!

Contoh response yang harus dicopy:
```json
{
  "success": false,
  "error": "...",
  "code": "...",
  "message": "..."
}
```
