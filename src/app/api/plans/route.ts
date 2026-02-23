import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const household = await prisma.household.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!household) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 })
  }

  const plans = await prisma.plan.findMany({
    where: { householdId: household.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { planDays: true } } },
  })

  return NextResponse.json(plans)
}
