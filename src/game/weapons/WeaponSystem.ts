import * as THREE from 'three'
import { GAME } from '../../config/gameConfig'
import type { PlayerController } from '../player/PlayerController'

export interface ShotResult {
  origin: THREE.Vector3
  direction: THREE.Vector3
  hitPoint: THREE.Vector3 | null
  hitObject: THREE.Object3D | null
}

export class WeaponSystem {
  ammo: number
  reserve: number
  reloading = false
  private reloadTimer = 0
  private cooldown = 0
  private readonly raycaster = new THREE.Raycaster()

  constructor() {
    this.ammo = GAME.weapon.magSize
    this.reserve = GAME.weapon.reserve
  }

  reset(): void {
    this.ammo = GAME.weapon.magSize
    this.reserve = GAME.weapon.reserve
    this.reloading = false
    this.reloadTimer = 0
    this.cooldown = 0
  }

  update(dt: number): void {
    if (this.cooldown > 0) this.cooldown -= dt
    if (this.reloading) {
      this.reloadTimer -= dt
      if (this.reloadTimer <= 0) {
        const need = GAME.weapon.magSize - this.ammo
        const take = Math.min(need, this.reserve)
        this.ammo += take
        this.reserve -= take
        this.reloading = false
      }
    }
  }

  tryReload(): void {
    if (this.reloading) return
    if (this.ammo >= GAME.weapon.magSize) return
    if (this.reserve <= 0) return
    this.reloading = true
    this.reloadTimer = GAME.weapon.reloadSeconds
  }

  tryFire(
    player: PlayerController,
    ads: boolean,
    sceneTargets: THREE.Object3D[],
  ): ShotResult | null {
    if (this.reloading || this.cooldown > 0) return null
    if (this.ammo <= 0) {
      this.tryReload()
      return null
    }

    this.ammo -= 1
    this.cooldown = 60 / GAME.weapon.rpm

    const bloom = ads ? GAME.weapon.bloomAds : GAME.weapon.bloomHip
    const origin = player.camera.getWorldPosition(new THREE.Vector3())
    const direction = new THREE.Vector3()
    player.camera.getWorldDirection(direction)
    direction.x += (Math.random() - 0.5) * bloom
    direction.y += (Math.random() - 0.5) * bloom
    direction.z += (Math.random() - 0.5) * bloom
    direction.normalize()

    const yawKick = (Math.random() - 0.5) * GAME.weapon.recoilYaw
    player.applyRecoil(GAME.weapon.recoilPitch, yawKick)

    this.raycaster.set(origin, direction)
    this.raycaster.far = 120
    const hits = this.raycaster.intersectObjects(sceneTargets, true)
    const hit = hits[0]

    return {
      origin,
      direction,
      hitPoint: hit ? hit.point.clone() : null,
      hitObject: hit ? hit.object : null,
    }
  }
}

export function createMuzzleFlash(): THREE.PointLight {
  const light = new THREE.PointLight(0xffcc88, 0, 8)
  return light
}
