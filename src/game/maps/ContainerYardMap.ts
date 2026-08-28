import * as THREE from 'three'
import type { ContainerColor } from '../materials/MapMaterials'
import {
  createAsphaltMaterial,
  createBarrelMaterial,
  createContainerMaterial,
  createFenceMaterial,
  createMetalTrimMaterial,
  createPuddleMaterial,
  createWoodMaterial,
} from '../materials/MapMaterials'
import type { Collider } from './collision'

export type { Collider } from './collision'
export { resolveCapsuleColliders, groundHeightAt } from './collision'

export interface BuiltMap {
  group: THREE.Group
  colliders: Collider[]
  spawns: THREE.Vector3[]
  targetAnchors: THREE.Vector3[]
}

const CW = 2.4
const CH = 2.6
const CL = 6

function pushCollider(
  colliders: Collider[],
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
): void {
  colliders.push({
    min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
    max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2),
  })
}

function addContainer(
  group: THREE.Group,
  colliders: Collider[],
  x: number,
  z: number,
  axis: 'x' | 'z',
  color: ContainerColor,
  stack = 1,
  yBase = 0,
): THREE.Group {
  const g = new THREE.Group()
  const mat = createContainerMaterial(color)
  const w = axis === 'x' ? CL : CW
  const d = axis === 'x' ? CW : CL

  for (let s = 0; s < stack; s++) {
    const geo = new THREE.BoxGeometry(w, CH, d)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(0, yBase + CH / 2 + s * CH, 0)
    mesh.castShadow = true
    mesh.receiveShadow = true
    g.add(mesh)
    pushCollider(colliders, w, CH, d, x, yBase + CH / 2 + s * CH, z)
  }

  // Door end trim
  const trim = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, CH * 0.92, 0.08), createMetalTrimMaterial())
  trim.position.set(0, yBase + CH / 2 + (stack - 1) * CH, d / 2 + 0.02)
  g.add(trim)

  g.position.set(x, 0, z)
  group.add(g)
  return g
}

function addAngledContainer(
  group: THREE.Group,
  colliders: Collider[],
  x: number,
  z: number,
  color: ContainerColor,
  angle: number,
): void {
  const mat = createContainerMaterial(color)
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(CL, CH, CW), mat)
  mesh.position.set(x, CH / 2, z)
  mesh.rotation.y = angle
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
  // Approximate AABB collider for rotated box
  const r = Math.max(CL, CW) * 0.55
  pushCollider(colliders, r * 2, CH, r * 2, x, CH / 2, z)
}

function addFenceWall(
  group: THREE.Group,
  colliders: Collider[],
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), createFenceMaterial())
  mesh.position.set(x, y, z)
  group.add(mesh)
  pushCollider(colliders, w, h, d, x, y, z)
}

function addBarrelCluster(group: THREE.Group, colliders: Collider[], x: number, z: number): void {
  const mat = createBarrelMaterial()
  const offsets: [number, number][] = [
    [0, 0],
    [0.55, 0.2],
    [-0.45, 0.35],
  ]
  for (const [ox, oz] of offsets) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 10), mat)
    mesh.position.set(x + ox, 0.45, z + oz)
    mesh.castShadow = true
    group.add(mesh)
    pushCollider(colliders, 0.56, 0.9, 0.56, x + ox, 0.45, z + oz)
  }
}

function addPalletStack(group: THREE.Group, colliders: Collider[], x: number, z: number): void {
  const mat = createWoodMaterial()
  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1), mat)
    mesh.position.set(x, 0.06 + i * 0.14, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }
  pushCollider(colliders, 1.2, 0.45, 1, x, 0.22, z)
}

function addParkingLine(group: THREE.Group, x: number, z: number, w: number, d: number): void {
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color: 0xd8dce0, roughness: 0.95 }),
  )
  line.rotation.x = -Math.PI / 2
  line.position.set(x, 0.03, z)
  group.add(line)
}

/** MW Shipment-inspired container yard — symmetric 1v1 layout. */
export function buildContainerYardMap(): BuiltMap {
  const group = new THREE.Group()
  const colliders: Collider[] = []

  // Ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(46, 34, 1, 1), createAsphaltMaterial())
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  group.add(ground)

  // Parking bay markings
  for (let x = -18; x <= 18; x += 6) {
    addParkingLine(group, x, -14.5, 4.5, 0.15)
    addParkingLine(group, x, 14.5, 4.5, 0.15)
  }

  // Puddles (visual)
  const puddleMat = createPuddleMaterial()
  ;[
    [-8, 3],
    [5, -6],
    [12, 8],
    [-14, -4],
  ].forEach(([x, z]) => {
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(1.2 + Math.random(), 16), puddleMat)
    puddle.rotation.x = -Math.PI / 2
    puddle.position.set(x, 0.025, z)
    puddle.scale.set(1.8, 1.2, 1)
    group.add(puddle)
  })

  // Perimeter fence
  addFenceWall(group, colliders, 46, 3.2, 0.25, 0, 1.6, -17.2)
  addFenceWall(group, colliders, 46, 3.2, 0.25, 0, 1.6, 17.2)
  addFenceWall(group, colliders, 0.25, 3.2, 34, -23.1, 1.6, 0)
  addFenceWall(group, colliders, 0.25, 3.2, 34, 23.1, 1.6, 0)

  // --- Perimeter containers (outer lane) ---
  const northZ = -12.5
  const southZ = 12.5
  const westX = -18.5
  const eastX = 18.5
  const perimColors: ContainerColor[] = ['blue', 'red', 'green', 'tan', 'blue', 'red']
  ;[-15, -9, -3, 3, 9, 15].forEach((x, i) => {
    addContainer(group, colliders, x, northZ, 'x', perimColors[i % perimColors.length])
    addContainer(group, colliders, x, southZ, 'x', perimColors[(i + 2) % perimColors.length])
  })
  ;[-9, -3, 3, 9].forEach((z, i) => {
    addContainer(group, colliders, westX, z, 'z', perimColors[(i + 1) % perimColors.length])
    addContainer(group, colliders, eastX, z, 'z', perimColors[(i + 3) % perimColors.length])
  })

  // --- Center Shipment cross (stacked pairs) ---
  const quad = [
    { x: -7, z: -7, c: 'red' as ContainerColor },
    { x: 7, z: -7, c: 'blue' as ContainerColor },
    { x: -7, z: 7, c: 'green' as ContainerColor },
    { x: 7, z: 7, c: 'tan' as ContainerColor },
  ]
  for (const q of quad) {
    addContainer(group, colliders, q.x, q.z, 'x', q.c, 2)
    addContainer(group, colliders, q.x + (q.x > 0 ? -3.2 : 3.2), q.z, 'z', q.c)
  }

  // Mid-lane single containers (create sightline breaks)
  addContainer(group, colliders, 0, -5, 'z', 'red')
  addContainer(group, colliders, 0, 5, 'z', 'blue')
  addContainer(group, colliders, -5, 0, 'x', 'green')
  addContainer(group, colliders, 5, 0, 'x', 'tan')

  // Angled corner wedges (Shipment-style)
  addAngledContainer(group, colliders, -14, -9, 'blue', Math.PI / 4)
  addAngledContainer(group, colliders, 14, 9, 'red', Math.PI / 4)
  addAngledContainer(group, colliders, 14, -9, 'green', -Math.PI / 4)
  addAngledContainer(group, colliders, -14, 9, 'tan', -Math.PI / 4)

  // Open tunnel container (both ends open visually — dark interior)
  const tunnel = new THREE.Mesh(
    new THREE.BoxGeometry(CL, CH, CW),
    createContainerMaterial('blue'),
  )
  tunnel.position.set(-3, CH / 2, 9)
  tunnel.castShadow = true
  group.add(tunnel)
  pushCollider(colliders, CL, CH, CW, -3, CH / 2, 9)
  const tunnelDark = new THREE.Mesh(
    new THREE.BoxGeometry(CL * 0.85, CH * 0.8, CW * 0.85),
    new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 1 }),
  )
  tunnelDark.position.set(-3, CH / 2, 9)
  group.add(tunnelDark)

  // Props
  addBarrelCluster(group, colliders, 16, -11)
  addBarrelCluster(group, colliders, -16, 11)
  addPalletStack(group, colliders, 10, -13)
  addPalletStack(group, colliders, -11, 12)

  // Tarp over NW stack (MW Shipment detail)
  const tarp = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 3.2),
    new THREE.MeshStandardMaterial({
      color: 0x8a7a58,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  )
  tarp.position.set(-7, CH * 2 + 1.1, -7)
  tarp.rotation.set(-0.55, 0.15, 0)
  tarp.castShadow = true
  group.add(tarp)

  // Distant crane silhouettes (non-colliding backdrop)
  const craneMat = new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 0.9 })
  for (const x of [-38, 38]) {
    const legA = new THREE.Mesh(new THREE.BoxGeometry(0.7, 20, 0.7), craneMat)
    legA.position.set(x - 4, 10, -30)
    group.add(legA)
    const legB = new THREE.Mesh(new THREE.BoxGeometry(0.7, 20, 0.7), craneMat)
    legB.position.set(x + 4, 10, -30)
    group.add(legB)
    const arm = new THREE.Mesh(new THREE.BoxGeometry(26, 0.55, 0.55), craneMat)
    arm.position.set(x, 19, -30)
    group.add(arm)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.4), craneMat)
    cab.position.set(x + 10, 18.2, -30)
    group.add(cab)
  }

  // Lighting — overcast port atmosphere (MW Shipment reference)
  group.add(new THREE.HemisphereLight(0xd0dae4, 0x4a5058, 1.05))
  group.add(new THREE.AmbientLight(0x98a8b8, 0.28))

  const sun = new THREE.DirectionalLight(0xfff4e4, 0.95)
  sun.position.set(-30, 45, 20)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 5
  sun.shadow.camera.far = 80
  sun.shadow.camera.left = -28
  sun.shadow.camera.right = 28
  sun.shadow.camera.top = 22
  sun.shadow.camera.bottom = -22
  sun.shadow.bias = -0.0003
  sun.shadow.normalBias = 0.02
  group.add(sun)

  const rim = new THREE.DirectionalLight(0xa0b8d8, 0.35)
  rim.position.set(20, 18, -15)
  group.add(rim)

  const spawns = [new THREE.Vector3(-16, 0, -11), new THREE.Vector3(16, 0, 11)]

  const targetAnchors = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-7, CH, -7),
    new THREE.Vector3(7, CH, 7),
    new THREE.Vector3(0, 0, -5),
    new THREE.Vector3(5, 0, 0),
    new THREE.Vector3(-14, 0, -9),
    new THREE.Vector3(10, 0, -13),
  ]

  return { group, colliders, spawns, targetAnchors }
}
