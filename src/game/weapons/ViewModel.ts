import * as THREE from 'three'
import { GAME } from '../../config/gameConfig'
import { buildViewModelGroup, isViewmodelVisible, preloadM4ViewModel } from '../../assets/weapon/WeaponAsset'

const HIP_POS = new THREE.Vector3(0.26, -0.23, -0.04)
const ADS_POS = new THREE.Vector3(0.0, -0.08, -0.1)
const HIP_ROT = new THREE.Euler(0.04, 0.08, 0, 'YXZ')
const ADS_ROT = new THREE.Euler(0.02, 0.0, 0, 'YXZ')

/** First-person weapon mesh with recoil animation. */
export class WeaponViewModel {
  readonly group = new THREE.Group()
  private model: THREE.Group
  private adsBlend = 0
  private kick = 0
  private sway = new THREE.Vector2()
  private readonly tmpPos = new THREE.Vector3()
  private readonly tmpEuler = new THREE.Euler(0, 0, 0, 'YXZ')

  constructor() {
    this.group.rotation.order = 'YXZ'
    this.model = buildViewModelGroup('m4a1')
    this.group.add(this.model)
    void this.loadM4Tan()
  }

  private async loadM4Tan(): Promise<void> {
    try {
      const glbModel = await preloadM4ViewModel()
      if (!isViewmodelVisible(glbModel)) {
        console.warn('M4 Tan viewmodel bbox invalid, keeping procedural fallback')
        return
      }
      this.group.remove(this.model)
      this.model = glbModel
      this.group.add(this.model)
    } catch (err) {
      console.warn('M4 Tan viewmodel unavailable, using procedural fallback', err)
    }
  }

  onFire(): void {
    this.kick = GAME.weapon.viewmodelKick
  }

  update(dt: number, ads: boolean, moveSpeed: number, lookDelta: THREE.Vector2): void {
    this.kick = Math.max(0, this.kick - dt * GAME.weapon.viewmodelRecovery * 0.01)

    this.sway.x = THREE.MathUtils.lerp(this.sway.x, -lookDelta.x * 0.4, 1 - Math.exp(-dt * 12))
    this.sway.y = THREE.MathUtils.lerp(this.sway.y, lookDelta.y * 0.35, 1 - Math.exp(-dt * 12))

    const bob = moveSpeed > 0.2 ? Math.sin(performance.now() * 0.012) * (moveSpeed > 5 ? 0.012 : 0.008) : 0

    const targetAds = ads ? 1 : 0
    this.adsBlend = THREE.MathUtils.lerp(this.adsBlend, targetAds, 1 - Math.exp(-dt * 14))

    this.tmpPos.lerpVectors(HIP_POS, ADS_POS, this.adsBlend)
    this.tmpEuler.x = THREE.MathUtils.lerp(HIP_ROT.x, ADS_ROT.x, this.adsBlend)
    this.tmpEuler.y = THREE.MathUtils.lerp(HIP_ROT.y, ADS_ROT.y, this.adsBlend)
    this.tmpEuler.z = THREE.MathUtils.lerp(HIP_ROT.z, ADS_ROT.z, this.adsBlend)

    this.group.position.set(
      this.tmpPos.x + this.sway.x,
      this.tmpPos.y + this.sway.y + bob,
      this.tmpPos.z - this.kick * 0.2,
    )
    this.group.rotation.set(
      this.tmpEuler.x + this.kick,
      this.tmpEuler.y + this.sway.x * 0.35,
      this.tmpEuler.z + this.sway.y * 0.25,
    )
    this.model.position.set(0, 0, -this.kick * 0.05)
  }
}
