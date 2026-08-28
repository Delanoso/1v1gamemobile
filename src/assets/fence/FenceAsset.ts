/**
 * Chain-link fence panel — single source of truth for yard perimeter fencing.
 * Reference: galvanized posts, top rail, chain mesh, Y-brackets, concertina razor wire.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { chainLinkAlphaMap, chainLinkColorMap, chainLinkRoughnessMap } from './FenceTextures'

export const FENCE_PANEL = { width: 3.6, height: 2.8 } as const

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
  return new THREE.MeshStandardMaterial({ color: 0x9098a0, metalness: 0.88, roughness: 0.32 })
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
    opacity: 0.94,
    metalness: 0.78,
    roughness: 0.38,
    side: THREE.DoubleSide,
    alphaTest: 0.4,
  })
}

function addYBracket(x: number, y: number, steel: THREE.MeshStandardMaterial, addMesh: (m: THREE.Mesh) => void): void {
  for (const side of [-1, 1] as const) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.38, 8), steel)
    arm.rotation.x = side * 0.72
    arm.position.set(x + side * 0.1, y + 0.16, 0.12)
    addMesh(arm)
  }
}

function addConcertinaWire(
  W: number,
  railY: number,
  steel: THREE.MeshStandardMaterial,
  addMesh: (m: THREE.Mesh) => void,
): void {
  const coilR = 0.1
  const tubeR = 0.011
  const coils = Math.floor(W / 0.22)
  for (let i = 0; i < coils; i++) {
    const t = i / Math.max(1, coils - 1)
    const x = -W / 2 + 0.14 + t * (W - 0.28)
    const torus = new THREE.Mesh(new THREE.TorusGeometry(coilR, tubeR, 6, 14), steel)
    torus.rotation.y = Math.PI / 2
    torus.rotation.x = i % 2 === 0 ? 0.15 : -0.15
    torus.position.set(x, railY + coilR * 0.75, 0.1 + (i % 2 === 0 ? 0.04 : -0.04))
    addMesh(torus)
  }
  // Support wire through Y-brackets
  const support = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, W - 0.2, 6), steel)
  support.rotation.z = Math.PI / 2
  support.position.set(0, railY + 0.2, 0.14)
  addMesh(support)
}

/** Procedural fence panel section for Asset Lab review. */
export function buildProceduralFence(): FenceBuildResult {
  const group = new THREE.Group()
  const { width: W, height: H } = FENCE_PANEL
  const steel = steelMat()
  const postR = 0.04
  const railY = H

  const addMesh = (mesh: THREE.Mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }

  // End posts only (single panel section)
  for (const x of [-W / 2, W / 2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(postR, postR, H, 12), steel)
    post.position.set(x, H / 2, 0)
    addMesh(post)
    addYBracket(x, railY, steel, addMesh)
  }

  // Top rail
  const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, W - postR * 2, 10), steel)
  topRail.rotation.z = Math.PI / 2
  topRail.position.set(0, railY, 0)
  addMesh(topRail)

  // Chain-link mesh (ground to top rail)
  const meshH = H - 0.14
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W - postR * 2.4, meshH), chainMat(8, 7))
  mesh.position.set(0, meshH / 2 + 0.02, 0)
  addMesh(mesh)

  // Concertina razor wire along top
  addConcertinaWire(W, railY, steel, addMesh)

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
