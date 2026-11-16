// A 2D vector: an arrow with an x part and a y part.
export type Vec2 = { x: number; y: number }

// Make a vector from two numbers.
export function vec(x: number, y: number): Vec2 {
  return { x, y }
}

// Add two vectors, piece by piece.
export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

// ===== YOUR TURN: write the function below, then save (Ctrl + S) =====

// Subtract b from a, piece by piece. (Copy add, change + to -)
export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y }
}
export function scale(v: Vec2, k: number): Vec2 {
  return { x: v.x * k, y: v.y * k }
}
export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

export function lengthSq(v: Vec2): number {
  return v.x * v.x + v.y * v.y
}

export function length(v: Vec2): number {
  return Math.sqrt(lengthSq(v))
}