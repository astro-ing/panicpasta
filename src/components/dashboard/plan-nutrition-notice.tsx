export function PlanNutritionNotice() {
  return (
    <div className="rounded-xl border-2 border-charcoal-900 bg-pasta-100 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-charcoal-800">Important note</p>
      <p className="mt-2 text-sm font-medium text-charcoal-800">
        Recipes and macro estimates are AI-generated and are not currently validated against a nutrition database. Nutrition values are approximate, and recipe details may contain errors. Please review and verify ingredients, allergens, and nutrition information before cooking.
      </p>
    </div>
  )
}
