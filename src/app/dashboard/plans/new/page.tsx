"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"

const DEFAULT_MEALS = {
  meal_1: { enabled: true, label: "Breakfast", type: "breakfast" as const },
  meal_2: { enabled: true, label: "Lunch", type: "meal" as const },
  meal_3: { enabled: true, label: "Dinner", type: "meal" as const },
  meal_4: { enabled: false, label: "Evening snack", type: "snack" as const },
}

export default function NewPlanPage() {
  const router = useRouter()
  const [numDays, setNumDays] = useState(3)
  const [mealsEnabled, setMealsEnabled] = useState(DEFAULT_MEALS)
  const [useItUpMode, setUseItUpMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const toggleMeal = (key: string) => {
    setMealsEnabled((prev) => ({
      ...prev,
      [key]: { ...prev[key as keyof typeof prev], enabled: !prev[key as keyof typeof prev].enabled },
    }))
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: new Date().toISOString().split("T")[0],
          numDays,
          mealsEnabled,
          useItUpMode,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to generate plan")
        return
      }
      router.push(`/dashboard/plans/${data.planId}`)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-black mb-2">Generate Meal Plan</h1>
        <p className="text-lg text-charcoal-800 font-medium">
          Configure your plan and we'll handle the rest.
        </p>
      </div>

      <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#1a1816] space-y-6">
        {/* Days */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-3 block">Number of Days</label>
          <div className="flex gap-3">
            {[1, 2, 3, 5, 7].map((d) => (
              <button
                key={d}
                onClick={() => setNumDays(d)}
                className={`w-14 h-14 rounded-xl border-2 border-charcoal-900 font-bold text-lg transition-all ${
                  numDays === d
                    ? "bg-tomato-500 text-white shadow-[4px_4px_0px_0px_#1a1816]"
                    : "bg-white hover:bg-pasta-100"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Meal Slots */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-3 block">Meal Slots</label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(mealsEnabled).map(([key, meal]) => (
              <button
                key={key}
                onClick={() => toggleMeal(key)}
                className={`p-4 rounded-xl border-2 border-charcoal-900 font-bold text-sm transition-all text-left ${
                  meal.enabled
                    ? "bg-basil-400 text-white shadow-[4px_4px_0px_0px_#1a1816]"
                    : "bg-white hover:bg-pasta-100 text-charcoal-800"
                }`}
              >
                <div>{meal.label}</div>
                <div className="text-xs opacity-80 mt-0.5">{meal.type}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Use-it-up mode */}
        <div>
          <button
            onClick={() => setUseItUpMode(!useItUpMode)}
            className={`w-full p-4 rounded-xl border-2 border-charcoal-900 font-bold text-sm transition-all text-left flex items-center justify-between ${
              useItUpMode
                ? "bg-charcoal-800 text-white shadow-[4px_4px_0px_0px_#1a1816]"
                : "bg-white hover:bg-pasta-100"
            }`}
          >
            <div>
              <div>🥫 Use-it-up Mode</div>
              <div className="text-xs opacity-80 mt-0.5">Prioritize pantry ingredients (Pro)</div>
            </div>
            <div className={`w-5 h-5 rounded border-2 border-charcoal-900 ${useItUpMode ? "bg-basil-400" : "bg-white"}`} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-tomato-500/10 border-2 border-tomato-500 rounded-xl">
            <p className="text-sm font-bold text-tomato-600">{error}</p>
          </div>
        )}

        <Button onClick={handleGenerate} disabled={loading} size="lg" className="w-full text-lg">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate {numDays}-Day Plan
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
