"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/SessionContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { formatDate, formatTime } from "@/lib/dateUtils";
import { getCustomerIdentity } from "@/lib/customerIdentity";

type OrderItem = {
  id: string;
  menu_item_id: string;
  quantity: number;
  price_at_time: number;
  menu_items: {
    name: string;
    category: string;
  };
};

type Order = {
  id: string;
  order_number: number;
  session_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  feedback_given: boolean | null;
};

export default function OrdersPage() {
  const { sessionId, isLoading: isLoadingSession } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoadingSession) return;
    if (!sessionId) {
      setError("No session found");
      setIsLoading(false);
      return;
    }

    async function fetchOrders(showLoading = true) {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              menu_items (
                name,
                category
              )
            )
          `)
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Failed to fetch orders:', fetchError);
          throw fetchError;
        }

        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    }

    // Initial fetch with loading indicator
    fetchOrders(true);
    
    // Subscribe to real-time updates for this customer's orders only
    const channel = supabase
      .channel(`customer-orders-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'orders',
          filter: `session_id=eq.${sessionId}`, // Only this customer's orders
        },
        (payload) => {
          console.log('Real-time order update:', payload);
          // Refresh orders without loading indicator
          fetchOrders(false);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isLoadingSession]);

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PLACED':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'PREPARING':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        );
      case 'READY':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'COMPLETED':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'CANCELLED':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PLACED':
        return 'bg-blue-100 text-blue-800';
      case 'PREPARING':
        return 'bg-yellow-100 text-yellow-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-stone-700 shadow-lg sticky top-0 z-10 border-b-2 border-amber-700">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-stone-600 rounded-lg transition-all duration-200 transform hover:scale-110"
              aria-label="Back to menu"
            >
              <svg
                className="w-6 h-6 text-amber-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold text-amber-50">My Orders</h1>
              {getCustomerIdentity() ? (
                <p className="text-sm text-stone-300 mt-1 animate-slide-in">
                  Hi, {getCustomerIdentity()?.name?.split(' ')[0] || 'Guest'} 👋
                </p>
              ) : (
                <p className="text-sm text-stone-300 mt-1">View your order history</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && orders.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-gray-300 mb-6">
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Start ordering your favorite dishes!</p>
            <Link
              href="/"
              className="inline-block bg-amber-700 text-amber-50 px-8 py-3 rounded-xl font-semibold hover:bg-amber-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Browse Menu 👨‍🍳
            </Link>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && !error && orders.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
              </p>
              <p className="text-xs text-gray-500">
                Session: {sessionId?.substring(0, 8)}...
              </p>
            </div>

            {orders.map((order, index) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-stone-200 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Order Header */}
                <div className="p-5 bg-stone-50 border-b-2 border-stone-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-amber-700">
                          Order #{order.order_number}
                        </h3>
                        <span
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                        {order.feedback_given && (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-700 text-green-50 shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            ⭐ Reviewed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <span className="flex items-center gap-1.5 font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(order.created_at)}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(order.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-amber-700">
                        ₹{(order.total_amount / 100).toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        {order.order_items?.length || 0} {order.order_items?.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {(order.customer_name || order.customer_phone) && (
                    <div className="flex items-center gap-4 pt-3 border-t border-stone-300 flex-wrap">
                      {order.customer_name && (
                        <div className="flex items-center gap-2 text-sm text-stone-700">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-semibold">{order.customer_name}</span>
                        </div>
                      )}
                      {order.customer_phone && (
                        <div className="flex items-center gap-2 text-sm text-stone-700">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="font-medium">{order.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Order Items - Expandable */}
                {order.order_items && order.order_items.length > 0 && (
                  <div>
                    <button
                      onClick={() =>
                        setExpandedOrderId(
                          expandedOrderId === order.id ? null : order.id
                        )
                      }
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        View Order Details
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${
                          expandedOrderId === order.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Expanded Order Items */}
                    {expandedOrderId === order.id && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="mt-4 space-y-3">
                          {order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0"
                            >
                              <div className="flex-1">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-700">
                                    {item.quantity}×
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">
                                      {item.menu_items.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                        {item.menu_items.category}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        ₹{(item.price_at_time / 100).toFixed(2)} each
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-bold text-gray-900">
                                  ₹{((item.price_at_time / 100) * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Total Summary */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-base font-semibold text-gray-900">
                              Order Total
                            </span>
                            <span className="text-xl font-bold text-gray-900">
                              ₹{(order.total_amount / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex gap-2">
                          {!order.feedback_given && (
                            <Link
                              href={`/bill/${order.id}`}
                              className="flex-1 py-2.5 text-center bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              Give Feedback
                            </Link>
                          )}
                          <Link
                            href={`/bill/${order.id}`}
                            className={`${!order.feedback_given ? 'flex-1' : 'w-full'} py-2.5 text-center bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors`}
                          >
                            View Bill & Receipt
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Order ID: {order.id.slice(0, 8).toUpperCase()}
                  </div>
                  <button
                    onClick={() =>
                      setExpandedOrderId(
                        expandedOrderId === order.id ? null : order.id
                      )
                    }
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {expandedOrderId === order.id ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
