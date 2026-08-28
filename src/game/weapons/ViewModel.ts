import * as THREE from 'three'
import { GAME } from '../../config/gameConfig'

/** Simple first-person rifle mesh with recoil animation. */
export class WeaponViewModel {
  readonly group = new THREE.Group()
  private readonly body: THREE.Mesh
  private readonly barrel: THREE.Mesh
  private kick = 0
  private sway = new THREE.Vector2()

  constructor() {
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a2f34, metalness: 0.55, roughness: 0.35 })
    const rail = new THREE.MeshStandardMaterial({ color: 0x1a1e22, metalness: 0.7, roughness: 0.25 })

    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.42), dark)
    this.body.position.set(0.14, -0.16, -0.38)
    this.group.add(this.body)

    this.barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 8), rail)
    this.barrel.rotation.x = Math.PI / 2
    this.barrel.position.set(0.14, -0.13, -0.62)
    this.group.add(this.barrel)

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.07), dark)
    grip.position.set(0.14, -0.24, -0.3)
    grip.rotation.x = 0.35
    this.group.add(grip)

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.08), dark)
    mag.position.set(0.14, -0.26, -0.36)
    this.group.add(mag)

    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.06), rail)
    sight.position.set(0.14, -0.1, -0.42)
    this.group.add(sight)

    this.group.position.set(0, 0, 0)
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
    this.barrel.position.z = -0.62 - this.kick * 0.4
  }
}
