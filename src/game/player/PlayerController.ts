import * as THREE from 'three'
import { GAME } from '../../config/gameConfig'
import type { FrameInput } from '../input/InputManager'
import {
  groundHeightAt,
  resolveCapsuleColliders,
  type Collider,
} from '../maps/WarehouseMap'

export class PlayerController {
  readonly camera: THREE.PerspectiveCamera
  readonly position = new THREE.Vector3()
  yaw = 0
  pitch = 0
  velocityY = 0
  grounded = true
  crouching = false
  health = GAME.combat.maxHealth

  private crouchToggleLatch = false
  private jumpLatch = false
  private readonly lookScratch = new THREE.Euler(0, 0, 0, 'YXZ')

  constructor() {
    this.camera = new THREE.PerspectiveCamera(GAME.weapon.hipFov, 1, 0.05, 200)
  }

  spawn(at: THREE.Vector3, yaw = 0): void {
    this.position.copy(at)
    this.yaw = yaw
    this.pitch = 0
    this.velocityY = 0
    this.health = GAME.combat.maxHealth
    this.crouching = false
    this.syncCamera()
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / Math.max(1, height)
    this.camera.updateProjectionMatrix()
  }

  update(dt: number, input: FrameInput, colliders: Collider[], ads: boolean): void {
    const p = GAME.player

    // lookDelta is already scaled in InputManager (radians-ish)
    this.yaw -= input.lookDelta.x
    this.pitch -= input.lookDelta.y
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch))

    if (input.crouch && !this.crouchToggleLatch) {
      this.crouching = !this.crouching
      this.crouchToggleLatch = true
    } else if (!input.crouch) {
      this.crouchToggleLatch = false
    }

    const speed = this.crouching
      ? p.crouchSpeed
      : input.sprint && input.move.y > 0.2
        ? p.sprintSpeed
        : p.walkSpeed

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))
    const wish = new THREE.Vector3()
    wish.addScaledVector(forward, input.move.y)
    wish.addScaledVector(right, input.move.x)
    if (wish.lengthSq() > 1) wish.normalize()

    this.position.x += wish.x * speed * dt
    this.position.z += wish.z * speed * dt

    const eye = this.crouching ? p.crouchEyeHeight : p.eyeHeight
    resolveCapsuleColliders(this.position, p.radius, eye, colliders)

    const ground = groundHeightAt(
      this.position.x,
      this.position.z,
      colliders,
      this.position.y,
    )

    if (this.grounded || this.position.y <= ground + 0.05) {
      this.position.y = ground
      this.velocityY = 0
      this.grounded = true
      if (input.jump && !this.jumpLatch && !this.crouching) {
        this.velocityY = p.jumpSpeed
        this.grounded = false
        this.jumpLatch = true
      }
    } else {
      this.velocityY -= p.gravity * dt
      this.position.y += this.velocityY * dt
      if (this.position.y <= ground) {
        this.position.y = ground
        this.velocityY = 0
        this.grounded = true
      }
    }
    if (!input.jump) this.jumpLatch = false

    const targetFov = ads ? GAME.weapon.adsFov : GAME.weapon.hipFov
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 12)
    this.camera.updateProjectionMatrix()
    this.syncCamera()
  }

  applyRecoil(pitch: number, yaw: number): void {
    this.pitch += pitch
    this.yaw += yaw
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch))
    this.syncCamera()
  }

  private syncCamera(): void {
    const eye = this.crouching ? GAME.player.crouchEyeHeight : GAME.player.eyeHeight
    this.camera.position.set(this.position.x, this.position.y + eye, this.position.z)
    this.lookScratch.set(this.pitch, this.yaw, 0)
    this.camera.quaternion.setFromEuler(this.lookScratch)
  }
}
