/**
 * Customer Identity Helper - Client-side only
 * Manages customer name and phone in localStorage
 * 
 * IMPORTANT CONCEPTS:
 * 
 * 1. SESSION_ID vs CUSTOMER IDENTITY:
 *    - session_id = Technical device/browser session (UUID)
 *      * Stored in: localStorage['session_id']
 *      * Purpose: Track orders from this device/browser
 *      * Generated: Once per browser session
 *      * Persists: Until logout or localStorage cleared
 *    
 *    - customer identity = User's name + phone (strings)
 *      * Stored in: localStorage['customer_name'] + localStorage['customer_phone']
 *      * Purpose: Display on orders, contact customer
 *      * Entered: Via form on checkout
 *      * Persists: Until logout
 * 
 * 2. WHY SEPARATE?
 *    - session_id: Links orders to device (never changes during session)
 *    - customer_identity: Links orders to person (can be updated)
 *    - Same device, multiple users: Logout clears BOTH for fresh start
 * 
 * 3. ORDER SCOPING:
 *    - All orders have session_id foreign key in database
 *    - Query: SELECT * FROM orders WHERE session_id = current_session_id
 *    - This means:
 *      * Orders are always scoped to session_id
 *      * Different session_id = different order history
 *      * Logout generates new session_id = new empty history
 * 
 * 4. LOGOUT BEHAVIOR:
 *    - Clears customer_name from localStorage
 *    - Clears customer_phone from localStorage
 *    - Clears session_id from localStorage
 *    - On reload: New session_id generated
 *    - Result: Fresh user with no order history visible
 * 
 * 5. USE CASE - SHARED DEVICE:
 *    User A: Login (name=Alice) → Orders visible
 *    User A: Logout → session_id cleared, orders hidden
 *    User B: New session → Login (name=Bob) → Fresh order history
 *    User A cannot see User B's orders (different session_id)
 * 
 * No authentication - this is NOT secure login, just convenience tracking
 */

const CUSTOMER_NAME_KEY = 'customer_name';
const CUSTOMER_PHONE_KEY = 'customer_phone';

export type CustomerIdentity = {
  name: string;
  phone: string;
};

/**
 * Get stored customer identity from localStorage
 * 
 * RELATIONSHIP TO SESSION:
 * - Customer identity = name + phone for CURRENT USER in this session
 * - This is stored separately from session_id
 * - Both are required for order placement:
 *   * session_id: Links order to device/browser
 *   * customer identity: Links order to person
 * 
 * @returns Customer identity object or null if not set
 */
export function getCustomerIdentity(): CustomerIdentity | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const name = localStorage.getItem(CUSTOMER_NAME_KEY);
    const phone = localStorage.getItem(CUSTOMER_PHONE_KEY);

    // Only return if both name and phone exist
    if (name && phone) {
      return { name, phone };
    }

    return null;
  } catch (error) {
    console.error('Error reading customer identity:', error);
    return null;
  }
}

/**
 * Save customer identity to localStorage
 * 
 * IMPORTANT:
 * - This saves name + phone for the CURRENT USER
 * - Does NOT affect session_id (session remains the same)
 * - Multiple orders with same session_id can have same customer info
 * - Useful for returning users who want to update their details
 * 
 * @param name - Customer's name
 * @param phone - Customer's phone number
 */
export function setCustomerIdentity(name: string, phone: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Trim whitespace from inputs
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedPhone) {
      console.warn('Cannot save empty customer identity');
      return;
    }

    localStorage.setItem(CUSTOMER_NAME_KEY, trimmedName);
    localStorage.setItem(CUSTOMER_PHONE_KEY, trimmedPhone);
  } catch (error) {
    console.error('Error saving customer identity:', error);
  }
}

/**
 * Check if customer identity is stored
 * @returns True if both name and phone are stored
 */
export function hasCustomerIdentity(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const name = localStorage.getItem(CUSTOMER_NAME_KEY);
    const phone = localStorage.getItem(CUSTOMER_PHONE_KEY);
    return !!(name && phone);
  } catch (error) {
    console.error('Error checking customer identity:', error);
    return false;
  }
}

/**
 * Clear customer identity from localStorage
 * 
 * IMPORTANT - PARTIAL CLEAR:
 * - This ONLY clears customer_name and customer_phone
 * - Does NOT clear session_id (use clearSession() for that)
 * - Does NOT clear cart (use sessionStorage.removeItem('cart') for that)
 * 
 * FULL LOGOUT REQUIRES:
 * 1. clearCustomerIdentity() → clear name + phone
 * 2. localStorage.removeItem('session_id') → clear session
 * 3. sessionStorage.removeItem('cart') → clear cart
 * 4. window.location.reload() → generate new session
 * 
 * See: app/page.tsx handleLogout() for complete logout implementation
 */
export function clearCustomerIdentity(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(CUSTOMER_NAME_KEY);
    localStorage.removeItem(CUSTOMER_PHONE_KEY);
  } catch (error) {
    console.error('Error clearing customer identity:', error);
  }
}
