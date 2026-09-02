import * as THREE from 'three'
import { deviceProfile } from '../../utils/deviceProfile'

const COUNT = deviceProfile.isMobile ? 140 : 220

function createRainStreakTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 16, 64)

  const grad = ctx.createLinearGradient(0, 0, 0, 64)
  grad.addColorStop(0, 'rgba(210, 228, 245, 0)')
  grad.addColorStop(0.15, 'rgba(220, 235, 248, 0.35)')
  grad.addColorStop(0.45, 'rgba(235, 245, 255, 0.95)')
  grad.addColorStop(0.75, 'rgba(220, 235, 248, 0.4)')
  grad.addColorStop(1, 'rgba(210, 228, 245, 0)')

  ctx.fillStyle = grad
  ctx.fillRect(6, 0, 4, 64)

  // Soft core highlight
  const core = ctx.createLinearGradient(0, 0, 0, 64)
  core.addColorStop(0, 'rgba(255, 255, 255, 0)')
  core.addColorStop(0.5, 'rgba(255, 255, 255, 0.55)')
  core.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = core
  ctx.fillRect(7, 4, 2, 56)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export class RainEffect {
  readonly group = new THREE.Group()
  private readonly positions: Float32Array
  private readonly speeds: Float32Array
  private readonly sizes: Float32Array
  private readonly points: THREE.Points

  constructor() {
    this.positions = new Float32Array(COUNT * 3)
    this.speeds = new Float32Array(COUNT)
    this.sizes = new Float32Array(COUNT)

    for (let i = 0; i < COUNT; i++) {
      this.resetDrop(i, true)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))

    const streak = createRainStreakTexture()
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: streak },
        opacity: { value: deviceProfile.isMobile ? 0.38 : 0.48 },
      },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = size * (280.0 / -mv.z);
          vAlpha = clamp(0.35 + size * 0.08, 0.25, 0.9);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float opacity;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(map, gl_PointCoord);
          if (tex.a < 0.05) discard;
          gl_FragColor = vec4(tex.rgb, tex.a * opacity * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.points = new THREE.Points(geo, mat)
    this.group.add(this.points)
  }

  private resetDrop(i: number, initial = false): void {
    this.positions[i * 3] = (Math.random() - 0.5) * 50
    this.positions[i * 3 + 1] = initial ? Math.random() * 22 : 18 + Math.random() * 6
    this.positions[i * 3 + 2] = (Math.random() - 0.5) * 38
    this.speeds[i] = 12 + Math.random() * 10
    this.sizes[i] = 0.55 + Math.random() * 0.45
  }

  update(dt: number): void {
    for (let i = 0; i < COUNT; i++) {
      let y = this.positions[i * 3 + 1]
      y -= this.speeds[i] * dt
      if (y < 0) this.resetDrop(i)
      else this.positions[i * 3 + 1] = y
    }
    this.points.geometry.attributes.position.needsUpdate = true
  }

  dispose(): void {
    const mat = this.points.material as THREE.ShaderMaterial
    const map = mat.uniforms.map?.value as THREE.Texture | undefined
    map?.dispose()
    mat.dispose()
    this.points.geometry.dispose()
  }
}
