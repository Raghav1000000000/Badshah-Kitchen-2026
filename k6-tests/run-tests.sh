#!/bin/bash
# K6 Load Test Runner for Unix/Linux/Mac
# This script helps you run all load tests and monitor the application

echo "🧪 Badshah's Kitchen Load Testing Suite"
echo "========================================"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 is not installed!"
    echo "Install k6 from: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Check for environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Environment variables not set!"
    echo "Please set SUPABASE_URL and SUPABASE_ANON_KEY"
    echo ""
    echo "Example:"
    echo '  export SUPABASE_URL="https://your-project.supabase.co"'
    echo '  export SUPABASE_ANON_KEY="your-anon-key"'
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📋 Available Tests:"
echo "1. Menu Load Test (100 users)"
echo "2. Order API Test (50 users)"
echo "3. Both tests (sequential)"
echo "4. Exit"
echo ""

read -p "Select test to run (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Running Menu Load Test (100 users)..."
        echo "Duration: ~6 minutes"
        echo ""
        k6 run menu-load-test.js
        ;;
    2)
        echo ""
        echo "🚀 Running Order API Test (50 users)..."
        echo "⚠️  Make sure you've updated MENU_ITEM_IDS in order-api-test.js!"
        echo "Duration: ~4.5 minutes"
        echo ""
        sleep 2
        k6 run order-api-test.js
        ;;
    3)
        echo ""
        echo "🚀 Running Both Tests Sequentially..."
        echo "Total Duration: ~10.5 minutes"
        echo ""
        
        echo ""
        echo "=== Test 1/2: Menu Load Test ==="
        k6 run menu-load-test.js
        
        echo ""
        echo ""
        echo "=== Test 2/2: Order API Test ==="
        echo "⚠️  Make sure you've updated MENU_ITEM_IDS in order-api-test.js!"
        sleep 3
        k6 run order-api-test.js
        
        echo ""
        echo "✅ All tests completed!"
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice!"
        exit 1
        ;;
esac

echo ""
echo "📊 Summary files generated:"
[ -f "menu-load-test-summary.json" ] && echo "  ✓ menu-load-test-summary.json"
[ -f "order-api-test-summary.json" ] && echo "  ✓ order-api-test-summary.json"

echo ""
echo "💡 Tips:"
echo "  • Open kitchen screen: http://localhost:3000/kitchen"
echo "  • Monitor Supabase logs during tests"
echo "  • Clean up test data: see README.md"

echo ""
echo "✨ Done!"
