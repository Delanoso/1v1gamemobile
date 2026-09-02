import * as THREE from 'three'
import {
  FPS_OPERATOR_ADS,
  FPS_OPERATOR_HIP,
  preloadFpsOperatorBody,
} from '../../assets/operator/OperatorAsset'

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

    this.tmpPos.lerpVectors(FPS_OPERATOR_HIP.position, FPS_OPERATOR_ADS.position, this.adsBlend)
    this.tmpEuler.x = THREE.MathUtils.lerp(FPS_OPERATOR_HIP.rotation.x, FPS_OPERATOR_ADS.rotation.x, this.adsBlend)
    this.tmpEuler.y = THREE.MathUtils.lerp(FPS_OPERATOR_HIP.rotation.y, FPS_OPERATOR_ADS.rotation.y, this.adsBlend)
    this.tmpEuler.z = THREE.MathUtils.lerp(FPS_OPERATOR_HIP.rotation.z, FPS_OPERATOR_ADS.rotation.z, this.adsBlend)

    this.group.position.set(
      this.tmpPos.x + this.sway.x * posSway,
      this.tmpPos.y + this.sway.y * posSway + bob,
      this.tmpPos.z - kick * 0.12 * kickScale,
    )
    this.group.rotation.set(
      this.tmpEuler.x + kick * 0.35 * kickScale * rotSway,
      this.tmpEuler.y,
      this.tmpEuler.z + this.sway.y * 0.15 * rotSway,
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
