import * as THREE from 'three'
import { GAME } from '../../config/gameConfig'
import {
  VIEWMODEL_ADS,
  VIEWMODEL_HIP,
  buildViewModelGroup,
  computeAdsAimOffset,
  getSightLocalAimPoint,
  getSightLocalBox,
  isViewmodelVisibleAtHip,
  preloadM4ViewModel,
} from '../../assets/weapon/WeaponAsset'

const HIP_POS = VIEWMODEL_HIP.position
const HIP_ROT = VIEWMODEL_HIP.rotation
const ADS_POS = VIEWMODEL_ADS.position
const ADS_ROT = VIEWMODEL_ADS.rotation
const GLB_LOAD_TIMEOUT_MS = 8000

const BOX_CORNERS = [
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
]

function disposeModel(root: THREE.Object3D): void {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry?.dispose()
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const mat of mats) mat.dispose()
    }
  })
}

function fillBoxCorners(box: THREE.Box3, corners: THREE.Vector3[]): void {
  const { min, max } = box
  corners[0].set(min.x, min.y, min.z)
  corners[1].set(max.x, min.y, min.z)
  corners[2].set(min.x, max.y, min.z)
  corners[3].set(max.x, max.y, min.z)
  corners[4].set(min.x, min.y, max.z)
  corners[5].set(max.x, min.y, max.z)
  corners[6].set(min.x, max.y, max.z)
  corners[7].set(max.x, max.y, max.z)
}

/** First-person weapon mesh with recoil animation. */
export class WeaponViewModel {
  readonly group = new THREE.Group()
  private model: THREE.Group
  private adsAimOffset = new THREE.Vector3()
  private adsBlend = 0
  private kick = 0
  private sway = new THREE.Vector2()
  private readonly tmpPos = new THREE.Vector3()
  private readonly tmpEuler = new THREE.Euler(0, 0, 0, 'YXZ')
  private readonly tmpModelPos = new THREE.Vector3()
  private readonly sightLocal = new THREE.Vector3()
  private readonly sightWorld = new THREE.Vector3()
  private readonly sightNdc = new THREE.Vector3()
  private readonly sightBox = new THREE.Box3()
  private scopeFramePx = 180

  constructor() {
    this.group.rotation.order = 'YXZ'
    this.model = buildViewModelGroup('m4a1')
    this.adsAimOffset.copy(computeAdsAimOffset(this.model))
    this.group.add(this.model)
    this.group.visible = false
    void this.loadM4Tan()
  }

  get adsAmount(): number {
    return this.adsBlend
  }

  get scopeFrameSizePx(): number {
    return this.scopeFramePx
  }

  private replaceModel(next: THREE.Group): void {
    this.group.remove(this.model)
    disposeModel(this.model)
    this.model = next
    this.adsAimOffset.copy(computeAdsAimOffset(this.model))
    this.group.add(this.model)
  }

  private async loadM4Tan(): Promise<void> {
    let revealed = false
    const reveal = (glb?: THREE.Group) => {
      if (glb) this.replaceModel(glb)
      this.group.visible = true
      revealed = true
    }

    const timer = window.setTimeout(() => {
      if (!revealed) reveal()
    }, GLB_LOAD_TIMEOUT_MS)

    try {
      const glbModel = await preloadM4ViewModel()
      window.clearTimeout(timer)
      if (isViewmodelVisibleAtHip(glbModel)) {
        reveal(glbModel)
        return
      }
      console.warn('M4 Tan viewmodel failed hip-pose validation, keeping procedural fallback')
    } catch (err) {
      window.clearTimeout(timer)
      console.warn('M4 Tan viewmodel unavailable, using procedural fallback', err)
    }

    if (!revealed) reveal()
  }

  onFire(): void {
    this.kick = GAME.weapon.viewmodelKick
  }

  private lockSightToCrosshair(camera: THREE.PerspectiveCamera): void {
    if (!getSightLocalAimPoint(this.model, this.sightLocal)) return

    this.sightWorld.copy(this.sightLocal)
    this.model.localToWorld(this.sightWorld)
    this.sightNdc.copy(this.sightWorld).project(camera)

    const viewZ = this.sightWorld.clone().applyMatrix4(camera.matrixWorldInverse).z
    const dist = Math.max(0.08, -viewZ)
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * dist
    const halfW = halfH * camera.aspect
    const lock = this.adsBlend * this.adsBlend

    this.group.position.x -= this.sightNdc.x * halfW * lock
    this.group.position.y -= this.sightNdc.y * halfH * lock
  }

  private updateScopeFrameSize(camera: THREE.PerspectiveCamera, width: number, height: number): void {
    if (!getSightLocalBox(this.model, this.sightBox) || this.adsBlend < 0.08) return

    fillBoxCorners(this.sightBox, BOX_CORNERS)
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const corner of BOX_CORNERS) {
      this.model.localToWorld(corner)
      corner.project(camera)
      const px = (corner.x * 0.5 + 0.5) * width
      const py = (-corner.y * 0.5 + 0.5) * height
      minX = Math.min(minX, px)
      maxX = Math.max(maxX, px)
      minY = Math.min(minY, py)
      maxY = Math.max(maxY, py)
    }

    const size = Math.max(maxX - minX, maxY - minY) * 1.08
    this.scopeFramePx = THREE.MathUtils.clamp(size, 72, Math.min(width, height) * 0.55)
  }

  update(
    dt: number,
    ads: boolean,
    moveSpeed: number,
    lookDelta: THREE.Vector2,
    camera: THREE.PerspectiveCamera,
    viewportWidth: number,
    viewportHeight: number,
  ): void {
    this.kick = Math.max(0, this.kick - dt * GAME.weapon.viewmodelRecovery * 0.01)

    const targetAds = ads ? 1 : 0
    this.adsBlend = THREE.MathUtils.lerp(this.adsBlend, targetAds, 1 - Math.exp(-dt * 14))

    const swayScale = 1 - this.adsBlend * 0.88
    const kickScale = 1 - this.adsBlend * 0.65

    this.sway.x = THREE.MathUtils.lerp(this.sway.x, -lookDelta.x * 0.4 * swayScale, 1 - Math.exp(-dt * 12))
    this.sway.y = THREE.MathUtils.lerp(this.sway.y, lookDelta.y * 0.35 * swayScale, 1 - Math.exp(-dt * 12))

    const bob = moveSpeed > 0.2
      ? Math.sin(performance.now() * 0.012) * (moveSpeed > 5 ? 0.012 : 0.008) * (1 - this.adsBlend * 0.9)
      : 0

    this.tmpPos.lerpVectors(HIP_POS, ADS_POS, this.adsBlend)
    this.tmpEuler.x = THREE.MathUtils.lerp(HIP_ROT.x, ADS_ROT.x, this.adsBlend)
    this.tmpEuler.y = THREE.MathUtils.lerp(HIP_ROT.y, ADS_ROT.y, this.adsBlend)
    this.tmpEuler.z = THREE.MathUtils.lerp(HIP_ROT.z, ADS_ROT.z, this.adsBlend)

    this.group.position.set(
      this.tmpPos.x + this.sway.x,
      this.tmpPos.y + this.sway.y + bob,
      this.tmpPos.z - this.kick * 0.2 * kickScale,
    )
    this.group.rotation.set(
      this.tmpEuler.x + this.kick * kickScale,
      this.tmpEuler.y + this.sway.x * 0.35 * swayScale,
      this.tmpEuler.z + this.sway.y * 0.25 * swayScale,
    )

    this.tmpModelPos.copy(this.adsAimOffset).multiplyScalar(this.adsBlend)
    this.tmpModelPos.z -= this.kick * 0.05 * kickScale
    this.model.position.copy(this.tmpModelPos)

    this.group.updateMatrixWorld(true)
    if (this.adsBlend > 0.05) {
      this.lockSightToCrosshair(camera)
      this.group.updateMatrixWorld(true)
      this.updateScopeFrameSize(camera, viewportWidth, viewportHeight)
    }
  }
}
