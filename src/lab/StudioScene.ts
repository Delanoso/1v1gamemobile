import * as THREE from 'three'

export type StudioViewMode = 'prop' | 'ground'

/** Neutral studio rig for inspecting one asset at a time. */
export class StudioScene {
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  readonly pivot = new THREE.Group()
  readonly renderer: THREE.WebGLRenderer

  private viewMode: StudioViewMode = 'prop'
  private rotY = 0.35
  private rotX = 0.15
  private zoom = 9
  private lookAtY = 1.3
  private touchId: number | null = null
  private lastTouch = { x: 0, y: 0 }

  constructor(host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    host.prepend(this.renderer.domElement)

    this.scene.background = new THREE.Color(0x1a2028)
    this.scene.fog = new THREE.Fog(0x1a2028, 18, 40)

    // Turntable platform
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 4.5, 0.12, 48),
      new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.85, metalness: 0.1 }),
    )
    platform.position.y = -0.06
    platform.receiveShadow = true
    this.scene.add(platform)

    const grid = new THREE.GridHelper(12, 24, 0x3a4550, 0x252c34)
    grid.position.y = 0.001
    this.scene.add(grid)

    this.scene.add(this.pivot)

    // Studio lights
    this.scene.add(new THREE.AmbientLight(0xa0b0c0, 0.65))
    const key = new THREE.DirectionalLight(0xfff4e8, 1.65)
    key.position.set(6, 10, 8)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    this.scene.add(key)
    const fill = new THREE.DirectionalLight(0xb8c8e8, 0.85)
    fill.position.set(-8, 5, -4)
    this.scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffffff, 0.55)
    rim.position.set(0, 4, -10)
    this.scene.add(rim)

    this.camera.position.set(0, 2.2, this.zoom)
    this.camera.lookAt(0, 1.3, 0)

    this.bindTouch(this.renderer.domElement)
    window.addEventListener('resize', () => this.resize())
    this.resize()
  }

  setAsset(object: THREE.Object3D, mode: StudioViewMode = 'prop'): void {
    this.viewMode = mode
    this.pivot.clear()
    if (mode === 'ground') {
      object.position.y = 0.02
      this.applyGroundDefaults()
    } else {
      object.position.y = propEyeLevel(object)
      this.applyPropDefaults()
    }
    this.pivot.add(object)
    this.fitCamera(object)
  }

  update(dt: number): void {
    this.pivot.rotation.y += dt * (this.viewMode === 'ground' ? 0.08 : 0.15)
    this.applyOrbit()
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  resize(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h)
    this.camera.aspect = w / Math.max(1, h)
    this.camera.updateProjectionMatrix()
  }

  resetView(mode: StudioViewMode = this.viewMode): void {
    if (mode === 'ground') this.applyGroundDefaults()
    else this.applyPropDefaults()
    this.applyOrbit()
  }

  private applyPropDefaults(): void {
    this.rotY = 0.35
    this.rotX = 0.15
    this.lookAtY = 1.3
    this.zoom = 9
  }

  private applyGroundDefaults(): void {
    this.rotY = 0.55
    this.rotX = 0.58
    this.lookAtY = 0.08
    this.zoom = 11
  }

  private fitCamera(object: THREE.Object3D): void {
    object.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(object)
    if (!Number.isFinite(box.min.x) || box.isEmpty()) {
      this.applyOrbit()
      return
    }
    const size = box.getSize(new THREE.Vector3())
    const max =
      this.viewMode === 'ground'
        ? Math.max(size.x, size.z)
        : Math.max(size.x, size.y, size.z)
    this.zoom = Math.max(6, max * (this.viewMode === 'ground' ? 1.6 : 2.2))
    this.applyOrbit()
  }

  private applyOrbit(): void {
    const cx = Math.sin(this.rotY) * Math.cos(this.rotX) * this.zoom
    const cy = Math.sin(this.rotX) * this.zoom + this.lookAtY
    const cz = Math.cos(this.rotY) * Math.cos(this.rotX) * this.zoom
    this.camera.position.set(cx, cy, cz)
    this.camera.lookAt(0, this.lookAtY, 0)
  }

  private bindTouch(el: HTMLElement): void {
    el.addEventListener(
      'touchstart',
      (e) => {
        if (this.touchId !== null) return
        const t = e.changedTouches[0]
        this.touchId = t.identifier
        this.lastTouch = { x: t.clientX, y: t.clientY }
        e.preventDefault()
      },
      { passive: false },
    )
    el.addEventListener(
      'touchmove',
      (e) => {
        for (const t of Array.from(e.changedTouches)) {
          if (t.identifier !== this.touchId) continue
          const dx = t.clientX - this.lastTouch.x
          const dy = t.clientY - this.lastTouch.y
          this.lastTouch = { x: t.clientX, y: t.clientY }
          this.rotY -= dx * 0.008
          this.rotX = Math.max(-0.4, Math.min(0.8, this.rotX - dy * 0.008))
          this.applyOrbit()
          e.preventDefault()
        }
      },
      { passive: false },
    )
    const end = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this.touchId) this.touchId = null
      }
    }
    el.addEventListener('touchend', end, { passive: false })
    el.addEventListener('touchcancel', end, { passive: false })
  }
}

function propEyeLevel(object: THREE.Object3D): number {
  object.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(object)
  if (!Number.isFinite(box.min.y) || box.isEmpty()) return 0
  return Math.max(0, -box.min.y)
}
