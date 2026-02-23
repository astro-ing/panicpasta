import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    include: {
      planDays: { orderBy: { dayIndex: "asc" } },
      household: { include: { members: { orderBy: { sortOrder: "asc" } } } },
    },
  })

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  }

  return NextResponse.json(plan)
}
