import * as THREE from 'three'

const POOL = 24
const particles: {
  mesh: THREE.Mesh
  vel: THREE.Vector3
  life: number
}[] = []

function makePool(scene: THREE.Scene): void {
  if (particles.length) return
  const geo = new THREE.BoxGeometry(0.04, 0.04, 0.04)
  const mat = new THREE.MeshBasicMaterial({ color: 0xffc070 })
  for (let i = 0; i < POOL; i++) {
    const mesh = new THREE.Mesh(geo, mat.clone())
    mesh.visible = false
    scene.add(mesh)
    particles.push({ mesh, vel: new THREE.Vector3(), life: 0 })
  }
}

export function spawnImpact(scene: THREE.Scene, point: THREE.Vector3, normal?: THREE.Vector3): void {
  makePool(scene)
  const n = normal ?? new THREE.Vector3(0, 1, 0)
  for (let i = 0; i < 6; i++) {
    const p = particles.find((x) => x.life <= 0)
    if (!p) break
    p.mesh.position.copy(point)
    p.mesh.visible = true
    p.life = 0.18 + Math.random() * 0.12
    const spread = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 1.2,
      (Math.random() - 0.5) * 2,
    )
    p.vel.copy(n).multiplyScalar(2 + Math.random() * 2).add(spread)
    ;(p.mesh.material as THREE.MeshBasicMaterial).color.setHex(
      Math.random() > 0.5 ? 0xffb060 : 0xdddddd,
    )
  }
}

export function updateImpacts(dt: number): void {
  for (const p of particles) {
    if (p.life <= 0) continue
    p.life -= dt
    p.mesh.position.addScaledVector(p.vel, dt)
    p.vel.y -= 9 * dt
    p.mesh.scale.setScalar(Math.max(0.2, p.life * 4))
    if (p.life <= 0) p.mesh.visible = false
  }
}
