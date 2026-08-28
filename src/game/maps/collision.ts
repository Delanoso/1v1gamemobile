import * as THREE from 'three'

export interface Collider {
  min: THREE.Vector3
  max: THREE.Vector3
}

export function resolveCapsuleColliders(
  pos: THREE.Vector3,
  radius: number,
  height: number,
  colliders: Collider[],
): void {
  const bodyMinY = pos.y
  const bodyMaxY = pos.y + height

  for (const c of colliders) {
    if (bodyMaxY <= c.min.y || bodyMinY >= c.max.y) continue

    const closestX = Math.max(c.min.x, Math.min(pos.x, c.max.x))
    const closestZ = Math.max(c.min.z, Math.min(pos.z, c.max.z))
    const dx = pos.x - closestX
    const dz = pos.z - closestZ
    const distSq = dx * dx + dz * dz
    if (distSq >= radius * radius) continue

    if (distSq < 1e-8) {
      const left = Math.abs(pos.x - c.min.x)
      const right = Math.abs(c.max.x - pos.x)
      const back = Math.abs(pos.z - c.min.z)
      const fwd = Math.abs(c.max.z - pos.z)
      const m = Math.min(left, right, back, fwd)
      if (m === left) pos.x = c.min.x - radius
      else if (m === right) pos.x = c.max.x + radius
      else if (m === back) pos.z = c.min.z - radius
      else pos.z = c.max.z + radius
    } else {
      const dist = Math.sqrt(distSq)
      const push = (radius - dist) / dist
      pos.x += dx * push
      pos.z += dz * push
    }
  }
}

export function groundHeightAt(
  x: number,
  z: number,
  colliders: Collider[],
  feetY: number,
): number {
  let best = 0
  for (const c of colliders) {
    if (x < c.min.x - 0.01 || x > c.max.x + 0.01) continue
    if (z < c.min.z - 0.01 || z > c.max.z + 0.01) continue
    if (c.max.y > feetY + 1.2) continue
    if (c.max.y > best && c.max.y <= feetY + 0.55) best = c.max.y
  }
  return best
}
