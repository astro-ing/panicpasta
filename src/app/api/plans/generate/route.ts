import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generatePlanSchema } from "@/lib/schemas"
import { buildConstraints } from "@/lib/constraints"
import { generateMealPlan } from "@/lib/llm"
import { guessMeasurementSystem } from "@/lib/measurement"

const PLAN_DAILY_LIMIT_FREE = Number(process.env.PLAN_DAILY_LIMIT_FREE || 1)
const PLAN_DAILY_LIMIT_PRO = Number(process.env.PLAN_DAILY_LIMIT_PRO || 3)
const PLAN_MAX_DAYS_FREE = Number(process.env.PLAN_MAX_DAYS_FREE || 3)
const PLAN_MAX_DAYS_PRO = Number(process.env.PLAN_MAX_DAYS_PRO || 30)

function normalizeMealsForConfiguredSlots(
  rawMeals: Record<string, unknown>,
  mealsEnabled: Record<string, { enabled: boolean }>
) {
  const normalized: Record<string, unknown> = {}

  for (const [slotKey, slotConfig] of Object.entries(mealsEnabled)) {
    if (!slotConfig.enabled) {
      normalized[slotKey] = null
      continue
    }

    normalized[slotKey] = slotKey in rawMeals ? rawMeals[slotKey] : null
  }

  return normalized
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true, generationsToday: true, generationsResetAt: true, measurementSystem: true },
  })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const now = new Date()
  const resetAt = new Date(user.generationsResetAt)
  const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60)
  let currentCount = user.generationsToday
  if (hoursSinceReset >= 24) {
    currentCount = 0
  }

  const dailyLimit = user.tier === "PRO" ? PLAN_DAILY_LIMIT_PRO : PLAN_DAILY_LIMIT_FREE
  if (currentCount >= dailyLimit) {
    return NextResponse.json(
      { error: `Daily generation limit reached (${dailyLimit}). ${user.tier === "FREE" ? "Upgrade to Pro for more." : "Try again tomorrow."}` },
      { status: 429 }
    )
  }

  const body = await req.json()
  const parsed = generatePlanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const maxDays = user.tier === "PRO" ? PLAN_MAX_DAYS_PRO : PLAN_MAX_DAYS_FREE
  if (parsed.data.numDays > maxDays) {
    return NextResponse.json(
      { error: `Max ${maxDays} days for ${user.tier} tier.` },
      { status: 403 }
    )
  }

  const effectiveUseItUpMode = user.tier === "PRO" ? parsed.data.useItUpMode : false

  let measurementSystem = user.measurementSystem
  if (!measurementSystem) {
    measurementSystem = guessMeasurementSystem(parsed.data.timezone)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { measurementSystem },
    })
  }

  const household = await prisma.household.findUnique({
    where: { userId: session.user.id },
    include: { members: { orderBy: { sortOrder: "asc" } }, pantryItems: true },
  })
  if (!household || household.members.length === 0) {
    return NextResponse.json(
      { error: "Add at least one household member before generating a plan." },
      { status: 400 }
    )
  }

  const plan = await prisma.plan.create({
    data: {
      householdId: household.id,
      startDate: new Date(parsed.data.startDate),
      numDays: parsed.data.numDays,
      mealsEnabled: parsed.data.mealsEnabled,
      useItUpMode: effectiveUseItUpMode,
      status: "generating",
    },
  })

  try {
    const constraints = buildConstraints(household.members)
    const pantryItems = effectiveUseItUpMode
      ? household.pantryItems.map((p) => p.name)
      : undefined

    const llmResult = await generateMealPlan(constraints, parsed.data, pantryItems, measurementSystem)

    await prisma.$transaction([
      ...llmResult.days.map((day) => {
        const normalizedMeals = normalizeMealsForConfiguredSlots(
          day.meals as Record<string, unknown>,
          parsed.data.mealsEnabled
        )

        return prisma.planDay.create({
          data: {
            planId: plan.id,
            dayIndex: day.day_index,
            meals: normalizedMeals as object,
          },
        })
      }),
      prisma.plan.update({
        where: { id: plan.id },
        data: { status: "ready" },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          generationsToday: hoursSinceReset >= 24 ? 1 : { increment: 1 },
          generationsResetAt: hoursSinceReset >= 24 ? now : undefined,
        },
      }),
    ])

    return NextResponse.json({ planId: plan.id, status: "ready" }, { status: 201 })
  } catch (error) {
    await prisma.plan.update({
      where: { id: plan.id },
      data: { status: "failed" },
    })
    console.error("Plan generation failed:", error)
    return NextResponse.json(
      { error: "Plan generation failed. Please try again." },
      { status: 500 }
    )
  }
}
