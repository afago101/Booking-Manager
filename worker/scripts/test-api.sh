#!/bin/bash

# API 測試腳本
# 使用方式: ./scripts/test-api.sh https://your-worker.workers.dev your-admin-key

if [ -z "$1" ]; then
  echo "請提供 Worker URL"
  echo "使用方式: ./scripts/test-api.sh https://your-worker.workers.dev [admin-key]"
  exit 1
fi

WORKER_URL=$1
ADMIN_KEY=${2:-""}
BASE_URL="$WORKER_URL/api"

echo "🧪 測試 Booking Manager API"
echo "================================"
echo "Worker URL: $WORKER_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

test_endpoint() {
  local method=$1
  local endpoint=$2
  local description=$3
  local data=$4
  local admin=$5

  echo "📍 測試: $description"
  echo "   $method $endpoint"

  if [ "$admin" = "true" ] && [ -n "$ADMIN_KEY" ]; then
    headers="-H 'x-admin-key: $ADMIN_KEY'"
  else
    headers=""
  fi

  if [ -n "$data" ]; then
    cmd="curl -s -X $method '$BASE_URL$endpoint' -H 'Content-Type: application/json' $headers -d '$data'"
  else
    cmd="curl -s -X $method '$BASE_URL$endpoint' $headers"
  fi

  response=$(eval $cmd)
  http_code=$(eval "curl -s -o /dev/null -w '%{http_code}' -X $method '$BASE_URL$endpoint' -H 'Content-Type: application/json' $headers $([ -n \"$data\" ] && echo \"-d '$data'\")")

  if [ $http_code -ge 200 ] && [ $http_code -lt 300 ]; then
    echo -e "   ${GREEN}✓ HTTP $http_code${NC}"
  else
    echo -e "   ${RED}✗ HTTP $http_code${NC}"
  fi

  echo "   Response: $response"
  echo ""
}

# === PUBLIC API 測試 ===

echo "📖 Public API 測試"
echo "---"

test_endpoint "GET" "/health" "健康檢查" "" false

test_endpoint "GET" "/availability?from=2024-01-01&to=2024-01-31" "查詢可訂日期" "" false

test_endpoint "POST" "/quote" "計算報價" '{
  "checkInDate": "2024-01-15",
  "checkOutDate": "2024-01-17",
  "numberOfGuests": 2,
  "useCoupon": true
}' false

test_endpoint "POST" "/bookings" "建立訂單" '{
  "guestName": "測試用戶",
  "contactPhone": "0912345678",
  "checkInDate": "2024-02-01",
  "checkOutDate": "2024-02-03",
  "numberOfGuests": 2,
  "useCoupon": false,
  "totalPrice": 10000
}' false

echo ""
echo "================================"
echo ""

# === ADMIN API 測試 ===

if [ -n "$ADMIN_KEY" ]; then
  echo "🔐 Admin API 測試"
  echo "---"

  test_endpoint "GET" "/admin/bookings" "取得所有訂單" "" true

  test_endpoint "GET" "/admin/bookings?status=pending" "取得 pending 訂單" "" true

  test_endpoint "GET" "/admin/settings" "取得設定" "" true

  test_endpoint "PUT" "/admin/settings" "更新設定" '{
    "key": "nightlyPriceDefault",
    "value": "5000"
  }' true

  test_endpoint "GET" "/admin/inventory" "取得房況" "" true

  test_endpoint "PUT" "/admin/inventory/2024-12-25" "更新房況" '{
    "isClosed": true,
    "capacity": 1,
    "note": "聖誕節休息"
  }' true

  echo ""
  echo "================================"
else
  echo "⚠️  未提供 Admin Key，跳過 Admin API 測試"
  echo "   使用方式: ./scripts/test-api.sh $WORKER_URL your-admin-key"
fi

echo ""
echo "✅ 測試完成！"

