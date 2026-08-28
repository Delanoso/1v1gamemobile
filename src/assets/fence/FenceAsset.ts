/**
 * Chain-link fence panel — single source of truth for yard perimeter fencing.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { chainLinkAlphaMap, chainLinkColorMap, chainLinkRoughnessMap } from './FenceTextures'

export const FENCE_PANEL = { width: 4, height: 3.2, postSpacing: 2 } as const

const GLB_PATH = '/assets/maps/container-yard/fence.glb'

export interface FenceBuildResult {
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

function steelMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x5a6068, metalness: 0.82, roughness: 0.38 })
}

function chainMat(repeatX: number, repeatY: number): THREE.MeshStandardMaterial {
  const alpha = chainLinkAlphaMap()
  const map = chainLinkColorMap()
  const rough = chainLinkRoughnessMap()
  alpha.repeat.set(repeatX, repeatY)
  map.repeat.set(repeatX, repeatY)
  rough.repeat.set(repeatX, repeatY)
  return new THREE.MeshStandardMaterial({
    map,
    alphaMap: alpha,
    roughnessMap: rough,
    transparent: true,
    opacity: 0.92,
    metalness: 0.72,
    roughness: 0.42,
    side: THREE.DoubleSide,
    alphaTest: 0.35,
  })
}

function concreteMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x6a6e72, roughness: 0.92, metalness: 0.02 })
}

/** Procedural fence panel section for Asset Lab review. */
export function buildProceduralFence(): FenceBuildResult {
  const group = new THREE.Group()
  const { width: W, height: H } = FENCE_PANEL
  const steel = steelMat()
  const meshBottom = 0.12
  const meshH = H - meshBottom - 0.18
  const postR = 0.045

  const addMesh = (mesh: THREE.Mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }

  // Posts + concrete footings
  for (const x of [-W / 2, 0, W / 2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(postR, postR, H, 10), steel)
    post.position.set(x, H / 2, 0)
    addMesh(post)
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(postR * 1.15, postR, 0.06, 10), steel)
    cap.position.set(x, H + 0.03, 0)
    addMesh(cap)
    const footing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.28), concreteMat())
    footing.position.set(x, 0.07, 0)
    addMesh(footing)
  }

  // Top and bottom rails
  for (const y of [H - 0.08, meshBottom + 0.04]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, 0.06), steel)
    rail.position.set(0, y, 0)
    addMesh(rail)
  }

  // Chain-link mesh bays (between posts)
  const bays: [number, number][] = [
    [-W / 4, W / 2],
    [W / 4, W / 2],
  ]
  for (const [cx, bayW] of bays) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(bayW - 0.12, meshH), chainMat(6, 5))
    mesh.position.set(cx, meshBottom + meshH / 2 + 0.04, 0)
    addMesh(mesh)
  }

  // Tension wire along top
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, W - 0.1, 6), steel)
  wire.rotation.z = Math.PI / 2
  wire.position.set(0, H - 0.02, 0.04)
  addMesh(wire)

  // Barb coil hint on top rail (port security detail)
  for (const x of [-W / 2 + 0.3, W / 2 - 0.3]) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 6, 12), steel)
    coil.rotation.x = Math.PI / 2
    coil.position.set(x, H + 0.08, 0)
    addMesh(coil)
  }

  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

export async function buildFence(): Promise<FenceBuildResult> {
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
    const scale = FENCE_PANEL.width / Math.max(size.x, size.z)
    model.scale.setScalar(scale)
    box.setFromObject(model)
    model.position.sub(box.getCenter(new THREE.Vector3()))
    model.position.y -= box.min.y
    const group = new THREE.Group()
    group.add(model)
    return { group, source: 'glb', triangleCount: countTriangles(group) }
  } catch {
    return buildProceduralFence()
  }
}
