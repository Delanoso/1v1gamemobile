/**
 * Call of Duty: Ghosts weapon pack (Sketchfab) — one GLB with 11 weapons laid out in world space.
 * Meshes are clustered by X position and exposed individually for the Asset Lab.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { normalizeWeaponGroup } from '../glb/GlbModelLoader'

export const COD_GHOSTS_WEAPONS_GLB = '/assets/weapons/call_of_duty_ghost_-_weapons.glb'

/** Gap along X (meters) that separates one weapon from the next in the source file. */
const CLUSTER_GAP_X = 2

/** Weapon names from the Sketchfab COD Ghosts pack (left → right in file). */
export const COD_WEAPON_LABELS = [
  'AK-12',
  'ARX-160',
  'Ameli',
  'CBJ-MS',
  'Honey Badger',
  'M27-IAR',
  'MP443',
  'MR-28',
  'Remington R5',
  'SC-2010',
  'Vector CRB',
] as const

/** Best-guess mapping from game loadout slots to pack indices (0-based). */
export const COD_WEAPON_BY_VARIANT = {
  m4a1: 9,
  shotgun: 10,
  svd: 7,
  ak74: 0,
} as const

let clusterPromise: Promise<THREE.Group[]> | null = null

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

function extractMesh(mesh: THREE.Mesh): THREE.Mesh {
  mesh.updateMatrixWorld(true)
  const baked = mesh.clone(true)
  baked.applyMatrix4(mesh.matrixWorld)
  baked.position.set(0, 0, 0)
  baked.rotation.set(0, 0, 0)
  baked.scale.set(1, 1, 1)
  baked.castShadow = true
  baked.receiveShadow = true
  return baked
}

function buildMeshClusters(scene: THREE.Object3D): THREE.Group[] {
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
      group.add(extractMesh(mesh))
    }
    return group
  })
}

async function loadClusters(): Promise<THREE.Group[]> {
  if (!clusterPromise) {
    clusterPromise = (async () => {
      const loader = new GLTFLoader()
      const gltf = await loader.loadAsync(COD_GHOSTS_WEAPONS_GLB)
      return buildMeshClusters(gltf.scene)
    })()
  }
  return clusterPromise
}

export async function getCodWeaponCount(): Promise<number> {
  const clusters = await loadClusters()
  return clusters.length
}

export async function loadCodWeaponPack(): Promise<THREE.Group[]> {
  const clusters = await loadClusters()
  return clusters.map((cluster, index) => {
    const group = cluster.clone(true)
    return normalizeWeaponGroup(group, 'cod-pack')
  })
}

export async function buildCodGhostsWeapon(index: number): Promise<{
  group: THREE.Group
  triangleCount: number
}> {
  const clusters = await loadClusters()
  if (index < 0 || index >= clusters.length) {
    throw new Error(`COD weapon index ${index} out of range (0..${clusters.length - 1})`)
  }
  const group = clusters[index].clone(true)
  normalizeWeaponGroup(group, 'cod-pack')
  return { group, triangleCount: countTriangles(group) }
}
