'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type OrderItem = {
  id: string
  item_name: string
  qty: number
  price: number
}

type Order = {
  id: string
  customer_name: string
  phone: string
  table_number: number
  status: 'pending' | 'completed'
  created_at: string
  order_items: OrderItem[]
}

export default function BillPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!orderId) return
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        phone,
        table_number,
        status,
        created_at,
        order_items (
          id,
          item_name,
          qty,
          price
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) {
      console.error(error)
      alert('Failed to load bill')
      return
    }

    setOrder(data)
  }

  const total = order
    ? order.order_items.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
      )
    : 0

  const handleSubmitFeedback = async () => {
    setSubmitting(true)

    const { error } = await supabase.from('feedback').insert({
      order_id: order?.id,
      rating,
      comment
    })

    if (error) {
      console.error(error)
      alert('Failed to submit feedback')
      setSubmitting(false)
      return
    }

    alert('Thank you for your visit ❤️')
    router.push('/menu')
    setSubmitting(false)
  }

  const handlePrint = () => {
    window.print()
  }

  if (!order) {
    return <p className="p-4 text-center">Loading bill...</p>
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-stone-100 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-4">Bill</h1>

      {/* Order Info */}
      <div className="bg-white p-4 rounded-xl mb-4 space-y-1">
        <p><strong>Name:</strong> {order.customer_name}</p>
        <p><strong>Phone:</strong> {order.phone}</p>
        <p><strong>Table:</strong> {order.table_number}</p>
        <p className="text-sm text-gray-500">
          {new Date(order.created_at).toLocaleString()}
        </p>
      </div>

      {/* Items */}
      <div className="bg-white p-4 rounded-xl mb-4">
        <h2 className="font-semibold mb-2">Items</h2>
        <ul className="space-y-1 text-sm">
          {order.order_items.map(item => (
            <li key={item.id} className="flex justify-between">
              <span>{item.qty} × {item.item_name}</span>
              <span>₹{item.price * item.qty}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between font-semibold mt-2 border-t pt-2">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
      </div>

      {/* Print */}
      <button
        onClick={handlePrint}
        className="w-full mb-4 bg-blue-600 text-white p-3 rounded-xl font-semibold"
      >
        Print Bill
      </button>

      {/* Feedback */}
      <div className="bg-white p-4 rounded-xl">
        <h2 className="font-semibold mb-2">Feedback (optional)</h2>

        {/* Rating */}
        <div className="flex gap-2 mb-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`px-3 py-1 rounded border ${
                rating === star
                  ? 'bg-yellow-400'
                  : 'bg-gray-100'
              }`}
            >
              ⭐ {star}
            </button>
          ))}
        </div>

        {/* Comment */}
        <textarea
          className="w-full p-2 border rounded mb-3"
          placeholder="Your feedback (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        <button
          disabled={submitting}
          onClick={handleSubmitFeedback}
          className={`w-full p-3 rounded-xl font-semibold text-white ${
            submitting ? 'bg-gray-400' : 'bg-green-700'
          }`}
        >
          {submitting ? 'Submitting...' : 'Submit & Return to Menu'}
        </button>
      </div>
    </div>
  )
}
