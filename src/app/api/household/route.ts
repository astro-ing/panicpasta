import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { householdUpdateSchema } from "@/lib/schemas"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const household = await prisma.household.findUnique({
    where: { userId: session.user.id },
    include: { members: { orderBy: { sortOrder: "asc" } } },
  })

  if (!household) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 })
  }

  return NextResponse.json(household)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = householdUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const household = await prisma.household.update({
    where: { userId: session.user.id },
    data: { name: parsed.data.name },
  })

  return NextResponse.json(household)
}
