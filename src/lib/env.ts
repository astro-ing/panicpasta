import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1),

  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),

  LLM_MODEL: z.string().default("gpt-4o-mini"),
  LLM_API_KEY: z.string().optional(),
  LLM_MAX_TOKENS: z.coerce.number().default(4096),

  PLAN_DAILY_LIMIT_FREE: z.coerce.number().default(1),
  PLAN_DAILY_LIMIT_PRO: z.coerce.number().default(3),
  PLAN_MAX_DAYS_FREE: z.coerce.number().default(3),
  PLAN_MAX_DAYS_PRO: z.coerce.number().default(30),
  MEMBERS_MAX_FREE: z.coerce.number().default(3),
  MEMBERS_MAX_PRO: z.coerce.number().default(6),
})

export type Env = z.infer<typeof envSchema>

function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors)
    throw new Error("Invalid environment variables")
  }
  return parsed.data
}

export const env = getEnv()
