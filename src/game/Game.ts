import * as THREE from 'three'
import { GAME } from '../config/gameConfig'
import { audio } from '../audio/AudioManager'
import { InputManager } from './input/InputManager'
import { TouchControls } from './input/TouchControls'
import { buildContainerYardMap, type Collider } from './maps/ContainerYardMap'
import { PostPipeline } from './rendering/PostPipeline'
import { PlayerController } from './player/PlayerController'
import { WeaponSystem, createMuzzleFlash } from './weapons/WeaponSystem'
import { WeaponViewModel } from './weapons/ViewModel'
import { RangeTarget, findRangeTarget } from './entities/RangeTarget'
import { spawnImpact, updateImpacts } from './effects/ImpactEffects'
import { HUD } from '../ui/HUD'
import { MainMenu, type MenuAction } from '../ui/MainMenu'

type Phase = 'menu' | 'play'

export class Game {
  private readonly host: HTMLElement
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly clock = new THREE.Clock()
  private readonly input = new InputManager()
  private readonly player = new PlayerController()
  private readonly weapon = new WeaponSystem()
  private readonly viewModel = new WeaponViewModel()
  private readonly hud: HUD
  private readonly menu: MainMenu
  private readonly touch: TouchControls
  private readonly muzzle: THREE.PointLight
  private readonly tracerGroup = new THREE.Group()
  private readonly overlay: HTMLElement
  private readonly menuCam = new THREE.PerspectiveCamera(60, 1, 0.1, 200)
  private post: PostPipeline | null = null

  private colliders: Collider[] = []
  private targets: RangeTarget[] = []
  private hitables: THREE.Object3D[] = []
  private phase: Phase = 'menu'
  private muzzleTimer = 0
  private running = false
  private kills = 0
  private spawnPoint = new THREE.Vector3(-17, 0, -13)
  private spawnYaw = Math.atan2(17 - -17, 13 - -13)
  private reloadWasActive = false

  constructor(host: HTMLElement) {
    this.host = host
    this.host.classList.add('game-host')
    this.host.innerHTML = ''

    this.overlay = document.createElement('div')
    this.overlay.id = 'overlay-ui'
    this.host.appendChild(this.overlay)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.3
    this.host.prepend(this.renderer.domElement)

    this.scene.background = new THREE.Color(0x9aacbc)
    this.scene.fog = new THREE.FogExp2(0x9aacbc, 0.018)
    this.scene.add(this.tracerGroup)

    this.muzzle = createMuzzleFlash()
    this.player.camera.add(this.muzzle)
    this.muzzle.position.set(0.18, -0.14, -0.45)
    this.player.camera.add(this.viewModel.group)
    this.scene.add(this.player.camera)

    this.hud = new HUD(this.overlay)
    this.menu = new MainMenu(this.overlay)
    this.touch = new TouchControls(this.input, this.overlay)

    this.hud.setVisible(false)
    this.touch.setVisible(false)
    this.menu.setVisible(true)

    this.menu.on((action) => this.handleMenu(action))
    const resumeAudio = () => void audio.resume()
    window.addEventListener('touchstart', resumeAudio, { once: true })
    window.addEventListener('click', resumeAudio, { once: true })
    this.renderer.domElement.addEventListener('click', () => {
      if (this.phase === 'play' && !document.pointerLockElement) {
        void this.renderer.domElement.requestPointerLock()
      }
    })
    window.addEventListener('resize', () => this.onResize())
    this.onResize()

    this.buildWorld()
    this.running = true
    this.loop()
  }

  private buildWorld(): void {
    const map = buildContainerYardMap()
    this.scene.add(map.group)
    this.colliders = map.colliders
    this.spawnPoint.copy(map.spawns[0])
    this.spawnYaw = Math.atan2(
      map.spawns[1].x - map.spawns[0].x,
      map.spawns[1].z - map.spawns[0].z,
    )

    for (const anchor of map.targetAnchors) {
      const t = new RangeTarget(anchor)
      this.targets.push(t)
      this.scene.add(t.group)
      this.hitables.push(...t.hitMeshes)
    }

    this.player.spawn(this.spawnPoint, this.spawnYaw)
    this.post = new PostPipeline(
      this.renderer,
      this.scene,
      this.player.camera,
      window.innerWidth,
      window.innerHeight,
    )
  }

  private handleMenu(action: MenuAction): void {
    if (action === 'play') {
      this.enterPlay()
      return
    }
    this.menu.showToast('Coming soon — we are polishing core gameplay first.')
  }

  private enterPlay(): void {
    this.phase = 'play'
    this.menu.setVisible(false)
    this.hud.setVisible(true)
    this.touch.setVisible(true)
    this.hud.setMode('CONTAINER YARD')
    this.weapon.reset()
    this.kills = 0
    this.reloadWasActive = false
    this.player.spawn(this.spawnPoint, this.spawnYaw)
    this.hud.setHealth(this.player.health)
    this.hud.pushFeed('Container yard live — Shipment-style layout')
    void audio.resume()
  }

  private onResize(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h)
    this.player.resize(w, h)
    this.menuCam.aspect = w / Math.max(1, h)
    this.menuCam.updateProjectionMatrix()
    this.post?.resize(w, h)
  }

  private loop = (): void => {
    if (!this.running) return
    requestAnimationFrame(this.loop)
    const dt = Math.min(0.05, this.clock.getDelta())

    if (this.phase === 'play') {
      this.updatePlay(dt)
      updateImpacts(dt)
      if (this.muzzleTimer > 0) {
        this.muzzleTimer -= dt
        this.muzzle.intensity = this.muzzleTimer > 0 ? 2.8 : 0
      }
      this.post?.render()
    } else {
      const t = this.clock.elapsedTime
      this.menuCam.position.set(Math.sin(t * 0.1) * 22, 8.5, Math.cos(t * 0.1) * 22)
      this.menuCam.lookAt(0, 2, 0)
      this.renderer.render(this.scene, this.menuCam)
    }
  }

  private updatePlay(dt: number): void {
    const input = this.input.sample(dt)
    const ads = input.ads
    const sprinting = input.sprint

    this.player.update(dt, input, this.colliders, ads, sprinting)
    this.weapon.update(dt)

    audio.tickFootsteps(dt, this.player.moveSpeed, sprinting, this.player.grounded)

    if (input.reload) this.weapon.tryReload()
    if (this.weapon.reloading && !this.reloadWasActive) audio.playReload()
    this.reloadWasActive = this.weapon.reloading

    if (input.fire) {
      const shot = this.weapon.tryFire(this.player, ads, this.hitables)
      if (shot) {
        this.muzzleTimer = 0.055
        this.viewModel.onFire()
        audio.playGunshot(ads)
        this.spawnTracer(shot.origin, shot.direction, shot.hitPoint)
        if (shot.hitPoint) spawnImpact(this.scene, shot.hitPoint, shot.hitNormal ?? undefined)
        if (shot.hitObject) {
          const target = findRangeTarget(shot.hitObject)
          if (target) {
            const killed = target.applyDamage(GAME.weapon.damage)
            audio.playHit()
            this.hud.flashHitmarker(killed)
            if (killed) {
              this.kills += 1
              this.hud.pushFeed(`Target down · ${this.kills}`)
            }
          }
        }
      }
    }

    this.viewModel.update(
      dt,
      ads,
      this.player.moveSpeed,
      new THREE.Vector2(this.player.lookDeltaScratch.x, this.player.lookDeltaScratch.y),
    )

    for (const t of this.targets) t.update(dt)

    this.hud.setAds(ads)
    this.hud.setAmmo(this.weapon.ammo, this.weapon.reserve, this.weapon.reloading)
    this.hud.setHealth(this.player.health)
    this.hud.setSprinting(sprinting && this.player.moveSpeed > GAME.player.walkSpeed)
  }

  private spawnTracer(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    hit: THREE.Vector3 | null,
  ): void {
    const end = hit ?? origin.clone().addScaledVector(dir, 50)
    const geo = new THREE.BufferGeometry().setFromPoints([origin.clone(), end])
    const mat = new THREE.LineBasicMaterial({
      color: 0xffe2a8,
      transparent: true,
      opacity: 0.9,
    })
    const line = new THREE.Line(geo, mat)
    this.tracerGroup.add(line)
    window.setTimeout(() => {
      this.tracerGroup.remove(line)
      geo.dispose()
      mat.dispose()
    }, 45)
  }
}
