import * as THREE from 'three'
import { loadGlbModel, type GlbBuildResult } from '../glb/GlbModelLoader'

export const FEDERATION_OPERATOR_GLB = '/assets/weapons/federation.glb'

/**
 * FPS: gloves/hands only — the body stays off-screen (classic MW arms view).
 * A full upperbody T-pose cannot sit behind the lens and still reach the gun.
 */
const FPS_HIDDEN_MATERIAL = /head|headgear|eye|lense|boot|lowerbody|loadout|utility|alpha|upperbody/i
const FPS_VISIBLE_MATERIAL = /glove/i

let federationTemplate: Promise<THREE.Group> | null = null

function meshMaterialNames(mesh: THREE.Mesh): string[] {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  return mats.map((m) => m.name)
}

function shouldShowFpsMesh(mesh: THREE.Mesh): boolean {
  const names = meshMaterialNames(mesh)
  if (names.some((n) => FPS_HIDDEN_MATERIAL.test(n))) return false
  if (names.some((n) => FPS_VISIBLE_MATERIAL.test(n))) return true
  return false
}

/** Shift the inner model so visible gloves sit on the group origin. */
function recenterVisibleContent(root: THREE.Group): void {
  root.updateMatrixWorld(true)
  const box = new THREE.Box3()
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o.visible) box.expandByObject(o)
  })
  if (box.isEmpty()) return

  const center = box.getCenter(new THREE.Vector3())
  root.worldToLocal(center)

  const inner = root.children[0]
  if (inner) inner.position.sub(center)
  else root.position.sub(center)
  root.updateMatrixWorld(true)
}

function prepareFpsOperatorBody(root: THREE.Group): void {
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    const show = shouldShowFpsMesh(o)
    o.visible = show
    if (!show) return
    o.castShadow = false
    o.receiveShadow = false
    o.frustumCulled = false
    o.renderOrder = 1

    const mats = Array.isArray(o.material) ? o.material : [o.material]
    for (const mat of mats) {
      if (!mat || Array.isArray(mat)) continue
      if ('metalness' in mat) {
        const std = mat as THREE.MeshStandardMaterial
        std.envMapIntensity = 0.45
        std.metalness = Math.min(std.metalness, 0.4)
        std.roughness = Math.max(std.roughness, 0.5)
      }
      mat.needsUpdate = true
    }
  })

  recenterVisibleContent(root)
  // Character-space gloves are huge; shrink to viewmodel hand size.
  root.scale.setScalar(0.38)
}

/**
 * Hands near the M4 grips — torso/vest never drawn.
 * Fine-tune via /tune.html → OPERATOR (OP HIP / OP ADS).
 */
export const FPS_OPERATOR_HIP = {
  position: new THREE.Vector3(0.2, -0.34, -0.1),
  rotation: new THREE.Euler(0.85, 0.25, -0.55, 'YXZ'),
}

export const FPS_OPERATOR_ADS = {
  position: new THREE.Vector3(0.1, -0.28, -0.16),
  rotation: new THREE.Euler(0.95, 0.12, -0.35, 'YXZ'),
}

/** @deprecated Use FPS_OPERATOR_HIP */
export const FPS_OPERATOR_HOLD = FPS_OPERATOR_HIP

/** Kept for call-site compatibility. */
export function updateFpsOperatorClipPlanes(_camera: THREE.Camera): void {}

async function loadFederationTemplate(): Promise<THREE.Group> {
  const { group } = await loadGlbModel(FEDERATION_OPERATOR_GLB, 'character')
  prepareFpsOperatorBody(group)
  group.rotation.order = 'YXZ'
  return group
}

export function preloadFpsOperatorBody(): Promise<THREE.Group> {
  if (!federationTemplate) {
    federationTemplate = loadFederationTemplate()
  }
  return federationTemplate.then((rig) => {
    // Clear cached template pose leftovers — clone starts identity; hold pose is on parent group.
    const clone = rig.clone(true)
    clone.position.set(0, 0, 0)
    clone.rotation.set(0, 0, 0)
    return clone
  })
}

export async function buildFederationOperator(): Promise<GlbBuildResult> {
  return loadGlbModel(FEDERATION_OPERATOR_GLB, 'character')
}
