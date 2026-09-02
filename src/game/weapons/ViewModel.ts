import * as THREE from 'three'
import { GAME } from '../../config/gameConfig'
import {
  VIEWMODEL_ADS,
  VIEWMODEL_HIP,
  buildViewModelGroup,
  computeAdsAimOffset,
  isViewmodelVisibleAtHip,
  preloadM4ViewModel,
} from '../../assets/weapon/WeaponAsset'
import { deviceProfile } from '../../utils/deviceProfile'

const HIP_POS = VIEWMODEL_HIP.position
const HIP_ROT = VIEWMODEL_HIP.rotation
const ADS_POS = VIEWMODEL_ADS.position
const ADS_ROT = VIEWMODEL_ADS.rotation
const GLB_LOAD_TIMEOUT_MS = 8000
const DEFAULT_SCOPE_FRAME_PX = 118

function disposeModel(root: THREE.Object3D): void {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry?.dispose()
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const mat of mats) mat.dispose()
    }
  })
}

/** First-person weapon mesh with recoil animation. */
export class WeaponViewModel {
  readonly group = new THREE.Group()
  private model: THREE.Group
  private adsAimOffset = new THREE.Vector3()
  private adsBlend = 0
  private kick = 0
  private sway = new THREE.Vector2()
  private scopeFramePx = DEFAULT_SCOPE_FRAME_PX
  private readonly tmpPos = new THREE.Vector3()
  private readonly tmpEuler = new THREE.Euler(0, 0, 0, 'YXZ')
  private readonly tmpModelPos = new THREE.Vector3()

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
      if (deviceProfile.isMobile || isViewmodelVisibleAtHip(glbModel)) {
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

  update(dt: number, ads: boolean, moveSpeed: number, lookDelta: THREE.Vector2): void {
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

    const adsLock = THREE.MathUtils.smoothstep(this.adsBlend, 0.75, 1)
    const posSway = 1 - adsLock
    const rotSway = 1 - adsLock

    this.tmpPos.lerpVectors(HIP_POS, ADS_POS, this.adsBlend)
    this.tmpEuler.x = THREE.MathUtils.lerp(HIP_ROT.x, ADS_ROT.x, this.adsBlend)
    this.tmpEuler.y = THREE.MathUtils.lerp(HIP_ROT.y, ADS_ROT.y, this.adsBlend)
    this.tmpEuler.z = THREE.MathUtils.lerp(HIP_ROT.z, ADS_ROT.z, this.adsBlend)

    this.group.position.set(
      this.tmpPos.x + this.sway.x * posSway,
      this.tmpPos.y + this.sway.y * posSway + bob,
      this.tmpPos.z - this.kick * 0.2 * kickScale,
    )
    this.group.rotation.set(
      this.tmpEuler.x + this.kick * kickScale * rotSway,
      this.tmpEuler.y + this.sway.x * 0.35 * rotSway,
      this.tmpEuler.z + this.sway.y * 0.25 * rotSway,
    )

    // Shift rig so holo center sits on group origin → crosshair when ADS_POS is (0,0,z).
    this.tmpModelPos.copy(this.adsAimOffset).multiplyScalar(this.adsBlend)
    this.tmpModelPos.z -= this.kick * 0.05 * kickScale
    this.model.position.copy(this.tmpModelPos)
  }
}
