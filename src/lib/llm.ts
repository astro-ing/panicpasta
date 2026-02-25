import OpenAI from "openai"
import type { ConstraintResult } from "./constraints"
import type { GeneratePlanInput, LLMPlanOutput } from "./schemas"
import { llmPlanOutputSchema } from "./schemas"
import type { MeasurementSystem } from "./measurement"

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
})

export async function generateMealPlan(
  constraints: ConstraintResult,
  input: GeneratePlanInput,
  pantryItems?: string[],
  measurementSystem: MeasurementSystem = "metric"
): Promise<LLMPlanOutput> {
  const enabledMeals = Object.entries(input.mealsEnabled)
    .filter(([, v]) => v.enabled)
    .map(([k, v]) => `${k}: ${v.label} (${v.type})`)
    .join(", ")

  const forkInstructions = constraints.forkSpecs.length > 0
    ? `\nMembers needing personal forks:\n${constraints.forkSpecs.map(
        (f) => `- ${f.memberName} (id: ${f.memberId}): ${f.reason}`
      ).join("\n")}\n\nFor each meal, include a "forks" object keyed by memberId with { reason, swaps: [{ original, replacement }], notes } ONLY for members who differ from the base meal. If the base meal already suits a member, omit their fork.`
    : "\nAll household members share the same dietary profile. Do NOT include any forks."

  const pantryNote = pantryItems && pantryItems.length > 0
    ? `\nPrioritize using these pantry items: ${pantryItems.join(", ")}`
    : ""

  const measurementInstructions = measurementSystem === "imperial"
    ? "Use imperial units for ingredient quantities and instructions (oz, lb, cups, tbsp, tsp, F)."
    : "Use metric units for ingredient quantities and instructions (g, kg, ml, l, C)."

  const prompt = `You are a meal planning assistant. Generate a ${input.numDays}-day meal plan as JSON.

Household: ${constraints.householdSize} people
Base diet: ${constraints.baseDiet}
Hard allergen excludes: ${constraints.hardExcludes.length > 0 ? constraints.hardExcludes.join(", ") : "none"}
Meal slots per day: ${enabledMeals}
Measurement system: ${measurementSystem}
${measurementInstructions}
${forkInstructions}${pantryNote}

Output ONLY valid JSON matching this structure exactly:
{
  "days": [
    {
      "day_index": 0,
      "meals": {
        "<meal_slot_key>": {
          "name": "Meal Name",
          "description": "Brief description",
          "ingredients": ["ingredient1", "ingredient2"],
          "steps": ["Step 1...", "Step 2..."],
          "prep_time_min": 30,
          "servings": ${constraints.householdSize},
          "macro_estimates": { "calories": 500, "protein_g": 30, "carbs_g": 60, "fat_g": 15 },
          "shopping_items": [{ "name": "item", "qty": "amount", "category": "produce|pantry|protein|dairy|other" }],
          "forks": {}
        }
      }
    }
  ]
}

Set disabled meal slots to null. Ensure variety across days. Keep recipes practical and family-friendly.
Macro estimates are rough approximations — label them as such.`

  const model = process.env.LLM_MODEL || "gpt-4o-mini"
  const maxTokens = Number(process.env.LLM_MAX_TOKENS || 4096)

  const baseRequest = {
    model,
    messages: [{ role: "user" as const, content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" as const },
  }

  const response = model.startsWith("gpt-5")
    ? await openai.chat.completions.create({
        ...baseRequest,
        max_completion_tokens: maxTokens,
      })
    : await openai.chat.completions.create({
        ...baseRequest,
        max_tokens: maxTokens,
      })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error("Empty LLM response")
  }

  const parsed = JSON.parse(content)
  const validated = llmPlanOutputSchema.parse(parsed)
  return validated
}
