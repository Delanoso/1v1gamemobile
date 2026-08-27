import * as THREE from 'three'

export interface Collider {
  min: THREE.Vector3
  max: THREE.Vector3
}

export interface BuiltMap {
  group: THREE.Group
  colliders: Collider[]
  spawns: THREE.Vector3[]
  targetAnchors: THREE.Vector3[]
}

function box(
  group: THREE.Group,
  colliders: Collider[],
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color: number,
  collide = true,
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d)
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0.12,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
  if (collide) {
    colliders.push({
      min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
      max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2),
    })
  }
  return mesh
}

/** Compact warehouse with floor containers and an upper catwalk. */
export function buildWarehouseMap(): BuiltMap {
  const group = new THREE.Group()
  const colliders: Collider[] = []

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x2a2f33,
    roughness: 0.95,
    metalness: 0.05,
  })
  const floor = new THREE.Mesh(new THREE.BoxGeometry(48, 0.4, 36), floorMat)
  floor.position.set(0, -0.2, 0)
  floor.receiveShadow = true
  group.add(floor)

  // Outer walls
  box(group, colliders, 48, 8, 0.6, 0, 4, -18, 0x3a4148)
  box(group, colliders, 48, 8, 0.6, 0, 4, 18, 0x3a4148)
  box(group, colliders, 0.6, 8, 36, -24, 4, 0, 0x3a4148)
  box(group, colliders, 0.6, 8, 36, 24, 4, 0, 0x3a4148)

  // Shipping containers (cover + vertical play)
  const steel = 0x4b5a4e
  const rust = 0x6a4a3a
  box(group, colliders, 6, 2.6, 2.4, -10, 1.3, -6, steel)
  box(group, colliders, 6, 2.6, 2.4, -10, 3.9, -6, rust)
  box(group, colliders, 6, 2.6, 2.4, 8, 1.3, 4, steel)
  box(group, colliders, 4, 2.6, 2.4, 12, 1.3, -8, rust)
  box(group, colliders, 3, 1.4, 3, 0, 0.7, 0, 0x555b61)

  // Stairs up to catwalk (step boxes)
  for (let i = 0; i < 8; i++) {
    const y = 0.25 + i * 0.35
    const z = 10 - i * 0.55
    box(group, colliders, 2.2, 0.35, 0.7, -18, y, z, 0x5c636b)
  }

  // Catwalk platform + rail stubs
  box(group, colliders, 20, 0.3, 4, -8, 3.1, 6, 0x6d757e)
  box(group, colliders, 0.15, 1.1, 4, 2, 3.8, 6, 0x8a939c)
  box(group, colliders, 0.15, 1.1, 4, -18, 3.8, 6, 0x8a939c)

  // Center crate lane
  box(group, colliders, 1.6, 1.2, 1.6, 4, 0.6, -3, 0x7a6a4e)
  box(group, colliders, 1.6, 1.2, 1.6, -3, 0.6, 7, 0x7a6a4e)
  box(group, colliders, 1.6, 1.2, 1.6, 14, 0.6, 10, 0x7a6a4e)

  // Soft ambient props (no collision)
  box(group, colliders, 0.4, 3.5, 0.4, -20, 1.75, -14, 0x2f353b, false)
  box(group, colliders, 0.4, 3.5, 0.4, 20, 1.75, 14, 0x2f353b, false)

  const hemi = new THREE.HemisphereLight(0xb7c4d0, 0x1a1c1e, 0.75)
  group.add(hemi)
  const sun = new THREE.DirectionalLight(0xf0e6d4, 1.15)
  sun.position.set(12, 22, 8)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.near = 2
  sun.shadow.camera.far = 60
  sun.shadow.camera.left = -30
  sun.shadow.camera.right = 30
  sun.shadow.camera.top = 30
  sun.shadow.camera.bottom = -30
  group.add(sun)

  const spawns = [
    new THREE.Vector3(-16, 0, -12),
    new THREE.Vector3(16, 0, 12),
  ]

  const targetAnchors = [
    new THREE.Vector3(-6, 0, -4),
    new THREE.Vector3(6, 0, 2),
    new THREE.Vector3(-8, 3.25, 6),
    new THREE.Vector3(10, 0, -10),
    new THREE.Vector3(0, 0, 12),
  ]

  return { group, colliders, spawns, targetAnchors }
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
      // Embedded in volume — push out along shortest axis
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
