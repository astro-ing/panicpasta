import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const pantryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().max(50).default("other"),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  })
  if (user?.tier !== "PRO") {
    return NextResponse.json({ error: "Pantry is a Pro feature." }, { status: 403 })
  }

  const household = await prisma.household.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!household) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 })
  }

  const items = await prisma.pantryItem.findMany({
    where: { householdId: household.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  })
  if (user?.tier !== "PRO") {
    return NextResponse.json({ error: "Pantry is a Pro feature." }, { status: 403 })
  }

  const household = await prisma.household.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!household) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = pantryCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const item = await prisma.pantryItem.create({
    data: { ...parsed.data, householdId: household.id },
  })

  return NextResponse.json(item, { status: 201 })
}
