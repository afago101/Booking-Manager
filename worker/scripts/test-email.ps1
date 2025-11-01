# Test Email Notification Script for Windows PowerShell
# This script tests the email notification functionality

param(
    [Parameter(Mandatory=$true)]
    [string]$WorkerUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$AdminKey,
    
    [Parameter(Mandatory=$false)]
    [string]$TestEmail = "test@example.com"
)

Write-Host "🧪 Testing Email Notification Functionality" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Test 1: Create a test booking with email
Write-Host "`n📝 Test 1: Creating test booking with email..." -ForegroundColor Yellow

$bookingData = @{
    guestName = "測試用戶"
    contactPhone = "0912345678"
    email = $TestEmail
    lineName = "testuser"
    checkInDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
    checkOutDate = (Get-Date).AddDays(9).ToString("yyyy-MM-dd")
    numberOfGuests = 2
    useCoupon = $false
    arrivalTime = "15:00"
    totalPrice = 10000
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$WorkerUrl/api/bookings" -Method POST -Body $bookingData -ContentType "application/json"
    Write-Host "✅ Booking created successfully!" -ForegroundColor Green
    Write-Host "   Booking ID: $($response.id)" -ForegroundColor Gray
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    
    # Test 2: Check if email settings are configured
    Write-Host "`n📧 Test 2: Checking email settings..." -ForegroundColor Yellow
    
    $headers = @{
        "x-admin-key" = $AdminKey
    }
    
    $settings = Invoke-RestMethod -Uri "$WorkerUrl/api/admin/settings" -Method GET -Headers $headers
    Write-Host "📋 Current email settings:" -ForegroundColor Cyan
    
    $emailSettings = @(
        "emailApiKey",
        "emailFrom", 
        "emailFromName",
        "notificationEmails"
    )
    
    foreach ($setting in $emailSettings) {
        if ($settings.$setting) {
            if ($setting -eq "emailApiKey") {
                Write-Host "   $setting`: [CONFIGURED]" -ForegroundColor Green
            } else {
                Write-Host "   $setting`: $($settings.$setting)" -ForegroundColor Green
            }
        } else {
            Write-Host "   $setting`: [NOT SET]" -ForegroundColor Red
        }
    }
    
    # Test 3: Check Worker logs for email notification
    Write-Host "`n📊 Test 3: Checking for email notification in logs..." -ForegroundColor Yellow
    Write-Host "   Please check your Worker logs using: wrangler tail" -ForegroundColor Gray
    Write-Host "   Look for messages like:" -ForegroundColor Gray
    Write-Host "   - 'Email notification skipped: no API key or recipients'" -ForegroundColor Gray
    Write-Host "   - 'Booking notification email sent successfully to ...'" -ForegroundColor Gray
    Write-Host "   - 'Failed to send email notification: ...'" -ForegroundColor Gray
    
    # Test 4: Setup instructions
    Write-Host "`n⚙️  Test 4: Email Setup Instructions" -ForegroundColor Yellow
    Write-Host "To enable email notifications, you need to:" -ForegroundColor Cyan
    Write-Host "1. Get a Resend API key from https://resend.com" -ForegroundColor White
    Write-Host "2. Set the following secrets in your Worker:" -ForegroundColor White
    Write-Host "   wrangler secret put EMAIL_API_KEY" -ForegroundColor Gray
    Write-Host "   wrangler secret put EMAIL_FROM" -ForegroundColor Gray
    Write-Host "   wrangler secret put EMAIL_FROM_NAME" -ForegroundColor Gray
    Write-Host "3. Configure notification emails in admin settings" -ForegroundColor White
    Write-Host "4. Redeploy your Worker" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
    }
}

Write-Host "`n🏁 Test completed!" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan



