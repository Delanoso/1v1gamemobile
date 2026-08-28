/**
 * FPS weapon meshes — lab hero + in-game viewmodel source of truth.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {
  weaponBluedMat,
  weaponMetalMat,
  weaponPolyMat,
  weaponRubberMat,
  weaponSuppressorMat,
  weaponTapeMat,
  weaponWoodMat,
} from './WeaponTextures'

export type WeaponVariant = 'm4a1' | 'shotgun' | 'svd' | 'ak74'

export interface WeaponBuildResult {
  group: THREE.Group
  source: 'glb' | 'procedural'
  triangleCount: number
}

const GLB_PATHS: Record<WeaponVariant, string> = {
  m4a1: '/assets/weapons/m4a1.glb',
  shotgun: '/assets/weapons/shotgun.glb',
  svd: '/assets/weapons/svd.glb',
  ak74: '/assets/weapons/ak74.glb',
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

type AddMesh = (mesh: THREE.Mesh) => void

function buildM4A1(add: AddMesh): void {
  const metal = weaponMetalMat()
  const dark = weaponBluedMat()
  const poly = weaponPolyMat()

  add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.34), dark))
  add(new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.085, 0.22), metal))
  add(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.28), poly))

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.38, 10), metal)
  barrel.rotation.x = Math.PI / 2
  barrel.position.z = -0.36
  add(barrel)

  const fh = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.05, 8), dark)
  fh.rotation.x = Math.PI / 2
  fh.position.z = -0.56
  add(fh)

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.11, 0.065), poly)
  grip.position.set(0, -0.1, 0.04)
  grip.rotation.x = 0.38
  add(grip)

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.13, 0.075), dark)
  mag.position.set(0, -0.12, -0.02)
  add(mag)

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.2), poly)
  stock.position.set(0, -0.01, 0.24)
  add(stock)

  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 8), metal)
  tube.rotation.x = Math.PI / 2
  tube.position.set(0, 0.02, 0.34)
  add(tube)

  const carry = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.12), metal)
  carry.position.set(0, 0.09, -0.04)
  add(carry)

  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.24), metal)
  rail.position.set(0, 0.06, -0.06)
  add(rail)
}

function buildShotgun(add: AddMesh): void {
  const metal = weaponMetalMat(1)
  const dark = weaponBluedMat()
  const wood = weaponWoodMat(2)
  const woodDark = weaponWoodMat(3)

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.42), wood)
  stock.position.set(0, 0.02, 0.38)
  add(stock)

  const riser = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.035, 0.14), dark)
  riser.position.set(0, 0.1, 0.32)
  add(riser)
  for (const sx of [-0.028, 0.028]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 6), metal)
    knob.position.set(sx, 0.12, 0.32)
    add(knob)
  }

  const tape = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.04, 0.1), weaponTapeMat())
  tape.position.set(0, 0.01, 0.48)
  add(tape)

  const blueTape = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.06), weaponTapeMat(0x3a68b8))
  blueTape.position.set(0, 0.08, 0.22)
  add(blueTape)

  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.12, 0.04), weaponRubberMat())
  pad.position.set(0, 0.02, 0.6)
  add(pad)

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.22), dark)
  receiver.position.set(0, 0.02, 0.08)
  add(receiver)

  const port = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.06), metal)
  port.position.set(0.048, 0.04, 0.1)
  add(port)

  const pump = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.09, 0.2), wood)
  pump.position.set(0, -0.02, -0.12)
  add(pump)

  for (let i = 0; i < 6; i++) {
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.086, 0.008, 0.024), woodDark)
    groove.position.set(0, -0.02, -0.2 + i * 0.028)
    add(groove)
  }

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 10), metal)
  barrel.rotation.x = Math.PI / 2
  barrel.position.set(0, 0.04, -0.38)
  add(barrel)

  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.58, 8), dark)
  tube.rotation.x = Math.PI / 2
  tube.position.set(0, -0.01, -0.38)
  add(tube)

  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.055, 0.48), metal)
  shield.position.set(0, 0.055, -0.34)
  add(shield)
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 7; i++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.018, 0.038), dark)
      vent.position.set(row === 0 ? -0.014 : 0.014, 0.082, -0.16 - i * 0.05)
      add(vent)
    }
  }

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.14), metal)
  saddle.position.set(0.055, 0.04, 0.02)
  add(saddle)
  const shellColors = [0xc84838, 0xc84838, 0xd8d0c8, 0xd8d0c8]
  for (let i = 0; i < 4; i++) {
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.05, 6),
      weaponPolyMat(shellColors[i]),
    )
    shell.rotation.x = Math.PI / 2
    shell.position.set(0.07, 0.02 + i * 0.02, 0.02 - i * 0.028)
    add(shell)
    const brass = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.012, 6), weaponMetalMat(2))
    brass.rotation.x = Math.PI / 2
    brass.position.set(0.07, 0.02 + i * 0.02, 0.048 - i * 0.028)
    add(brass)
  }

  const bead = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 6), metal)
  bead.rotation.x = Math.PI / 2
  bead.position.set(0, 0.06, -0.68)
  add(bead)
}

function buildSvd(add: AddMesh): void {
  const metal = weaponMetalMat()
  const dark = weaponBluedMat()
  const wood = weaponWoodMat(4)

  const stockBase = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.38), wood)
  stockBase.position.set(0, 0.02, 0.36)
  add(stockBase)

  const thumbhole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.14), wood)
  thumbhole.position.set(0, -0.04, 0.28)
  add(thumbhole)

  const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.16), weaponPolyMat(0x4a3828))
  cheek.position.set(0, 0.1, 0.34)
  add(cheek)

  const buttplate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.02), weaponRubberMat(0x2a2420))
  buttplate.position.set(0, 0.02, 0.56)
  add(buttplate)

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.28), dark)
  receiver.position.set(0, 0.02, 0.1)
  add(receiver)

  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.09, 0.34), weaponPolyMat())
  handguard.position.set(0, 0.01, -0.12)
  add(handguard)
  for (let i = 0; i < 3; i++) {
    for (const sx of [-0.044, 0.044]) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.05, 0.07), weaponPolyMat(0x1a1e22))
      slot.position.set(sx, 0.01, -0.04 - i * 0.1)
      add(slot)
    }
  }
  for (let i = 0; i < 4; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.02), weaponPolyMat(0x222830))
    rib.position.set(0, -0.03, -0.22 + i * 0.08)
    add(rib)
  }

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.72, 10), metal)
  barrel.rotation.x = Math.PI / 2
  barrel.position.set(0, 0.045, -0.48)
  add(barrel)

  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.08, 8), dark)
  muzzle.rotation.x = Math.PI / 2
  muzzle.position.set(0, 0.045, -0.86)
  add(muzzle)
  for (let i = 0; i < 5; i++) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.02, 0.012), metal)
    slot.position.set(0, 0.045, -0.82 - i * 0.012)
    add(slot)
  }

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.1, 0.12), metal)
  mag.position.set(0, -0.1, 0.04)
  mag.rotation.x = 0.2
  add(mag)
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.008, 0.02), weaponMetalMat(1))
    rib.position.set(0, -0.08 + i * 0.028, 0.05)
    rib.rotation.x = 0.2
    add(rib)
  }

  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.12), metal)
  mount.position.set(0.06, 0.08, 0.02)
  add(mount)

  const scopeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.28, 10), dark)
  scopeBody.rotation.z = Math.PI / 2
  scopeBody.position.set(0.2, 0.1, 0.02)
  add(scopeBody)

  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.06, 10), dark)
  bell.rotation.z = Math.PI / 2
  bell.position.set(0.34, 0.1, 0.02)
  add(bell)

  const eyecup = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.04, 10), weaponRubberMat())
  eyecup.rotation.z = Math.PI / 2
  eyecup.position.set(0.08, 0.1, 0.02)
  add(eyecup)

  for (const sx of [0.14, 0.26]) {
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), metal)
    turret.position.set(sx, 0.12, 0.02)
    add(turret)
  }
}

function buildAk74(add: AddMesh): void {
  const dark = weaponBluedMat()
  const metal = weaponMetalMat()
  const poly = weaponPolyMat()
  const suppressorMat = weaponSuppressorMat(true)

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.26), dark)
  receiver.position.set(0, 0.02, 0.04)
  add(receiver)

  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.085, 0.22), poly)
  handguard.position.set(0, 0.01, -0.14)
  add(handguard)

  const vg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.1, 8), poly)
  vg.position.set(0, -0.1, -0.1)
  add(vg)

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.1), metal)
  mag.position.set(0, -0.1, 0.02)
  mag.rotation.x = 0.15
  add(mag)
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.051, 0.006, 0.02), weaponMetalMat(1))
    rib.position.set(0, -0.06 + i * 0.03, 0.03)
    rib.rotation.x = 0.15
    add(rib)
  }
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.006), dark)
  cross.position.set(0.026, -0.08, 0.04)
  cross.rotation.x = 0.15
  add(cross)

  const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.42, 12), suppressorMat)
  suppressor.rotation.x = Math.PI / 2
  suppressor.position.set(0, 0.04, -0.42)
  add(suppressor)
  for (let i = 0; i < 12; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.039, 0.0025, 4, 12), dark)
    ring.rotation.x = Math.PI / 2
    ring.position.set(0, 0.04, -0.22 - i * 0.032)
    add(ring)
  }

  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.038, 0.06, 12), weaponSuppressorMat(true))
  tip.rotation.x = Math.PI / 2
  tip.position.set(0, 0.04, -0.64)
  add(tip)

  const stockTop = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.18), metal)
  stockTop.position.set(0, 0.08, 0.3)
  add(stockTop)
  const stockBot = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, 0.2), metal)
  stockBot.position.set(0, 0.02, 0.3)
  add(stockBot)
  for (const sz of [0.22, 0.34]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), metal)
    strut.position.set(0, 0.05, sz)
    add(strut)
  }

  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.04), weaponRubberMat())
  pad.position.set(0, 0.02, 0.42)
  add(pad)

  const riser = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.1), poly)
  riser.position.set(0, 0.1, 0.3)
  add(riser)

  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.08), metal)
  mount.position.set(0.05, 0.12, 0.06)
  add(mount)

  const optic = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.07), metal)
  optic.position.set(0.05, 0.14, 0.06)
  add(optic)

  const laser = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 0.05), poly)
  laser.position.set(0.04, 0.06, -0.08)
  add(laser)
}

export function buildProceduralWeapon(variant: WeaponVariant = 'm4a1'): WeaponBuildResult {
  const group = new THREE.Group()
  const add: AddMesh = (mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }

  switch (variant) {
    case 'shotgun':
      buildShotgun(add)
      break
    case 'svd':
      buildSvd(add)
      break
    case 'ak74':
      buildAk74(add)
      break
    default:
      buildM4A1(add)
  }

  group.rotation.y = Math.PI
  const box = new THREE.Box3().setFromObject(group)
  const center = box.getCenter(new THREE.Vector3())
  group.position.set(-center.x, -box.min.y, -center.z)

  return { group, source: 'procedural', triangleCount: countTriangles(group) }
}

/** Clone for FPS viewmodel — scaled and aimed down camera -Z. */
export function buildViewModelGroup(variant: WeaponVariant = 'm4a1'): THREE.Group {
  const { group } = buildProceduralWeapon(variant)
  const vm = group.clone(true)
  vm.scale.setScalar(1.05)
  vm.rotation.set(0.02, 0, 0)
  vm.position.set(0.14, -0.15, -0.08)
  return vm
}

export async function buildWeapon(variant: WeaponVariant = 'm4a1'): Promise<WeaponBuildResult> {
  try {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(GLB_PATHS[variant])
    const model = gltf.scene.clone()
    model.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const scale = 1 / Math.max(size.x, size.y, size.z, 0.01)
    model.scale.setScalar(scale)
    box.setFromObject(model)
    model.position.sub(box.getCenter(new THREE.Vector3()))
    model.position.y -= box.min.y
    const group = new THREE.Group()
    group.add(model)
    group.rotation.y = Math.PI
    return { group, source: 'glb', triangleCount: countTriangles(group) }
  } catch {
    return buildProceduralWeapon(variant)
  }
}
