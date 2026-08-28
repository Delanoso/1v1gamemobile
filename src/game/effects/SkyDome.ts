import * as THREE from 'three'

function skyCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 512
  const ctx = c.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#7a8e9e')
  grad.addColorStop(0.45, '#a8b8c8')
  grad.addColorStop(0.72, '#d0dae4')
  grad.addColorStop(1, '#e8eef4')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 512)
  // Haze band at horizon
  const haze = ctx.createLinearGradient(0, 280, 0, 512)
  haze.addColorStop(0, 'rgba(255,255,255,0)')
  haze.addColorStop(1, 'rgba(255,255,255,0.55)')
  ctx.fillStyle = haze
  ctx.fillRect(0, 280, 1024, 232)
  // Soft sun glow
  const sun = ctx.createRadialGradient(180, 120, 0, 180, 120, 140)
  sun.addColorStop(0, 'rgba(255,248,230,0.7)')
  sun.addColorStop(1, 'rgba(255,248,230,0)')
  ctx.fillStyle = sun
  ctx.fillRect(0, 0, 1024, 512)
  return c
}

export function createSkyDome(): THREE.Mesh {
  const tex = new THREE.CanvasTexture(skyCanvas())
  tex.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(90, 32, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false }),
  )
  return mesh
}
