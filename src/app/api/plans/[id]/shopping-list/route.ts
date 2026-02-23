import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Meal } from "@/lib/schemas"

interface AggregatedItem {
  name: string
  quantities: string[]
  category: string
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const household = await prisma.household.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!household) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 })
  }

  const plan = await prisma.plan.findFirst({
    where: { id, householdId: household.id },
    include: { planDays: true },
  })
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  }

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
          itemMap.set(key, {
            name: item.name,
            quantities: [item.qty],
            category: item.category,
          })
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

  return NextResponse.json({ planId: id, categories: grouped })
}
