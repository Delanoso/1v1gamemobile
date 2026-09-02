import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export interface GlbBuildResult {
  group: THREE.Group
  triangleCount: number
}

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
  group.position.set(0, 0, 0)
  group.updateMatrixWorld(true)

  let box = new THREE.Box3().setFromObject(group)
  const center = box.getCenter(new THREE.Vector3())
  group.position.x -= center.x
  group.position.z -= center.z
  group.updateMatrixWorld(true)
  box = new THREE.Box3().setFromObject(group)
  group.position.y -= box.min.y
}

/** Pull exploded mesh parts together along the weapon's long axis. */
export function assembleExplodedParts(group: THREE.Group): void {
  const meshes: THREE.Mesh[] = []
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) meshes.push(o)
  })
  if (meshes.length <= 1) return

  group.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(group)
  const size = box.getSize(new THREE.Vector3())
  const axis: 'x' | 'y' | 'z' =
    size.x >= size.y && size.x >= size.z ? 'x' : size.y >= size.z ? 'y' : 'z'

  const items = meshes.map((mesh) => {
    const bounds = new THREE.Box3().setFromObject(mesh)
    return { mesh, min: bounds.min.clone(), max: bounds.max.clone() }
  })
  items.sort((a, b) => a.min[axis] - b.min[axis])

  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1]
    const cur = items[i]
    const gap = cur.min[axis] - prev.max[axis]
    if (gap <= 0.02) continue
    const shift = new THREE.Vector3()
    shift[axis] = -gap
    for (let j = i; j < items.length; j++) {
      items[j].mesh.position.add(shift)
      items[j].min.add(shift)
      items[j].max.add(shift)
    }
  }
}

function pickStandRotation(group: THREE.Group): void {
  const candidates = [
    new THREE.Euler(0, 0, 0),
    new THREE.Euler(0, Math.PI / 2, 0),
    new THREE.Euler(0, -Math.PI / 2, 0),
    new THREE.Euler(0, Math.PI, 0),
    new THREE.Euler(Math.PI / 2, 0, 0),
    new THREE.Euler(-Math.PI / 2, 0, 0),
  ]

  let best = candidates[0]
  let bestScore = -Infinity

  for (const euler of candidates) {
    group.rotation.copy(euler)
    group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(group)
    const size = box.getSize(new THREE.Vector3())
    const yIsLongest = size.y >= Math.max(size.x, size.z) * 0.92 ? 14 : 0
    const yIsShortest = size.y <= Math.min(size.x, size.z) * 1.08 ? -14 : 0
    const footprint = size.x * size.z
    const score = yIsLongest + yIsShortest - footprint * 0.5
    if (score > bestScore) {
      bestScore = score
      best = euler
    }
  }

  group.rotation.copy(best)
}

function pickFlatRotation(group: THREE.Group): void {
  const candidates = [
    new THREE.Euler(0, 0, 0),
    new THREE.Euler(0, 0, Math.PI / 2),
    new THREE.Euler(0, 0, -Math.PI / 2),
    new THREE.Euler(0, Math.PI / 2, 0),
    new THREE.Euler(0, -Math.PI / 2, 0),
    new THREE.Euler(-Math.PI / 2, 0, 0),
    new THREE.Euler(Math.PI / 2, 0, 0),
    new THREE.Euler(0, Math.PI, 0),
    new THREE.Euler(0, 0, Math.PI),
  ]

  let best = candidates[0]
  let bestScore = -Infinity

  for (const euler of candidates) {
    group.rotation.copy(euler)
    group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(group)
    const size = box.getSize(new THREE.Vector3())
    const minDim = Math.min(size.x, size.y, size.z)
    const maxDim = Math.max(size.x, size.y, size.z)
    const xIsBarrel = size.x >= Math.max(size.y, size.z) * 0.9 ? 18 : 0
    const yIsThin = size.y <= minDim * 1.08 ? 16 : size.y >= maxDim * 0.9 ? -16 : 0
    const aspect = maxDim / Math.max(minDim, 0.001)
    const score = xIsBarrel + yIsThin + aspect
    if (score > bestScore) {
      bestScore = score
      best = euler
    }
  }

  group.rotation.copy(best)
}

export function normalizeWeaponGroup(group: THREE.Group, horizontal = true): THREE.Group {
  group.position.set(0, 0, 0)
  group.rotation.set(0, 0, 0)
  group.scale.set(1, 1, 1)
  group.updateMatrixWorld(true)

  assembleExplodedParts(group)

  const box = new THREE.Box3().setFromObject(group)
  const size = box.getSize(new THREE.Vector3())
  const scale = 1 / Math.max(size.x, size.y, size.z, 0.01)
  group.scale.setScalar(scale)
  if (horizontal) pickFlatRotation(group)
  else pickStandRotation(group)
  seatOnGround(group)
  return group
}

export function normalizeCharacterGroup(group: THREE.Group, targetHeight = 1.75): THREE.Group {
  group.position.set(0, 0, 0)
  group.rotation.set(0, 0, 0)
  group.scale.set(1, 1, 1)
  group.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(group)
  const size = box.getSize(new THREE.Vector3())
  const scale = targetHeight / Math.max(size.y, 0.01)
  group.scale.setScalar(scale)
  seatOnGround(group)
  return group
}

export async function loadGlbModel(
  path: string,
  layout: 'weapon' | 'character' = 'weapon',
): Promise<GlbBuildResult> {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(path)
  const model = gltf.scene.clone()
  model.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })

  const group = new THREE.Group()
  group.add(model)
  if (layout === 'character') normalizeCharacterGroup(group)
  else normalizeWeaponGroup(group)

  return { group, triangleCount: countTriangles(group) }
}
