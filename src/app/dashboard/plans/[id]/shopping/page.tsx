export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import type { Meal } from "@/lib/schemas"

interface AggregatedItem {
  name: string
  quantities: string[]
  category: string
}

export default async function ShoppingListPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return null

  const { id } = await params
  const household = await prisma.household.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!household) return null

  const plan = await prisma.plan.findFirst({
    where: { id, householdId: household.id },
    include: { planDays: true },
  })
  if (!plan) notFound()

  const itemMap = new Map<string, AggregatedItem>()
  for (const day of plan.planDays) {
    const meals = day.meals as Record<string, Meal | null>
    for (const meal of Object.values(meals)) {
      if (!meal?.shopping_items) continue
      for (const item of meal.shopping_items) {
        const key = item.name.toLowerCase()
        const existing = itemMap.get(key)
        if (existing) {
          existing.quantities.push(item.qty)
        } else {
          itemMap.set(key, { name: item.name, quantities: [item.qty], category: item.category })
        }
      }
    }
  }

  const grouped: Record<string, AggregatedItem[]> = {}
  for (const item of itemMap.values()) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => a.name.localeCompare(b.name))
  }

  const categoryColors: Record<string, string> = {
    produce: "bg-basil-400 text-white",
    protein: "bg-tomato-500 text-white",
    pantry: "bg-pasta-200 text-charcoal-900",
    dairy: "bg-pasta-100 text-charcoal-900",
    other: "bg-charcoal-800 text-white",
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link href={`/dashboard/plans/${id}`} className="text-sm font-bold text-charcoal-800 hover:text-tomato-500 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to plan
        </Link>
        <h1 className="font-serif text-4xl font-black mb-1">Shopping List</h1>
        <p className="text-charcoal-800 font-medium">{plan.numDays}-day plan · {itemMap.size} items</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-12 shadow-[6px_6px_0px_0px_#1a1816] text-center">
          <p className="text-charcoal-800 font-medium">No shopping items found in this plan.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-white border-4 border-charcoal-900 rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_#1a1816]">
            <div className={`px-6 py-3 border-b-2 border-charcoal-900 ${categoryColors[category] || categoryColors.other}`}>
              <h2 className="font-bold text-sm uppercase tracking-wider">{category}</h2>
            </div>
            <div className="divide-y-2 divide-charcoal-900/10">
              {items.map((item, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <span className="font-bold">{item.name}</span>
                  <span className="text-sm text-charcoal-800 font-medium">
                    {item.quantities.join(" + ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
