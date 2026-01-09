'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type MenuItem = {
  id: string
  name: string
  price: number
  category: string
  available: boolean
}

export default function AdminMenuPage() {
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    const { data } = await supabase
      .from('menu')
      .select('*')
      .order('category')

    setMenu(data || [])
  }

  const addItem = async () => {
    if (!name || !price || !category) {
      alert('Fill all fields')
      return
    }

    await supabase.from('menu').insert({
      name,
      price: Number(price),
      category,
      available: true
    })

    setName('')
    setPrice('')
    setCategory('')
    fetchMenu()
  }

  const toggleAvailability = async (id: string, value: boolean) => {
    await supabase
      .from('menu')
      .update({ available: !value })
      .eq('id', id)

    fetchMenu()
  }

  const updatePrice = async (id: string, newPrice: number) => {
    if (!newPrice) return

    await supabase
      .from('menu')
      .update({ price: newPrice })
      .eq('id', id)

    fetchMenu()
  }

  return (
    <div className="min-h-screen bg-stone-100 p-4">
      <h1 className="text-2xl font-bold text-center mb-4">
        Admin Menu
      </h1>

      {/* ADD ITEM */}
      <div className="bg-white p-4 rounded-xl mb-4">
        <h2 className="font-semibold mb-2">Add New Item</h2>

        <input
          placeholder="Item name"
          className="w-full mb-2 p-2 border rounded"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <input
          placeholder="Price"
          type="number"
          className="w-full mb-2 p-2 border rounded"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />

        <input
          placeholder="Category (tea / coffee / food)"
          className="w-full mb-3 p-2 border rounded"
          value={category}
          onChange={e => setCategory(e.target.value)}
        />

        <button
          onClick={addItem}
          className="w-full bg-green-700 text-white p-2 rounded"
        >
          Add Item
        </button>
      </div>

      {/* MENU LIST */}
      <div className="space-y-3">
        {menu.map(item => (
          <div
            key={item.id}
            className="bg-white p-3 rounded-xl flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-gray-500">
                ₹{item.price} • {item.category}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-16 p-1 border rounded"
                defaultValue={item.price}
                onBlur={e =>
                  updatePrice(item.id, Number(e.target.value))
                }
              />

              <button
                onClick={() =>
                  toggleAvailability(item.id, item.available)
                }
                className={`px-3 py-1 rounded text-white ${
                  item.available
                    ? 'bg-green-600'
                    : 'bg-red-600'
                }`}
              >
                {item.available ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
