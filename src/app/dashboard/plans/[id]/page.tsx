export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, ArrowLeft, Clock, Users } from "lucide-react"
import type { Meal, Fork } from "@/lib/schemas"

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
    include: {
      planDays: { orderBy: { dayIndex: "asc" } },
      household: { include: { members: { orderBy: { sortOrder: "asc" } } } },
    },
  })

  if (!plan) notFound()

  const memberMap = new Map(plan.household.members.map((m) => [m.id, m.name]))
  const startDate = new Date(plan.startDate)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/plans" className="text-sm font-bold text-charcoal-800 hover:text-tomato-500 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to plans
          </Link>
          <h1 className="font-serif text-4xl font-black mb-1">{plan.numDays}-Day Meal Plan</h1>
          <p className="text-charcoal-800 font-medium">
            Starting {startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href={`/dashboard/plans/${id}/shopping`}>
          <Button variant="secondary" size="lg">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Shopping List
          </Button>
        </Link>
      </div>

      {plan.status !== "ready" && (
        <div className={`p-4 rounded-xl border-2 border-charcoal-900 ${
          plan.status === "generating" ? "bg-pasta-200" : "bg-tomato-400/20"
        }`}>
          <p className="font-bold">{plan.status === "generating" ? "⏳ Plan is still generating..." : "❌ Plan generation failed."}</p>
        </div>
      )}

      {plan.planDays.map((day) => {
        const dayDate = new Date(startDate)
        dayDate.setDate(dayDate.getDate() + day.dayIndex)
        const meals = day.meals as Record<string, Meal | null>

        return (
          <div key={day.id} className="space-y-4">
            <h2 className="font-serif text-2xl font-bold sticky top-16 bg-pasta-50 py-2 z-10 border-b-2 border-charcoal-900/10">
              Day {day.dayIndex + 1} — {dayDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </h2>

            <div className="grid gap-4">
              {Object.entries(meals).map(([slotKey, meal]) => {
                if (!meal) return null
                const forks = (meal.forks || {}) as Record<string, Fork>
                const hasForks = Object.keys(forks).length > 0

                return (
                  <div key={slotKey} className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Badge variant="default" className="mb-2 text-xs">{slotKey.replace("meal_", "Meal ")}</Badge>
                        <h3 className="font-serif text-xl font-bold">{meal.name}</h3>
                        <p className="text-sm text-charcoal-800 font-medium mt-1">{meal.description}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-charcoal-800">
                        {meal.prep_time_min && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-pasta-100 rounded-lg border-2 border-charcoal-900">
                            <Clock className="w-3 h-3" />{meal.prep_time_min}m
                          </span>
                        )}
                        {meal.servings && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-pasta-100 rounded-lg border-2 border-charcoal-900">
                            <Users className="w-3 h-3" />{meal.servings}
                          </span>
                        )}
                      </div>
                    </div>

                    {meal.macro_estimates && (
                      <div className="flex gap-3 mb-4 text-xs font-bold">
                        <span className="px-2 py-1 bg-tomato-400/10 text-tomato-600 rounded-lg">{meal.macro_estimates.calories} cal</span>
                        <span className="px-2 py-1 bg-basil-400/10 text-basil-600 rounded-lg">{meal.macro_estimates.protein_g}g protein</span>
                        <span className="px-2 py-1 bg-pasta-200 text-charcoal-800 rounded-lg">{meal.macro_estimates.carbs_g}g carbs</span>
                        <span className="px-2 py-1 bg-pasta-200 text-charcoal-800 rounded-lg">{meal.macro_estimates.fat_g}g fat</span>
                      </div>
                    )}

                    {/* Ingredients */}
                    <div className="mb-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-2">Ingredients</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {meal.ingredients.map((ing, i) => (
                          <span key={i} className="px-2 py-0.5 bg-pasta-100 border border-charcoal-900/20 rounded-full text-xs font-medium">{ing}</span>
                        ))}
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="mb-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-2">Steps</h4>
                      <ol className="space-y-1.5 text-sm font-medium text-charcoal-800">
                        {meal.steps.map((step, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="font-bold text-tomato-500 shrink-0">{i + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Forks */}
                    {hasForks && (
                      <div className="pt-4 border-t-2 border-charcoal-900/10">
                        <p className="text-xs font-bold uppercase tracking-wider text-tomato-600 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-tomato-500 animate-pulse" />
                          Personal Forks
                        </p>
                        <div className="space-y-2">
                          {Object.entries(forks).map(([memberId, fork]) => (
                            <div key={memberId} className="flex items-start gap-3 bg-pasta-50 p-3 rounded-xl border-2 border-charcoal-900 shadow-[2px_2px_0px_0px_#1a1816]">
                              <div>
                                <p className="font-bold text-sm">{memberMap.get(memberId) || memberId}</p>
                                <p className="text-xs text-charcoal-800 font-medium">{fork.reason}</p>
                                {fork.swaps && fork.swaps.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {fork.swaps.map((s, i) => (
                                      <span key={i} className="text-xs bg-white px-2 py-0.5 rounded border border-charcoal-900/20">
                                        <span className="line-through text-charcoal-800/50">{s.original}</span> → <span className="font-bold text-basil-600">{s.replacement}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {fork.notes && <p className="text-xs text-charcoal-800/80 mt-1 italic">{fork.notes}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
