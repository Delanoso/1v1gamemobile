import * as THREE from 'three'
import { GAME } from '../../config/gameConfig'
import type { FrameInput } from '../input/InputManager'
import {
  groundHeightAt,
  resolveCapsuleCollidersRepeated,
  type Collider,
} from '../maps/collision'

export class PlayerController {
  readonly camera: THREE.PerspectiveCamera
  readonly position = new THREE.Vector3()
  readonly lookDeltaScratch = new THREE.Vector2()
  yaw = 0
  pitch = 0
  recoilPitch = 0
  recoilYaw = 0
  velocityY = 0
  moveSpeed = 0
  grounded = true
  crouching = false
  health = GAME.combat.maxHealth
  cameraKick = 0

  private planarVel = new THREE.Vector2()
  private crouchToggleLatch = false
  private jumpLatch = false
  private bobPhase = 0
  private readonly lookScratch = new THREE.Euler(0, 0, 0, 'YXZ')

  constructor() {
    this.camera = new THREE.PerspectiveCamera(GAME.weapon.hipFov, 1, 0.05, 200)
  }

  spawn(at: THREE.Vector3, yaw = 0, colliders?: Collider[]): void {
    this.position.copy(at)
    this.yaw = yaw
    this.pitch = 0
    this.recoilPitch = 0
    this.recoilYaw = 0
    this.velocityY = 0
    this.planarVel.set(0, 0)
    this.health = GAME.combat.maxHealth
    this.crouching = false
    this.bobPhase = 0
    this.cameraKick = 0
    if (colliders?.length) {
      resolveCapsuleCollidersRepeated(
        this.position,
        GAME.player.radius,
        GAME.player.eyeHeight,
        colliders,
        8,
      )
    }
    this.syncCamera()
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / Math.max(1, height)
    this.camera.updateProjectionMatrix()
  }

  update(dt: number, input: FrameInput, colliders: Collider[], ads: boolean, sprinting: boolean): void {
    const p = GAME.player

    this.lookDeltaScratch.set(input.lookDelta.x, input.lookDelta.y)
    this.yaw -= input.lookDelta.x
    this.pitch -= input.lookDelta.y
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch))

    this.recoilPitch = THREE.MathUtils.lerp(
      this.recoilPitch,
      0,
      1 - Math.exp(-dt * GAME.weapon.recoilRecovery),
    )
    this.recoilYaw = THREE.MathUtils.lerp(this.recoilYaw, 0, 1 - Math.exp(-dt * GAME.weapon.recoilRecovery))
    this.cameraKick = Math.max(0, this.cameraKick - dt * 18)

    if (input.crouch && !this.crouchToggleLatch) {
      this.crouching = !this.crouching
      this.crouchToggleLatch = true
    } else if (!input.crouch) {
      this.crouchToggleLatch = false
    }

    const sprintingForward = sprinting && input.move.y > 0.2 && !this.crouching && !ads
    const targetSpeed = this.crouching
      ? p.crouchSpeed
      : sprintingForward
        ? p.sprintSpeed
        : p.walkSpeed
    const moveScale = ads ? p.adsMoveMultiplier : 1

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))
    const wish = new THREE.Vector2()
    wish.x = forward.x * input.move.y + right.x * input.move.x
    wish.y = forward.z * input.move.y + right.z * input.move.x
    if (wish.lengthSq() > 1) wish.normalize()
    wish.multiplyScalar(targetSpeed * moveScale)

    const accel = wish.lengthSq() > 0.01 ? p.accel : p.decel
    this.planarVel.x = THREE.MathUtils.lerp(this.planarVel.x, wish.x, Math.min(1, accel * dt))
    this.planarVel.y = THREE.MathUtils.lerp(this.planarVel.y, wish.y, Math.min(1, accel * dt))

    const eye = this.crouching ? p.crouchEyeHeight : p.eyeHeight
    const dx = this.planarVel.x * dt
    const dz = this.planarVel.y * dt

    this.position.x += dx
    resolveCapsuleCollidersRepeated(this.position, p.radius, eye, colliders, 6)
    this.position.z += dz
    resolveCapsuleCollidersRepeated(this.position, p.radius, eye, colliders, 6)

    this.moveSpeed = Math.hypot(this.planarVel.x, this.planarVel.y)

    const ground = groundHeightAt(this.position.x, this.position.z, colliders, this.position.y)

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

    const bobAmp = sprintingForward ? p.headBobSprint : p.headBobWalk
    if (this.grounded && this.moveSpeed > 0.5) {
      this.bobPhase += dt * (sprintingForward ? 11 : 8.5)
    } else {
      this.bobPhase = THREE.MathUtils.lerp(this.bobPhase, 0, dt * 6)
    }
    const bobY = Math.sin(this.bobPhase) * bobAmp * Math.min(1, this.moveSpeed / p.walkSpeed)
    const bobX = Math.cos(this.bobPhase * 0.5) * bobAmp * 0.35

    let targetFov = ads ? GAME.weapon.adsFov : GAME.weapon.hipFov
    if (sprintingForward && !ads) targetFov += p.sprintFovBoost
    const fovSpeed = ads ? GAME.weapon.adsInSpeed : GAME.weapon.adsOutSpeed
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * fovSpeed)
    this.camera.updateProjectionMatrix()
    this.syncCamera(bobX, bobY)
  }

  applyRecoil(pitch: number, yaw: number, kick = 0): void {
    this.recoilPitch += pitch
    this.recoilYaw += yaw
    this.cameraKick = Math.min(0.02, this.cameraKick + kick)
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch + pitch * 0.35))
    this.yaw += yaw * 0.35
  }

  private syncCamera(bobX = 0, bobY = 0): void {
    const eye = this.crouching ? GAME.player.crouchEyeHeight : GAME.player.eyeHeight
    const pitch = this.pitch + this.recoilPitch
    const yaw = this.yaw + this.recoilYaw

    this.camera.position.set(
      this.position.x + bobX,
      this.position.y + eye + bobY - this.cameraKick,
      this.position.z,
    )
    this.lookScratch.set(pitch, yaw, 0)
    this.camera.quaternion.setFromEuler(this.lookScratch)
  }
}
