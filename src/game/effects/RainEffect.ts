import * as THREE from 'three'

const COUNT = 420

export class RainEffect {
  readonly group = new THREE.Group()
  private readonly positions: Float32Array
  private readonly speeds: Float32Array
  private readonly points: THREE.Points

  constructor() {
    this.positions = new Float32Array(COUNT * 3)
    this.speeds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      this.positions[i * 3] = (Math.random() - 0.5) * 50
      this.positions[i * 3 + 1] = Math.random() * 22
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * 38
      this.speeds[i] = 10 + Math.random() * 8
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    const mat = new THREE.PointsMaterial({
      color: 0xc8d8e8,
      size: 0.08,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    })
    this.points = new THREE.Points(geo, mat)
    this.group.add(this.points)
  }

  update(dt: number): void {
    for (let i = 0; i < COUNT; i++) {
      let y = this.positions[i * 3 + 1]
      y -= this.speeds[i] * dt
      if (y < 0) {
        y = 18 + Math.random() * 6
        this.positions[i * 3] = (Math.random() - 0.5) * 50
        this.positions[i * 3 + 2] = (Math.random() - 0.5) * 38
      }
      this.positions[i * 3 + 1] = y
    }
    this.points.geometry.attributes.position.needsUpdate = true
  }
}
