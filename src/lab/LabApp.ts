import './lab.css'
import * as THREE from 'three'
import { StudioScene } from './StudioScene'
import { buildContainer } from '../assets/container/ContainerAsset'
import { buildFloor } from '../assets/floor/FloorAsset'
import { buildFence } from '../assets/fence/FenceAsset'
import { buildBarrel, type BarrelVariant } from '../assets/barrel/BarrelAsset'
import { buildCrate, type CrateVariant } from '../assets/crate/CrateAsset'
import { buildPallet, type PalletVariant } from '../assets/pallet/PalletAsset'
import { buildWeapon, type WeaponVariant } from '../assets/weapon/WeaponAsset'
import type { ContainerColor } from '../game/materials/MapMaterials'

export type LabAsset = 'container' | 'floor' | 'fence' | 'barrel' | 'crate' | 'pallet' | 'weapon'

const ASSET_LABELS: Record<LabAsset, string> = {
  container: 'Shipping Container',
  floor: 'Asphalt Floor',
  fence: 'Chain-link Fence',
  barrel: 'Barrel',
  crate: 'Crate',
  pallet: 'Pallet',
  weapon: 'Weapon',
}

const GLB_HINTS: Partial<Record<LabAsset, string>> = {
  container: 'public/assets/maps/container-yard/container.glb',
  floor: 'public/assets/maps/container-yard/floor.glb',
  fence: 'public/assets/maps/container-yard/fence.glb',
  barrel:
    'public/assets/maps/container-yard/barrel-metal.glb · barrel-hazard-green.glb · barrel-hazard-yellow.glb · barrel-wood.glb',
  crate:
    'public/assets/maps/container-yard/crate-small.glb · crate-medium.glb · crate-large.glb · crate-long.glb · crate-flat.glb',
  pallet:
    'public/assets/maps/container-yard/pallet-standard.glb · pallet-double.glb · pallet-plastic.glb',
  weapon: 'public/assets/weapons/m4a1.glb · shotgun.glb · svd.glb · ak74.glb',
}

export class LabApp {
  private readonly studio: StudioScene
  private readonly panel: HTMLElement
  private readonly statusEl: HTMLElement
  private readonly trisEl: HTMLElement
  private readonly sourceEl: HTMLElement
  private readonly hintEl: HTMLElement
  private asset: LabAsset = 'weapon'
  private containerColor: ContainerColor = 'red'
  private barrelVariant: BarrelVariant = 'metal-dark'
  private crateVariant: CrateVariant = 'medium'
  private palletVariant: PalletVariant = 'standard'
  private weaponVariant: WeaponVariant = 'm4a1'
  private colorRow: HTMLElement | null = null
  private clock = new THREE.Clock()

  constructor(host: HTMLElement) {
    host.className = 'lab-host'
    this.studio = new StudioScene(host)

    this.panel = document.createElement('div')
    this.panel.className = 'lab-panel'
    this.panel.innerHTML = `
      <p class="lab-eyebrow">ASSET LAB</p>
      <h1 id="lab-title">Crate</h1>
      <p class="lab-sub">Polish one asset to 100% before it goes in the game.</p>
      <div class="lab-tabs" id="lab-tabs"></div>
      <div class="lab-meta">
        <span id="lab-source">Source: …</span>
        <span id="lab-tris">Tris: …</span>
      </div>
      <p class="lab-status" id="lab-status">Loading…</p>
      <div class="lab-actions">
        <button type="button" id="lab-reset">Reset view</button>
        <button type="button" id="lab-reload">Reload asset</button>
      </div>
      <p class="lab-hint" id="lab-hint">Drag to rotate · Turntable auto-spin</p>
    `
    host.appendChild(this.panel)

    this.statusEl = this.panel.querySelector('#lab-status')!
    this.trisEl = this.panel.querySelector('#lab-tris')!
    this.sourceEl = this.panel.querySelector('#lab-source')!
    this.hintEl = this.panel.querySelector('#lab-hint')!
    this.buildTabs()

    const params = new URLSearchParams(window.location.search)
    const a = params.get('asset') as LabAsset | null
    if (a && a in ASSET_LABELS) this.asset = a

    this.panel.querySelector('#lab-reset')!.addEventListener('click', () =>
      this.studio.resetView(
        this.asset === 'floor' ? 'ground' : this.asset === 'weapon' ? 'weapon' : 'prop',
      ),
    )
    this.panel.querySelector('#lab-reload')!.addEventListener('click', () => void this.loadAsset())

    this.syncColorSwatches()
    void this.loadAsset()
    this.loop()
  }

  private buildTabs(): void {
    const tabs = this.panel.querySelector('#lab-tabs')!
    ;(Object.keys(ASSET_LABELS) as LabAsset[]).forEach((key) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = ASSET_LABELS[key]
      btn.className = key === this.asset ? 'active' : ''
      btn.addEventListener('click', () => {
        this.asset = key
        tabs.querySelectorAll('button').forEach((b) => b.classList.remove('active'))
        btn.classList.add('active')
        this.syncColorSwatches()
        void this.loadAsset()
      })
      tabs.appendChild(btn)
    })
  }

  private syncColorSwatches(): void {
    this.colorRow?.remove()
    this.colorRow = null

    if (this.asset === 'container') {
      const row = document.createElement('div')
      row.className = 'lab-colors'
      const colors: ContainerColor[] = ['red', 'blue', 'green', 'tan']
      const labels = { red: 'Red', blue: 'Blue', green: 'Green', tan: 'Tan' }
      colors.forEach((c) => {
        const b = document.createElement('button')
        b.type = 'button'
        b.textContent = labels[c]
        b.className = `swatch swatch-${c}${c === this.containerColor ? ' active' : ''}`
        b.addEventListener('click', () => {
          this.containerColor = c
          row.querySelectorAll('button').forEach((x) => x.classList.remove('active'))
          b.classList.add('active')
          void this.loadAsset()
        })
        row.appendChild(b)
      })
      this.panel.querySelector('.lab-actions')!.before(row)
      this.colorRow = row
      return
    }

    if (this.asset === 'barrel') {
      const row = document.createElement('div')
      row.className = 'lab-colors lab-colors-wrap'
      const variants: BarrelVariant[] = ['metal-dark', 'metal-green', 'metal-yellow', 'wood']
      const labels: Record<BarrelVariant, string> = {
        'metal-dark': 'Metal',
        'metal-green': 'Hazard Green',
        'metal-yellow': 'Hazard Yellow',
        wood: 'Wood',
      }
      variants.forEach((v) => {
        const b = document.createElement('button')
        b.type = 'button'
        b.textContent = labels[v]
        b.className = `swatch swatch-${v}${v === this.barrelVariant ? ' active' : ''}`
        b.addEventListener('click', () => {
          this.barrelVariant = v
          row.querySelectorAll('button').forEach((x) => x.classList.remove('active'))
          b.classList.add('active')
          void this.loadAsset()
        })
        row.appendChild(b)
      })
      this.panel.querySelector('.lab-actions')!.before(row)
      this.colorRow = row
      return
    }

    if (this.asset === 'crate') {
      const row = document.createElement('div')
      row.className = 'lab-colors lab-colors-wrap'
      const variants: CrateVariant[] = ['small', 'medium', 'large', 'long', 'flat']
      const labels: Record<CrateVariant, string> = {
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        long: 'Long',
        flat: 'Flat',
      }
      variants.forEach((v) => {
        const b = document.createElement('button')
        b.type = 'button'
        b.textContent = labels[v]
        b.className = `swatch swatch-crate-${v}${v === this.crateVariant ? ' active' : ''}`
        b.addEventListener('click', () => {
          this.crateVariant = v
          row.querySelectorAll('button').forEach((x) => x.classList.remove('active'))
          b.classList.add('active')
          void this.loadAsset()
        })
        row.appendChild(b)
      })
      this.panel.querySelector('.lab-actions')!.before(row)
      this.colorRow = row
      return
    }

    if (this.asset === 'pallet') {
      const row = document.createElement('div')
      row.className = 'lab-colors lab-colors-wrap'
      const variants: PalletVariant[] = ['standard', 'double', 'plastic']
      const labels: Record<PalletVariant, string> = {
        standard: 'Wood',
        double: 'Stacked',
        plastic: 'Plastic',
      }
      variants.forEach((v) => {
        const b = document.createElement('button')
        b.type = 'button'
        b.textContent = labels[v]
        b.className = `swatch swatch-pallet-${v}${v === this.palletVariant ? ' active' : ''}`
        b.addEventListener('click', () => {
          this.palletVariant = v
          row.querySelectorAll('button').forEach((x) => x.classList.remove('active'))
          b.classList.add('active')
          void this.loadAsset()
        })
        row.appendChild(b)
      })
      this.panel.querySelector('.lab-actions')!.before(row)
      this.colorRow = row
      return
    }

    if (this.asset === 'weapon') {
      const row = document.createElement('div')
      row.className = 'lab-colors lab-colors-wrap'
      const variants: WeaponVariant[] = ['m4a1', 'shotgun', 'svd', 'ak74']
      const labels: Record<WeaponVariant, string> = {
        m4a1: 'M4A1',
        shotgun: 'Shotgun',
        svd: 'DMR',
        ak74: 'AK-74',
      }
      variants.forEach((v) => {
        const b = document.createElement('button')
        b.type = 'button'
        b.textContent = labels[v]
        b.className = `swatch swatch-weapon-${v}${v === this.weaponVariant ? ' active' : ''}`
        b.addEventListener('click', () => {
          this.weaponVariant = v
          row.querySelectorAll('button').forEach((x) => x.classList.remove('active'))
          b.classList.add('active')
          void this.loadAsset()
        })
        row.appendChild(b)
      })
      this.panel.querySelector('.lab-actions')!.before(row)
      this.colorRow = row
    }
  }

  private async loadAsset(): Promise<void> {
    const title = this.panel.querySelector('#lab-title')!
    title.textContent = ASSET_LABELS[this.asset]
    this.statusEl.textContent = 'Loading…'

    const glbPath = GLB_HINTS[this.asset]
    this.hintEl.innerHTML = glbPath
      ? `Drag to rotate · Turntable auto-spin · Drop GLB at<br><code>${glbPath}</code>`
      : 'Drag to rotate · Turntable auto-spin'

    if (this.asset === 'container') {
      const result = await buildContainer(this.containerColor)
      this.studio.setAsset(result.group, 'prop')
      this.sourceEl.textContent = `Source: ${result.source === 'glb' ? 'GLB model' : 'Procedural'}`
      this.trisEl.textContent = `Tris: ${result.triangleCount.toLocaleString()}`
      this.statusEl.textContent =
        result.source === 'glb'
          ? 'Using imported GLB — rotate and review on iPad.'
          : 'Procedural v3 — large square corrugation (225 mm pitch, trapezoid ribs).'
      return
    }

    if (this.asset === 'floor') {
      const result = await buildFloor()
      this.studio.setAsset(result.group, 'ground')
      this.sourceEl.textContent = `Source: ${result.source === 'glb' ? 'GLB model' : 'Procedural'}`
      this.trisEl.textContent = `Tris: ${result.triangleCount.toLocaleString()}`
      this.statusEl.textContent =
        result.source === 'glb'
          ? 'Using imported floor GLB — check wetness, cracks, and line wear.'
          : 'Procedural v1 — MW Shipment-style asphalt with lines, puddles, and curb lip.'
      return
    }

    if (this.asset === 'fence') {
      const result = await buildFence()
      this.studio.setAsset(result.group, 'prop')
      this.sourceEl.textContent = `Source: ${result.source === 'glb' ? 'GLB model' : 'Procedural'}`
      this.trisEl.textContent = `Tris: ${result.triangleCount.toLocaleString()}`
      this.statusEl.textContent =
        result.source === 'glb'
          ? 'Using imported fence GLB — check mesh transparency and post alignment.'
          : 'Procedural v2 — galvanized posts, chain mesh, Y-brackets, concertina razor wire.'
      return
    }

    if (this.asset === 'barrel') {
      const result = await buildBarrel(this.barrelVariant)
      this.studio.setAsset(result.group, 'prop')
      this.sourceEl.textContent = `Source: ${result.source === 'glb' ? 'GLB model' : 'Procedural'}`
      this.trisEl.textContent = `Tris: ${result.triangleCount.toLocaleString()}`
      const variantLabels: Record<BarrelVariant, string> = {
        'metal-dark': 'dark metal drum with red bands and skull decal',
        'metal-green': 'lime hazard drum with biohazard decal and waste stencil',
        'metal-yellow': 'yellow hazard drum with toxic and radiation decals',
        wood: 'wooden stave barrel with iron hoops and plank lid',
      }
      const variantNames: Record<BarrelVariant, string> = {
        'metal-dark': 'Metal',
        'metal-green': 'Hazard Green',
        'metal-yellow': 'Hazard Yellow',
        wood: 'Wood',
      }
      this.statusEl.textContent =
        result.source === 'glb'
          ? `Using imported ${variantNames[this.barrelVariant]} barrel GLB.`
          : `Procedural v2 — ${variantLabels[this.barrelVariant]}.`
      return
    }

    if (this.asset === 'crate') {
      const result = await buildCrate(this.crateVariant)
      this.studio.setAsset(result.group, 'prop')
      this.sourceEl.textContent = `Source: ${result.source === 'glb' ? 'GLB model' : 'Procedural'}`
      this.trisEl.textContent = `Tris: ${result.triangleCount.toLocaleString()}`
      const variantLabels: Record<CrateVariant, string> = {
        small: 'compact cube with rope handle',
        medium: 'standard shipping cube with stencil codes',
        large: 'reinforced crate with diagonal brace and side-up marking',
        long: 'low rifle-style ammo box',
        flat: 'wide pallet crate with recessed lid and skids',
      }
      const variantNames: Record<CrateVariant, string> = {
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        long: 'Long',
        flat: 'Flat',
      }
      this.statusEl.textContent =
        result.source === 'glb'
          ? `Using imported ${variantNames[this.crateVariant]} crate GLB.`
          : `Procedural v3 — brown wood ${variantLabels[this.crateVariant]}.`
      return
    }

    if (this.asset === 'pallet') {
      const result = await buildPallet(this.palletVariant)
      this.studio.setAsset(result.group, 'prop')
      this.sourceEl.textContent = `Source: ${result.source === 'glb' ? 'GLB model' : 'Procedural'}`
      this.trisEl.textContent = `Tris: ${result.triangleCount.toLocaleString()}`
      const variantLabels: Record<PalletVariant, string> = {
        standard: 'EUR-style wood pallet with deck boards, runners, and nail heads',
        double: 'two weathered wood pallets stacked with a slight offset',
        plastic: 'blue industrial plastic pallet with lattice ribs',
      }
      const variantNames: Record<PalletVariant, string> = {
        standard: 'Wood',
        double: 'Stacked',
        plastic: 'Plastic',
      }
      this.statusEl.textContent =
        result.source === 'glb'
          ? `Using imported ${variantNames[this.palletVariant]} pallet GLB.`
          : `Procedural v1 — ${variantLabels[this.palletVariant]}.`
      return
    }

    if (this.asset === 'weapon') {
      const result = await buildWeapon(this.weaponVariant)
      this.studio.setAsset(result.group, 'weapon')
      this.sourceEl.textContent = `Source: ${result.source === 'glb' ? 'GLB model' : 'Procedural'}`
      this.trisEl.textContent = `Tris: ${result.triangleCount.toLocaleString()}`
      const variantLabels: Record<WeaponVariant, string> = {
        m4a1: 'assault rifle — rails, carry handle, STANAG mag (in-game viewmodel)',
        shotgun: 'pump shotgun — wood stock/pump, vented heat shield, side saddle',
        svd: 'marksman rifle — wood thumbhole stock, PSO-style scope',
        ak74: 'tactical AK — skeleton stock, suppressor, vertical grip',
      }
      const variantNames: Record<WeaponVariant, string> = {
        m4a1: 'M4A1',
        shotgun: 'Shotgun',
        svd: 'DMR',
        ak74: 'AK-74',
      }
      this.statusEl.textContent =
        result.source === 'glb'
          ? `Using imported ${variantNames[this.weaponVariant]} GLB.`
          : `Procedural v3 — ${variantLabels[this.weaponVariant]}. Drop GLB for reference fidelity.`
    }
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop)
    const dt = this.clock.getDelta()
    this.studio.update(dt)
    this.studio.render()
  }
}
