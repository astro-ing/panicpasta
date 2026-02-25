import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { accountUpdateSchema } from "@/lib/schemas"
import { guessMeasurementSystem } from "@/lib/measurement"

const PLAN_DAILY_LIMIT_FREE = Number(process.env.PLAN_DAILY_LIMIT_FREE || 1)
const PLAN_DAILY_LIMIT_PRO = Number(process.env.PLAN_DAILY_LIMIT_PRO || 3)
const PLAN_MAX_DAYS_FREE = Number(process.env.PLAN_MAX_DAYS_FREE || 3)
const PLAN_MAX_DAYS_PRO = Number(process.env.PLAN_MAX_DAYS_PRO || 30)
const MEMBERS_MAX_FREE = Number(process.env.MEMBERS_MAX_FREE || 2)
const MEMBERS_MAX_PRO = Number(process.env.MEMBERS_MAX_PRO || 6)

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      tier: true,
      stripeCustomerId: true,
      generationsToday: true,
      generationsResetAt: true,
      measurementSystem: true,
      newsletterSubscribed: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  let measurementSystem = user.measurementSystem
  if (!measurementSystem) {
    const timezone = req.nextUrl.searchParams.get("timezone")
    measurementSystem = guessMeasurementSystem(timezone)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { measurementSystem },
    })
  }

  const isPro = user.tier === "PRO"

  return NextResponse.json({
    email: user.email,
    tier: user.tier,
    stripeCustomerId: user.stripeCustomerId,
    generationsToday: user.generationsToday,
    generationsResetAt: user.generationsResetAt,
    measurementSystem,
    newsletterSubscribed: user.newsletterSubscribed,
    createdAt: user.createdAt,
    limits: {
      dailyGenerations: isPro ? PLAN_DAILY_LIMIT_PRO : PLAN_DAILY_LIMIT_FREE,
      maxPlanDays: isPro ? PLAN_MAX_DAYS_PRO : PLAN_MAX_DAYS_FREE,
      maxMembers: isPro ? MEMBERS_MAX_PRO : MEMBERS_MAX_FREE,
    },
  })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = accountUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(parsed.data.measurementSystem !== undefined
        ? { measurementSystem: parsed.data.measurementSystem }
        : {}),
      ...(parsed.data.newsletterSubscribed !== undefined
        ? { newsletterSubscribed: parsed.data.newsletterSubscribed }
        : {}),
    },
    select: { measurementSystem: true, newsletterSubscribed: true },
  })

  return NextResponse.json(updated)
}
