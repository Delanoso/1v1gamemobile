import * as THREE from 'three'
import { GAME } from '../../config/gameConfig'

export class RangeTarget {
  readonly group: THREE.Group
  readonly hitMeshes: THREE.Object3D[] = []
  health: number
  readonly maxHealth: number
  private plate: THREE.Mesh
  private readonly baseColor: THREE.Color
  private hitFlash = 0
  private readonly respawnAt: THREE.Vector3
  private dead = false
  private respawnTimer = 0

  constructor(position: THREE.Vector3, maxHealth = GAME.combat.rangeTargetHealth) {
    this.maxHealth = maxHealth
    this.health = maxHealth
    this.respawnAt = position.clone()
    this.group = new THREE.Group()
    this.group.position.copy(position)

    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x33383d, roughness: 0.8 }),
    )
    stand.position.y = 0.6
    stand.castShadow = true
    this.group.add(stand)

    this.baseColor = new THREE.Color(0xff7a3c)
    this.plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.1, 0.12),
      new THREE.MeshStandardMaterial({
        color: this.baseColor.clone(),
        emissive: new THREE.Color(0x4a1808),
        emissiveIntensity: 0.55,
        metalness: 0.25,
        roughness: 0.4,
      }),
    )
    this.plate.position.y = 1.55
    this.plate.castShadow = true
    this.plate.userData.rangeTarget = this
    this.group.add(this.plate)
    this.hitMeshes.push(this.plate)
  }

  applyDamage(amount: number): boolean {
    if (this.dead) return false
    this.health = Math.max(0, this.health - amount)
    this.hitFlash = 0.12
    if (this.health <= 0) {
      this.dead = true
      this.respawnTimer = 2.5
      this.group.visible = false
      return true
    }
    return false
  }

  update(dt: number): void {
    if (this.dead) {
      this.respawnTimer -= dt
      if (this.respawnTimer <= 0) {
        this.dead = false
        this.health = this.maxHealth
        this.group.visible = true
        this.group.position.copy(this.respawnAt)
      }
      return
    }

    if (this.hitFlash > 0) {
      this.hitFlash -= dt
      const mat = this.plate.material as THREE.MeshStandardMaterial
      mat.color.copy(this.baseColor).lerp(new THREE.Color(0xffffff), Math.min(1, this.hitFlash * 8))
    }
  }
}

export function findRangeTarget(obj: THREE.Object3D | null): RangeTarget | null {
  let cur: THREE.Object3D | null = obj
  while (cur) {
    if (cur.userData.rangeTarget) return cur.userData.rangeTarget as RangeTarget
    cur = cur.parent
  }
  return null
}
