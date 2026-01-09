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
  const { orderId } = useParams()
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [feedback, setFeedback] = useState('')
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
      alert('Failed to load order')
      return
    }
    setOrder(data)
  }

  const total = order
    ? order.order_items.reduce((sum, item) => sum + item.price * item.qty, 0)
    : 0

  const handleSubmitFeedback = async () => {
    setSubmitting(true)

    if (feedback.trim() !== '') {
      const { error } = await supabase.from('feedback').insert({
        order_id: order?.id,
        customer_name: order?.customer_name,
        phone: order?.phone,
        table_number: order?.table_number,
        message: feedback
      })
      if (error) {
        console.error(error)
        alert('Failed to submit feedback')
        setSubmitting(false)
        return
      }
    }

    alert('Thank you! Your order has been recorded.')
    router.push('/menu')
    setSubmitting(false)
  }

  const handlePrint = () => {
    window.print()
  }

  if (!order) return <p className="p-4">Loading...</p>

  return (
    <div className="max-w-md mx-auto p-4 bg-stone-100 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-4">Bill</h1>

      {/* Order Info */}
      <div className="bg-white p-4 rounded-xl mb-4 space-y-2">
        <p><strong>Name:</strong> {order.customer_name}</p>
        <p><strong>Phone:</strong> {order.phone}</p>
        <p><strong>Table:</strong> {order.table_number}</p>
        <p><strong>Order Time:</strong> {new Date(order.created_at).toLocaleString()}</p>
      </div>

      {/* Items */}
      <div className="bg-white p-4 rounded-xl mb-4">
        <h2 className="font-semibold mb-2">Items</h2>
        <ul className="space-y-1">
          {order.order_items.map(item => (
            <li key={item.id} className="flex justify-between">
              <span>{item.qty} × {item.item_name}</span>
              <span>₹{item.price * item.qty}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between font-semibold mt-2">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
      </div>

      {/* Print Button */}
      <div className="mb-4">
        <button
          onClick={handlePrint}
          className="w-full bg-blue-600 text-white p-3 rounded-xl font-semibold"
        >
          Print Bill
        </button>
      </div>

      {/* Feedback Form */}
      <div className="bg-white p-4 rounded-xl mb-4">
        <h2 className="font-semibold mb-2">Feedback (optional)</h2>
        <textarea
          className="w-full p-2 border rounded mb-2"
          placeholder="Your feedback..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
        <button
          className={`w-full p-3 rounded-xl font-semibold text-white ${
            submitting ? 'bg-gray-400' : 'bg-green-700'
          }`}
          onClick={handleSubmitFeedback}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit & Return to Menu'}
        </button>
      </div>
    </div>
  )
}
