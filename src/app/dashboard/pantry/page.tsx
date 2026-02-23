"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X, ShoppingBasket, Lock } from "lucide-react"

interface PantryItem {
  id: string
  name: string
  category: string
}

const CATEGORIES = ["produce", "protein", "dairy", "pantry", "frozen", "other"]

export default function PantryPage() {
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newItem, setNewItem] = useState("")
  const [newCategory, setNewCategory] = useState("pantry")

  useEffect(() => {
    fetch("/api/pantry")
      .then(async (res) => {
        if (res.status === 403) {
          setError("pro")
          return
        }
        const data = await res.json()
        setItems(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const addItem = async () => {
    if (!newItem.trim()) return
    const res = await fetch("/api/pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newItem.trim(), category: newCategory }),
    })
    if (res.ok) {
      const item = await res.json()
      setItems([item, ...items])
      setNewItem("")
    }
  }

  const removeItem = async (id: string) => {
    await fetch(`/api/pantry/${id}`, { method: "DELETE" })
    setItems(items.filter((i) => i.id !== id))
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="font-serif text-4xl font-black">Pantry</h1>
        <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-12 shadow-[6px_6px_0px_0px_#1a1816] text-center">
          <p className="text-charcoal-800 font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  if (error === "pro") {
    return (
      <div className="space-y-8">
        <h1 className="font-serif text-4xl font-black">Pantry</h1>
        <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-12 shadow-[6px_6px_0px_0px_#1a1816] text-center">
          <Lock className="w-12 h-12 text-charcoal-800/20 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold mb-2">Pro Feature</h2>
          <p className="text-charcoal-800 font-medium mb-6">
            Pantry management and "Use-it-up" mode are available on the Pro plan.
          </p>
          <Button>Upgrade to Pro</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-black mb-2">Pantry</h1>
        <p className="text-lg text-charcoal-800 font-medium">
          Track what you have. Enable "Use-it-up" mode when generating plans.
        </p>
      </div>

      <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816]">
        <div className="flex gap-3 mb-6">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Add ingredient..."
            className="flex-1 h-12 px-4 rounded-xl border-2 border-charcoal-900 bg-pasta-50 font-medium focus:outline-none focus:ring-2 focus:ring-tomato-500"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="h-12 px-3 rounded-xl border-2 border-charcoal-900 bg-pasta-50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-tomato-500"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button onClick={addItem} size="default">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBasket className="w-12 h-12 text-charcoal-800/20 mx-auto mb-3" />
            <p className="text-charcoal-800 font-medium">Your pantry is empty. Add some items!</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-pasta-100 border-2 border-charcoal-900 rounded-full shadow-[2px_2px_0px_0px_#1a1816]">
                <span className="font-bold text-sm">{item.name}</span>
                <span className="text-xs text-charcoal-800/60">{item.category}</span>
                <button onClick={() => removeItem(item.id)} className="ml-1 hover:text-tomato-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
