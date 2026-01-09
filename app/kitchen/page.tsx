'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check staff authentication
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return router.replace('/staff-login') // redirect if not logged in

      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (!data || data.role !== 'staff') router.replace('/staff-login')
          else setLoading(false)
        })
    })
  }, [router])

  // Fetch orders and subscribe
  useEffect(() => {
    if (loading) return

    fetchOrders()

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loading])

  const fetchOrders = async () => {
    const since = new Date()
    since.setHours(since.getHours() - 24)

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
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })

    if (!error && data) setOrders(data as Order[])
  }

  const markCompleted = async (id: string) => {
    await supabase.from('orders').update({ status: 'completed' }).eq('id', id)
    fetchOrders()
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Kitchen Orders</h1>

      <div className="space-y-4">
        {orders.map(order => (
          <div
            key={order.id}
            className={`p-4 rounded-xl ${
              order.status === 'completed' ? 'bg-gray-700' : 'bg-green-800'
            }`}
          >
            <div className="flex justify-between mb-2">
              <div>
                <p className="font-semibold">
                  {order.customer_name} — Table {order.table_number}
                </p>
                <p className="text-sm text-gray-300">{order.phone}</p>
              </div>

              {order.status === 'pending' && (
                <button
                  onClick={() => markCompleted(order.id)}
                  className="bg-white text-black px-3 py-1 rounded"
                >
                  Complete
                </button>
              )}
            </div>

            <ul className="text-sm space-y-1">
              {order.order_items.map(item => (
                <li key={item.id}>
                  {item.qty}× {item.item_name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
