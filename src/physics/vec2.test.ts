import { describe, expect, test } from 'vitest'
import { vec, add, sub, scale, dot, lengthSq, length } from './vec2'

describe('vec2', () => {
    test('add combines components', () => {
        const r = add(vec(1, 2), vec(3, 4))
        expect(r.x).toBeCloseTo(4)
        expect(r.y).toBeCloseTo(6)
    })
    test('sub points from second to first', () => {
        const r = sub(vec(3, 4), vec(0, 0))
        expect(r.x).toBeCloseTo(3)
        expect(r.y).toBeCloseTo(4)
    })
    test('scale multiplies both parts', () => {
        const r = scale(vec(3, 4), 2)
        expect(r.x).toBeCloseTo(6)
        expect(r.y).toBeCloseTo(8)
    })
    test('dot of perpendicular vectors is 0', () => {
        expect(dot(vec(1, 0), vec(0, 1))).toBeCloseTo(0)
    })

    test('lengthSq of (3,4) is 25', () => {
        expect(lengthSq(vec(3, 4))).toBeCloseTo(25)
    })

    test('length of (3,4) is 5', () => {
        expect(length(vec(3, 4))).toBeCloseTo(5)
    })
})
