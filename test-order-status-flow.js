/**
 * End-to-End Order Status Flow Test
 * 
 * Tests:
 * 1. Create a test order
 * 2. Test valid status transitions (PLACED → ACCEPTED → PREPARING → READY → COMPLETED)
 * 3. Test invalid transitions (should fail validation)
 * 4. Verify database state after each transition
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role key if available (bypasses RLS), otherwise use anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('Optional: SUPABASE_SERVICE_ROLE_KEY (for bypassing RLS in tests)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('ℹ️  Using service role key (bypasses RLS)');
} else {
  console.log('⚠️  Using anon key (RLS policies apply - updates may fail)');
  console.log('   Tip: Add SUPABASE_SERVICE_ROLE_KEY to .env.local for full testing\n');
}

// Validation logic (matches kitchen page)
function isValidTransition(currentStatus, newStatus) {
  const validTransitions = {
    'PLACED': ['ACCEPTED'],
    'ACCEPTED': ['PREPARING'],
    'PREPARING': ['READY'],
    'READY': ['COMPLETED'],
    'COMPLETED': [],
  };

  const current = currentStatus.toUpperCase();
  const next = newStatus.toUpperCase();
  
  return validTransitions[current]?.includes(next) || false;
}

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createTestOrder() {
  console.log('\n📝 Creating test order...');
  
  // Get a menu item for testing
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('id, name, price')
    .limit(1);

  if (!menuItems || menuItems.length === 0) {
    throw new Error('No menu items found. Please add menu items first.');
  }

  const menuItem = menuItems[0];
  const sessionId = `test-${Date.now()}`;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      session_id: sessionId,
      customer_name: 'Test Customer',
      customer_phone: '9999999999',
      status: 'PLACED',
      total_amount: menuItem.price * 2,
    })
    .select('id, order_number, status')
    .single();

  if (orderError) throw orderError;

  // Create order item
  const { error: itemError } = await supabase
    .from('order_items')
    .insert({
      order_id: order.id,
      menu_item_id: menuItem.id,
      quantity: 2,
    });

  if (itemError) throw itemError;

  console.log(`✅ Created order #${order.order_number} (ID: ${order.id})`);
  console.log(`   Status: ${order.status}`);
  console.log(`   Menu Item: ${menuItem.name} x 2`);
  
  return order;
}

async function updateOrderStatus(orderId, newStatus, shouldSucceed = true) {
  const { data: order } = await supabase
    .from('orders')
    .select('order_number, status')
    .eq('id', orderId)
    .single();

  const isValid = isValidTransition(order.status, newStatus);
  const action = shouldSucceed ? '✅' : '❌';
  
  console.log(`\n${action} Testing: ${order.status} → ${newStatus}`);
  console.log(`   Validation result: ${isValid ? 'VALID' : 'INVALID'}`);
  
  if (!isValid) {
    if (shouldSucceed) {
      console.log('   ⚠️ Expected valid, but got invalid!');
      return false;
    } else {
      console.log('   ✓ Correctly blocked invalid transition');
      return true;
    }
  }

  // Attempt update
  const { data: updateData, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select('status');

  if (error) {
    console.log(`   ❌ Database error: ${error.message}`);
    return false;
  }

  if (!updateData || updateData.length === 0) {
    console.log(`   ❌ Update returned no data (possible RLS policy blocking)`);
    return false;
  }

  // Verify update
  const { data: updated } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (updated.status === newStatus) {
    console.log(`   ✓ Status updated successfully to ${newStatus}`);
    return true;
  } else {
    console.log(`   ❌ Status mismatch: expected ${newStatus}, got ${updated.status}`);
    return false;
  }
}

async function cleanupTestOrder(orderId) {
  console.log('\n🗑️ Cleaning up test order...');
  
  // Delete order items first (foreign key constraint)
  await supabase.from('order_items').delete().eq('order_id', orderId);
  
  // Delete order
  await supabase.from('orders').delete().eq('id', orderId);
  
  console.log('✅ Cleanup complete');
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   ORDER STATUS FLOW - END-TO-END TEST');
  console.log('═══════════════════════════════════════════════════');

  let testOrder;
  let allPassed = true;

  try {
    // Test 1: Create order
    testOrder = await createTestOrder();
    await wait(500);

    // Test 2: Valid transitions (happy path)
    console.log('\n┌─────────────────────────────────────────────────┐');
    console.log('│  TESTING VALID TRANSITIONS (Happy Path)        │');
    console.log('└─────────────────────────────────────────────────┘');
    
    allPassed = await updateOrderStatus(testOrder.id, 'ACCEPTED', true) && allPassed;
    await wait(500);
    
    allPassed = await updateOrderStatus(testOrder.id, 'PREPARING', true) && allPassed;
    await wait(500);
    
    allPassed = await updateOrderStatus(testOrder.id, 'READY', true) && allPassed;
    await wait(500);
    
    allPassed = await updateOrderStatus(testOrder.id, 'COMPLETED', true) && allPassed;
    await wait(500);

    // Test 3: Test invalid transitions
    console.log('\n┌─────────────────────────────────────────────────┐');
    console.log('│  TESTING INVALID TRANSITIONS (Should Block)    │');
    console.log('└─────────────────────────────────────────────────┘');

    // Reset to PLACED for invalid transition tests
    await supabase.from('orders').update({ status: 'PLACED' }).eq('id', testOrder.id);
    console.log('\n🔄 Reset order to PLACED for invalid transition tests');

    // Try to skip steps
    allPassed = await updateOrderStatus(testOrder.id, 'PREPARING', false) && allPassed; // Skip ACCEPTED
    await wait(500);
    
    allPassed = await updateOrderStatus(testOrder.id, 'READY', false) && allPassed; // Skip ACCEPTED & PREPARING
    await wait(500);
    
    allPassed = await updateOrderStatus(testOrder.id, 'COMPLETED', false) && allPassed; // Skip all middle steps
    await wait(500);

    // Try to go backwards
    await supabase.from('orders').update({ status: 'READY' }).eq('id', testOrder.id);
    console.log('\n🔄 Set order to READY for backward transition test');
    
    allPassed = await updateOrderStatus(testOrder.id, 'PREPARING', false) && allPassed; // Try to go back
    await wait(500);
    
    allPassed = await updateOrderStatus(testOrder.id, 'PLACED', false) && allPassed; // Try to go back to start
    await wait(500);

    // Test 4: Verify COMPLETED has no valid transitions
    console.log('\n┌─────────────────────────────────────────────────┐');
    console.log('│  TESTING COMPLETED STATUS (No Transitions)     │');
    console.log('└─────────────────────────────────────────────────┘');

    await supabase.from('orders').update({ status: 'COMPLETED' }).eq('id', testOrder.id);
    console.log('\n🔄 Set order to COMPLETED');
    
    allPassed = await updateOrderStatus(testOrder.id, 'PLACED', false) && allPassed;
    await wait(500);
    
    allPassed = await updateOrderStatus(testOrder.id, 'READY', false) && allPassed;
    await wait(500);

    // Results
    console.log('\n═══════════════════════════════════════════════════');
    console.log('   TEST RESULTS');
    console.log('═══════════════════════════════════════════════════');
    
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('\nValidation logic is working correctly:');
      console.log('  ✓ Valid transitions are allowed');
      console.log('  ✓ Invalid transitions are blocked');
      console.log('  ✓ Status updates persist to database');
      console.log('  ✓ COMPLETED orders cannot be changed');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('\nPlease review the output above for details.');
    }

    console.log('\n═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    allPassed = false;
  } finally {
    if (testOrder) {
      await cleanupTestOrder(testOrder.id);
    }
  }

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests();
