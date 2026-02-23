import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
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

  const item = await prisma.pantryItem.findFirst({
    where: { id, householdId: household.id },
  })
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 })
  }

  await prisma.pantryItem.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
