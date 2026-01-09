'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CartPage() {
  const router = useRouter()

  const [cart, setCart] = useState<any[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [table, setTable] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    const savedCustomer = localStorage.getItem('customer')

    if (savedCart) setCart(JSON.parse(savedCart))
    if (savedCustomer) {
      const c = JSON.parse(savedCustomer)
      setName(c.name)
      setPhone(c.phone)
      setTable(c.table)
    }
  }, [])

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  )

  const handleSaveAndOrder = async () => {
    if (!cart.length) {
      alert('Cart is empty')
      return
    }

    if (!name || phone.length !== 10 || !table) {
      alert('Enter valid details')
      return
    }

    try {
      setLoading(true)

      // Save customer locally
      localStorage.setItem(
        'customer',
        JSON.stringify({ name, phone, table })
      )

      // 1️⃣ Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: name,
          phone,
          table_number: Number(table),
          status: 'pending'
        })
        .select()
        .single()

      if (orderError || !order) {
        console.error(orderError)
        alert('Failed to place order')
        return
      }

      // 2️⃣ Insert order items
      const items = cart.map(item => ({
        order_id: order.id,
        item_name: item.name,
        qty: item.qty,
        price: item.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(items)

      if (itemsError) {
        console.error(itemsError)
        alert('Order created but items failed')
        return
      }

      // 3️⃣ Clear cart
      localStorage.removeItem('cart')
      setCart([])

      alert('Order placed successfully!')
      router.push('/menu')

    } catch (err) {
      console.error(err)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 p-4">
      <h1 className="text-xl font-bold text-center mb-4">
        Your Cart
      </h1>

      {cart.length === 0 && (
        <p className="text-center text-gray-500 mb-4">
          Your cart is empty
        </p>
      )}

      {cart.map((item, i) => (
        <div
          key={i}
          className="bg-white p-3 rounded-xl mb-2 flex justify-between"
        >
          <span>
            {item.name} × {item.qty}
          </span>
          <span>₹{item.price * item.qty}</span>
        </div>
      ))}

      <div className="font-semibold text-right mb-4">
        Total: ₹{total}
      </div>

      <div className="bg-white p-4 rounded-xl">
        <h2 className="font-semibold mb-2">Your Details</h2>

        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="Phone"
          value={phone}
          maxLength={10}
          onChange={(e) =>
            setPhone(e.target.value.replace(/\D/g, ''))
          }
        />

        <select
          className="w-full mb-3 p-2 border rounded"
          value={table}
          onChange={(e) => setTable(e.target.value)}
        >
          <option value="">Select Table</option>
          {Array.from({ length: 15 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Table {i + 1}
            </option>
          ))}
        </select>

        <button
          disabled={loading}
          onClick={handleSaveAndOrder}
          className={`w-full p-3 rounded-xl font-semibold text-white ${
            loading ? 'bg-gray-400' : 'bg-green-700'
          }`}
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  )
}
