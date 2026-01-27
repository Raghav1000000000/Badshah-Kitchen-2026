"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/SessionContext";
import { MenuItem, CartItem } from "@/types/cart";
import { 
  calculateCartTotal, 
  calculateCartItemCount
} from "@/lib/cartUtils";
import { supabase } from "@/lib/supabase";
import { 
  hasCustomerIdentity,
  clearCustomerIdentity,
  getCustomerIdentity,
  setCustomerIdentity
} from "@/lib/customerIdentity";
import { submitOrder } from "@/lib/orderSubmission";
import CustomerIdentityForm from "@/components/CustomerIdentityForm";

export default function Home() {
  const { sessionId } = useSession();
  const router = useRouter();
  
  // Menu state from database
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  
  // Cart state - ephemeral, client-side only
  // Stores full MenuItem data for display (name, price, category, etc.)
  // When placing order, only menu_item_id (id) and quantity are inserted to order_items
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>("All");
  
  // Track customer identity for showing logout button (client-side only to avoid hydration mismatch)
  const [hasIdentity, setHasIdentity] = useState(false);
  
  // Order submission state
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [showIdentityForm, setShowIdentityForm] = useState(false);



  // Fetch menu items from Supabase on mount
  useEffect(() => {
    async function fetchMenuItems() {
      setIsLoadingMenu(true);
      setMenuError(null);
      
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        setMenuItems(data || []);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        setMenuError('Failed to load menu items. Please refresh the page.');
      } finally {
        setIsLoadingMenu(false);
      }
    }
    
    fetchMenuItems();
  }, []);

  // Check customer identity after mount (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setHasIdentity(hasCustomerIdentity());
  }, []);

  // Save cart to sessionStorage when it changes
  useEffect(() => {
    if (cart.length > 0) {
      sessionStorage.setItem("cart", JSON.stringify(cart));
    } else {
      sessionStorage.removeItem("cart");
    }
  }, [cart]);

  // Don't render until we have sessionId
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Initializing session...</p>
        </div>
      </div>
    );
  }

  const categories: (string | null)[] = ["All", ...Array.from(new Set(menuItems.map(item => item.category).filter(Boolean)))];

  const filteredItems = selectedCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  // Cart management - all operations happen in memory only
  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === id);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(cartItem =>
          cartItem.id === id
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prevCart.filter(cartItem => cartItem.id !== id);
    });
  };

  // Clear cart helper - safely resets to empty state
  const clearCart = () => {
    setCart([]);
  };

  // Handle logout - clear customer identity, cart, and session
  // 
  // COMPLETE LOGOUT FLOW:
  // 1. Clear customer identity (name, phone) from localStorage
  // 2. Clear hasIdentity state (hides logout button)
  // 3. Clear cart state (empties cart in memory)
  // 4. Clear cart from sessionStorage (persisted cart)
  // 5. Clear session_id from localStorage (NEW: explicit session reset)
  // 6. Reload page (generates fresh session_id)
  // 
  // WHY THIS CLEARS ORDER HISTORY:
  // - Orders are stored with session_id in database
  // - Query: SELECT * FROM orders WHERE session_id = current_session_id
  // - After logout: new session_id is generated on reload
  // - New session_id ≠ old session_id
  // - Therefore: no orders match the query
  // - Previous orders still exist in database but are not visible
  // 
  // This provides:
  // - Privacy: each session is isolated
  // - Multi-user support: shared devices get fresh sessions
  // - Clean slate: new customer gets empty order history
  // 
  // To view old orders, would need to restore old session_id
  const handleLogout = () => {
    if (confirm("Are you sure you want to logout? This will clear your cart, customer information, and order history.")) {
      // Step 1: Clear customer identity
      clearCustomerIdentity();
      setHasIdentity(false);
      
      // Step 2: Clear cart
      clearCart();
      sessionStorage.removeItem("cart");
      
      // Step 3: EXPLICITLY clear session_id from localStorage
      // This is the critical step that resets order history
      // After reload, getSessionId() will generate a NEW UUID
      localStorage.removeItem('session_id');
      
      // Step 4: Reload page to generate fresh session
      alert("You have been logged out. Your session has been reset.");
      window.location.reload();
    }
  };

  // Handle Place Order button click
  const handlePlaceOrder = () => {
    // Check if customer identity exists
    if (!hasCustomerIdentity()) {
      // Show identity form if not set
      setShowIdentityForm(true);
      return;
    }

    // Get identity and proceed with order
    const identity = getCustomerIdentity();
    if (identity) {
      proceedWithOrderSubmission(identity.name, identity.phone);
    }
  };

  // Handle customer identity form submission
  const handleIdentitySubmit = async (name: string, phone: string) => {
    setCustomerIdentity(name, phone);
    setHasIdentity(true);
    setShowIdentityForm(false);
    await proceedWithOrderSubmission(name, phone);
  };

  // Proceed with order submission
  const proceedWithOrderSubmission = async (
    customerName: string,
    customerPhone: string
  ) => {
    if (isSubmittingOrder) return;

    setIsSubmittingOrder(true);

    try {
      const result = await submitOrder(cart, {
        session_id: sessionId,
        customer_name: customerName,
        customer_phone: customerPhone,
      });

      if (result.success) {
        // Clear cart on success
        sessionStorage.removeItem("cart");
        setCart([]);
        
        // Redirect to bill page with order ID
        router.push(`/bill/${result.order_id}`);
      } else {
        alert(
          `❌ Order Failed\n\n` +
            `We couldn't process your order. Please try again.\n\n` +
            `Technical details: ${result.error}`
        );
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Badshah&apos;s Kitchen</h1>
              <p className="text-sm text-gray-600">Order your favorites</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/orders"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span className="text-sm font-medium">Orders</span>
              </Link>
              {hasIdentity && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-600 hover:text-red-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="text-sm font-medium">Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="bg-white border-b sticky top-[72px] z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-32">
        {/* Loading State */}
        {isLoadingMenu && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading menu...</p>
          </div>
        )}

        {/* Error State */}
        {menuError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{menuError}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingMenu && !menuError && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No menu items available in this category.</p>
          </div>
        )}

        {/* Menu Items Grid */}
        {!isLoadingMenu && !menuError && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {item.name}
                      {item.is_special && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Special
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{item.category}</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900 ml-2">
                    ₹{(item.price / 100).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  className="w-full mt-3 bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Cart Items */}
            <div className="mb-4 max-h-48 overflow-y-auto">
              {cart.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      ₹{(item.price / 100).toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700"
                    >
                      −
                    </button>
                    <span className="font-semibold text-gray-900 w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700"
                    >
                      +
                    </button>
                  </div>
                  <div className="ml-4 font-semibold text-gray-900 min-w-[60px] text-right">
                    ₹{((item.price / 100) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Place Order Section */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  {calculateCartItemCount(cart)} {calculateCartItemCount(cart) === 1 ? "item" : "items"}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{calculateCartTotal(cart).toFixed(2)}
                </p>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmittingOrder}
                className="flex-1 max-w-xs py-3 rounded-lg font-semibold transition-colors bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmittingOrder ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Identity Form Modal */}
      {showIdentityForm && (
        <CustomerIdentityForm
          onSubmit={handleIdentitySubmit}
          onCancel={() => setShowIdentityForm(false)}
        />
      )}
    </div>
  );
}
