"use client";

/**
 * Kitchen Display Page
 * 
 * Purpose: Display incoming orders for kitchen staff to view and manage
 * 
 * Features:
 * - Real-time order list for kitchen staff
 * - View order details (items, quantities, customer info)
 * - Update order status (Placed → Preparing → Ready)
 * - Mobile-first design with tablet support
 * - Authentication required (kitchen staff only)
 * 
 * Status Flow:
 * 1. PLACED - New order received
 * 2. PREPARING - Kitchen is working on it
 * 3. READY - Order completed, ready for pickup
 * 4. COMPLETED - Order picked up by customer
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatTime } from "@/lib/dateUtils";
import { useKitchenAuth } from "@/lib/kitchenAuth";

type OrderItem = {
  id: string;
  quantity: number;
  menu_items: {
    name: string;
  };
};

type Order = {
  id: string;
  order_number: number;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
};

export default function KitchenPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, signOut } = useKitchenAuth();

  // State for filtering orders by status
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Order data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/kitchen/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch orders from Supabase
  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all orders including completed
      // Sort by created_at descending (newest first)
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            menu_items (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch orders on mount and subscribe to real-time updates
  useEffect(() => {
    fetchOrders();

    // Subscribe to real-time changes for non-completed orders
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'orders',
          filter: 'status=neq.COMPLETED', // Only non-completed orders
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Refresh orders when any change happens
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter orders based on selected status
  const filteredOrders = filterStatus === "all" 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === filterStatus);

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PLACED':
        return 'bg-blue-500 text-white';
      case 'ACCEPTED':
        return 'bg-purple-500 text-white';
      case 'PREPARING':
        return 'bg-yellow-500 text-white';
      case 'READY':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Validate status transition - allow both forward and backward transitions
  const isValidTransition = (currentStatus: string, newStatus: string): boolean => {
    const current = currentStatus.toUpperCase();
    const next = newStatus.toUpperCase();
    
    // Don't allow transitioning to the same status
    if (current === next) {
      return false;
    }
    
    // Can't change status once completed
    if (current === 'COMPLETED') {
      return false;
    }
    
    // Allow all other transitions (forward and backward)
    const validStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];
    return validStatuses.includes(next);
  };

  // Update order status in Supabase
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      console.error('❌ Order not found:', orderId);
      alert('Error: Order not found');
      return;
    }

    // Validate status transition before updating
    if (!isValidTransition(order.status, newStatus)) {
      const message = `Invalid status transition: ${order.status} → ${newStatus}\n\n` +
        (order.status === 'COMPLETED' 
          ? 'Cannot change status of completed orders.'
          : order.status === newStatus
          ? 'Order is already in this status.'
          : 'Invalid status selected.');
      
      console.error(`❌ Invalid transition blocked for order #${order.order_number}: ${order.status} → ${newStatus}`);
      alert(message);
      return;
    }

    setUpdatingOrderId(orderId);
    console.log(`📝 Updating order #${order.order_number} from ${order.status} to ${newStatus}`);

    try {
      const { data: updateData, error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus.toUpperCase() })
        .eq('id', orderId)
        .select('id, status');

      if (updateError) {
        throw updateError;
      }

      // Check if update actually happened (RLS might block it)
      if (!updateData || updateData.length === 0) {
        throw new Error(
          'Update was blocked (likely by RLS policy). ' +
          'Please run add-update-policy.sql to enable status updates.'
        );
      }

      console.log(`✅ Order #${order.order_number} updated successfully to ${newStatus}`);
      
      // Update local state immediately for better UX
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === orderId ? { ...o, status: newStatus.toUpperCase() } : o
        )
      );
    } catch (err: any) {
      console.error('❌ Error updating order status:', err);
      alert(
        `❌ Failed to update order status:\n` +
        `Order: #${order.order_number}\n` +
        `Error: ${err.message || 'Unknown error'}\n\n` +
        `Please try again or contact support.`
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Reject order - marks as COMPLETED to remove from active list
  const rejectOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to reject this order? It will be marked as completed.')) {
      return;
    }
    await updateOrderStatus(orderId, 'COMPLETED');
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchOrders();
  };

  // Handle logout
  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      signOut();
      router.push('/kitchen/login');
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render kitchen page if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Fixed at top for easy access */}
      <header className="bg-white shadow sticky top-0 z-10 border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Kitchen Orders
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                Kitchen Staff
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={fetchOrders}
                disabled={isLoading}
                className="px-3 py-2 rounded bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
              >
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Status Filter Bar */}
      <div className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
                filterStatus === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("placed")}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
                filterStatus === "placed"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Placed
            </button>
            <button
              onClick={() => setFilterStatus("accepted")}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
                filterStatus === "accepted"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setFilterStatus("preparing")}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
                filterStatus === "preparing"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Preparing
            </button>
            <button
              onClick={() => setFilterStatus("ready")}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
                filterStatus === "ready"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Ready
            </button>
            <button
              onClick={() => setFilterStatus("completed")}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
                filterStatus === "completed"
                  ? "bg-gray-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Order List */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-600 font-semibold">Loading orders...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State - No orders */}
        {!isLoading && !error && filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg
                className="w-20 h-20 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {filterStatus === "all" ? "No Active Orders" : `No ${filterStatus.toUpperCase()} Orders`}
            </h3>
            <p className="text-gray-500">
              {filterStatus === "all" 
                ? "New orders will appear here automatically" 
                : "Try selecting a different filter"}
            </p>
          </div>
        )}

        {/* Order Cards */}
        {!isLoading && !error && filteredOrders.length > 0 && (
          <div className="space-y-2">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              return (
              <div
                key={order.id}
                className="bg-white rounded border border-gray-300 shadow-sm"
              >
                {/* Compact Order Header - Always Visible */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="font-bold text-lg text-gray-900">
                      #{order.order_number}
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.customer_name || 'Walk-in'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(order.created_at)}
                    </div>
                    <div className="font-bold text-gray-900">
                      ₹{(order.total_amount / 100).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-3 bg-gray-50">
                    {/* Order Items */}
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-gray-600 mb-2">ITEMS</div>
                      <div className="space-y-1">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            <span className="w-6 h-6 rounded bg-gray-900 text-white font-bold text-xs flex items-center justify-center">
                              {item.quantity}
                            </span>
                            <span className="text-gray-900">{item.menu_items.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Controls */}
                    <div className="flex gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        disabled={updatingOrderId === order.id}
                        className="flex-1 p-2 border border-gray-300 rounded text-sm font-medium text-gray-900 bg-white"
                      >
                        <option value="PLACED">Placed</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="READY">Ready</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                      
                      <button
                        onClick={() => rejectOrder(order.id)}
                        disabled={updatingOrderId === order.id}
                        className="px-3 py-2 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
