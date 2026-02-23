import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { memberUpdateSchema } from "@/lib/schemas"

async function getHouseholdId(userId: string) {
  const household = await prisma.household.findUnique({
    where: { userId },
    select: { id: true },
  })
  return household?.id
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const householdId = await getHouseholdId(session.user.id)
  if (!householdId) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 })
  }

  const existing = await prisma.member.findFirst({
    where: { id, householdId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = memberUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const member = await prisma.member.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(member)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const householdId = await getHouseholdId(session.user.id)
  if (!householdId) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 })
  }

  const existing = await prisma.member.findFirst({
    where: { id, householdId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  await prisma.member.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
