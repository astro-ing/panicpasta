import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2026-01-28.clover",
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const email = session.customer_email || session.customer_details?.email
      const metadataUserId = session.metadata?.userId
      const stripeCustomerId = typeof session.customer === "string" ? session.customer : undefined

      if (metadataUserId) {
        await prisma.user.updateMany({
          where: { id: metadataUserId },
          data: {
            tier: "PRO",
            stripeCustomerId,
          },
        })
      } else if (email) {
        await prisma.user.updateMany({
          where: { email },
          data: {
            tier: "PRO",
            stripeCustomerId,
          },
        })
      } else if (stripeCustomerId) {
        await prisma.user.updateMany({
          where: { stripeCustomerId },
          data: { tier: "PRO" },
        })
      }
      break
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { tier: "FREE" },
      })
      break
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { tier: "FREE" },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
