"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit3, Save, X, User } from "lucide-react"
import { useRouter } from "next/navigation"

const DIET_OPTIONS = [
  { value: "none", label: "No restrictions" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
]

const AGE_OPTIONS = [
  { value: "adult", label: "Adult" },
  { value: "teen", label: "Teen" },
  { value: "child", label: "Child" },
]

const COMMON_ALLERGIES = ["dairy", "gluten", "nuts", "peanuts", "shellfish", "soy", "eggs", "fish", "sesame", "wheat"]

interface Member {
  id: string
  name: string
  ageGroup: string
  diet: string
  allergies: string[]
  dislikes: string[]
  goals: string[]
}

interface Props {
  members: Member[]
  maxMembers: number
}

export function HouseholdManager({ members: initialMembers, maxMembers }: Props) {
  const router = useRouter()
  const members = initialMembers
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    ageGroup: "adult",
    diet: "none",
    allergies: [] as string[],
    dislikes: [] as string[],
    goals: [] as string[],
  })
  const [dislikeInput, setDislikeInput] = useState("")
  const [goalInput, setGoalInput] = useState("")

  const resetForm = () => {
    setForm({ name: "", ageGroup: "adult", diet: "none", allergies: [], dislikes: [], goals: [] })
    setDislikeInput("")
    setGoalInput("")
  }

  const startEdit = (member: Member) => {
    setEditing(member.id)
    setForm({
      name: member.name,
      ageGroup: member.ageGroup,
      diet: member.diet,
      allergies: [...member.allergies],
      dislikes: [...member.dislikes],
      goals: [...member.goals],
    })
  }

  const addChip = (field: "allergies" | "dislikes" | "goals", value: string) => {
    const trimmed = value.trim().toLowerCase()
    if (trimmed && !form[field].includes(trimmed)) {
      setForm({ ...form, [field]: [...form[field], trimmed] })
    }
  }

  const removeChip = (field: "allergies" | "dislikes" | "goals", value: string) => {
    setForm({ ...form, [field]: form[field].filter((v) => v !== value) })
  }

  const handleSave = async (memberId?: string) => {
    setLoading(true)
    setError("")
    try {
      const response = memberId
        ? await fetch(`/api/members/${memberId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch("/api/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const message = typeof data?.error === "string" ? data.error : "Failed to save member"
        setError(message)
        return
      }

      router.refresh()
      if (memberId) {
        setEditing(null)
      } else {
        setAdding(false)
      }
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (memberId: string) => {
    if (!confirm("Remove this member?")) return
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/members/${memberId}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const message = typeof data?.error === "string" ? data.error : "Failed to delete member"
        setError(message)
        return
      }

      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const renderForm = (memberId?: string) => (
    <div className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816] space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1 block">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Alex"
            className="w-full h-10 px-3 rounded-xl border-2 border-charcoal-900 bg-pasta-50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-tomato-500"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1 block">Age Group</label>
          <select
            value={form.ageGroup}
            onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
            className="w-full h-10 px-3 rounded-xl border-2 border-charcoal-900 bg-pasta-50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-tomato-500"
          >
            {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1 block">Diet</label>
          <select
            value={form.diet}
            onChange={(e) => setForm({ ...form, diet: e.target.value })}
            className="w-full h-10 px-3 rounded-xl border-2 border-charcoal-900 bg-pasta-50 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-tomato-500"
          >
            {DIET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Allergies */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1 block">Allergies</label>
        <div className="flex flex-wrap gap-2">
          {COMMON_ALLERGIES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => form.allergies.includes(a) ? removeChip("allergies", a) : addChip("allergies", a)}
              className={`px-3 py-1 rounded-full text-xs font-bold border-2 border-charcoal-900 transition-all ${
                form.allergies.includes(a) ? "bg-tomato-500 text-white shadow-[2px_2px_0px_0px_#1a1816]" : "bg-white hover:bg-pasta-100"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Dislikes */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1 block">Dislikes</label>
        <div className="flex flex-wrap gap-1 mb-2">
          {form.dislikes.map((d) => (
            <Badge key={d} variant="default" className="cursor-pointer" onClick={() => removeChip("dislikes", d)}>{d} ×</Badge>
          ))}
        </div>
        <input
          value={dislikeInput}
          onChange={(e) => setDislikeInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip("dislikes", dislikeInput); setDislikeInput("") } }}
          placeholder="e.g. mushrooms, olives..."
          className="w-full h-9 px-3 rounded-lg border-2 border-charcoal-900/30 bg-pasta-50 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-tomato-500"
        />
      </div>

      {/* Goals */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1 block">Goals</label>
        <div className="flex flex-wrap gap-1 mb-2">
          {form.goals.map((g) => (
            <Badge key={g} variant="basil" className="cursor-pointer" onClick={() => removeChip("goals", g)}>{g} ×</Badge>
          ))}
        </div>
        <input
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip("goals", goalInput); setGoalInput("") } }}
          placeholder="e.g. high protein, low carb..."
          className="w-full h-9 px-3 rounded-lg border-2 border-charcoal-900/30 bg-pasta-50 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-tomato-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={() => handleSave(memberId)} disabled={loading || !form.name.trim()} size="sm">
          <Save className="w-4 h-4 mr-1" />
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setAdding(false); resetForm() }}>
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-tomato-500/10 border-2 border-tomato-500 rounded-xl">
          <p className="text-sm font-bold text-tomato-600">{error}</p>
        </div>
      )}

      {/* Member List */}
      {members.map((member) =>
        editing === member.id ? (
          <div key={member.id}>{renderForm(member.id)}</div>
        ) : (
          <div key={member.id} className="bg-white border-4 border-charcoal-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#1a1816] hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#1a1816] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pasta-200 border-2 border-charcoal-900 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-charcoal-900" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <p className="text-xs font-medium text-charcoal-800">{member.ageGroup} · {member.diet === "none" ? "No dietary restrictions" : member.diet}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(member)} className="p-2 rounded-lg hover:bg-pasta-100 transition-colors">
                  <Edit3 className="w-4 h-4 text-charcoal-800" />
                </button>
                <button onClick={() => handleDelete(member.id)} className="p-2 rounded-lg hover:bg-tomato-500/10 transition-colors">
                  <Trash2 className="w-4 h-4 text-tomato-500" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {member.allergies.map((a) => <Badge key={a} variant="tomato">{a}</Badge>)}
              {member.dislikes.map((d) => <Badge key={d} variant="default">{d}</Badge>)}
              {member.goals.map((g) => <Badge key={g} variant="basil">{g}</Badge>)}
            </div>
          </div>
        )
      )}

      {/* Add Member */}
      {adding ? (
        renderForm()
      ) : (
        <Button
          onClick={() => { setAdding(true); resetForm() }}
          variant="outline"
          className="w-full bg-white border-dashed"
          disabled={members.length >= maxMembers}
        >
          <Plus className="w-4 h-4 mr-2" />
          {members.length >= maxMembers
            ? `Member limit reached (${maxMembers})`
            : "Add Member"
          }
        </Button>
      )}
    </div>
  )
}
