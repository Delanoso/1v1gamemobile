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
  roughness = 0.78,
  metalness = 0.08,
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d)
  const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness })
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

function floorPatch(
  group: THREE.Group,
  w: number,
  d: number,
  x: number,
  z: number,
  color: number,
): void {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.02 }),
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(x, 0.02, z)
  mesh.receiveShadow = true
  group.add(mesh)
}

/** 1v1 warehouse — two spawn bays, mid lane, flank catwalk, readable cover. */
export function buildWarehouseMap(): BuiltMap {
  const group = new THREE.Group()
  const colliders: Collider[] = []

  // Floor slab
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(52, 0.35, 38),
    new THREE.MeshStandardMaterial({ color: 0x5c636b, roughness: 0.94, metalness: 0.03 }),
  )
  floor.position.set(0, -0.175, 0)
  floor.receiveShadow = true
  group.add(floor)

  // Spawn zone paint (team markers for future 1v1)
  floorPatch(group, 8, 6, -17, -13, 0x4a5a6a)
  floorPatch(group, 8, 6, 17, 13, 0x6a4a4a)

  // Mid lane hazard stripe
  for (let i = -8; i <= 8; i += 2) {
    floorPatch(group, 1.2, 0.8, i * 1.4, 0, 0xc9a24d)
  }

  // Walls + ceiling beams
  box(group, colliders, 52, 9, 0.7, 0, 4.5, -19, 0x707880)
  box(group, colliders, 52, 9, 0.7, 0, 4.5, 19, 0x707880)
  box(group, colliders, 0.7, 9, 38, -26, 4.5, 0, 0x707880)
  box(group, colliders, 0.7, 9, 38, 26, 4.5, 0, 0x707880)

  // Ceiling trusses (visual)
  for (let x = -20; x <= 20; x += 10) {
    box(group, colliders, 0.35, 0.35, 36, x, 8.6, 0, 0x4a5058, false, 0.9, 0.2)
  }

  // Skylight panels (visual only)
  for (let x = -12; x <= 12; x += 12) {
    const skylight = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 4),
      new THREE.MeshStandardMaterial({
        color: 0xb8d4f0,
        emissive: 0x88aacc,
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.85,
      }),
    )
    skylight.rotation.x = Math.PI / 2
    skylight.position.set(x, 8.75, 0)
    group.add(skylight)
  }

  // Support pillars (mid-map cover)
  const pillarPositions: [number, number][] = [
    [-6, -4],
    [6, 4],
    [-4, 8],
    [8, -6],
  ]
  for (const [px, pz] of pillarPositions) {
    box(group, colliders, 0.9, 3.8, 0.9, px, 1.9, pz, 0x6a7078, true, 0.85, 0.15)
  }

  // West container stack (flank cover)
  box(group, colliders, 7, 2.6, 2.6, -14, 1.3, -6, 0x5f7a68)
  box(group, colliders, 7, 2.6, 2.6, -14, 3.9, -6, 0x8a5a42)
  box(group, colliders, 5, 2.6, 2.6, -10, 1.3, 2, 0x5f7a68)
  box(group, colliders, 4, 2.6, 2.6, -16, 1.3, 4, 0x8a5a42)

  // East container lane
  box(group, colliders, 6, 2.6, 2.6, 12, 1.3, 6, 0x5f7a68)
  box(group, colliders, 6, 2.6, 2.6, 16, 1.3, -4, 0x8a5a42)
  box(group, colliders, 4, 2.6, 2.6, 10, 3.9, -8, 0x5f7a68)

  // Center cover lane — MW-style head-glitch crates
  box(group, colliders, 2, 1.3, 1.3, 0, 0.65, -2, 0xa08858)
  box(group, colliders, 2, 1.3, 1.3, 3, 0.65, 3, 0xa08858)
  box(group, colliders, 1.4, 1, 1.4, -2, 0.5, 5, 0x8a7a50)
  box(group, colliders, 1.6, 0.9, 2.4, 6, 0.45, -5, 0x7a7060)

  // West stairs → catwalk (vertical flank)
  for (let i = 0; i < 9; i++) {
    const y = 0.22 + i * 0.34
    const z = 12 - i * 0.5
    box(group, colliders, 2.4, 0.34, 0.75, -20, y, z, 0x8a939c)
  }
  box(group, colliders, 22, 0.32, 3.2, -10, 3.25, 8.5, 0x9aa3ac)
  box(group, colliders, 0.12, 1.05, 3.2, 1, 3.85, 8.5, 0xb8c0c8)
  box(group, colliders, 0.12, 1.05, 3.2, -21, 3.85, 8.5, 0xb8c0c8)
  // Catwalk crate
  box(group, colliders, 1.4, 1, 1.4, -6, 3.75, 8.5, 0xa08858)

  // East low platform
  box(group, colliders, 8, 0.5, 6, 18, 0.25, -10, 0x6a7078)
  box(group, colliders, 1.2, 1.1, 1.2, 20, 0.8, -12, 0xa08858)
  box(group, colliders, 1.2, 1.1, 1.2, 16, 0.8, -8, 0xa08858)

  // Back-wall shelves (visual + partial cover)
  for (let x = -22; x <= 22; x += 5.5) {
    box(group, colliders, 4, 2.2, 0.5, x, 1.1, -17.5, 0x555c64, x % 11 === 0)
  }

  // Industrial props
  box(group, colliders, 0.5, 4, 0.5, -22, 2, 15, 0x4a5058, false)
  box(group, colliders, 0.5, 4, 0.5, 22, 2, -15, 0x4a5058, false)
  box(group, colliders, 1.8, 0.8, 1.8, -8, 0.4, -12, 0x6a6050, false)
  box(group, colliders, 1.8, 0.8, 1.8, 9, 0.4, 11, 0x6a6050, false)

  // Lighting
  const ambient = new THREE.AmbientLight(0xd8e0ea, 0.7)
  group.add(ambient)
  const hemi = new THREE.HemisphereLight(0xf0f4fa, 0x3a4248, 1.05)
  group.add(hemi)

  const sun = new THREE.DirectionalLight(0xfff4e0, 1.45)
  sun.position.set(16, 28, 12)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 2
  sun.shadow.camera.far = 70
  sun.shadow.camera.left = -32
  sun.shadow.camera.right = 32
  sun.shadow.camera.top = 32
  sun.shadow.camera.bottom = -32
  sun.shadow.bias = -0.0002
  group.add(sun)

  const fill = new THREE.DirectionalLight(0xa8c0e8, 0.45)
  fill.position.set(-20, 14, -8)
  group.add(fill)

  // Overhead strip lights
  for (let x = -18; x <= 18; x += 9) {
    const strip = new THREE.PointLight(0xfff8ee, 0.55, 18)
    strip.position.set(x, 7.8, 0)
    group.add(strip)
    const fixture = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.12, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfff0d0,
        emissiveIntensity: 0.8,
      }),
    )
    fixture.position.set(x, 8.5, 0)
    group.add(fixture)
  }

  const spawns = [new THREE.Vector3(-17, 0, -13), new THREE.Vector3(17, 0, 13)]

  const targetAnchors = [
    new THREE.Vector3(-6, 0, -4),
    new THREE.Vector3(6, 0, 2),
    new THREE.Vector3(-6, 3.4, 8.5),
    new THREE.Vector3(12, 0, -8),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(18, 0.5, -10),
    new THREE.Vector3(-14, 0, 4),
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
