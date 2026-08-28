import * as THREE from 'three'

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

/** Worn gunmetal with edge scratches. */
export function weaponMetalTexture(tone = 0): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  const g = 42 + tone * 8
  ctx.fillStyle = `rgb(${g},${g + 2},${g + 6})`
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 3000; i++) {
    const s = 30 + Math.random() * 40
    ctx.fillStyle = `rgba(${s},${s + 2},${s + 4},0.12)`
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 2 + Math.random() * 3)
  }
  for (let i = 0; i < 18; i++) {
    ctx.strokeStyle = `rgba(180,190,200,${0.04 + Math.random() * 0.08})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.random() * 256, Math.random() * 256)
    ctx.lineTo(Math.random() * 256, Math.random() * 256)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Weathered wood stock / pump. */
export function weaponWoodTexture(seed = 1): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 256)
  const base = 88 + seed * 6
  ctx.fillStyle = `rgb(${base},${base * 0.68},${base * 0.42})`
  ctx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 3) {
    ctx.strokeStyle = `rgba(${base * 0.45},${base * 0.3},${base * 0.2},0.25)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x < 256; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.05 + seed) * 1.5)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function weaponMetalMat(tone = 0): THREE.MeshStandardMaterial {
  const map = weaponMetalTexture(tone)
  return new THREE.MeshStandardMaterial({
    map,
    color: 0x8a9098,
    metalness: 0.82,
    roughness: 0.38,
  })
}

export function weaponBluedMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: weaponMetalTexture(2),
    color: 0x3a4048,
    metalness: 0.78,
    roughness: 0.42,
  })
}

export function weaponWoodMat(seed = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: weaponWoodTexture(seed),
    roughness: 0.86,
    metalness: 0.02,
  })
}

export function weaponPolyMat(color = 0x2a3038): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.08 })
}

/** Ribbed suppressor tube with optional heat discoloration at the muzzle. */
export function weaponSuppressorMat(heatTip = false): THREE.MeshStandardMaterial {
  const [c, ctx] = canvas(128, 256)
  ctx.fillStyle = '#2e343c'
  ctx.fillRect(0, 0, 128, 256)
  for (let y = 0; y < 256; y += 8) {
    const shade = 38 + (y % 16 === 0 ? 10 : 0)
    ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 6})`
    ctx.fillRect(0, y, 128, 4)
  }
  if (heatTip) {
    const grad = ctx.createLinearGradient(0, 0, 0, 48)
    grad.addColorStop(0, 'rgba(180,60,200,0.85)')
    grad.addColorStop(0.45, 'rgba(120,40,160,0.5)')
    grad.addColorStop(1, 'rgba(46,52,60,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 128, 48)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshStandardMaterial({
    map: tex,
    color: heatTip ? 0xffffff : 0x3a4048,
    metalness: 0.8,
    roughness: 0.36,
  })
}

export function weaponTapeMat(color = 0xb8bcc4): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.02 })
}

export function weaponRubberMat(color = 0x1a1c20): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.94, metalness: 0 })
}
