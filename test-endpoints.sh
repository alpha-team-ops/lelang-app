#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== CURL Test Endpoints ===${NC}\n"

# Backend URL
BACKEND_URL="http://localhost:8000"
API_VERSION="v1"

# You need to set your token here
read -p "Enter your ACCESS_TOKEN: " TOKEN

if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}⚠️  Token is empty. Please provide a valid token.${NC}"
  exit 1
fi

echo -e "\n${BLUE}1️⃣  Testing GET /api/v1/admin/stats${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X GET "${BACKEND_URL}/api/${API_VERSION}/admin/stats" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\n\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  -s | jq .

echo -e "\n${BLUE}2️⃣  Testing GET /api/v1/admin/insights?period=day${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X GET "${BACKEND_URL}/api/${API_VERSION}/admin/insights?period=day" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\n\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  -s | jq '.data.priceComparison[0]' 2>/dev/null || echo "No priceComparison data"

echo -e "\n${BLUE}3️⃣  Testing POST /api/v1/bids/place (bid placement)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ℹ️  Note: Update auctionId with a real auction ID"

read -p "Enter AUCTION_ID (or press Enter to skip): " AUCTION_ID

if [ -n "$AUCTION_ID" ]; then
  curl -X POST "${BACKEND_URL}/api/${API_VERSION}/bids/place" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"auctionId\": \"${AUCTION_ID}\", \"bidAmount\": 5000000}" \
    -w "\n\nStatus: %{http_code}\nTime: %{time_total}s\n" \
    -s | jq .
else
  echo "Skipped (no auction ID provided)"
fi

echo -e "\n${GREEN}✅ Test complete!${NC}"
