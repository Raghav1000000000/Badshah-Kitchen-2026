/**
 * Session Helper - Client-side only
 * Manages a persistent session_id in localStorage for customer device tracking
 * 
 * ============================================================================
 * KEY CONCEPTS: SESSION_ID vs CUSTOMER IDENTITY
 * ============================================================================
 * 
 * SESSION_ID (Technical):
 *   - What: Random UUID (e.g., "3f7a2b5c-8d1e-4f9a-b2c6-7e8d1f2a3b4c")
 *   - Stored: localStorage['session_id']
 *   - Purpose: Identify this device/browser session
 *   - Generated: Once when app first loads (if missing)
 *   - Lifetime: Until logout or localStorage cleared
 *   - Visible: Backend only (database queries)
 * 
 * CUSTOMER IDENTITY (User-facing):
 *   - What: Name + Phone (e.g., "John Doe", "+1234567890")
 *   - Stored: localStorage['customer_name'] + localStorage['customer_phone']
 *   - Purpose: Display on orders, contact information
 *   - Generated: User enters via form on checkout
 *   - Lifetime: Until logout
 *   - Visible: Frontend and backend (shown on orders page)
 * 
 * ============================================================================
 * ORDER SCOPING - HOW ORDERS ARE LINKED
 * ============================================================================
 * 
 * Database Schema:
 *   orders table:
 *     - id (primary key)
 *     - session_id (links to this browser session)
 *     - customer_name (from customer identity)
 *     - customer_phone (from customer identity)
 *     - total_amount, status, created_at
 * 
 * Query Pattern:
 *   SELECT * FROM orders WHERE session_id = current_session_id
 * 
 * This means:
 *   ✅ Orders are ALWAYS scoped to session_id
 *   ✅ Only orders from THIS browser session are visible
 *   ✅ Different session_id = completely separate order history
 *   ✅ No cross-session visibility (privacy by design)
 * 
 * ============================================================================
 * LOGOUT BEHAVIOR - ALLOWING FRESH USERS
 * ============================================================================
 * 
 * When user clicks logout:
 *   1. clearCustomerIdentity() → Removes name + phone
 *   2. localStorage.removeItem('session_id') → Removes session_id
 *   3. sessionStorage.removeItem('cart') → Clears cart
 *   4. window.location.reload() → Reloads page
 * 
 * After reload:
 *   1. getSessionId() runs → No session_id found
 *   2. New UUID generated → Stored in localStorage
 *   3. New session_id ≠ old session_id
 *   4. Orders query returns empty (no matching session_id)
 * 
 * Result:
 *   ✅ Fresh user experience
 *   ✅ Empty order history
 *   ✅ No customer info
 *   ✅ Empty cart
 *   ✅ Previous orders still in database but NOT visible
 * 
 * ============================================================================
 * USE CASE: SHARED DEVICE (Café Tablet)
 * ============================================================================
 * 
 * Scenario:
 *   Customer A (Alice):
 *     - Opens app → session_id = "aaa-111"
 *     - Enters name "Alice" + phone "111-222-3333"
 *     - Places 3 orders → All linked to session_id "aaa-111"
 *     - Views /orders → Sees her 3 orders
 * 
 *   Customer A logs out:
 *     - session_id "aaa-111" removed from localStorage
 *     - Page reloads
 * 
 *   Customer B (Bob):
 *     - Same device, new session_id = "bbb-222"
 *     - Enters name "Bob" + phone "444-555-6666"
 *     - Places 2 orders → All linked to session_id "bbb-222"
 *     - Views /orders → Sees ONLY his 2 orders (not Alice's)
 * 
 *   Why Bob can't see Alice's orders:
 *     - Alice's orders: session_id = "aaa-111"
 *     - Bob's session: session_id = "bbb-222"
 *     - Query: WHERE session_id = "bbb-222" → No match
 * 
 * ============================================================================
 * SESSION LIFECYCLE:
 * ============================================================================
 * 1. App loads → getSessionId() checks localStorage
 * 2. If session_id exists → reuse it (returning customer)
 * 3. If session_id missing → generate new UUID and store it (new customer)
 * 4. On logout → clearSession() removes session_id from localStorage
 * 5. After logout reload → new session_id generated (fresh start)
 * ============================================================================
 */

const SESSION_KEY = 'session_id';

/**
 * Generates a UUID v4
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID generation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Gets or creates a session_id from localStorage
 * 
 * BEHAVIOR:
 * - First call: Generates new UUID and stores in localStorage
 * - Subsequent calls: Returns existing UUID from localStorage
 * - After logout: clearSession() removes it, so next call generates new UUID
 * 
 * This ensures session_id is generated ONCE per browser/device session
 * and persists across page reloads until explicitly cleared.
 * 
 * @returns {string} The session_id for this device/browser
 */
export function getSessionId(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    // Try to get existing session_id from localStorage
    let sessionId = localStorage.getItem(SESSION_KEY);
    
    // If not found, generate a new one and store it
    // This happens on:
    // 1. First app visit
    // 2. After logout (clearSession removes it)
    // 3. After localStorage.clear() or manual deletion
    if (!sessionId) {
      sessionId = generateUUID();
      localStorage.setItem(SESSION_KEY, sessionId);
      console.log('🆕 New session created:', sessionId);
    } else {
      console.log('♻️ Existing session loaded:', sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // Handle localStorage errors (e.g., disabled, quota exceeded)
    console.error('Error accessing localStorage:', error);
    return generateUUID(); // Return temp UUID without persisting
  }
}

/**
 * Clears the current session by removing session_id from localStorage
 * 
 * CRITICAL: This explicitly removes the session_id key from localStorage.
 * Next call to getSessionId() will generate a NEW session_id.
 * 
 * EFFECTS OF CLEARING SESSION:
 * 1. session_id removed from localStorage
 * 2. Next page load/reload generates NEW session_id
 * 3. Previous orders are NOT visible (different session_id)
 * 4. Fresh start: no order history, no customer identity
 * 
 * USE CASES:
 * - Logout functionality
 * - Switching users on shared device
 * - Testing with fresh session
 * - Privacy reset
 * 
 * Called by:
 * - app/page.tsx handleLogout() → clearSession() → window.location.reload()
 * - SessionContext.clearSession() wrapper
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    try {
      const oldSessionId = localStorage.getItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
      console.log('🗑️ Session cleared:', oldSessionId);
      console.log('💡 Next load will generate new session_id');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }
}

/**
 * Gets the session_id without creating a new one (returns null if not exists)
 */
export function getExistingSessionId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(SESSION_KEY);
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
}
