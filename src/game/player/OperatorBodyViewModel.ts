import * as THREE from 'three'
import { FPS_OPERATOR_HOLD, preloadFpsOperatorBody } from '../../assets/operator/OperatorAsset'
import { VIEWMODEL_ADS, VIEWMODEL_HIP } from '../../assets/weapon/WeaponAsset'

const HIP_POS = VIEWMODEL_HIP.position
const HIP_ROT = VIEWMODEL_HIP.rotation
const ADS_POS = VIEWMODEL_ADS.position
const ADS_ROT = VIEWMODEL_ADS.rotation

/** Federation torso/arms rendered behind the FPS weapon. */
export class OperatorBodyViewModel {
  readonly group = new THREE.Group()
  private body: THREE.Group | null = null
  private visible = false
  private adsBlend = 0
  private sway = new THREE.Vector2()
  private readonly tmpPos = new THREE.Vector3()
  private readonly tmpEuler = new THREE.Euler(0, 0, 0, 'YXZ')

  constructor() {
    this.group.rotation.order = 'YXZ'
    this.group.visible = false
    void this.load()
  }

  setVisible(show: boolean): void {
    this.visible = show
    this.group.visible = show && this.body !== null
  }

  update(
    dt: number,
    ads: boolean,
    moveSpeed: number,
    lookDelta: THREE.Vector2,
    kick: number,
  ): void {
    if (!this.body) return

    const targetAds = ads ? 1 : 0
    this.adsBlend = THREE.MathUtils.lerp(this.adsBlend, targetAds, 1 - Math.exp(-dt * 14))

    const swayScale = 1 - this.adsBlend * 0.85
    this.sway.x = THREE.MathUtils.lerp(this.sway.x, -lookDelta.x * 0.28 * swayScale, 1 - Math.exp(-dt * 12))
    this.sway.y = THREE.MathUtils.lerp(this.sway.y, lookDelta.y * 0.22 * swayScale, 1 - Math.exp(-dt * 12))

    const bob =
      moveSpeed > 0.2
        ? Math.sin(performance.now() * 0.012) * (moveSpeed > 5 ? 0.01 : 0.006) * (1 - this.adsBlend * 0.9)
        : 0

    const adsLock = THREE.MathUtils.smoothstep(this.adsBlend, 0.75, 1)
    const posSway = 1 - adsLock
    const rotSway = 1 - adsLock
    const kickScale = 1 - this.adsBlend * 0.6

    this.tmpPos.lerpVectors(HIP_POS, ADS_POS, this.adsBlend)
    this.tmpEuler.x = THREE.MathUtils.lerp(HIP_ROT.x, ADS_ROT.x, this.adsBlend)
    this.tmpEuler.y = THREE.MathUtils.lerp(HIP_ROT.y, ADS_ROT.y, this.adsBlend)
    this.tmpEuler.z = THREE.MathUtils.lerp(HIP_ROT.z, ADS_ROT.z, this.adsBlend)

    const hold = FPS_OPERATOR_HOLD
    this.group.position.set(
      hold.position.x + this.tmpPos.x * 0.35 + this.sway.x * posSway,
      hold.position.y + this.tmpPos.y * 0.25 + this.sway.y * posSway + bob,
      hold.position.z + this.tmpPos.z * 0.4 - kick * 0.12 * kickScale,
    )
    this.group.rotation.set(
      hold.rotation.x + this.tmpEuler.x * 0.45 + kick * 0.35 * kickScale * rotSway,
      hold.rotation.y + this.tmpEuler.y * 0.2,
      hold.rotation.z + this.tmpEuler.z * 0.45 + this.sway.y * 0.15 * rotSway,
    )
  }

  private async load(): Promise<void> {
    try {
      const body = await preloadFpsOperatorBody()
      this.body = body
      this.group.add(body)
      this.group.visible = this.visible
    } catch (err) {
      console.warn('FPS operator body unavailable', err)
    }
  }
}
