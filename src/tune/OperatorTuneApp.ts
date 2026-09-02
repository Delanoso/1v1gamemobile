import './tune.css'
import * as THREE from 'three'
import { GAME } from '../config/gameConfig'
import {
  FPS_OPERATOR_ADS,
  FPS_OPERATOR_HIP,
  preloadFpsOperatorBody,
} from '../assets/operator/OperatorAsset'
import {
  VIEWMODEL_ADS,
  VIEWMODEL_HIP,
  buildViewModelGroup,
  computeAdsAimOffset,
  preloadM4ViewModel,
} from '../assets/weapon/WeaponAsset'
import { getRendererPixelRatio } from '../utils/deviceProfile'
import {
  applyScopeOverlay,
  getScopeOverlaySettings,
  saveScopeOverlaySettings,
} from '../ui/scopeOverlay'

type TuneMode = 'hip' | 'ads'

interface Pose {
  position: THREE.Vector3
  rotation: THREE.Euler
}

const OPERATOR_STORAGE_KEY = 'frontline-operator-tune-v1'
const WEAPON_POSE_STORAGE_KEY = 'frontline-vm-tune-v1'
const DRAG_SENS = 0.00085

function clonePose(src: { position: THREE.Vector3; rotation: THREE.Euler }): Pose {
  return {
    position: src.position.clone(),
    rotation: new THREE.Euler(src.rotation.x, src.rotation.y, src.rotation.z, 'YXZ'),
  }
}

function poseToCode(name: string, pose: Pose): string {
  const p = pose.position
  const r = pose.rotation
  return `export const FPS_OPERATOR_${name} = {
  position: new THREE.Vector3(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}),
  rotation: new THREE.Euler(${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)}, 'YXZ'),
}`
}

function loadSavedOperatorPoses(): { hip: Pose; ads: Pose } | null {
  try {
    const raw = localStorage.getItem(OPERATOR_STORAGE_KEY)
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

function saveOperatorPoses(hip: Pose, ads: Pose): void {
  const pack = (pose: Pose) => ({
    position: pose.position.toArray(),
    rotation: [pose.rotation.x, pose.rotation.y, pose.rotation.z],
  })
  localStorage.setItem(OPERATOR_STORAGE_KEY, JSON.stringify({ hip: pack(hip), ads: pack(ads) }))
}

function loadSavedWeaponPoses(): { hip: Pose; ads: Pose } | null {
  try {
    const raw = localStorage.getItem(WEAPON_POSE_STORAGE_KEY)
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

/** Drag-to-position FPS operator behind a fixed in-game weapon — open /operator-tune.html */
export class OperatorTuneApp {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(GAME.weapon.hipFov, 1, 0.05, 100)
  private readonly operatorGroup = new THREE.Group()
  private readonly vmGroup = new THREE.Group()
  private readonly overlay: HTMLElement
  private readonly scopeOverlay: HTMLElement
  private readonly sliderContainer: HTMLElement
  private readonly outputEl: HTMLElement
  private readonly toastEl: HTMLElement
  private readonly copyBtn: HTMLButtonElement
  private readonly resetBtn: HTMLButtonElement
  private readonly weaponHip: Pose
  private readonly weaponAds: Pose
  private model: THREE.Group
  private operatorBody: THREE.Group | null = null
  private adsAimOffset = new THREE.Vector3()
  private readonly hip: Pose
  private readonly ads: Pose
  private scope = getScopeOverlaySettings()
  private mode: TuneMode = 'hip'
  private dragging = false
  private lastPointer = new THREE.Vector2()

  constructor(host: HTMLElement) {
    host.className = 'tune-host'

    const savedOperator = loadSavedOperatorPoses()
    this.hip = savedOperator?.hip ?? clonePose(FPS_OPERATOR_HIP)
    this.ads = savedOperator?.ads ?? clonePose(FPS_OPERATOR_ADS)

    const savedWeapon = loadSavedWeaponPoses()
    this.weaponHip = savedWeapon?.hip ?? clonePose(VIEWMODEL_HIP)
    this.weaponAds = savedWeapon?.ads ?? clonePose(VIEWMODEL_ADS)

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

    this.camera.position.set(0, GAME.player.eyeHeight, 0)
    this.operatorGroup.rotation.order = 'YXZ'
    this.vmGroup.rotation.order = 'YXZ'
    this.camera.add(this.operatorGroup)
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
      <h1>OPERATOR TUNER</h1>
      <p class="sub" id="tune-hint">Gun is fixed at in-game pose. Drag to move the operator body.</p>
      <div class="tune-modes">
        <button type="button" data-mode="hip" class="active">HIP</button>
        <button type="button" data-mode="ads">ADS</button>
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
        this.syncModeUi()
        this.applyAll()
      })
    })
    this.resetBtn.addEventListener('click', () => this.resetCurrent())
    this.copyBtn.addEventListener('click', () => void this.copyOutput())

    this.buildSliders()
    this.bindDrag(host)
    window.addEventListener('resize', () => this.onResize())
    this.onResize()
    this.syncModeUi()
    this.applyAll()
    void this.loadAssets()

    const loop = () => {
      requestAnimationFrame(loop)
      this.renderer.render(this.scene, this.camera)
    }
    loop()
  }

  private activePose(): Pose {
    return this.mode === 'ads' ? this.ads : this.hip
  }

  private activeWeaponPose(): Pose {
    return this.mode === 'ads' ? this.weaponAds : this.weaponHip
  }

  private syncModeUi(): void {
    const crosshair = this.overlay.querySelector('#tune-crosshair')!
    const hint = document.querySelector('#tune-hint')!
    const showScope = this.mode === 'ads'

    crosshair.classList.toggle('ads', showScope)
    this.scopeOverlay.classList.toggle('active', showScope)
    this.camera.fov = showScope ? this.scope.adsFov : GAME.weapon.hipFov
    this.camera.updateProjectionMatrix()

    hint.textContent = showScope
      ? 'ADS — gun fixed at in-game ADS pose with scope overlay. Drag operator behind it.'
      : 'HIP — gun fixed at in-game hip pose. Drag operator body into place behind the weapon.'
  }

  private applyAll(): void {
    const weapon = this.activeWeaponPose()
    this.vmGroup.position.copy(weapon.position)
    this.vmGroup.rotation.copy(weapon.rotation)
    if (this.mode === 'ads') {
      this.model.position.copy(this.adsAimOffset)
    } else {
      this.model.position.set(0, 0, 0)
    }

    const pose = this.activePose()
    this.operatorGroup.position.copy(pose.position)
    this.operatorGroup.rotation.copy(pose.rotation)

    applyScopeOverlay(this.scopeOverlay, this.scope, 1)
    saveScopeOverlaySettings(this.scope)
    saveOperatorPoses(this.hip, this.ads)
    this.refreshSliders()
    this.refreshOutput()
  }

  private buildSliders(): void {
    this.sliderContainer.innerHTML = ''
    const axes = [
      { key: 'px', label: 'Pos X', min: -0.6, max: 0.6, step: 0.001, pose: 'position', axis: 'x' },
      { key: 'py', label: 'Pos Y', min: -2.2, max: 0.6, step: 0.001, pose: 'position', axis: 'y' },
      { key: 'pz', label: 'Pos Z', min: -1.2, max: 0.4, step: 0.001, pose: 'position', axis: 'z' },
      { key: 'rx', label: 'Rot X', min: -0.8, max: 0.8, step: 0.001, pose: 'rotation', axis: 'x' },
      { key: 'ry', label: 'Rot Y', min: -3.14, max: 3.14, step: 0.001, pose: 'rotation', axis: 'y' },
      { key: 'rz', label: 'Rot Z', min: -0.8, max: 0.8, step: 0.001, pose: 'rotation', axis: 'z' },
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

  private refreshSliders(): void {
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
    this.outputEl.textContent = `${poseToCode('HIP', this.hip)}\n\n${poseToCode('ADS', this.ads)}`
  }

  private resetCurrent(): void {
    const defaults = this.mode === 'hip' ? FPS_OPERATOR_HIP : FPS_OPERATOR_ADS
    const pose = this.activePose()
    pose.position.copy(defaults.position)
    pose.rotation.copy(defaults.rotation)
    this.applyAll()
    this.toast('Reset operator pose to code defaults')
  }

  private async copyOutput(): Promise<void> {
    const text = `${poseToCode('HIP', this.hip)}\n\n${poseToCode('ADS', this.ads)}`
    try {
      await navigator.clipboard.writeText(text)
      this.toast('Copied HIP + ADS operator poses')
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
      if (!this.dragging) return
      const dx = x - this.lastPointer.x
      const dy = y - this.lastPointer.y
      this.lastPointer.set(x, y)
      const pose = this.activePose()
      pose.position.x += dx * DRAG_SENS
      pose.position.y -= dy * DRAG_SENS
      this.applyAll()
    }

    canvas.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.tune-panel')) return
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

  private m4Loaded = false
  private operatorLoaded = false

  private async loadAssets(): Promise<void> {
    if (!this.m4Loaded) {
      try {
        const glb = await preloadM4ViewModel()
        this.vmGroup.remove(this.model)
        this.model = glb
        this.adsAimOffset.copy(computeAdsAimOffset(this.model))
        this.vmGroup.add(this.model)
        this.m4Loaded = true
        this.applyAll()
      } catch {
        window.setTimeout(() => void this.loadAssets(), 3000)
        return
      }
    }

    if (!this.operatorLoaded) {
      try {
        const body = await preloadFpsOperatorBody()
        if (!this.operatorBody) {
          this.operatorBody = body
          this.operatorGroup.add(body)
        }
        this.operatorLoaded = true
        this.applyAll()
        this.toast('Operator + M4 loaded — drag body behind gun')
      } catch {
        window.setTimeout(() => void this.loadAssets(), 3000)
      }
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
