// Unit system: G = 1, mass in solar masses, distance in AU.
// Then a 1 AU circular orbit around 1 solar mass has period 2π time units,
// and that orbit is Earth's — so 2π simulation time units = 1 year.
export const TIME_UNITS_PER_YEAR = 2 * Math.PI

export function simTimeToYears(t: number): number {
  return t / TIME_UNITS_PER_YEAR
}

// Pick a readable unit: days → months → years → centuries.
export function formatElapsed(years: number): string {
  if (years < 1 / 12) return `${(years * 365.25).toFixed(1)} days`
  if (years < 1) return `${(years * 12).toFixed(1)} months`
  if (years < 100) return `${years.toFixed(2)} years`
  return `${(years / 100).toFixed(2)} centuries`
}
