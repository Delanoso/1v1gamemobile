import * as THREE from 'three'
import { GAME } from '../../config/gameConfig'
import { buildImportedViewModel, buildViewModelGroup } from '../../assets/weapon/WeaponAsset'

/** First-person weapon mesh with recoil animation. */
export class WeaponViewModel {
  readonly group = new THREE.Group()
  private model: THREE.Group
  private modelBaseZ = -0.08
  private kick = 0
  private sway = new THREE.Vector2()

  constructor() {
    this.model = buildViewModelGroup('m4a1')
    this.group.add(this.model)
    void this.loadM4Tan()
  }

  private async loadM4Tan(): Promise<void> {
    try {
      const glbModel = await buildImportedViewModel()
      this.group.remove(this.model)
      this.model = glbModel
      this.modelBaseZ = this.model.position.z
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

    const adsOffset = ads ? -0.06 : 0
    const adsTilt = ads ? 0.04 : 0

    this.group.position.set(
      0.14 + this.sway.x + adsOffset,
      -0.16 + this.sway.y + bob,
      -0.1,
    )
    this.group.rotation.set(
      this.kick + adsTilt,
      this.sway.x * 0.5,
      this.sway.y * 0.3,
    )
    this.model.position.z = this.modelBaseZ - this.kick * 0.35
  }
}
