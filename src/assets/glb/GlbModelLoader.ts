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

function pickFlatRotation(group: THREE.Group): void {
  const candidates = [
    new THREE.Euler(0, 0, Math.PI / 2),
    new THREE.Euler(0, 0, -Math.PI / 2),
    new THREE.Euler(-Math.PI / 2, 0, 0),
    new THREE.Euler(Math.PI / 2, 0, 0),
    new THREE.Euler(0, Math.PI / 2, 0),
    new THREE.Euler(0, -Math.PI / 2, 0),
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

export function normalizeWeaponGroup(group: THREE.Group): THREE.Group {
  group.position.set(0, 0, 0)
  group.rotation.set(0, 0, 0)
  group.scale.set(1, 1, 1)
  group.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(group)
  const size = box.getSize(new THREE.Vector3())
  const scale = 1 / Math.max(size.x, size.y, size.z, 0.01)
  group.scale.setScalar(scale)
  pickFlatRotation(group)
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
