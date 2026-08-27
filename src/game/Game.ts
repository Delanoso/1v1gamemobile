import * as THREE from 'three'
import { GAME } from '../config/gameConfig'
import { InputManager } from './input/InputManager'
import { TouchControls } from './input/TouchControls'
import { buildWarehouseMap, type Collider } from './maps/WarehouseMap'
import { PlayerController } from './player/PlayerController'
import { WeaponSystem, createMuzzleFlash } from './weapons/WeaponSystem'
import { RangeTarget, findRangeTarget } from './entities/RangeTarget'
import { HUD } from '../ui/HUD'
import { MainMenu, type MenuAction } from '../ui/MainMenu'

type Phase = 'menu' | 'range'

export class Game {
  private readonly host: HTMLElement
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly clock = new THREE.Clock()
  private readonly input = new InputManager()
  private readonly player = new PlayerController()
  private readonly weapon = new WeaponSystem()
  private readonly hud: HUD
  private readonly menu: MainMenu
  private readonly touch: TouchControls
  private readonly muzzle: THREE.PointLight
  private readonly tracerGroup = new THREE.Group()
  private readonly overlay: HTMLElement
  private readonly menuCam = new THREE.PerspectiveCamera(60, 1, 0.1, 200)

  private colliders: Collider[] = []
  private targets: RangeTarget[] = []
  private hitables: THREE.Object3D[] = []
  private phase: Phase = 'menu'
  private muzzleTimer = 0
  private running = false
  private kills = 0
  private spawnPoint = new THREE.Vector3(-14, 0, -10)
  private spawnYaw = Math.atan2(-14, -10)

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
    this.renderer.toneMappingExposure = 1.25
    this.host.prepend(this.renderer.domElement)

    this.scene.background = new THREE.Color(0x1a222a)
    this.scene.fog = new THREE.Fog(0x1a222a, 40, 90)
    this.scene.add(this.tracerGroup)

    this.muzzle = createMuzzleFlash()
    this.player.camera.add(this.muzzle)
    this.muzzle.position.set(0.18, -0.14, -0.45)
    this.scene.add(this.player.camera)

    this.hud = new HUD(this.overlay)
    this.menu = new MainMenu(this.overlay)
    this.touch = new TouchControls(this.input, this.overlay)

    this.hud.setVisible(false)
    this.touch.setVisible(false)
    this.menu.setVisible(true)

    this.menu.on((action) => this.handleMenu(action))
    this.renderer.domElement.addEventListener('click', () => {
      if (this.phase === 'range' && !document.pointerLockElement) {
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
    const map = buildWarehouseMap()
    this.scene.add(map.group)
    this.colliders = map.colliders
    this.spawnPoint.copy(map.spawns[0])

    for (const anchor of map.targetAnchors) {
      const t = new RangeTarget(anchor)
      this.targets.push(t)
      this.scene.add(t.group)
      this.hitables.push(...t.hitMeshes)
    }

    this.player.spawn(this.spawnPoint, this.spawnYaw)
  }

  private handleMenu(action: MenuAction): void {
    if (action === 'range') {
      this.enterRange()
      return
    }
    if (action === 'private') {
      this.menu.showToast('Private rooms land in Phase 1 (P2P invite codes).')
      return
    }
    if (action === 'quick') {
      this.menu.showToast('Quick Match lands with accounts + signaling.')
      return
    }
    this.menu.showToast('Loadouts: primary / secondary / lethal / tac / perks — next.')
  }

  private enterRange(): void {
    this.phase = 'range'
    this.menu.setVisible(false)
    this.hud.setVisible(true)
    this.touch.setVisible(true)
    this.hud.setMode('RANGE')
    this.weapon.reset()
    this.kills = 0
    this.player.spawn(this.spawnPoint, this.spawnYaw)
    this.hud.setHealth(this.player.health)
    this.hud.pushFeed('Range live — clear the plates')
  }

  private onResize(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h)
    this.player.resize(w, h)
    this.menuCam.aspect = w / Math.max(1, h)
    this.menuCam.updateProjectionMatrix()
  }

  private loop = (): void => {
    if (!this.running) return
    requestAnimationFrame(this.loop)
    const dt = Math.min(0.05, this.clock.getDelta())

    if (this.phase === 'range') {
      this.updateRange(dt)
      if (this.muzzleTimer > 0) {
        this.muzzleTimer -= dt
        this.muzzle.intensity = this.muzzleTimer > 0 ? 2.4 : 0
      }
      this.renderer.render(this.scene, this.player.camera)
    } else {
      const t = this.clock.elapsedTime
      this.menuCam.position.set(Math.sin(t * 0.12) * 20, 7.5, Math.cos(t * 0.12) * 20)
      this.menuCam.lookAt(0, 1.8, 0)
      this.renderer.render(this.scene, this.menuCam)
    }
  }

  private updateRange(dt: number): void {
    const input = this.input.sample(dt)
    const ads = input.ads
    this.player.update(dt, input, this.colliders, ads)
    this.weapon.update(dt)

    if (input.reload) this.weapon.tryReload()

    if (input.fire) {
      const shot = this.weapon.tryFire(this.player, ads, this.hitables)
      if (shot) {
        this.muzzleTimer = 0.05
        this.spawnTracer(shot.origin, shot.direction, shot.hitPoint)
        if (shot.hitObject) {
          const target = findRangeTarget(shot.hitObject)
          if (target) {
            const killed = target.applyDamage(GAME.weapon.damage)
            this.hud.flashHitmarker(killed)
            if (killed) {
              this.kills += 1
              this.hud.pushFeed(`Plate down · ${this.kills}`)
            }
          }
        }
      }
    }

    if (input.lethal) this.hud.pushFeed('Lethal — wired in Phase 2')
    if (input.tactical) this.hud.pushFeed('Tactical — wired in Phase 2')

    for (const t of this.targets) t.update(dt)

    this.hud.setAds(ads)
    this.hud.setAmmo(this.weapon.ammo, this.weapon.reserve, this.weapon.reloading)
    this.hud.setHealth(this.player.health)
  }

  private spawnTracer(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    hit: THREE.Vector3 | null,
  ): void {
    const end = hit ?? origin.clone().addScaledVector(dir, 45)
    const geo = new THREE.BufferGeometry().setFromPoints([origin.clone(), end])
    const mat = new THREE.LineBasicMaterial({
      color: 0xffe2a8,
      transparent: true,
      opacity: 0.85,
    })
    const line = new THREE.Line(geo, mat)
    this.tracerGroup.add(line)
    window.setTimeout(() => {
      this.tracerGroup.remove(line)
      geo.dispose()
      mat.dispose()
    }, 50)
  }
}
