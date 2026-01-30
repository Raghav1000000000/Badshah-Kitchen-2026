# K6 Load Test Runner
Write-Host "Badshah Kitchen Load Testing Suite" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if k6 is installed
$k6Path = ".\k6.exe"
if (!(Test-Path $k6Path)) {
    if (!(Get-Command k6 -ErrorAction SilentlyContinue)) {
        Write-Host "k6 is not installed!" -ForegroundColor Red
        exit 1
    }
    $k6Path = "k6"
}

# Check for environment variables
if (!$env:SUPABASE_URL -or !$env:SUPABASE_ANON_KEY) {
    Write-Host "Environment variables not set!" -ForegroundColor Yellow
    Write-Host "Please set SUPABASE_URL and SUPABASE_ANON_KEY" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
}

Write-Host ""
Write-Host "Available Tests:" -ForegroundColor Green
Write-Host "1. Menu Load Test - 100 users" -ForegroundColor White
Write-Host "2. Order API Test - 50 users" -ForegroundColor White
Write-Host "3. Both tests - sequential" -ForegroundColor White
Write-Host "4. Exit" -ForegroundColor White

$choice = Read-Host "`nSelect test to run (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`nRunning Menu Load Test..." -ForegroundColor Cyan
        Write-Host "Duration: ~6 minutes" -ForegroundColor Gray
        Write-Host ""
        & $k6Path run menu-load-test.js
    }
    "2" {
        Write-Host "`nRunning Order API Test..." -ForegroundColor Cyan
        Write-Host "Make sure you updated MENU_ITEM_IDS in order-api-test.js!" -ForegroundColor Yellow
        Write-Host "Duration: ~4.5 minutes" -ForegroundColor Gray
        Write-Host ""
        Start-Sleep -Seconds 2
        & $k6Path run order-api-test.js
    }
    "3" {
        Write-Host "`nRunning Both Tests Sequentially..." -ForegroundColor Cyan
        Write-Host "Total Duration: ~10.5 minutes" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "=== Test 1/2: Menu Load Test ===" -ForegroundColor Cyan
        & $k6Path run menu-load-test.js
        
        Write-Host ""
        Write-Host "=== Test 2/2: Order API Test ===" -ForegroundColor Cyan
        Write-Host "Make sure you updated MENU_ITEM_IDS!" -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        & $k6Path run order-api-test.js
        
        Write-Host "`nAll tests completed!" -ForegroundColor Green
    }
    "4" {
        Write-Host "Goodbye!" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host "Invalid choice!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Summary files generated:" -ForegroundColor Green
if (Test-Path "menu-load-test-summary.json") {
    Write-Host "  menu-load-test-summary.json" -ForegroundColor Gray
}
if (Test-Path "order-api-test-summary.json") {
    Write-Host "  order-api-test-summary.json" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Tips:" -ForegroundColor Cyan
Write-Host "  Open kitchen screen: http://localhost:3000/kitchen" -ForegroundColor Gray
Write-Host "  Monitor Supabase logs during tests" -ForegroundColor Gray
Write-Host "  Clean up test data: see README.md" -ForegroundColor Gray

Write-Host "`nDone!" -ForegroundColor Green
