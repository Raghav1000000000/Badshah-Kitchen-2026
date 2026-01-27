// Test Supabase Connection
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aazusnehgxgoztqbkdhn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhenVzbmVoZ3hnb3p0cWJrZGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTA2NTYsImV4cCI6MjA4NDkyNjY1Nn0.yb1j8nb29DG5hkElugVGFieYY6ZPCvZGBMqCGUOkNc4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Testing Supabase connection...\n');

// Test 1: Fetch menu items
async function testMenuItems() {
  console.log('1. Testing menu_items table...');
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching menu items:', error.message);
      return false;
    }
    
    console.log('✅ Successfully fetched menu items');
    console.log(`   Found ${data?.length || 0} items`);
    if (data && data.length > 0) {
      console.log('   Sample:', data[0].name);
    }
    return true;
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return false;
  }
}

// Test 2: Check orders table
async function testOrders() {
  console.log('\n2. Testing orders table...');
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing orders:', error.message);
      return false;
    }
    
    console.log('✅ Successfully accessed orders table');
    console.log(`   Found ${data?.length || 0} orders`);
    return true;
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return false;
  }
}

// Test 3: Check order_items table
async function testOrderItems() {
  console.log('\n3. Testing order_items table...');
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing order_items:', error.message);
      return false;
    }
    
    console.log('✅ Successfully accessed order_items table');
    console.log(`   Found ${data?.length || 0} order items`);
    return true;
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const test1 = await testMenuItems();
  const test2 = await testOrders();
  const test3 = await testOrderItems();
  
  console.log('\n' + '='.repeat(50));
  console.log('Test Results:');
  console.log(`  Menu Items: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Orders: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Order Items: ${test3 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(50));
  
  if (test1 && test2 && test3) {
    console.log('\n✅ All tests passed! Supabase connection is working.');
  } else {
    console.log('\n❌ Some tests failed. Check your Supabase configuration:');
    console.log('   1. Verify tables exist in Supabase dashboard');
    console.log('   2. Check RLS policies are configured');
    console.log('   3. Ensure database has data (menu_items)');
  }
}

runTests();
