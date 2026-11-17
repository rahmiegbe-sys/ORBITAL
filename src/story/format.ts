const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }

// 2.4e-9 → "2.4 × 10⁻⁹"
export function sci(e: number) {
  if (e === 0) return '0'
  const [m, x] = e.toExponential(1).split('e')
  return `${m} × 10${x.replace('+', '').split('').map((c) => SUP[c] ?? c).join('')}`
}
