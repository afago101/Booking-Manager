#!/bin/bash

# Test Email Notification Script for Linux/Mac
# This script tests the email notification functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${CYAN}🧪 Testing Email Notification Functionality${NC}"
    echo -e "${CYAN}===============================================${NC}"
}

print_test() {
    echo -e "\n${YELLOW}📝 Test $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ Error: $1${NC}"
}

print_info() {
    echo -e "${CYAN}📋 $1${NC}"
}

print_instruction() {
    echo -e "${GRAY}   $1${NC}"
}

# Check if required parameters are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 <worker-url> <admin-key> [test-email]"
    echo "Example: $0 https://your-worker.workers.dev your-admin-key test@example.com"
    exit 1
fi

WORKER_URL="$1"
ADMIN_KEY="$2"
TEST_EMAIL="${3:-test@example.com}"

print_status

# Test 1: Create a test booking with email
print_test "1" "Creating test booking with email..."

# Calculate dates (7 days from now for check-in, 9 days for check-out)
CHECK_IN_DATE=$(date -d "+7 days" +%Y-%m-%d)
CHECK_OUT_DATE=$(date -d "+9 days" +%Y-%m-%d)

BOOKING_DATA=$(cat <<EOF
{
    "guestName": "測試用戶",
    "contactPhone": "0912345678",
    "email": "$TEST_EMAIL",
    "lineName": "testuser",
    "checkInDate": "$CHECK_IN_DATE",
    "checkOutDate": "$CHECK_OUT_DATE",
    "numberOfGuests": 2,
    "useCoupon": false,
    "arrivalTime": "15:00",
    "totalPrice": 10000
}
EOF
)

if response=$(curl -s -X POST "$WORKER_URL/api/bookings" \
    -H "Content-Type: application/json" \
    -d "$BOOKING_DATA"); then
    
    print_success "Booking created successfully!"
    booking_id=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    print_instruction "Booking ID: $booking_id"
    print_instruction "Status: $status"
else
    print_error "Failed to create booking"
    exit 1
fi

# Test 2: Check if email settings are configured
print_test "2" "Checking email settings..."

if settings=$(curl -s -X GET "$WORKER_URL/api/admin/settings" \
    -H "x-admin-key: $ADMIN_KEY"); then
    
    print_info "Current email settings:"
    
    # Check each email setting
    email_api_key=$(echo "$settings" | grep -o '"emailApiKey":"[^"]*"' | cut -d'"' -f4)
    email_from=$(echo "$settings" | grep -o '"emailFrom":"[^"]*"' | cut -d'"' -f4)
    email_from_name=$(echo "$settings" | grep -o '"emailFromName":"[^"]*"' | cut -d'"' -f4)
    notification_emails=$(echo "$settings" | grep -o '"notificationEmails":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$email_api_key" ]; then
        print_instruction "emailApiKey: [CONFIGURED]"
    else
        print_instruction "emailApiKey: [NOT SET]"
    fi
    
    if [ -n "$email_from" ]; then
        print_instruction "emailFrom: $email_from"
    else
        print_instruction "emailFrom: [NOT SET]"
    fi
    
    if [ -n "$email_from_name" ]; then
        print_instruction "emailFromName: $email_from_name"
    else
        print_instruction "emailFromName: [NOT SET]"
    fi
    
    if [ -n "$notification_emails" ]; then
        print_instruction "notificationEmails: $notification_emails"
    else
        print_instruction "notificationEmails: [NOT SET]"
    fi
else
    print_error "Failed to retrieve settings"
fi

# Test 3: Check Worker logs for email notification
print_test "3" "Checking for email notification in logs..."
print_instruction "Please check your Worker logs using: wrangler tail"
print_instruction "Look for messages like:"
print_instruction "- 'Email notification skipped: no API key or recipients'"
print_instruction "- 'Booking notification email sent successfully to ...'"
print_instruction "- 'Failed to send email notification: ...'"

# Test 4: Setup instructions
print_test "4" "Email Setup Instructions"
print_info "To enable email notifications, you need to:"
print_instruction "1. Get a Resend API key from https://resend.com"
print_instruction "2. Set the following secrets in your Worker:"
print_instruction "   wrangler secret put EMAIL_API_KEY"
print_instruction "   wrangler secret put EMAIL_FROM"
print_instruction "   wrangler secret put EMAIL_FROM_NAME"
print_instruction "3. Configure notification emails in admin settings"
print_instruction "4. Redeploy your Worker"

echo -e "\n${CYAN}🏁 Test completed!${NC}"
echo -e "${CYAN}===============================================${NC}"



