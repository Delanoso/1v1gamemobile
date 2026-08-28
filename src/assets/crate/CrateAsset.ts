/**
 * Yard prop crates — brown wooden boxes in several sizes and shapes.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {
  crateBracketTexture,
  crateFrameTexture,
  crateLidTexture,
  cratePlankTexture,
  sideUpDecalTexture,
  stencilDecalTexture,
} from './CrateTextures'

export type CrateVariant = 'small' | 'medium' | 'large' | 'long' | 'flat'

export interface CrateDims {
  width: number
  height: number
  depth: number
}

const CRATE_DIMS: Record<CrateVariant, CrateDims> = {
  small: { width: 0.55, height: 0.55, depth: 0.55 },
  medium: { width: 1.0, height: 1.0, depth: 1.0 },
  large: { width: 1.35, height: 1.35, depth: 1.35 },
  long: { width: 2.0, height: 0.42, depth: 0.42 },
  flat: { width: 1.8, height: 0.55, depth: 1.2 },
}

const GLB_PATHS: Record<CrateVariant, string> = {
  small: '/assets/maps/container-yard/crate-small.glb',
  medium: '/assets/maps/container-yard/crate-medium.glb',
  large: '/assets/maps/container-yard/crate-large.glb',
  long: '/assets/maps/container-yard/crate-long.glb',
  flat: '/assets/maps/container-yard/crate-flat.glb',
}

export interface CrateBuildResult {
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

function plankMat(tone = 0): THREE.MeshStandardMaterial {
  const map = cratePlankTexture(tone)
  return new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0.02 })
}

function lidMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ map: crateLidTexture(), roughness: 0.9, metalness: 0.02 })
}

function frameMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ map: crateFrameTexture(), roughness: 0.88, metalness: 0.04 })
}

function bracketMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: crateBracketTexture(),
    roughness: 0.55,
    metalness: 0.65,
    color: 0x888480,
  })
}

function addFaceDecal(
  addMesh: (m: THREE.Mesh) => void,
  texture: THREE.CanvasTexture,
  face: 'front' | 'back' | 'left' | 'right',
  w: number,
  h: number,
  hw: number,
  hh: number,
  hd: number,
  yOff = 0,
): void {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95, metalness: 0, depthWrite: false }),
  )
  mesh.renderOrder = 2
  const inset = 0.012
  switch (face) {
    case 'front':
      mesh.position.set(0, hh * 0.5 + yOff, hd + inset)
      break
    case 'back':
      mesh.position.set(0, hh * 0.5 + yOff, -hd - inset)
      mesh.rotation.y = Math.PI
      break
    case 'left':
      mesh.position.set(-hw - inset, hh * 0.5 + yOff, 0)
      mesh.rotation.y = -Math.PI / 2
      break
    case 'right':
      mesh.position.set(hw + inset, hh * 0.5 + yOff, 0)
      mesh.rotation.y = Math.PI / 2
      break
  }
  addMesh(mesh)
}

function addRopeHandle(addMesh: (m: THREE.Mesh) => void, hw: number, hh: number, side: 'left' | 'right'): void {
  const rope = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.018, 6, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x8a7050, roughness: 0.95, metalness: 0 }),
  )
  rope.rotation.y = side === 'left' ? -Math.PI / 2 : Math.PI / 2
  rope.rotation.z = Math.PI / 2
  const x = side === 'left' ? -hw - 0.02 : hw + 0.02
  rope.position.set(x, hh * 0.55, 0)
  addMesh(rope)
}

function addDiagonalBrace(addMesh: (m: THREE.Mesh) => void, hw: number, hh: number, hd: number): void {
  const brace = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, Math.hypot(hw * 1.7, hh * 0.85), 0.02),
    frameMat(),
  )
  brace.position.set(0, hh * 0.48, hd + 0.015)
  brace.rotation.z = Math.atan2(hh * 0.85, hw * 1.7)
  addMesh(brace)
}

function addCornerBrackets(addMesh: (m: THREE.Mesh) => void, hw: number, hh: number, hd: number): void {
  const b = bracketMat()
  const s = 0.06
  for (const [sx, sy, sz] of [
    [-1, -1, -1],
    [1, -1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [-1, 1, -1],
    [1, 1, -1],
    [-1, 1, 1],
    [1, 1, 1],
  ] as const) {
    const legX = new THREE.Mesh(new THREE.BoxGeometry(s, s * 2.2, s * 0.5), b)
    legX.position.set(sx * (hw - s * 0.3), sy * (hh - s * 0.5), sz * (hd - s * 0.3))
    addMesh(legX)
    const legY = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 2.2, s), b)
    legY.position.set(sx * (hw - s * 0.3), sy * (hh - s * 0.5), sz * (hd - s * 0.3))
    addMesh(legY)
  }
}

function addFrameBands(addMesh: (m: THREE.Mesh) => void, hw: number, hh: number, hd: number): void {
  const fm = frameMat()
  const t = 0.035
  for (const y of [hh * 0.15, hh * 0.85]) {
    const front = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + t, t, t), fm)
    front.position.set(0, y, hd + t * 0.3)
    addMesh(front)
    const back = front.clone()
    back.position.z = -hd - t * 0.3
    addMesh(back)
    const left = new THREE.Mesh(new THREE.BoxGeometry(t, t, hd * 2 + t), fm)
    left.position.set(-hw - t * 0.3, y, 0)
    addMesh(left)
    const right = left.clone()
    right.position.x = hw + t * 0.3
    addMesh(right)
  }
}

function addSkids(addMesh: (m: THREE.Mesh) => void, hw: number, hd: number): void {
  const fm = frameMat()
  for (const z of [-hd * 0.55, 0, hd * 0.55]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, 0.06, 0.1), fm)
    skid.position.set(0, 0.03, z)
    addMesh(skid)
  }
}

function buildPlankCrate(
  addMesh: (m: THREE.Mesh) => void,
  dims: CrateDims,
  tone: number,
  features: {
    diagonalBrace?: boolean
    ropeHandle?: boolean
    stencils?: { face: 'front' | 'back' | 'left' | 'right'; label: string; sub?: string; w: number; h: number; y?: number }[]
    sideUp?: boolean
    skids?: boolean
    recessedLid?: boolean
  } = {},
): void {
  const { width: W, height: H, depth: D } = dims
  const hw = W / 2
  const hh = H
  const hd = D / 2
  const body = plankMat(tone)

  const shell = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), body)
  shell.position.y = H / 2
  addMesh(shell)

  if (features.recessedLid) {
    const lid = new THREE.Mesh(new THREE.BoxGeometry(W * 0.88, 0.04, D * 0.88), lidMat())
    lid.position.y = H - 0.02
    addMesh(lid)
    const rimT = 0.04
    for (const [lx, lz, lw, ld] of [
      [0, hd * 0.92, W * 0.92, rimT],
      [0, -hd * 0.92, W * 0.92, rimT],
      [-hw * 0.92, 0, rimT, D * 0.92],
      [hw * 0.92, 0, rimT, D * 0.92],
    ] as const) {
      const rim = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.05, ld), frameMat())
      rim.position.set(lx, H - 0.04, lz)
      addMesh(rim)
    }
  } else {
    const lid = new THREE.Mesh(new THREE.BoxGeometry(W + 0.02, 0.05, D + 0.02), lidMat())
    lid.position.y = H + 0.025
    addMesh(lid)
  }

  addFrameBands(addMesh, hw, hh, hd)
  addCornerBrackets(addMesh, hw, hh, hd)

  if (features.diagonalBrace) addDiagonalBrace(addMesh, hw, hh, hd)
  if (features.ropeHandle) {
    addRopeHandle(addMesh, hw, hh, 'right')
  }
  if (features.skids) addSkids(addMesh, hw, hd)

  if (features.sideUp) {
    addFaceDecal(addMesh, sideUpDecalTexture(), 'left', hw * 0.9, hh * 0.55, hw, hh, hd)
  }

  for (const s of features.stencils ?? []) {
    addFaceDecal(
      addMesh,
      stencilDecalTexture(s.label, s.sub),
      s.face,
      s.w,
      s.h,
      hw,
      hh,
      hd,
      s.y ?? 0,
    )
  }
}

function addSmallCrate(addMesh: (m: THREE.Mesh) => void): void {
  buildPlankCrate(addMesh, CRATE_DIMS.small, 0, {
    ropeHandle: true,
    stencils: [{ face: 'front', label: 'FRAG', w: 0.28, h: 0.12 }],
  })
}

function addMediumCrate(addMesh: (m: THREE.Mesh) => void): void {
  buildPlankCrate(addMesh, CRATE_DIMS.medium, 1, {
    stencils: [
      { face: 'front', label: 'TOP', w: 0.35, h: 0.14, y: hhOffset(CRATE_DIMS.medium) },
      { face: 'front', label: 'F4-66-88', sub: 'ORD-221', w: 0.5, h: 0.22 },
    ],
  })
}

function hhOffset(dims: CrateDims): number {
  return dims.height * 0.22
}

function addLargeCrate(addMesh: (m: THREE.Mesh) => void): void {
  buildPlankCrate(addMesh, CRATE_DIMS.large, 2, {
    diagonalBrace: true,
    recessedLid: true,
    sideUp: true,
    stencils: [{ face: 'front', label: '1315-14-543', sub: 'MO 81-44', w: 0.75, h: 0.28 }],
  })
}

function addLongCrate(addMesh: (m: THREE.Mesh) => void): void {
  buildPlankCrate(addMesh, CRATE_DIMS.long, 3, {
    stencils: [{ face: 'front', label: 'TOP', w: 0.3, h: 0.12, y: CRATE_DIMS.long.height * 0.08 }],
  })
}

function addFlatCrate(addMesh: (m: THREE.Mesh) => void): void {
  buildPlankCrate(addMesh, CRATE_DIMS.flat, 4, {
    recessedLid: true,
    skids: true,
    stencils: [{ face: 'front', label: 'SUPPLY', sub: 'WT 48 KG', w: 0.55, h: 0.22 }],
  })
}

export function buildProceduralCrate(variant: CrateVariant = 'medium'): CrateBuildResult {
  const group = new THREE.Group()
  const addMesh = (mesh: THREE.Mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }
  switch (variant) {
    case 'small':
      addSmallCrate(addMesh)
      break
    case 'large':
      addLargeCrate(addMesh)
      break
    case 'long':
      addLongCrate(addMesh)
      break
    case 'flat':
      addFlatCrate(addMesh)
      break
    default:
      addMediumCrate(addMesh)
  }
  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

/** Mixed crate scatter for map placement. */
export function buildCrateCluster(): CrateBuildResult {
  const group = new THREE.Group()
  const placements: [CrateVariant, number, number, number][] = [
    ['medium', 0, 0, 0],
    ['small', 0.7, 0, 0.35],
    ['long', -0.9, 0, 0.2],
    ['flat', 0.2, 0, -0.85],
    ['large', -1.1, 0, -0.6],
  ]
  for (const [variant, ox, oy, oz] of placements) {
    const crate = buildProceduralCrate(variant).group
    crate.position.set(ox, oy, oz)
    group.add(crate)
  }
  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

export async function buildCrate(variant: CrateVariant = 'medium'): Promise<CrateBuildResult> {
  const glbPath = GLB_PATHS[variant]
  try {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(glbPath)
    const model = gltf.scene.clone()
    model.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const dims = CRATE_DIMS[variant]
    const targetH = dims.height
    const scale = targetH / Math.max(size.y, size.x, size.z)
    model.scale.setScalar(scale)
    box.setFromObject(model)
    model.position.sub(box.getCenter(new THREE.Vector3()))
    model.position.y -= box.min.y
    const group = new THREE.Group()
    group.add(model)
    return { group, source: 'glb', triangleCount: countTriangles(group) }
  } catch {
    return buildProceduralCrate(variant)
  }
}

export { CRATE_DIMS }
