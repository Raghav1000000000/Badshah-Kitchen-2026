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
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <header className="bg-stone-700 shadow-lg border-b-2 border-amber-700">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-amber-50">
              Badshah&apos;s Kitchen
            </h1>
            <Link
              href="/"
              className="text-sm text-amber-200 hover:text-amber-50 font-medium transition-colors"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Order Confirmation */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-2 border-stone-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-fade-in">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-stone-800 mb-3">
              Order Confirmed!
            </h2>
            <p className="text-stone-600 text-lg">
              Thank you, <span className="font-semibold text-amber-700">{order.customer_name}</span> 🙏
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-stone-50 rounded-lg p-6 mb-6 border border-stone-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-stone-500 mb-1">Order Number</p>
                <p className="text-2xl font-bold text-amber-700">
                  #{order.order_number}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-stone-500 mb-1">Status</p>
                <p className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                  {order.status}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-stone-200 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-stone-500 mb-1">Date</p>
                <p className="text-sm font-semibold text-stone-700 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-500 mb-1">Time</p>
                <p className="text-sm font-semibold text-stone-700 flex items-center justify-end gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(order.created_at).toLocaleTimeString('en-IN', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-bold text-stone-800 mb-4 text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Order Items
            </h3>
            <div className="space-y-3">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start p-3 bg-stone-50 rounded-lg border border-stone-200"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-stone-800">
                      {item.menu_items.name}
                    </p>
                    <p className="text-sm text-stone-500 mt-1">
                      ₹{(item.price_at_time / 100).toFixed(0)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-amber-700 text-lg">
                    ₹{((item.price_at_time / 100) * item.quantity).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-amber-50 rounded-lg p-5 border-2 border-amber-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-stone-700">Total Amount</span>
              <span className="text-3xl font-bold text-amber-700">
                ₹{(order.total_amount / 100).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        {!feedbackSubmitted && !order.feedback_given ? (
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-stone-200">
            <h3 className="text-2xl font-bold text-stone-800 mb-2">
              How was your experience?
            </h3>
            <p className="text-stone-500 mb-6">We&apos;d love to hear your feedback! ☕</p>
            <form onSubmit={handleFeedbackSubmit}>
              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-stone-700 mb-3">
                  Rate your experience
                </label>
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-125 active:scale-110"
                    >
                      <svg
                        className={`w-12 h-12 ${
                          star <= rating
                            ? "text-amber-500 fill-current drop-shadow-md"
                            : "text-stone-300"
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
                  <p className="text-center text-base font-semibold text-amber-700 mt-3">
                    {rating === 1 && "😞 Poor"}
                    {rating === 2 && "😐 Fair"}
                    {rating === 3 && "🙂 Good"}
                    {rating === 4 && "😊 Very Good"}
                    {rating === 5 && "🤩 Excellent!"}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label
                  htmlFor="comment"
                  className="block text-sm font-semibold text-stone-700 mb-2"
                >
                  Share your thoughts (Optional)
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you loved or how we can improve..."
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingFeedback || rating === 0}
                className="w-full py-4 bg-amber-700 text-amber-50 rounded-xl font-bold text-lg hover:bg-amber-800 disabled:bg-stone-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {isSubmittingFeedback ? "Submitting..." : "Submit Feedback ✨"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-green-50 rounded-xl p-8 text-center border-2 border-green-200 shadow-lg">
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
            <h3 className="text-2xl font-bold text-stone-800 mb-2">
              Thank you for your feedback!
            </h3>
            <p className="text-stone-600 mb-6">
              We appreciate you taking the time to share your experience. 🙏
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-amber-700 text-amber-50 rounded-xl font-bold hover:bg-amber-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Order Again 🍴
            </Link>
          </div>
        )}

        {/* Contact Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-stone-500 mb-2">Questions about your order?</p>
          <p className="font-semibold text-stone-700 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {order.customer_phone}
          </p>
        </div>
      </div>
    </div>
  );
}
