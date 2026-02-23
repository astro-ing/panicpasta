export const dynamic = "force-dynamic"

import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Plus, CalendarDays } from "lucide-react"

export default async function PlansPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const household = await prisma.household.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!household) return null

  const plans = await prisma.plan.findMany({
    where: { householdId: household.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { planDays: true } } },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-black mb-2">Meal Plans</h1>
          <p className="text-lg text-charcoal-800 font-medium">Your generated meal plans.</p>
        </div>
        <Link href="/dashboard/plans/new">
          <Button size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Plan
          </Button>
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-12 shadow-[6px_6px_0px_0px_#1a1816] text-center">
          <CalendarDays className="w-16 h-16 text-charcoal-800/20 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold mb-2">No plans yet</h2>
          <p className="text-charcoal-800 font-medium mb-6">Generate your first meal plan to get started.</p>
          <Link href="/dashboard/plans/new">
            <Button><Plus className="w-4 h-4 mr-2" />Generate Plan</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Link key={plan.id} href={`/dashboard/plans/${plan.id}`}>
              <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#1a1816] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-xl font-bold">{plan.numDays}-Day Plan</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 border-charcoal-900 ${
                    plan.status === "ready" ? "bg-basil-400 text-white" :
                    plan.status === "generating" ? "bg-pasta-200" : "bg-tomato-400 text-white"
                  }`}>{plan.status}</span>
                </div>
                <p className="text-sm text-charcoal-800 font-medium">
                  Starting {new Date(plan.startDate).toLocaleDateString()} · {plan._count.planDays} days generated
                </p>
                {plan.useItUpMode && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-basil-400/20 text-basil-600 text-xs font-bold rounded-full">
                    🥫 Use-it-up mode
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
