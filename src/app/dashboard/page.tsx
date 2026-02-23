export const dynamic = "force-dynamic"

import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Users, CalendarDays, Plus, ChefHat } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const household = await prisma.household.findUnique({
    where: { userId: session.user.id },
    include: {
      members: { orderBy: { sortOrder: "asc" } },
      plans: { orderBy: { createdAt: "desc" }, take: 3, include: { _count: { select: { planDays: true } } } },
    },
  })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true, generationsToday: true },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-black mb-2">
          Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}! 👋
        </h1>
        <p className="text-lg text-charcoal-800 font-medium">
          {household?.name || "My Household"} · {user?.tier} tier
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Household Card */}
        <Link href="/dashboard/household" className="group">
          <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#1a1816] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-tomato-500 border-2 border-charcoal-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1a1816]">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold">Household</h2>
                <p className="text-sm text-charcoal-800 font-medium">{household?.members.length || 0} members</p>
              </div>
            </div>
            {household?.members && household.members.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {household.members.map((m) => (
                  <span key={m.id} className="px-3 py-1 bg-pasta-100 border-2 border-charcoal-900 rounded-full text-xs font-bold">
                    {m.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-charcoal-800/60 font-medium">Add your first member →</p>
            )}
          </div>
        </Link>

        {/* Plans Card */}
        <Link href="/dashboard/plans" className="group">
          <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#1a1816] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-basil-500 border-2 border-charcoal-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1a1816]">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold">Meal Plans</h2>
                <p className="text-sm text-charcoal-800 font-medium">{household?.plans.length || 0} plans</p>
              </div>
            </div>
            {household?.plans && household.plans.length > 0 ? (
              <div className="space-y-2">
                {household.plans.slice(0, 2).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="font-bold">{p.numDays}-day plan</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border-2 border-charcoal-900 ${
                      p.status === "ready" ? "bg-basil-400 text-white" :
                      p.status === "generating" ? "bg-pasta-200" : "bg-tomato-400 text-white"
                    }`}>{p.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-charcoal-800/60 font-medium">Generate your first plan →</p>
            )}
          </div>
        </Link>

        {/* Quick Actions Card */}
        <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-charcoal-800 border-2 border-charcoal-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1a1816]">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold">Quick Actions</h2>
              <p className="text-sm text-charcoal-800 font-medium">{user?.generationsToday || 0} used today</p>
            </div>
          </div>
          <div className="space-y-3">
            <Link href="/dashboard/plans/new">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Generate New Plan
              </Button>
            </Link>
            <Link href="/dashboard/household">
              <Button variant="outline" className="w-full bg-white">
                <Users className="w-4 h-4 mr-2" />
                Manage Household
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
