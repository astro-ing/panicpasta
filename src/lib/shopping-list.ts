import type { Meal } from "@/lib/schemas"

export interface AggregatedShoppingItem {
  name: string
  quantities: string[]
  category: string
}

interface PlanDayLike {
  meals: unknown
}

export interface ShoppingListAggregationResult {
  grouped: Record<string, AggregatedShoppingItem[]>
  totalItems: number
}

export function aggregateShoppingList(planDays: PlanDayLike[]): ShoppingListAggregationResult {
  const itemMap = new Map<string, AggregatedShoppingItem>()

  for (const day of planDays) {
    const meals = day.meals as Record<string, Meal | null>
    for (const meal of Object.values(meals)) {
      if (!meal?.shopping_items) continue

      for (const item of meal.shopping_items) {
        const key = item.name.toLowerCase()
        const existing = itemMap.get(key)
        if (existing) {
          existing.quantities.push(item.qty)
        } else {
          itemMap.set(key, {
            name: item.name,
            quantities: [item.qty],
            category: item.category,
          })
        }
      }
    }
  }

  const grouped: Record<string, AggregatedShoppingItem[]> = {}
  for (const item of itemMap.values()) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }

  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) => a.name.localeCompare(b.name))
  }

  return {
    grouped,
    totalItems: itemMap.size,
  }
}
