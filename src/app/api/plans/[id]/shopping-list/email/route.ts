import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { aggregateShoppingList } from "@/lib/shopping-list"

export const dynamic = "force-dynamic"

const PLAN_DAILY_LIMIT_FREE = Number(process.env.PLAN_DAILY_LIMIT_FREE || 1)
const PLAN_DAILY_LIMIT_PRO = Number(process.env.PLAN_DAILY_LIMIT_PRO || 3)

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getMailerConfig() {
  const host = process.env.EMAIL_SERVER_HOST
  const user = process.env.EMAIL_SERVER_USER
  const pass = process.env.EMAIL_SERVER_PASSWORD
  const from = process.env.EMAIL_FROM
  const port = Number(process.env.EMAIL_SERVER_PORT || 587)

  if (!host || !user || !pass || !from) return null
  return { host, user, pass, from, port }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      tier: true,
      shoppingEmailsToday: true,
      shoppingEmailsResetAt: true,
    },
  })

  if (!user?.email) {
    return NextResponse.json({ error: "No account email available for sending." }, { status: 400 })
  }

  const now = new Date()
  const resetAt = new Date(user.shoppingEmailsResetAt)
  const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60)
  let currentCount = user.shoppingEmailsToday
  if (hoursSinceReset >= 24) {
    currentCount = 0
  }

  const dailyLimit = user.tier === "PRO" ? PLAN_DAILY_LIMIT_PRO : PLAN_DAILY_LIMIT_FREE
  if (currentCount >= dailyLimit) {
    return NextResponse.json(
      {
        error: `Daily shopping-list email limit reached (${dailyLimit}). ${user.tier === "FREE" ? "Upgrade to Pro for more." : "Try again tomorrow."}`,
      },
      { status: 429 }
    )
  }

  const mailer = getMailerConfig()
  if (!mailer) {
    return NextResponse.json({ error: "Email delivery is not configured." }, { status: 503 })
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
    include: { planDays: true },
  })

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  }

  const { grouped, totalItems } = aggregateShoppingList(plan.planDays)
  if (totalItems === 0) {
    return NextResponse.json({ error: "This plan has no shopping items to email." }, { status: 400 })
  }

  const categoryNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b))
  const listBody = categoryNames
    .map((category) => {
      const items = grouped[category]
        .map((item) => `- ${item.name}: ${item.quantities.join(" + ")}`)
        .join("\n")

      return `${toTitleCase(category)}\n${items}`
    })
    .join("\n\n")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
  const shoppingUrl = `${appUrl}/dashboard/plans/${id}/shopping`

  const text = [
    `Your PANIC Pasta shopping list for a ${plan.numDays}-day plan`,
    "",
    listBody,
    "",
    `Open in PANIC Pasta: ${shoppingUrl}`,
  ].join("\n")

  try {
    const transporter = nodemailer.createTransport({
      host: mailer.host,
      port: mailer.port,
      secure: mailer.port === 465,
      auth: {
        user: mailer.user,
        pass: mailer.pass,
      },
    })

    await transporter.sendMail({
      from: mailer.from,
      to: user.email,
      subject: `PANIC Pasta shopping list (${plan.numDays}-day plan)`,
      text,
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        shoppingEmailsToday: hoursSinceReset >= 24 ? 1 : { increment: 1 },
        shoppingEmailsResetAt: hoursSinceReset >= 24 ? now : undefined,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Shopping list email failed:", error)
    return NextResponse.json({ error: "Failed to send shopping list email." }, { status: 500 })
  }
}
