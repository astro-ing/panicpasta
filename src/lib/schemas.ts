import { z } from "zod"

export const DietTypeEnum = z.enum([
  "none", "vegetarian", "vegan", "pescatarian", "keto", "paleo", "halal", "kosher",
])

export const AgeGroupEnum = z.enum(["adult", "teen", "child"])

export const memberCreateSchema = z.object({
  name: z.string().min(1).max(50),
  ageGroup: AgeGroupEnum.default("adult"),
  diet: DietTypeEnum.default("none"),
  allergies: z.array(z.string().max(50)).max(20).default([]),
  dislikes: z.array(z.string().max(50)).max(20).default([]),
  goals: z.array(z.string().max(100)).max(10).default([]),
})

export const memberUpdateSchema = memberCreateSchema.partial()

export const householdUpdateSchema = z.object({
  name: z.string().min(1).max(100),
})

export const mealSlotSchema = z.object({
  enabled: z.boolean(),
  label: z.string(),
  type: z.enum(["breakfast", "meal", "snack"]),
})

export const generatePlanSchema = z.object({
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  numDays: z.number().int().min(1).max(31),
  mealsEnabled: z.record(z.string(), mealSlotSchema).default({
    meal_1: { enabled: true, label: "Breakfast", type: "breakfast" },
    meal_2: { enabled: true, label: "Lunch", type: "meal" },
    meal_3: { enabled: true, label: "Dinner", type: "meal" },
    meal_4: { enabled: false, label: "Evening snack", type: "snack" },
  }),
  useItUpMode: z.boolean().default(false),
})

export const shoppingItemSchema = z.object({
  name: z.string(),
  qty: z.string(),
  category: z.string(),
})

export const forkSchema = z.object({
  reason: z.string(),
  swaps: z.array(z.object({
    original: z.string(),
    replacement: z.string(),
  })).default([]),
  notes: z.string().default(""),
})

export const mealSchema = z.object({
  name: z.string(),
  description: z.string(),
  ingredients: z.array(z.string()),
  steps: z.array(z.string()),
  prep_time_min: z.number(),
  servings: z.number(),
  macro_estimates: z.object({
    calories: z.number(),
    protein_g: z.number(),
    carbs_g: z.number(),
    fat_g: z.number(),
  }).optional(),
  shopping_items: z.array(shoppingItemSchema).default([]),
  forks: z.record(z.string(), forkSchema).default({}),
})

export const dayMealsSchema = z.record(
  z.string(),
  mealSchema.nullable()
)

export const llmPlanOutputSchema = z.object({
  days: z.array(z.object({
    day_index: z.number(),
    meals: dayMealsSchema,
  })),
})

export type MemberCreate = z.infer<typeof memberCreateSchema>
export type MemberUpdate = z.infer<typeof memberUpdateSchema>
export type GeneratePlanInput = z.infer<typeof generatePlanSchema>
export type Meal = z.infer<typeof mealSchema>
export type DayMeals = z.infer<typeof dayMealsSchema>
export type Fork = z.infer<typeof forkSchema>
export type ShoppingItem = z.infer<typeof shoppingItemSchema>
export type LLMPlanOutput = z.infer<typeof llmPlanOutputSchema>
