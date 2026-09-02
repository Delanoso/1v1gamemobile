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

type PoseMode = 'hip' | 'ads'

interface Pose {
  position: THREE.Vector3
  rotation: THREE.Euler
}

const STORAGE_KEY = 'frontline-vm-tune-v1'
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
    const raw = localStorage.getItem(STORAGE_KEY)
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ hip: pack(hip), ads: pack(ads) }))
}

/** Drag-to-position FPS viewmodel tuner — open /tune.html */
export class ViewmodelTuneApp {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(GAME.weapon.hipFov, 1, 0.05, 100)
  private readonly vmGroup = new THREE.Group()
  private model: THREE.Group
  private adsAimOffset = new THREE.Vector3()
  private readonly hip: Pose
  private readonly ads: Pose
  private mode: PoseMode = 'hip'
  private dragging = false
  private lastPointer = new THREE.Vector2()
  private readonly outputEl: HTMLElement
  private readonly toastEl: HTMLElement

  constructor(host: HTMLElement) {
    host.className = 'tune-host'

    const saved = loadSavedPoses()
    this.hip = saved?.hip ?? clonePose(VIEWMODEL_HIP)
    this.ads = saved?.ads ?? clonePose(VIEWMODEL_ADS)

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

    const overlay = document.createElement('div')
    overlay.className = 'tune-overlay'
    overlay.innerHTML = `
      <div class="crosshair" id="tune-crosshair">
        <span class="ch h"></span><span class="ch v"></span>
      </div>
      <div class="scope-overlay active" id="tune-scope" aria-hidden="true">
        <div class="scope-vignette"></div>
        <div class="scope-frame" style="width:118px;height:118px">
          <div class="scope-lens"></div>
          <div class="scope-dot"></div>
        </div>
      </div>
    `
    host.appendChild(overlay)

    const panel = document.createElement('div')
    panel.className = 'tune-panel'
    panel.innerHTML = `
      <h1>VIEWMODEL TUNER</h1>
      <p class="sub">Drag the view to move the gun. Use sliders for depth &amp; rotation. Copy pose into WeaponAsset.ts.</p>
      <div class="tune-modes">
        <button type="button" data-mode="hip" class="active">HIP</button>
        <button type="button" data-mode="ads">ADS</button>
      </div>
      <div id="tune-sliders"></div>
      <div class="tune-actions">
        <button type="button" id="tune-reset">Reset</button>
        <button type="button" id="tune-copy" class="primary">Copy pose</button>
      </div>
      <pre class="tune-output" id="tune-output"></pre>
    `
    host.appendChild(panel)

    this.outputEl = panel.querySelector('#tune-output')!
    this.toastEl = document.createElement('div')
    this.toastEl.className = 'tune-toast'
    host.appendChild(this.toastEl)

    this.buildSliders(panel.querySelector('#tune-sliders')!)
    panel.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.mode = btn.dataset.mode as PoseMode
        panel.querySelectorAll('[data-mode]').forEach((b) => b.classList.remove('active'))
        btn.classList.add('active')
        this.syncModeUi(overlay)
        this.applyPose()
        this.refreshOutput()
      })
    })
    panel.querySelector('#tune-reset')!.addEventListener('click', () => this.resetCurrent())
    panel.querySelector('#tune-copy')!.addEventListener('click', () => void this.copyPose())

    this.bindDrag(host)
    window.addEventListener('resize', () => this.onResize())
    this.onResize()
    this.syncModeUi(overlay)
    this.applyPose()
    this.refreshOutput()
    void this.loadM4()

    const loop = () => {
      requestAnimationFrame(loop)
      this.renderer.render(this.scene, this.camera)
    }
    loop()
  }

  private activePose(): Pose {
    return this.mode === 'hip' ? this.hip : this.ads
  }

  private syncModeUi(overlay: HTMLElement): void {
    const crosshair = overlay.querySelector('#tune-crosshair')!
    const scope = overlay.querySelector('#tune-scope')!
    crosshair.classList.toggle('ads', this.mode === 'ads')
    scope.classList.toggle('active', this.mode === 'ads')
    this.camera.fov = this.mode === 'ads' ? GAME.weapon.adsFov : GAME.weapon.hipFov
    this.camera.updateProjectionMatrix()
  }

  private applyPose(): void {
    const pose = this.activePose()
    this.vmGroup.position.copy(pose.position)
    this.vmGroup.rotation.copy(pose.rotation)
    if (this.mode === 'ads') {
      this.model.position.copy(this.adsAimOffset)
    } else {
      this.model.position.set(0, 0, 0)
    }
    savePoses(this.hip, this.ads)
    this.refreshSliders()
    this.refreshOutput()
  }

  private buildSliders(container: HTMLElement): void {
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
        this.applyPose()
      })
      container.appendChild(row)
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
    document.querySelectorAll<HTMLElement>('.tune-row').forEach((row) => {
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
    const defaults = this.mode === 'hip' ? VIEWMODEL_HIP : VIEWMODEL_ADS
    const pose = this.activePose()
    pose.position.copy(defaults.position)
    pose.rotation.copy(defaults.rotation)
    this.applyPose()
    this.toast('Reset to code defaults')
  }

  private async copyPose(): Promise<void> {
    const text = `${poseToCode('HIP', this.hip)}\n\n${poseToCode('ADS', this.ads)}`
    try {
      await navigator.clipboard.writeText(text)
      this.toast('Copied HIP + ADS to clipboard')
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
    const start = (x: number, y: number) => {
      this.dragging = true
      this.lastPointer.set(x, y)
    }
    const move = (x: number, y: number) => {
      if (!this.dragging) return
      const dx = x - this.lastPointer.x
      const dy = y - this.lastPointer.y
      this.lastPointer.set(x, y)
      const pose = this.activePose()
      pose.position.x += dx * DRAG_SENS
      pose.position.y -= dy * DRAG_SENS
      this.applyPose()
    }
    const end = () => {
      this.dragging = false
    }

    canvas.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.tune-panel')) return
      canvas.setPointerCapture(e.pointerId)
      start(e.clientX, e.clientY)
    })
    canvas.addEventListener('pointermove', (e) => move(e.clientX, e.clientY))
    canvas.addEventListener('pointerup', end)
    canvas.addEventListener('pointercancel', end)

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
      this.applyPose()
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
