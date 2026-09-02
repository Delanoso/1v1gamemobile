import './tune.css'
import * as THREE from 'three'
import { GAME } from '../config/gameConfig'
import {
  VIEWMODEL_ADS,
  VIEWMODEL_HIP,
  buildViewModelGroup,
  computeAdsAimOffset,
  preloadM4ViewModel,
} from '../assets/weapon/WeaponAsset'
import { getRendererPixelRatio } from '../utils/deviceProfile'
import {
  DEFAULT_SCOPE_OVERLAY,
  applyScopeOverlay,
  getScopeOverlaySettings,
  saveScopeOverlaySettings,
  scopeSettingsToCode,
  type ScopeOverlaySettings,
} from '../ui/scopeOverlay'

type TuneMode = 'hip' | 'ads' | 'scope'

interface Pose {
  position: THREE.Vector3
  rotation: THREE.Euler
}

const POSE_STORAGE_KEY = 'frontline-vm-tune-v1'
const DRAG_SENS = 0.00055

function clonePose(src: { position: THREE.Vector3; rotation: THREE.Euler }): Pose {
  return {
    position: src.position.clone(),
    rotation: new THREE.Euler(src.rotation.x, src.rotation.y, src.rotation.z, 'YXZ'),
  }
}

function poseToCode(name: string, pose: Pose): string {
  const p = pose.position
  const r = pose.rotation
  return `export const VIEWMODEL_${name} = {
  position: new THREE.Vector3(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}),
  rotation: new THREE.Euler(${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)}, 'YXZ'),
}`
}

function loadSavedPoses(): { hip: Pose; ads: Pose } | null {
  try {
    const raw = localStorage.getItem(POSE_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as {
      hip: { position: number[]; rotation: number[] }
      ads: { position: number[]; rotation: number[] }
    }
    const toPose = (entry: { position: number[]; rotation: number[] }): Pose => ({
      position: new THREE.Vector3(entry.position[0], entry.position[1], entry.position[2]),
      rotation: new THREE.Euler(entry.rotation[0], entry.rotation[1], entry.rotation[2], 'YXZ'),
    })
    return { hip: toPose(data.hip), ads: toPose(data.ads) }
  } catch {
    return null
  }
}

function savePoses(hip: Pose, ads: Pose): void {
  const pack = (pose: Pose) => ({
    position: pose.position.toArray(),
    rotation: [pose.rotation.x, pose.rotation.y, pose.rotation.z],
  })
  localStorage.setItem(POSE_STORAGE_KEY, JSON.stringify({ hip: pack(hip), ads: pack(ads) }))
}

type ScopeSliderSpec = {
  key: keyof ScopeOverlaySettings
  label: string
  min: number
  max: number
  step: number
}

const SCOPE_SLIDERS: ScopeSliderSpec[] = [
  { key: 'adsFov', label: 'Zoom', min: 32, max: 62, step: 1 },
  { key: 'frameWidthPx', label: 'Width', min: 60, max: 280, step: 1 },
  { key: 'frameHeightPx', label: 'Height', min: 40, max: 220, step: 1 },
  { key: 'frameBorderPx', label: 'Border', min: 0, max: 8, step: 1 },
  { key: 'frameRadiusPx', label: 'Radius', min: 0, max: 80, step: 1 },
  { key: 'lensInsetPx', label: 'Lens in', min: 0, max: 24, step: 1 },
  { key: 'dotSizePx', label: 'Dot', min: 0, max: 12, step: 1 },
  { key: 'dotOffsetX', label: 'Dot X', min: -30, max: 30, step: 1 },
  { key: 'dotOffsetY', label: 'Dot Y', min: -30, max: 30, step: 1 },
  { key: 'vignetteInnerRatio', label: 'Vig in', min: 0.2, max: 0.8, step: 0.01 },
  { key: 'vignetteOuterRatio', label: 'Vig out', min: 0.5, max: 1.4, step: 0.01 },
  { key: 'vignetteOpacity', label: 'Vig dim', min: 0, max: 0.9, step: 0.01 },
  { key: 'vignetteEdgeOpacity', label: 'Vig edge', min: 0, max: 0.95, step: 0.01 },
]

/** Drag-to-position FPS viewmodel + scope overlay tuner — open /tune.html */
export class ViewmodelTuneApp {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(GAME.weapon.hipFov, 1, 0.05, 100)
  private readonly vmGroup = new THREE.Group()
  private readonly overlay: HTMLElement
  private readonly scopeOverlay: HTMLElement
  private readonly sliderContainer: HTMLElement
  private readonly outputEl: HTMLElement
  private readonly toastEl: HTMLElement
  private readonly copyBtn: HTMLButtonElement
  private readonly resetBtn: HTMLButtonElement
  private model: THREE.Group
  private adsAimOffset = new THREE.Vector3()
  private readonly hip: Pose
  private readonly ads: Pose
  private scope: ScopeOverlaySettings
  private mode: TuneMode = 'hip'
  private dragging = false
  private lastPointer = new THREE.Vector2()

  constructor(host: HTMLElement) {
    host.className = 'tune-host'

    const saved = loadSavedPoses()
    this.hip = saved?.hip ?? clonePose(VIEWMODEL_HIP)
    this.ads = saved?.ads ?? clonePose(VIEWMODEL_ADS)
    this.scope = getScopeOverlaySettings()

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(getRendererPixelRatio())
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(this.renderer.domElement)

    this.scene.background = new THREE.Color(0x8898a8)
    this.scene.fog = new THREE.FogExp2(0x8898a8, 0.02)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x6a7078, roughness: 0.9 }),
    )
    floor.rotation.x = -Math.PI / 2
    this.scene.add(floor)

    const light = new THREE.DirectionalLight(0xfff4e8, 1.4)
    light.position.set(2, 4, 1)
    this.scene.add(light)
    this.scene.add(new THREE.AmbientLight(0xb8c8d8, 0.55))

    this.camera.position.set(0, 1.6, 0)
    this.vmGroup.rotation.order = 'YXZ'
    this.camera.add(this.vmGroup)
    this.scene.add(this.camera)

    this.model = buildViewModelGroup('m4a1')
    this.adsAimOffset.copy(computeAdsAimOffset(this.model))
    this.vmGroup.add(this.model)

    this.overlay = document.createElement('div')
    this.overlay.className = 'tune-overlay'
    this.overlay.innerHTML = `
      <div class="crosshair" id="tune-crosshair">
        <span class="ch h"></span><span class="ch v"></span>
      </div>
      <div class="scope-overlay" id="tune-scope" aria-hidden="true">
        <div class="scope-vignette"></div>
        <div class="scope-frame">
          <div class="scope-lens"></div>
          <div class="scope-dot"></div>
        </div>
      </div>
    `
    host.appendChild(this.overlay)
    this.scopeOverlay = this.overlay.querySelector('#tune-scope')!

    const panel = document.createElement('div')
    panel.className = 'tune-panel'
    panel.innerHTML = `
      <h1>VIEWMODEL TUNER</h1>
      <p class="sub" id="tune-hint">Drag the view to move the gun. Use sliders for depth &amp; rotation.</p>
      <div class="tune-modes">
        <button type="button" data-mode="hip" class="active">HIP</button>
        <button type="button" data-mode="ads">ADS</button>
        <button type="button" data-mode="scope">SCOPE</button>
      </div>
      <div id="tune-sliders"></div>
      <div class="tune-actions">
        <button type="button" id="tune-reset">Reset</button>
        <button type="button" id="tune-copy" class="primary">Copy</button>
      </div>
      <pre class="tune-output" id="tune-output"></pre>
    `
    host.appendChild(panel)

    this.sliderContainer = panel.querySelector('#tune-sliders')!
    this.outputEl = panel.querySelector('#tune-output')!
    this.copyBtn = panel.querySelector('#tune-copy')!
    this.resetBtn = panel.querySelector('#tune-reset')!
    this.toastEl = document.createElement('div')
    this.toastEl.className = 'tune-toast'
    host.appendChild(this.toastEl)

    panel.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.mode = btn.dataset.mode as TuneMode
        panel.querySelectorAll('[data-mode]').forEach((b) => b.classList.remove('active'))
        btn.classList.add('active')
        this.rebuildSliders()
        this.syncModeUi()
        this.applyAll()
      })
    })
    this.resetBtn.addEventListener('click', () => this.resetCurrent())
    this.copyBtn.addEventListener('click', () => void this.copyOutput())

    this.bindDrag(host)
    window.addEventListener('resize', () => this.onResize())
    this.onResize()
    this.rebuildSliders()
    this.syncModeUi()
    this.applyAll()
    void this.loadM4()

    const loop = () => {
      requestAnimationFrame(loop)
      this.renderer.render(this.scene, this.camera)
    }
    loop()
  }

  private activePose(): Pose {
    return this.mode === 'ads' ? this.ads : this.hip
  }

  private syncModeUi(): void {
    const crosshair = this.overlay.querySelector('#tune-crosshair')!
    const hint = document.querySelector('#tune-hint')!
    const showScope = this.mode === 'ads' || this.mode === 'scope'

    crosshair.classList.toggle('ads', showScope)
    this.scopeOverlay.classList.toggle('active', showScope)
    this.vmGroup.visible = this.mode !== 'scope'

    if (this.mode === 'scope') {
      hint.textContent = 'Tune scope overlay. Zoom: lower = more magnification. Width/height for frame size.'
      this.camera.fov = this.scope.adsFov
      this.copyBtn.textContent = 'Copy scope'
      this.resetBtn.textContent = 'Reset scope'
    } else {
      hint.textContent = 'Drag the view to move the gun. Use sliders for depth & rotation.'
      this.camera.fov = this.mode === 'ads' ? this.scope.adsFov : GAME.weapon.hipFov
      this.copyBtn.textContent = 'Copy pose'
      this.resetBtn.textContent = 'Reset pose'
    }
    this.camera.updateProjectionMatrix()
  }

  private applyAll(): void {
    if (this.mode !== 'scope') {
      const pose = this.activePose()
      this.vmGroup.position.copy(pose.position)
      this.vmGroup.rotation.copy(pose.rotation)
      if (this.mode === 'ads') {
        this.model.position.copy(this.adsAimOffset)
      } else {
        this.model.position.set(0, 0, 0)
      }
      savePoses(this.hip, this.ads)
    }

    applyScopeOverlay(this.scopeOverlay, this.scope, 1)
    saveScopeOverlaySettings(this.scope)
    if (this.mode === 'scope' || this.mode === 'ads') {
      this.camera.fov = this.scope.adsFov
      this.camera.updateProjectionMatrix()
    }
    this.refreshSliders()
    this.refreshOutput()
  }

  private rebuildSliders(): void {
    this.sliderContainer.innerHTML = ''
    if (this.mode === 'scope') {
      this.buildScopeSliders()
      return
    }
    this.buildPoseSliders()
  }

  private buildPoseSliders(): void {
    const axes = [
      { key: 'px', label: 'Pos X', min: -0.35, max: 0.35, step: 0.001, pose: 'position', axis: 'x' },
      { key: 'py', label: 'Pos Y', min: -0.35, max: 0.35, step: 0.001, pose: 'position', axis: 'y' },
      { key: 'pz', label: 'Pos Z', min: -0.35, max: 0.1, step: 0.001, pose: 'position', axis: 'z' },
      { key: 'rx', label: 'Rot X', min: -0.6, max: 0.6, step: 0.001, pose: 'rotation', axis: 'x' },
      { key: 'ry', label: 'Rot Y', min: -0.6, max: 0.6, step: 0.001, pose: 'rotation', axis: 'y' },
      { key: 'rz', label: 'Rot Z', min: -0.6, max: 0.6, step: 0.001, pose: 'rotation', axis: 'z' },
    ] as const

    for (const spec of axes) {
      const row = document.createElement('div')
      row.className = 'tune-row'
      row.dataset.key = spec.key
      row.innerHTML = `
        <label>${spec.label}</label>
        <input type="range" min="${spec.min}" max="${spec.max}" step="${spec.step}" />
        <span class="val">0</span>
      `
      const input = row.querySelector('input')!
      input.addEventListener('input', () => {
        const pose = this.activePose()
        const target = spec.pose === 'position' ? pose.position : pose.rotation
        target[spec.axis] = parseFloat(input.value)
        this.applyAll()
      })
      this.sliderContainer.appendChild(row)
    }
  }

  private buildScopeSliders(): void {
    const shapeRow = document.createElement('div')
    shapeRow.className = 'tune-modes tune-shape'
    shapeRow.innerHTML = `
      <button type="button" data-shape="square">SQUARE</button>
      <button type="button" data-shape="round">ROUND</button>
    `
    shapeRow.querySelectorAll<HTMLButtonElement>('[data-shape]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.shape === this.scope.scopeShape)
      btn.addEventListener('click', () => {
        this.scope.scopeShape = btn.dataset.shape as 'square' | 'round'
        shapeRow.querySelectorAll('[data-shape]').forEach((b) => b.classList.remove('active'))
        btn.classList.add('active')
        this.applyAll()
      })
    })
    this.sliderContainer.appendChild(shapeRow)

    for (const spec of SCOPE_SLIDERS) {
      const row = document.createElement('div')
      row.className = 'tune-row'
      row.dataset.key = spec.key
      row.innerHTML = `
        <label>${spec.label}</label>
        <input type="range" min="${spec.min}" max="${spec.max}" step="${spec.step}" />
        <span class="val">0</span>
      `
      const input = row.querySelector('input')!
      input.addEventListener('input', () => {
        const v = parseFloat(input.value)
        this.scope[spec.key] = v as never
        this.applyAll()
      })
      this.sliderContainer.appendChild(row)
    }

    for (const [key, label] of [
      ['showDot', 'Red dot'],
      ['showVignette', 'Vignette'],
    ] as const) {
      const row = document.createElement('label')
      row.className = 'tune-check'
      row.innerHTML = `<input type="checkbox" data-check="${key}" /> ${label}`
      row.querySelector('input')!.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked
        if (key === 'showDot') this.scope.showDot = checked
        else this.scope.showVignette = checked
        this.applyAll()
      })
      this.sliderContainer.appendChild(row)
    }
  }

  private refreshSliders(): void {
    if (this.mode === 'scope') {
      for (const spec of SCOPE_SLIDERS) {
        const row = this.sliderContainer.querySelector(`[data-key="${spec.key}"]`)
        if (!row) continue
        const input = row.querySelector('input') as HTMLInputElement
        const val = row.querySelector('.val')!
        const n = this.scope[spec.key] as number
        input.value = String(n)
        if (spec.key === 'adsFov') {
          val.textContent = `${Math.round(n)}°`
        } else {
          val.textContent = Number.isInteger(spec.step) ? String(Math.round(n)) : n.toFixed(2)
        }
      }
      const shapeBtns = this.sliderContainer.querySelectorAll<HTMLButtonElement>('[data-shape]')
      shapeBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.shape === this.scope.scopeShape))
      const dotCheck = this.sliderContainer.querySelector('[data-check="showDot"]') as HTMLInputElement
      const vigCheck = this.sliderContainer.querySelector('[data-check="showVignette"]') as HTMLInputElement
      if (dotCheck) dotCheck.checked = this.scope.showDot
      if (vigCheck) vigCheck.checked = this.scope.showVignette
      return
    }

    const pose = this.activePose()
    const map: Record<string, number> = {
      px: pose.position.x,
      py: pose.position.y,
      pz: pose.position.z,
      rx: pose.rotation.x,
      ry: pose.rotation.y,
      rz: pose.rotation.z,
    }
    this.sliderContainer.querySelectorAll<HTMLElement>('.tune-row').forEach((row) => {
      const key = row.dataset.key!
      const input = row.querySelector('input') as HTMLInputElement
      const val = row.querySelector('.val')!
      input.value = String(map[key])
      val.textContent = map[key].toFixed(3)
    })
  }

  private refreshOutput(): void {
    if (this.mode === 'scope') {
      this.outputEl.textContent = scopeSettingsToCode(this.scope)
      return
    }
    this.outputEl.textContent = `${poseToCode('HIP', this.hip)}\n\n${poseToCode('ADS', this.ads)}`
  }

  private resetCurrent(): void {
    if (this.mode === 'scope') {
      this.scope = { ...DEFAULT_SCOPE_OVERLAY }
      this.applyAll()
      this.toast('Reset scope to defaults')
      return
    }
    const defaults = this.mode === 'hip' ? VIEWMODEL_HIP : VIEWMODEL_ADS
    const pose = this.activePose()
    pose.position.copy(defaults.position)
    pose.rotation.copy(defaults.rotation)
    this.applyAll()
    this.toast('Reset pose to code defaults')
  }

  private async copyOutput(): Promise<void> {
    const text =
      this.mode === 'scope'
        ? scopeSettingsToCode(this.scope)
        : `${poseToCode('HIP', this.hip)}\n\n${poseToCode('ADS', this.ads)}`
    try {
      await navigator.clipboard.writeText(text)
      this.toast(this.mode === 'scope' ? 'Copied scope settings' : 'Copied HIP + ADS poses')
    } catch {
      this.outputEl.textContent = text
      this.toast('Copy failed — select text below')
    }
  }

  private toast(msg: string): void {
    this.toastEl.textContent = msg
    this.toastEl.classList.add('show')
    window.setTimeout(() => this.toastEl.classList.remove('show'), 2200)
  }

  private bindDrag(host: HTMLElement): void {
    const canvas = this.renderer.domElement
    const move = (x: number, y: number) => {
      if (!this.dragging || this.mode === 'scope') return
      const dx = x - this.lastPointer.x
      const dy = y - this.lastPointer.y
      this.lastPointer.set(x, y)
      const pose = this.activePose()
      pose.position.x += dx * DRAG_SENS
      pose.position.y -= dy * DRAG_SENS
      this.applyAll()
    }

    canvas.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.tune-panel') || this.mode === 'scope') return
      canvas.setPointerCapture(e.pointerId)
      this.dragging = true
      this.lastPointer.set(e.clientX, e.clientY)
    })
    canvas.addEventListener('pointermove', (e) => move(e.clientX, e.clientY))
    canvas.addEventListener('pointerup', () => {
      this.dragging = false
    })
    canvas.addEventListener('pointercancel', () => {
      this.dragging = false
    })

    host.addEventListener(
      'touchmove',
      (e) => {
        if (this.dragging) e.preventDefault()
      },
      { passive: false },
    )
  }

  private async loadM4(): Promise<void> {
    try {
      const glb = await preloadM4ViewModel()
      this.vmGroup.remove(this.model)
      this.model = glb
      this.adsAimOffset.copy(computeAdsAimOffset(this.model))
      this.vmGroup.add(this.model)
      this.applyAll()
      this.toast('M4 Tan loaded')
    } catch {
      this.toast('Using procedural gun — M4 still loading')
      window.setTimeout(() => void this.loadM4(), 3000)
    }
  }

  private onResize(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h)
    this.camera.aspect = w / Math.max(1, h)
    this.camera.updateProjectionMatrix()
  }
}
