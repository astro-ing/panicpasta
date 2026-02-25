export type MeasurementSystem = "metric" | "imperial"

export function guessMeasurementSystem(timezone?: string | null): MeasurementSystem {
  if (!timezone) return "metric"
  return timezone.startsWith("America/") ? "imperial" : "metric"
}
