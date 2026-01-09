'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type MenuItem = {
  id: string
  name: string
  price: number
  category: string
}

export default function MenuPage() {
  const router = useRouter()
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<any[]>([])

  // Load menu
  useEffect(() => {
    fetchMenu()

    const savedCart = localStorage.getItem('cart')
    if (savedCart) setCart(JSON.parse(savedCart))
  }, [])

  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .eq('available', true)
      .order('category')

    if (!error && data) setMenu(data)
  }

  const updateCart = (item: MenuItem, qtyChange: number) => {
    let updated = [...cart]
    const index = updated.findIndex(i => i.id === item.id)

    if (index >= 0) {
      updated[index].qty += qtyChange
      if (updated[index].qty <= 0) updated.splice(index, 1)
    } else if (qtyChange > 0) {
      updated.push({ ...item, qty: 1 })
    }

    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const getQty = (id: string) => {
    const item = cart.find(i => i.id === id)
    return item ? item.qty : 0
  }

  return (
    <div className="min-h-screen bg-stone-100 p-4">
      <h1 className="text-2xl font-bold text-center mb-4 text-green-700">
        Menu
      </h1>

      <div className="space-y-3">
        {menu.map(item => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-xl flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold">{item.name}</h2>
              <p className="text-gray-500">₹{item.price}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateCart(item, -1)}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                −
              </button>

              <span>{getQty(item.id)}</span>

              <button
                onClick={() => updateCart(item, 1)}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <button
          onClick={() => router.push('/cart')}
          className="fixed bottom-4 left-4 right-4 bg-green-700 text-white p-4 rounded-xl font-semibold"
        >
          Go to Cart ({cart.length} items)
        </button>
      )}
    </div>
  )
}
