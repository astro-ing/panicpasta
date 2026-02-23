export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { HouseholdManager } from "@/components/dashboard/household-manager"

export default async function HouseholdPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const household = await prisma.household.findUnique({
    where: { userId: session.user.id },
    include: { members: { orderBy: { sortOrder: "asc" } } },
  })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  })

  if (!household) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-black mb-2">Your Household</h1>
        <p className="text-lg text-charcoal-800 font-medium">
          Manage your household members and their dietary preferences.
        </p>
      </div>
      <HouseholdManager
        household={household}
        members={household.members}
        tier={user?.tier || "FREE"}
      />
    </div>
  )
}
