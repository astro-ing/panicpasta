import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { memberCreateSchema } from "@/lib/schemas"

const MEMBERS_MAX_FREE = Number(process.env.MEMBERS_MAX_FREE || 3)
const MEMBERS_MAX_PRO = Number(process.env.MEMBERS_MAX_PRO || 6)

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const household = await prisma.household.findUnique({
    where: { userId: session.user.id },
  })
  if (!household) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 })
  }

  const members = await prisma.member.findMany({
    where: { householdId: household.id },
    orderBy: { sortOrder: "asc" },
  })

  return NextResponse.json(members)
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

  const household = await prisma.household.findUnique({
    where: { userId: session.user.id },
    include: { members: true },
  })
  if (!household) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 })
  }

  const maxMembers = user?.tier === "PRO" ? MEMBERS_MAX_PRO : MEMBERS_MAX_FREE
  if (household.members.length >= maxMembers) {
    return NextResponse.json(
      { error: `Member limit reached (${maxMembers}). ${user?.tier === "FREE" ? "Upgrade to Pro for more." : ""}` },
      { status: 403 }
    )
  }

  const body = await req.json()
  const parsed = memberCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const member = await prisma.member.create({
    data: {
      ...parsed.data,
      householdId: household.id,
      sortOrder: household.members.length,
    },
  })

  return NextResponse.json(member, { status: 201 })
}
