/**
 * Yard prop crates — brown wooden boxes in several sizes and shapes.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {
  crateBracketTexture,
  crateFrameTexture,
  endGrainTexture,
  plankSlatNormalMap,
  plankSlatRoughnessMap,
  plankSlatTexture,
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

const PLANK_T = 0.02
const GAP = 0.005
const POST = 0.05

export interface CrateBuildResult {
  group: THREE.Group
  source: 'glb' | 'procedural'
  triangleCount: number
}

const matCache = new Map<string, THREE.MeshStandardMaterial>()

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

function plankSlatMat(tone: number, seed: number): THREE.MeshStandardMaterial {
  const key = `slat-${tone}-${seed % 48}`
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      map: plankSlatTexture(seed, tone),
      normalMap: plankSlatNormalMap(seed),
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: plankSlatRoughnessMap(seed),
      roughness: 0.86,
      metalness: 0.02,
    })
    matCache.set(key, m)
  }
  return m
}

function endGrainMat(seed: number): THREE.MeshStandardMaterial {
  const key = `end-${seed % 48}`
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      map: endGrainTexture(seed),
      roughness: 0.92,
      metalness: 0.01,
    })
    matCache.set(key, m)
  }
  return m
}

const wornEdgeMat = new THREE.MeshStandardMaterial({ color: 0xb8a080, roughness: 0.94, metalness: 0 })

function frameMat(): THREE.MeshStandardMaterial {
  const key = 'frame'
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ map: crateFrameTexture(), roughness: 0.9, metalness: 0.03 })
    matCache.set(key, m)
  }
  return m
}

function bracketMat(): THREE.MeshStandardMaterial {
  const key = 'bracket'
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      map: crateBracketTexture(),
      roughness: 0.62,
      metalness: 0.72,
      color: 0x9a9590,
    })
    matCache.set(key, m)
  }
  return m
}

const nailMat = new THREE.MeshStandardMaterial({ color: 0x2a2824, roughness: 0.45, metalness: 0.55 })

function addBox(
  addMesh: (m: THREE.Mesh) => void,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.position.set(x, y, z)
  addMesh(mesh)
}

function addNail(addMesh: (m: THREE.Mesh) => void, x: number, y: number, z: number, axis: 'x' | 'z'): void {
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.006, 0.0025, 6), nailMat)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0028, 0.006, 5), nailMat)
  if (axis === 'z') {
    head.rotation.x = shaft.rotation.x = Math.PI / 2
    head.position.set(x, y, z + 0.002)
    shaft.position.set(x, y, z - 0.001)
  } else {
    head.rotation.z = shaft.rotation.z = Math.PI / 2
    head.position.set(x + 0.002, y, z)
    shaft.position.set(x - 0.001, y, z)
  }
  addMesh(head)
  addMesh(shaft)
}

function addEndGrainCap(
  addMesh: (m: THREE.Mesh) => void,
  x: number,
  y: number,
  z: number,
  plankH: number,
  depth: number,
  seed: number,
): void {
  addBox(addMesh, 0.007, plankH * 0.94, depth * 0.9, x, y, z, endGrainMat(seed))
}

function addPlankEdgeWear(
  addMesh: (m: THREE.Mesh) => void,
  x: number,
  y: number,
  z: number,
  w: number,
): void {
  addBox(addMesh, w * 0.96, 0.003, 0.006, x, y, z, wornEdgeMat)
}

function addSplinter(
  addMesh: (m: THREE.Mesh) => void,
  x: number,
  y: number,
  z: number,
  seed: number,
  tone: number,
): void {
  const splinter = new THREE.Mesh(
    new THREE.BoxGeometry(0.022 + (seed % 3) * 0.008, 0.003, 0.007),
    plankSlatMat(tone, seed + 501),
  )
  splinter.position.set(x, y, z)
  splinter.rotation.z = (seed % 7) * 0.04 - 0.12
  splinter.rotation.x = (seed % 5) * 0.03
  addMesh(splinter)
}

type PlankFace = 'z+' | 'z-' | 'x+' | 'x-'

function addPlank(
  addMesh: (m: THREE.Mesh) => void,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  tone: number,
  seed: number,
  grainAlong: 'x' | 'z',
  outerFace?: PlankFace,
): void {
  const jx = ((seed % 7) - 3) * 0.0008
  const jy = ((seed % 5) - 2) * 0.0006
  const wScale = 0.991 + (seed % 4) * 0.003
  const hScale = 0.994 + (seed % 3) * 0.002
  const fw = w * wScale
  const fh = h * hScale

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, d), plankSlatMat(tone, seed))
  mesh.position.set(x + jx, y + jy, z)
  addMesh(mesh)

  if (grainAlong === 'x') {
    addEndGrainCap(addMesh, x - fw / 2 - 0.002, y, z, fh, d, seed + 1)
    addEndGrainCap(addMesh, x + fw / 2 + 0.002, y, z, fh, d, seed + 2)
    if (outerFace === 'z+') {
      addPlankEdgeWear(addMesh, x, y + fh / 2 - 0.001, z + d / 2 + 0.003, fw)
      if (seed % 4 === 0) addSplinter(addMesh, x + fw * 0.15, y - fh * 0.1, z + d / 2 + 0.005, seed, tone)
    }
    if (outerFace === 'z-' && seed % 5 === 1) {
      addSplinter(addMesh, x - fw * 0.2, y + fh * 0.15, z - d / 2 - 0.005, seed + 11, tone)
    }
  } else {
    addEndGrainCap(addMesh, x, y, z - w / 2 - 0.002, fh, d, seed + 1)
    addEndGrainCap(addMesh, x, y, z + w / 2 + 0.002, fh, d, seed + 2)
    if (outerFace === 'x+') {
      addPlankEdgeWear(addMesh, x + d / 2 + 0.003, y + fh / 2 - 0.001, z, w * wScale)
      if (seed % 4 === 2) addSplinter(addMesh, x + d / 2 + 0.005, y, z + w * 0.1, seed, tone)
    }
  }
}

function addHorizontalPlankWall(
  addMesh: (m: THREE.Mesh) => void,
  count: number,
  span: number,
  height: number,
  depth: number,
  cx: number,
  yBase: number,
  cz: number,
  along: 'x' | 'z',
  tone: number,
  wallSeed: number,
  outerFace: PlankFace,
  nails: boolean,
): void {
  const plankH = (height - GAP * (count - 1)) / count
  for (let i = 0; i < count; i++) {
    const y = yBase + plankH / 2 + i * (plankH + GAP)
    const seed = wallSeed * 100 + i
    if (along === 'x') {
      addPlank(addMesh, span, plankH, depth, cx, y, cz, tone, seed, 'x', outerFace)
      if (nails) {
        addNail(addMesh, cx - span * 0.32, y, cz + depth * 0.58, 'z')
        addNail(addMesh, cx + span * 0.32, y, cz + depth * 0.58, 'z')
        if (i % 3 === 0) addNail(addMesh, cx, y, cz + depth * 0.58, 'z')
      }
    } else {
      addPlank(addMesh, depth, plankH, span, cx, y, cz, tone, seed, 'z', outerFace)
      if (nails) {
        addNail(addMesh, cx + depth * 0.58, y, cz - span * 0.32, 'x')
        addNail(addMesh, cx + depth * 0.58, y, cz + span * 0.32, 'x')
        if (i % 3 === 0) addNail(addMesh, cx + depth * 0.58, y, cz, 'x')
      }
    }
  }
}

function addLidPlankRow(
  addMesh: (m: THREE.Mesh) => void,
  count: number,
  span: number,
  depth: number,
  y: number,
  tone: number,
): void {
  const plankW = (span - GAP * (count - 1)) / count
  for (let i = 0; i < count; i++) {
    const x = -span / 2 + plankW / 2 + i * (plankW + GAP)
    const seed = 800 + i * 17
    addPlank(addMesh, plankW, PLANK_T + 0.01, depth, x, y, 0, tone, seed, 'x')
    addNail(addMesh, x - plankW * 0.28, y, depth * 0.48, 'z')
    addNail(addMesh, x + plankW * 0.28, y, depth * 0.48, 'z')
  }
}

function addCornerPost(
  addMesh: (m: THREE.Mesh) => void,
  x: number,
  y0: number,
  z: number,
  h: number,
): void {
  addBox(addMesh, POST, h, POST, x, y0 + h / 2, z, frameMat())
}

function addMetalBracket(
  addMesh: (m: THREE.Mesh) => void,
  x: number,
  y: number,
  z: number,
  face: 'front' | 'back' | 'left' | 'right',
): void {
  const b = bracketMat()
  const leg = 0.09
  const t = 0.012
  const h = 0.13
  let a: THREE.Mesh
  let c: THREE.Mesh
  if (face === 'front' || face === 'back') {
    a = new THREE.Mesh(new THREE.BoxGeometry(leg, h, t), b)
    c = new THREE.Mesh(new THREE.BoxGeometry(t, h, leg), b)
  } else {
    a = new THREE.Mesh(new THREE.BoxGeometry(t, h, leg), b)
    c = new THREE.Mesh(new THREE.BoxGeometry(leg, h, t), b)
  }
  const sign = face === 'front' || face === 'right' ? 1 : -1
  a.position.set(x, y, z)
  c.position.set(x + (face === 'front' || face === 'back' ? sign * leg * 0.45 : 0), y, z + (face === 'left' || face === 'right' ? sign * leg * 0.45 : 0))
  addMesh(a)
  addMesh(c)
}

function addFaceDecal(
  addMesh: (m: THREE.Mesh) => void,
  texture: THREE.CanvasTexture,
  face: 'front' | 'back' | 'left' | 'right',
  w: number,
  h: number,
  hw: number,
  yBase: number,
  bodyH: number,
  hd: number,
  yOff = 0,
): void {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.12,
      roughness: 0.98,
      metalness: 0,
      depthWrite: false,
    }),
  )
  mesh.renderOrder = 2
  const inset = PLANK_T + 0.006
  const cy = yBase + bodyH * 0.5 + yOff
  switch (face) {
    case 'front':
      mesh.position.set(0, cy, hd + inset)
      break
    case 'back':
      mesh.position.set(0, cy, -hd - inset)
      mesh.rotation.y = Math.PI
      break
    case 'left':
      mesh.position.set(-hw - inset, cy, 0)
      mesh.rotation.y = -Math.PI / 2
      break
    case 'right':
      mesh.position.set(hw + inset, cy, 0)
      mesh.rotation.y = Math.PI / 2
      break
  }
  addMesh(mesh)
}

function addDiagonalBrace(
  addMesh: (m: THREE.Mesh) => void,
  hw: number,
  yBase: number,
  bodyH: number,
  hd: number,
): void {
  const len = Math.hypot(hw * 1.75, bodyH * 0.82)
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.07, len, PLANK_T + 0.01), frameMat())
  brace.position.set(0, yBase + bodyH * 0.48, hd + PLANK_T + 0.008)
  brace.rotation.z = Math.atan2(bodyH * 0.82, hw * 1.75)
  addMesh(brace)
  for (const t of [-0.35, 0, 0.35]) {
    addNail(addMesh, hw * t, yBase + bodyH * 0.48 + len * 0.38, hd + PLANK_T + 0.02, 'z')
  }
}

function addRopeHandle(
  addMesh: (m: THREE.Mesh) => void,
  hw: number,
  yBase: number,
  bodyH: number,
  side: 'left' | 'right',
): void {
  const rope = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.014, 6, 14, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x7a6040, roughness: 0.96, metalness: 0 }),
  )
  rope.rotation.y = side === 'left' ? -Math.PI / 2 : Math.PI / 2
  rope.rotation.z = Math.PI / 2
  rope.position.set(side === 'left' ? -hw - POST * 0.5 : hw + POST * 0.5, yBase + bodyH * 0.55, 0)
  addMesh(rope)
}

function addSkids(addMesh: (m: THREE.Mesh) => void, hw: number, hd: number): number {
  const fm = frameMat()
  const h = 0.07
  for (const z of [-hd * 0.55, 0, hd * 0.55]) {
    addBox(addMesh, hw * 2, h, 0.11, 0, h / 2, z, fm)
  }
  return h
}

function addLidPlanks(
  addMesh: (m: THREE.Mesh) => void,
  w: number,
  d: number,
  y: number,
  tone: number,
  recessed: boolean,
): void {
  const inset = recessed ? 0.07 : 0
  const innerW = w - inset * 2
  const innerD = d - inset * 2
  const count = w > 1.2 ? 5 : 3
  addLidPlankRow(addMesh, count, innerW, innerD, y, tone)
  if (recessed) {
    const rim = frameMat()
    const rimH = 0.06
    const yRim = y - rimH / 2 - PLANK_T * 0.5
    addBox(addMesh, w, rimH, PLANK_T, 0, yRim, d / 2 - PLANK_T, rim)
    addBox(addMesh, w, rimH, PLANK_T, 0, yRim, -d / 2 + PLANK_T, rim)
    addBox(addMesh, PLANK_T, rimH, d, -w / 2 + PLANK_T, yRim, 0, rim)
    addBox(addMesh, PLANK_T, rimH, d, w / 2 - PLANK_T, yRim, 0, rim)
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
  const hw = W / 2 - POST
  const hd = D / 2 - POST
  const yBase = features.skids ? addSkids(addMesh, W / 2, D / 2) : 0
  const bodyH = H
  const plankRows = Math.max(4, Math.round(bodyH / 0.14))

  // Corner posts
  for (const [x, z] of [
    [-W / 2 + POST / 2, -D / 2 + POST / 2],
    [W / 2 - POST / 2, -D / 2 + POST / 2],
    [-W / 2 + POST / 2, D / 2 - POST / 2],
    [W / 2 - POST / 2, D / 2 - POST / 2],
  ]) {
    addCornerPost(addMesh, x, yBase, z, bodyH)
  }

  // Four plank walls (horizontal boards stacked vertically)
  addHorizontalPlankWall(addMesh, plankRows, hw * 2, bodyH, PLANK_T, 0, yBase, hd + PLANK_T / 2, 'x', tone, 1, 'z+', true)
  addHorizontalPlankWall(addMesh, plankRows, hw * 2, bodyH, PLANK_T, 0, yBase, -hd - PLANK_T / 2, 'x', tone, 2, 'z-', true)
  addHorizontalPlankWall(addMesh, plankRows, hd * 2, bodyH, PLANK_T, -hw - PLANK_T / 2, yBase, 0, 'z', tone, 3, 'x-', true)
  addHorizontalPlankWall(addMesh, plankRows, hd * 2, bodyH, PLANK_T, hw + PLANK_T / 2, yBase, 0, 'z', tone, 4, 'x+', true)

  // Bottom boards
  const bottomCount = W > 1.2 ? 4 : 3
  const bottomPlankW = (W - POST - GAP * (bottomCount - 1)) / bottomCount
  for (let i = 0; i < bottomCount; i++) {
    const x = -((bottomCount - 1) * (bottomPlankW + GAP)) / 2 + i * (bottomPlankW + GAP)
    addPlank(addMesh, bottomPlankW, PLANK_T, D - POST, x, yBase + PLANK_T / 2, 0, tone, 600 + i, 'x')
  }

  // Metal brackets at corners (lower + upper)
  for (const y of [yBase + bodyH * 0.18, yBase + bodyH * 0.82]) {
    addMetalBracket(addMesh, -hw, y, hd, 'front')
    addMetalBracket(addMesh, hw, y, hd, 'right')
    addMetalBracket(addMesh, -hw, y, -hd, 'back')
    addMetalBracket(addMesh, hw, y, -hd, 'right')
  }

  addLidPlanks(addMesh, W, D, yBase + bodyH + PLANK_T, tone, features.recessedLid ?? false)

  if (features.diagonalBrace) addDiagonalBrace(addMesh, hw, yBase, bodyH, hd)
  if (features.ropeHandle) addRopeHandle(addMesh, hw + POST, yBase, bodyH, 'right')
  if (features.sideUp) {
    addFaceDecal(addMesh, sideUpDecalTexture(), 'left', hw * 1.1, bodyH * 0.5, hw + POST, yBase, bodyH, hd)
  }
  for (const s of features.stencils ?? []) {
    addFaceDecal(
      addMesh,
      stencilDecalTexture(s.label, s.sub),
      s.face,
      s.w,
      s.h,
      hw + POST,
      yBase,
      bodyH,
      hd,
      s.y ?? 0,
    )
  }
}

function addSmallCrate(addMesh: (m: THREE.Mesh) => void): void {
  buildPlankCrate(addMesh, CRATE_DIMS.small, 0, {
    ropeHandle: true,
    stencils: [{ face: 'front', label: 'FRAG', w: 0.28, h: 0.1 }],
  })
}

function addMediumCrate(addMesh: (m: THREE.Mesh) => void): void {
  buildPlankCrate(addMesh, CRATE_DIMS.medium, 1, {
    stencils: [
      { face: 'front', label: 'TOP', w: 0.32, h: 0.12, y: CRATE_DIMS.medium.height * 0.22 },
      { face: 'front', label: 'F4-66-88', sub: 'ORD-221', w: 0.48, h: 0.18 },
    ],
  })
}

function addLargeCrate(addMesh: (m: THREE.Mesh) => void): void {
  buildPlankCrate(addMesh, CRATE_DIMS.large, 2, {
    diagonalBrace: true,
    recessedLid: true,
    sideUp: true,
    stencils: [{ face: 'front', label: '1315-14-543', sub: 'MO 81-44', w: 0.7, h: 0.24 }],
  })
}

function addLongCrate(addMesh: (m: THREE.Mesh) => void): void {
  buildPlankCrate(addMesh, CRATE_DIMS.long, 3, {
    stencils: [{ face: 'front', label: 'TOP', w: 0.28, h: 0.1, y: CRATE_DIMS.long.height * 0.08 }],
  })
}

function addFlatCrate(addMesh: (m: THREE.Mesh) => void): void {
  buildPlankCrate(addMesh, CRATE_DIMS.flat, 4, {
    recessedLid: true,
    skids: true,
    stencils: [{ face: 'front', label: 'SUPPLY', sub: 'WT 48 KG', w: 0.52, h: 0.18 }],
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
