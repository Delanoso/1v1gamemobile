/**
 * Chain-link fence panel — single source of truth for yard perimeter fencing.
 * Reference: galvanized posts, top rail, chain mesh, Y-brackets, concertina razor wire.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { chainLinkSurfaceMap } from './FenceTextures'

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

function wireMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x8a929a, metalness: 0.82, roughness: 0.36 })
}

function chainMeshMat(repeatX: number, repeatY: number): THREE.MeshBasicMaterial {
  const surface = chainLinkSurfaceMap()
  surface.repeat.set(repeatX, repeatY)
  return new THREE.MeshBasicMaterial({
    map: surface,
    alphaMap: surface,
    side: THREE.DoubleSide,
    alphaTest: 0.25,
    transparent: false,
  })
}

/** Short wire segments only — every endpoint stays inside the panel rect. */
function addChainLinkLattice(
  W: number,
  H: number,
  cx: number,
  cy: number,
  wire: THREE.MeshStandardMaterial,
  addMesh: (m: THREE.Mesh) => void,
): void {
  const spacing = 0.16
  const wireR = 0.007
  const left = cx - W / 2
  const right = cx + W / 2
  const bottom = cy - H / 2
  const top = cy + H / 2
  const up = new THREE.Vector3(0, 1, 0)

  const inside = (x: number, y: number) => x >= left && x <= right && y >= bottom && y <= top

  const addSegment = (x1: number, y1: number, x2: number, y2: number) => {
    if (!inside(x1, y1) || !inside(x2, y2)) return
    const len = Math.hypot(x2 - x1, y2 - y1)
    if (len < 0.02) return
    const strand = new THREE.Mesh(new THREE.CylinderGeometry(wireR, wireR, len, 5), wire)
    const dir = new THREE.Vector3(x2 - x1, y2 - y1, 0).normalize()
    strand.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0.015)
    strand.quaternion.setFromUnitVectors(up, dir)
    addMesh(strand)
  }

  const half = spacing * 0.5
  for (let y = bottom; y < top - half; y += half) {
    const row = Math.round((y - bottom) / half)
    const stagger = (row % 2) * half
    for (let x = left + stagger; x < right - half; x += spacing) {
      addSegment(x, y, x + half, y + half)
      addSegment(x + half, y, x + spacing, y + half)
      addSegment(x + half, y + half, x + spacing, y)
      addSegment(x, y + half, x + half, y + spacing)
    }
  }
}

function addYBracket(x: number, y: number, steel: THREE.MeshStandardMaterial, addMesh: (m: THREE.Mesh) => void): void {
  for (const side of [-1, 1] as const) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.38, 8), steel)
    arm.rotation.x = side * 0.72
    arm.position.set(x + side * 0.1, y + 0.16, 0.12)
    addMesh(arm)
  }
}

function addCoilBarbs(
  cx: number,
  cy: number,
  cz: number,
  coilR: number,
  steel: THREE.MeshStandardMaterial,
  addMesh: (m: THREE.Mesh) => void,
): void {
  const barbGeo = new THREE.ConeGeometry(0.011, 0.042, 4)
  const up = new THREE.Vector3(0, 1, 0)
  const barbsPerRing = 10
  for (let b = 0; b < barbsPerRing; b++) {
    const a = (b / barbsPerRing) * Math.PI * 2
    const py = cy + Math.sin(a) * coilR
    const pz = cz + Math.cos(a) * coilR
    const outward = new THREE.Vector3(0, Math.sin(a), Math.cos(a)).normalize()
    const dir = outward.clone().add(new THREE.Vector3(0, 0.45, 0)).normalize()

    const barb = new THREE.Mesh(barbGeo, steel)
    barb.position.set(cx, py, pz)
    barb.quaternion.setFromUnitVectors(up, dir)
    addMesh(barb)

    // Inner ring barbs (classic concertina — spikes on both sides of coil)
    if (b % 2 === 0) {
      const innerR = coilR * 0.55
      const ipy = cy + Math.sin(a + 0.3) * innerR
      const ipz = cz + Math.cos(a + 0.3) * innerR
      const innerOut = new THREE.Vector3(0, Math.sin(a + 0.3), Math.cos(a + 0.3)).normalize()
      const innerDir = innerOut.clone().multiplyScalar(-1).add(new THREE.Vector3(0, 0.35, 0)).normalize()
      const innerBarb = new THREE.Mesh(barbGeo, steel)
      innerBarb.position.set(cx, ipy, ipz)
      innerBarb.quaternion.setFromUnitVectors(up, innerDir)
      addMesh(innerBarb)
    }
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
    const cy = railY + coilR * 0.75
    const cz = 0.1 + (i % 2 === 0 ? 0.04 : -0.04)
    const torus = new THREE.Mesh(new THREE.TorusGeometry(coilR, tubeR, 6, 14), steel)
    torus.rotation.y = Math.PI / 2
    torus.rotation.x = i % 2 === 0 ? 0.15 : -0.15
    torus.position.set(x, cy, cz)
    addMesh(torus)
    addCoilBarbs(x, cy, cz, coilR, steel, addMesh)
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
  const wire = wireMat()
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

  // Chain-link fill — 3D wire diamonds clipped to panel + faint texture backing
  const meshW = W - postR * 2.4
  const meshH = H - 0.14
  const meshY = meshH / 2 + 0.02
  const backing = new THREE.Mesh(new THREE.PlaneGeometry(meshW, meshH), chainMeshMat(10, 8))
  backing.position.set(0, meshY, 0.005)
  addMesh(backing)
  addChainLinkLattice(meshW, meshH, 0, meshY, wire, addMesh)

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
