import * as THREE from 'three'
import { buildBarrelCluster } from '../../assets/barrel/BarrelAsset'
import {
  buildProceduralContainer,
  CONTAINER_DIMS,
  type ContainerVariant,
} from '../../assets/container/ContainerAsset'
import { buildProceduralCrate } from '../../assets/crate/CrateAsset'
import { buildMapGround } from '../../assets/floor/FloorAsset'
import { buildMapFencePanel, FENCE_PANEL } from '../../assets/fence/FenceAsset'
import type { ContainerColor } from '../materials/MapMaterials'
import type { Collider } from './collision'

export type { Collider } from './collision'
export { resolveCapsuleColliders, resolveCapsuleCollidersRepeated, groundHeightAt } from './collision'

export interface BuiltMap {
  group: THREE.Group
  colliders: Collider[]
  spawns: THREE.Vector3[]
  targetAnchors: THREE.Vector3[]
}

const CH = CONTAINER_DIMS.height
const CW = CONTAINER_DIMS.width
const CL = CONTAINER_DIMS.length
/** Pull container hitboxes inward so alley gaps match what players see. */
const CONTAINER_COLLIDER_INSET = 0.28

const containerProtos = new Map<ContainerVariant, THREE.Object3D>()
let fenceProto: THREE.Object3D | null = null

function pushCollider(
  colliders: Collider[],
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
): void {
  colliders.push({
    min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
    max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2),
  })
}

function pushContainerCollider(
  colliders: Collider[],
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
): void {
  const inset = CONTAINER_COLLIDER_INSET
  pushCollider(
    colliders,
    Math.max(0.5, w - inset * 2),
    h,
    Math.max(0.5, d - inset * 2),
    x,
    y,
    z,
  )
}

function cloneContainer(color: ContainerColor): THREE.Object3D {
  const key = color as ContainerVariant
  let proto = containerProtos.get(key)
  if (!proto) {
    proto = buildProceduralContainer(key).group
    containerProtos.set(key, proto)
  }
  return proto.clone()
}

function cloneFencePanel(): THREE.Object3D {
  if (!fenceProto) fenceProto = buildMapFencePanel().group
  return fenceProto.clone()
}

function addFenceRun(
  group: THREE.Group,
  colliders: Collider[],
  axis: 'x' | 'z',
  fixed: number,
  start: number,
  end: number,
  rotY: number,
): void {
  const panelW = FENCE_PANEL.width
  const count = Math.ceil((end - start) / panelW)
  const margin = (count * panelW - (end - start)) / 2
  for (let i = 0; i < count; i++) {
    const panel = cloneFencePanel()
    const along = start + margin + panelW / 2 + i * panelW
    if (axis === 'x') panel.position.set(along, 0, fixed)
    else panel.position.set(fixed, 0, along)
    panel.rotation.y = rotY
    group.add(panel)
    pushCollider(colliders, panelW, FENCE_PANEL.height, 0.18, panel.position.x, FENCE_PANEL.height / 2, panel.position.z)
  }
}

function addContainer(
  group: THREE.Group,
  colliders: Collider[],
  x: number,
  z: number,
  axis: 'x' | 'z',
  color: ContainerColor,
  stack = 1,
  yBase = 0,
): THREE.Group {
  const wrapper = new THREE.Group()
  const w = axis === 'x' ? CL : CW
  const d = axis === 'x' ? CW : CL

  for (let s = 0; s < stack; s++) {
    const container = cloneContainer(color)
    if (axis === 'z') container.rotation.y = Math.PI / 2
    container.position.set(0, yBase + CH / 2 + s * CH, 0)
    wrapper.add(container)
    pushContainerCollider(colliders, w, CH, d, x, yBase + CH / 2 + s * CH, z)
  }

  wrapper.position.set(x, 0, z)
  group.add(wrapper)
  return wrapper
}

function addAngledContainer(
  group: THREE.Group,
  colliders: Collider[],
  x: number,
  z: number,
  color: ContainerColor,
  angle: number,
): void {
  const container = cloneContainer(color)
  container.position.set(x, CH / 2, z)
  container.rotation.y = angle
  group.add(container)
  const r = CL * 0.38
  pushContainerCollider(colliders, r * 2, CH, r * 2, x, CH / 2, z)
}

function addBarrelCluster(group: THREE.Group, colliders: Collider[], x: number, z: number): void {
  const cluster = buildBarrelCluster().group
  cluster.traverse((o) => {
    if (o instanceof THREE.Mesh && o.geometry.type !== 'CylinderGeometry') o.castShadow = false
  })
  cluster.position.set(x, 0, z)
  group.add(cluster)
  pushCollider(colliders, 1.35, 1.05, 1.35, x, 0.52, z)
}

function addCratePair(group: THREE.Group, colliders: Collider[], x: number, z: number, rotY = 0): void {
  const wrapper = new THREE.Group()
  const medium = buildProceduralCrate('medium').group
  medium.position.set(0, 0, 0)
  const small = buildProceduralCrate('small').group
  small.position.set(0.85, 0, 0.35)
  wrapper.add(medium, small)
  wrapper.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = false
  })
  wrapper.position.set(x, 0, z)
  wrapper.rotation.y = rotY
  group.add(wrapper)
  pushCollider(colliders, 1.55, 1.05, 1.25, x, 0.52, z)
}

/** MW Shipment-inspired container yard — lab assets integrated (game-optimized). */
export function buildContainerYardMap(): BuiltMap {
  const group = new THREE.Group()
  const colliders: Collider[] = []

  group.add(buildMapGround(48, 36))

  addFenceRun(group, colliders, 'x', -17.2, -23, 23, 0)
  addFenceRun(group, colliders, 'x', 17.2, -23, 23, Math.PI)
  addFenceRun(group, colliders, 'z', -23.1, -17, 17, Math.PI / 2)
  addFenceRun(group, colliders, 'z', 23.1, -17, 17, -Math.PI / 2)

  const northZ = -12.5
  const southZ = 12.5
  const westX = -18.5
  const eastX = 18.5
  const perimColors: ContainerColor[] = ['blue', 'red', 'green', 'tan', 'blue', 'red']
  ;[-15, -9, -3, 3, 9, 15].forEach((x, i) => {
    addContainer(group, colliders, x, northZ, 'x', perimColors[i % perimColors.length])
    addContainer(group, colliders, x, southZ, 'x', perimColors[(i + 2) % perimColors.length])
  })
  ;[-9, -3, 3, 9].forEach((z, i) => {
    addContainer(group, colliders, westX, z, 'z', perimColors[(i + 1) % perimColors.length])
    addContainer(group, colliders, eastX, z, 'z', perimColors[(i + 3) % perimColors.length])
  })

  const quad = [
    { x: -7, z: -7, c: 'red' as ContainerColor },
    { x: 7, z: -7, c: 'blue' as ContainerColor },
    { x: -7, z: 7, c: 'green' as ContainerColor },
    { x: 7, z: 7, c: 'tan' as ContainerColor },
  ]
  for (const q of quad) {
    addContainer(group, colliders, q.x, q.z, 'x', q.c, 2)
  }

  addContainer(group, colliders, 0, -5, 'z', 'red')
  addContainer(group, colliders, 0, 5, 'z', 'blue')
  addContainer(group, colliders, -5, 0, 'x', 'green')
  addContainer(group, colliders, 5, 0, 'x', 'tan')

  addAngledContainer(group, colliders, -14, -9, 'blue', Math.PI / 4)
  addAngledContainer(group, colliders, 14, 9, 'red', Math.PI / 4)
  addAngledContainer(group, colliders, 14, -9, 'green', -Math.PI / 4)
  addAngledContainer(group, colliders, -14, 9, 'tan', -Math.PI / 4)

  const tunnel = cloneContainer('blue')
  tunnel.position.set(-10, CH / 2, 11)
  group.add(tunnel)
  pushContainerCollider(colliders, CL, CH, CW, -10, CH / 2, 11)
  const tunnelDark = new THREE.Mesh(
    new THREE.BoxGeometry(CL * 0.85, CH * 0.8, CW * 0.85),
    new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 1 }),
  )
  tunnelDark.position.set(-10, CH / 2, 11)
  group.add(tunnelDark)

  addBarrelCluster(group, colliders, 16, -11)
  addBarrelCluster(group, colliders, -16, 11)
  addCratePair(group, colliders, -12, 4, -0.2)
  addCratePair(group, colliders, 12, -3, 0.15)
  addCratePair(group, colliders, 3, 3, -0.3)

  const tarp = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 3.2),
    new THREE.MeshStandardMaterial({
      color: 0x8a7a58,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  )
  tarp.position.set(-7, CH * 2 + 1.1, -7)
  tarp.rotation.set(-0.55, 0.15, 0)
  group.add(tarp)

  const craneMat = new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 0.9 })
  for (const x of [-38, 38]) {
    const legA = new THREE.Mesh(new THREE.BoxGeometry(0.7, 20, 0.7), craneMat)
    legA.position.set(x - 4, 10, -30)
    group.add(legA)
    const legB = new THREE.Mesh(new THREE.BoxGeometry(0.7, 20, 0.7), craneMat)
    legB.position.set(x + 4, 10, -30)
    group.add(legB)
    const arm = new THREE.Mesh(new THREE.BoxGeometry(26, 0.55, 0.55), craneMat)
    arm.position.set(x, 19, -30)
    group.add(arm)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.4), craneMat)
    cab.position.set(x + 10, 18.2, -30)
    group.add(cab)
  }

  group.add(new THREE.HemisphereLight(0xd0dae4, 0x4a5058, 1.05))
  group.add(new THREE.AmbientLight(0x98a8b8, 0.28))

  const sun = new THREE.DirectionalLight(0xfff4e4, 0.95)
  sun.position.set(-30, 45, 20)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.near = 5
  sun.shadow.camera.far = 80
  sun.shadow.camera.left = -28
  sun.shadow.camera.right = 28
  sun.shadow.camera.top = 22
  sun.shadow.camera.bottom = -22
  sun.shadow.bias = -0.0003
  sun.shadow.normalBias = 0.02
  group.add(sun)

  const rim = new THREE.DirectionalLight(0xa0b8d8, 0.35)
  rim.position.set(20, 18, -15)
  group.add(rim)

  // Clear center lanes — old (-16,-11) wedged into perimeter containers + crates
  const spawns = [new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, 0, -10)]

  const targetAnchors = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-7, CH, -7),
    new THREE.Vector3(7, CH, 7),
    new THREE.Vector3(0, 0, -5),
    new THREE.Vector3(5, 0, 0),
    new THREE.Vector3(-14, 0, -9),
    new THREE.Vector3(3, 0, 3),
  ]

  return { group, colliders, spawns, targetAnchors }
}
