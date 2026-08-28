/**
 * Shipping container — single source of truth.
 * Polished here in Asset Lab, then used in ContainerYardMap.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createContainerMaterial, type ContainerColor } from '../../game/materials/MapMaterials'

export const CONTAINER_DIMS = { length: 6, width: 2.4, height: 2.6 } as const

const GLB_PATH = '/assets/maps/container-yard/container.glb'

export interface ContainerBuildResult {
  group: THREE.Group
  source: 'glb' | 'procedural'
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

/** Detailed procedural container (fallback until GLB is approved). */
export function buildProceduralContainer(color: ContainerColor = 'red'): ContainerBuildResult {
  const group = new THREE.Group()
  const { length: L, width: W, height: H } = CONTAINER_DIMS
  const bodyMat = createContainerMaterial(color)
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x3a4048,
    metalness: 0.82,
    roughness: 0.28,
  })
  const doorMat = createContainerMaterial(color)

  // Main hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(L * 0.96, H * 0.94, W * 0.96), bodyMat)
  hull.castShadow = true
  hull.receiveShadow = true
  group.add(hull)

  // Corner ISO posts
  const postGeo = new THREE.BoxGeometry(0.12, H, 0.12)
  const corners: [number, number][] = [
    [-L / 2, -W / 2],
    [L / 2, -W / 2],
    [-L / 2, W / 2],
    [L / 2, W / 2],
  ]
  for (const [x, z] of corners) {
    const post = new THREE.Mesh(postGeo, trimMat)
    post.position.set(x, 0, z)
    post.castShadow = true
    group.add(post)
  }

  // Top & bottom rails
  for (const y of [-H / 2 + 0.06, H / 2 - 0.06]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 0.1, W), trimMat)
    rail.position.y = y
    group.add(rail)
  }

  // Door end (player-facing detail side)
  const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, H * 0.88, W * 0.88), doorMat)
  doorPanel.position.set(L / 2 + 0.02, 0, 0)
  group.add(doorPanel)

  // Door vertical ridges
  for (let i = -3; i <= 3; i++) {
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, H * 0.82, 0.06), trimMat)
    ridge.position.set(L / 2 + 0.07, 0, i * (W / 7))
    group.add(ridge)
  }

  // Locking bars
  for (const z of [-W * 0.28, W * 0.28]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, H * 0.7, 0.08), trimMat)
    bar.position.set(L / 2 + 0.1, 0, z)
    group.add(bar)
  }

  // Fork pockets (bottom cut silhouette)
  for (const x of [-L * 0.3, L * 0.3]) {
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, W * 0.7), trimMat)
    pocket.position.set(x, -H / 2 + 0.09, 0)
    group.add(pocket)
  }

  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

/** Load Tripo/Meshy GLB if present, else procedural fallback. */
export async function buildContainer(color: ContainerColor = 'red'): Promise<ContainerBuildResult> {
  try {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(GLB_PATH)
    const model = gltf.scene.clone()
    model.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const scale = CONTAINER_DIMS.length / Math.max(size.x, size.y, size.z)
    model.scale.setScalar(scale)
    box.setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    model.position.sub(center)
    model.position.y -= box.min.y

    const group = new THREE.Group()
    group.add(model)
    return { group, source: 'glb', triangleCount: countTriangles(group) }
  } catch {
    return buildProceduralContainer(color)
  }
}
