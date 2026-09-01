/**
 * Call of Duty: Ghosts weapon pack (Sketchfab) — one GLB with 11 weapons laid out in world space.
 * Meshes are clustered by X position and exposed individually for the Asset Lab.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export const COD_GHOSTS_WEAPONS_GLB = '/assets/weapons/call_of_duty_ghost_-_weapons.glb'

/** Gap along X (meters) that separates one weapon from the next in the source file. */
const CLUSTER_GAP_X = 2

/** Best-guess mapping from game loadout slots to pack indices (0-based, left → right in file). */
export const COD_WEAPON_BY_VARIANT = {
  m4a1: 4,
  shotgun: 6,
  svd: 8,
  ak74: 9,
} as const

export const COD_WEAPON_LABELS = [
  'Gun 1',
  'Gun 2',
  'Gun 3',
  'Gun 4',
  'Gun 5 — M4 slot',
  'Gun 6',
  'Gun 7 — Shotgun slot',
  'Gun 8',
  'Gun 9 — DMR slot',
  'Gun 10 — AK slot',
  'Gun 11',
] as const

let packPromise: Promise<THREE.Group[]> | null = null

function countTriangles(root: THREE.Object3D): number {
  let n = 0
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o.geometry) {
      const g = o.geometry
      if (g.index) n += g.index.count / 3
      else if (g.attributes.position) n += g.attributes.position.count / 3
    }
  })
  return Math.floor(n)
}

function seatOnGround(group: THREE.Group): void {
  group.updateMatrixWorld(true)
  let box = new THREE.Box3().setFromObject(group)
  const center = box.getCenter(new THREE.Vector3())
  group.position.sub(center)
  group.updateMatrixWorld(true)
  box = new THREE.Box3().setFromObject(group)
  group.position.y -= box.min.y
}

/** Try a few 90° rotations so barrel length is horizontal and Y is the thin axis. */
function pickFlatRotation(group: THREE.Group): void {
  const candidates = [
    new THREE.Euler(0, 0, Math.PI / 2),
    new THREE.Euler(0, 0, -Math.PI / 2),
    new THREE.Euler(-Math.PI / 2, 0, 0),
    new THREE.Euler(Math.PI / 2, 0, 0),
    new THREE.Euler(0, 0, 0),
  ]

  let best = candidates[0]
  let bestScore = -Infinity

  for (const euler of candidates) {
    group.rotation.copy(euler)
    group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(group)
    const size = box.getSize(new THREE.Vector3())
    const dims = [size.x, size.y, size.z]
    const minDim = Math.min(...dims)
    const maxDim = Math.max(...dims)
    const yIsThinnest = size.y <= minDim * 1.05 ? 12 : size.y >= maxDim * 0.95 ? -12 : 0
    const aspect = maxDim / Math.max(minDim, 0.001)
    const score = yIsThinnest + aspect
    if (score > bestScore) {
      bestScore = score
      best = euler
    }
  }

  group.rotation.copy(best)
}

function normalizeWeaponGroup(group: THREE.Group): THREE.Group {
  const box = new THREE.Box3().setFromObject(group)
  const size = box.getSize(new THREE.Vector3())
  const scale = 1 / Math.max(size.x, size.y, size.z, 0.01)
  group.scale.setScalar(scale)
  pickFlatRotation(group)
  seatOnGround(group)
  return group
}

function clusterMeshes(scene: THREE.Object3D): THREE.Group[] {
  scene.updateMatrixWorld(true)

  const items: { mesh: THREE.Mesh; cx: number }[] = []
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      const box = new THREE.Box3().setFromObject(o)
      items.push({ mesh: o, cx: box.getCenter(new THREE.Vector3()).x })
    }
  })

  if (items.length === 0) return []

  items.sort((a, b) => a.cx - b.cx)

  const meshClusters: THREE.Mesh[][] = []
  let current: THREE.Mesh[] = [items[0].mesh]
  for (let i = 1; i < items.length; i++) {
    if (items[i].cx - items[i - 1].cx > CLUSTER_GAP_X) {
      meshClusters.push(current)
      current = []
    }
    current.push(items[i].mesh)
  }
  meshClusters.push(current)

  return meshClusters.map((meshes) => {
    const group = new THREE.Group()
    for (const mesh of meshes) {
      const clone = mesh.clone(true)
      clone.castShadow = true
      clone.receiveShadow = true
      group.add(clone)
    }
    return normalizeWeaponGroup(group)
  })
}

async function loadPack(): Promise<THREE.Group[]> {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(COD_GHOSTS_WEAPONS_GLB)
  return clusterMeshes(gltf.scene)
}

export async function getCodWeaponCount(): Promise<number> {
  const pack = await loadCodWeaponPack()
  return pack.length
}

export async function loadCodWeaponPack(): Promise<THREE.Group[]> {
  if (!packPromise) packPromise = loadPack()
  return packPromise
}

export async function buildCodGhostsWeapon(index: number): Promise<{
  group: THREE.Group
  triangleCount: number
}> {
  const pack = await loadCodWeaponPack()
  if (index < 0 || index >= pack.length) {
    throw new Error(`COD weapon index ${index} out of range (0..${pack.length - 1})`)
  }
  const group = pack[index].clone(true)
  return { group, triangleCount: countTriangles(group) }
}
