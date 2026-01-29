"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: string;
  menu_item_id: string;
  quantity: number;
  price_at_time: number;
  menu_items: {
    name: string;
  };
};

type Order = {
  id: string;
  order_number: number;
  total_amount: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  order_items: OrderItem[];
  feedback_given: boolean | null;
};

export default function BillPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feedback form state
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Fetch order details
  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
            *,
            order_items (
              *,
              menu_items (name)
            )
          `
          )
          .eq("id", orderId)
          .single();

        if (error) throw error;

        setOrder(data);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  // Handle feedback submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Please select a rating before submitting.");
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      // Insert feedback into feedback table
      const { error: feedbackError } = await supabase
        .from('feedback')
        .insert({
          order_id: orderId,
          rating: rating,
          comment: comment.trim() || null,
        });

      if (feedbackError) throw feedbackError;

      // Mark order as feedback_given
      const { error: updateError } = await supabase
        .from('orders')
        .update({ feedback_given: true })
        .eq('id', orderId);

      if (updateError) throw updateError;

      console.log("Feedback submitted:", {
        orderId,
        rating,
        comment,
      });

      setFeedbackSubmitted(true);
      
      // Update local order state
      if (order) {
        setOrder({ ...order, feedback_given: true });
      }
      
      alert("Thank you for your feedback! 🙏");
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Order not found"}</p>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Badshah&apos;s Kitchen
            </h1>
            <Link
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Order Confirmation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h2>
            <p className="text-gray-600">
              Thank you for your order, {order.customer_name}
            </p>
          </div>

          {/* Order Details */}
          <div className="border-t border-b border-gray-200 py-4 mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Order Number</span>
              <span className="font-semibold text-gray-900">
                #{order.order_number}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Order ID</span>
              <span className="font-mono text-xs text-gray-700">
                {order.id}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Status</span>
              <span className="capitalize font-medium text-blue-600">
                {order.status}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Time</span>
              <span className="text-gray-700">
                {new Date(order.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="space-y-2">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.menu_items.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      ₹{(item.price_at_time / 100).toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ₹{((item.price_at_time / 100) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">
                ₹{(order.total_amount / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        {!feedbackSubmitted && !order.feedback_given ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              How was your experience?
            </h3>
            <form onSubmit={handleFeedbackSubmit}>
              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <svg
                        className={`w-10 h-10 ${
                          star <= rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                        stroke="currentColor"
                        fill={star <= rating ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Comments (Optional)
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingFeedback || rating === 0}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Thank you for your feedback!
            </h3>
            <p className="text-gray-600 mb-4">
              We appreciate you taking the time to share your experience.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Order Again
            </Link>
          </div>
        )}

        {/* Contact Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Questions about your order?</p>
          <p className="font-medium text-gray-900">
            Contact us: {order.customer_phone}
          </p>
        </div>
      </div>
    </div>
  );
}
