import type { Member, DietType } from "@prisma/client"

export interface ForkSpec {
  memberId: string
  memberName: string
  reason: string
  diet: DietType
  allergies: string[]
  goals: string[]
}

export interface ConstraintResult {
  hardExcludes: string[]
  baseDiet: DietType
  forkSpecs: ForkSpec[]
  householdSize: number
}

const DIET_RESTRICTIVENESS: Record<string, number> = {
  none: 0,
  pescatarian: 1,
  halal: 2,
  kosher: 2,
  keto: 3,
  paleo: 3,
  vegetarian: 4,
  vegan: 5,
}

export function buildConstraints(members: Member[]): ConstraintResult {
  const allAllergies = new Set<string>()
  members.forEach((m) => m.allergies.forEach((a) => allAllergies.add(a.toLowerCase())))

  let baseDiet: DietType = "none"
  let maxRestriction = 0
  for (const m of members) {
    const level = DIET_RESTRICTIVENESS[m.diet] ?? 0
    if (level > maxRestriction) {
      maxRestriction = level
      baseDiet = m.diet
    }
  }

  const forkSpecs: ForkSpec[] = []
  for (const m of members) {
    const needsFork =
      m.diet !== baseDiet ||
      m.allergies.length > 0 ||
      m.goals.length > 0

    if (needsFork) {
      forkSpecs.push({
        memberId: m.id,
        memberName: m.name,
        reason: [
          m.diet !== baseDiet ? m.diet : null,
          m.allergies.length > 0 ? `allergies: ${m.allergies.join(", ")}` : null,
          m.goals.length > 0 ? `goals: ${m.goals.join(", ")}` : null,
        ].filter(Boolean).join("; "),
        diet: m.diet,
        allergies: m.allergies,
        goals: m.goals,
      })
    }
  }

  return {
    hardExcludes: Array.from(allAllergies),
    baseDiet,
    forkSpecs,
    householdSize: members.length,
  }
}
