import * as THREE from 'three'

export type PartMat = THREE.Material
export type AddPart = (mesh: THREE.Mesh) => void

/** Revolve a side profile around the gun Z axis. Profile = [z, radius]. */
export function revolveZ(profile: ReadonlyArray<readonly [number, number]>, segs: number, mat: PartMat): THREE.Mesh {
  const pts = profile.map(([z, r]) => new THREE.Vector2(r, z))
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, segs), mat)
  mesh.rotation.x = Math.PI / 2
  return mesh
}

/** Cylinder aligned along Z. */
export function barrelZ(
  r0: number,
  r1: number,
  len: number,
  segs: number,
  mat: PartMat,
  z = 0,
  y = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, segs), mat)
  m.rotation.x = Math.PI / 2
  m.position.set(0, y, z)
  return m
}

/** Torus ring around the barrel (Z axis). Default torus lies in XY plane. */
export function ringZ(radius: number, tube: number, mat: PartMat, z: number, y = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 6, 16), mat)
  m.position.set(0, y, z)
  return m
}

/** Box centered at position. */
export function boxW(
  w: number,
  h: number,
  d: number,
  mat: PartMat,
  x: number,
  y: number,
  z: number,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  return m
}

/**
 * Extrude a YZ side silhouette along X (stock width).
 * Profile points are gun [z, y] — comb can rise above the grip line.
 */
export function extrudeYZ(
  profile: ReadonlyArray<readonly [number, number]>,
  width: number,
  mat: PartMat,
): THREE.Mesh {
  const shape = new THREE.Shape()
  shape.moveTo(profile[0][0], profile[0][1])
  for (let i = 1; i < profile.length; i++) shape.lineTo(profile[i][0], profile[i][1])
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, curveSegments: 10 })
  geo.translate(0, 0, -width / 2)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.y = Math.PI / 2
  return mesh
}

/** Trigger guard arc in YZ plane. */
export function triggerGuard(mat: PartMat, z: number, scale = 1): THREE.Mesh {
  const shape = new THREE.Shape()
  shape.absarc(0, 0, 0.028 * scale, Math.PI * 0.12, Math.PI * 0.88, false)
  const depth = 0.014 * scale
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 })
  geo.translate(0, 0, -depth / 2)
  const m = new THREE.Mesh(geo, mat)
  m.rotation.y = Math.PI / 2
  m.position.set(0, -0.055 * scale, z)
  return m
}

/** Half-cylinder heat shield with alpha vent texture. */
export function ventedHeatShield(length: number, radius: number, mat: PartMat, z: number, y: number): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius, radius, length, 28, 1, true, Math.PI * 0.12, Math.PI * 0.76)
  const m = new THREE.Mesh(geo, mat)
  m.rotation.x = Math.PI / 2
  m.position.set(0, y, z)
  return m
}

/** Tube along a 3D path. */
export function tubePath(points: THREE.Vector3[], radius: number, mat: PartMat): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points)
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 28, radius, 8, false), mat)
}

/** Waffle emboss on magazine side. */
export function waffleMag(add: AddPart, mat: PartMat, side: 1 | -1, z: number, y: number): void {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      add(boxW(0.003, 0.022, 0.022, mat, side * 0.027, y - 0.04 + row * 0.028, z - 0.02 + col * 0.028))
    }
  }
}

/** PSO-style scope on left side. */
export function buildPsoScope(
  add: AddPart,
  mats: { body: PartMat; metal: PartMat; rubber: PartMat; glass: PartMat },
): void {
  add(boxW(0.018, 0.042, 0.1, mats.metal, 0.052, 0.078, 0.02))
  add(boxW(0.012, 0.008, 0.14, mats.metal, 0.058, 0.1, 0.02))

  const body = revolveZ(
    [
      [0, 0.019],
      [0.12, 0.022],
      [0.24, 0.021],
      [0.28, 0.019],
    ],
    16,
    mats.body,
  )
  body.rotation.z = Math.PI / 2
  body.position.set(0.14, 0.1, 0.02)
  add(body)

  const bell = revolveZ(
    [
      [0, 0.03],
      [0.04, 0.022],
      [0.06, 0.019],
    ],
    14,
    mats.body,
  )
  bell.rotation.z = Math.PI / 2
  bell.position.set(0.28, 0.1, 0.02)
  add(bell)

  const eyecup = revolveZ(
    [
      [0, 0.028],
      [0.03, 0.032],
      [0.04, 0.03],
    ],
    12,
    mats.rubber,
  )
  eyecup.rotation.z = Math.PI / 2
  eyecup.position.set(0.06, 0.1, 0.02)
  add(eyecup)

  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.016, 12), mats.glass)
  lens.position.set(0.31, 0.1, 0.02)
  lens.rotation.y = -Math.PI / 2
  add(lens)

  for (const tz of [0.1, 0.18]) {
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.016, 8), mats.metal)
    turret.position.set(0.14, 0.118, tz)
    add(turret)
  }
}

export function flashHider(add: AddPart, mat: PartMat, z: number, y: number): void {
  add(barrelZ(0.016, 0.014, 0.075, 10, mat, z, y))
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2
    add(boxW(0.003, 0.022, 0.012, mat, Math.sin(angle) * 0.014, y + Math.cos(angle) * 0.014, z - 0.03))
  }
}

export function ribbedSuppressor(
  add: AddPart,
  mats: { body: PartMat; rib: PartMat; heat: PartMat },
  z: number,
  y: number,
  length: number,
  radius: number,
  ribs: number,
): void {
  add(barrelZ(radius, radius, length, 16, mats.body, z, y))
  for (let i = 0; i < ribs; i++) {
    const t = ribs > 1 ? i / (ribs - 1) : 0
    add(ringZ(radius + 0.001, 0.0022, mats.rib, z + length / 2 - t * length, y))
  }
  const heatLen = length * 0.2
  add(barrelZ(radius * 0.92, radius, heatLen, 14, mats.heat, z - length / 2 + heatLen / 2, y))
}

/** Horizontal pump grooves as torus rings around the Z axis. */
export function pumpGrooves(add: AddPart, count: number, z0: number, pitch: number, mat: PartMat, y = -0.015): void {
  for (let i = 0; i < count; i++) {
    const g = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.003, 4, 18), mat)
    g.position.set(0, y, z0 - i * pitch)
    add(g)
  }
}

/** Oval vent slots on handguard sides. */
export function handguardVents(add: AddPart, count: number, z0: number, pitch: number, mat: PartMat): void {
  for (let i = 0; i < count; i++) {
    for (const side of [-1, 1] as const) {
      add(boxW(0.006, 0.048, 0.072, mat, side * 0.044, 0.02, z0 - i * pitch))
    }
  }
}
