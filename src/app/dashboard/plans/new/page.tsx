"use client"

import { useEffect, useState } from "react"
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
  const [numDaysInput, setNumDaysInput] = useState("1")
  const [mealsEnabled, setMealsEnabled] = useState(DEFAULT_MEALS)
  const [useItUpMode, setUseItUpMode] = useState(false)
  const [tier, setTier] = useState<"FREE" | "PRO">("FREE")
  const [maxPlanDays, setMaxPlanDays] = useState(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isPro = tier === "PRO"
  const trimmedDaysInput = numDaysInput.trim()
  const hasWholeNumberInput = /^\d+$/.test(trimmedDaysInput)
  const parsedNumDays = Number.parseInt(trimmedDaysInput, 10)
  const isNumDaysInRange = hasWholeNumberInput && parsedNumDays >= 1 && parsedNumDays <= 31
  const exceedsTierLimit = isNumDaysInRange && parsedNumDays > maxPlanDays
  const displayNumDays = isNumDaysInRange ? parsedNumDays : 1

  useEffect(() => {
    let cancelled = false

    fetch("/api/account", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && (data.tier === "FREE" || data.tier === "PRO")) {
          setTier(data.tier)
          if (typeof data?.limits?.maxPlanDays === "number") {
            setMaxPlanDays(data.limits.maxPlanDays)
          } else {
            setMaxPlanDays(data.tier === "PRO" ? 30 : 3)
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTier("FREE")
          setMaxPlanDays(3)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isPro) {
      setUseItUpMode(false)
    }
  }, [isPro])

  const toggleMeal = (key: string) => {
    setMealsEnabled((prev) => ({
      ...prev,
      [key]: { ...prev[key as keyof typeof prev], enabled: !prev[key as keyof typeof prev].enabled },
    }))
  }

  const handleNumDaysBlur = () => {
    const trimmed = numDaysInput.trim()
    if (!/^\d+$/.test(trimmed)) {
      setNumDaysInput("1")
      return
    }

    const normalized = Math.min(Math.max(Number.parseInt(trimmed, 10), 1), 31)
    setNumDaysInput(String(normalized))
  }

  const handleGenerate = async () => {
    setError("")

    if (!isNumDaysInRange) {
      setError("Enter a whole number of days between 1 and 31.")
      return
    }

    if (exceedsTierLimit) {
      setError(`${tier} tier supports up to ${maxPlanDays} days. Reduce days or upgrade to Pro.`)
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: new Date().toISOString().split("T")[0],
          numDays: parsedNumDays,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          mealsEnabled,
          useItUpMode: isPro ? useItUpMode : false,
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
          Configure your plan and we&apos;ll handle the rest.
        </p>
      </div>

      <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#1a1816] space-y-6">
        {/* Days */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-3 block">Number of Days</label>
          <div className="space-y-2">
            <input
              type="number"
              min={1}
              max={31}
              step={1}
              value={numDaysInput}
              onChange={(e) => setNumDaysInput(e.target.value.replace(/[^\d]/g, ""))}
              onBlur={handleNumDaysBlur}
              className="w-full h-12 px-4 rounded-xl border-2 border-charcoal-900 bg-pasta-50 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-tomato-500"
            />
            <p className="text-xs font-bold text-charcoal-800">
              Max for {tier} tier: {maxPlanDays} day{maxPlanDays === 1 ? "" : "s"}
            </p>
          </div>

          {exceedsTierLimit && (
            <div className="mt-3 p-3 bg-tomato-500/10 border-2 border-tomato-500 rounded-xl">
              <p className="text-xs font-bold text-tomato-600">
                {tier} tier allows up to {maxPlanDays} days. Reduce the number of days or upgrade to Pro.
              </p>
            </div>
          )}
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
            type="button"
            disabled={!isPro}
            onClick={() => {
              if (!isPro) return
              setUseItUpMode(!useItUpMode)
            }}
            className={`w-full p-4 rounded-xl border-2 border-charcoal-900 font-bold text-sm transition-all text-left flex items-center justify-between ${
              !isPro
                ? "bg-pasta-100 text-charcoal-800/60 cursor-not-allowed"
                : useItUpMode
                ? "bg-charcoal-800 text-white shadow-[4px_4px_0px_0px_#1a1816]"
                : "bg-white hover:bg-pasta-100"
            }`}
          >
            <div>
              <div>{isPro ? "🥫 Use-it-up Mode" : "🥫 Use-it-up Mode (Pro feature)"}</div>
              <div className="text-xs opacity-80 mt-0.5">Prioritize pantry ingredients you already have.</div>
            </div>
            <div
              className={`w-5 h-5 rounded border-2 border-charcoal-900 ${
                useItUpMode ? "bg-basil-400" : "bg-white"
              } ${!isPro ? "opacity-60" : ""}`}
            />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-tomato-500/10 border-2 border-tomato-500 rounded-xl">
            <p className="text-sm font-bold text-tomato-600">{error}</p>
          </div>
        )}

        <Button onClick={handleGenerate} disabled={loading || !isNumDaysInRange || exceedsTierLimit} size="lg" className="w-full text-lg">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate {displayNumDays}-Day Plan
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
