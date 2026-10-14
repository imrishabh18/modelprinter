/** Analytic rear-face clearance checks; no renderer or meshes are needed. */
type RearProfile = {
  bodyWidth: number
  rearCornerChamfer?: number
  rearStepped: boolean
  rearCornerRecessRadius: number
  rearCornerFilletRadius: number
}

export function isInsideNemaRearFace(x: number, y: number, p: RearProfile) {
  const h = p.bodyWidth / 2
  x = Math.abs(x)
  y = Math.abs(y)
  if (x > h || y > h) return false
  const chamfer = p.rearCornerChamfer ?? 0
  if (!p.rearStepped) return x + y <= 2 * h - chamfer
  const c = chamfer / Math.SQRT2
  if (c === 0) return true
  const recess = p.rearCornerRecessRadius
  const fillet = p.rearCornerFilletRadius
  const k = h - c + recess
  if (x > h - c && y > h - c)
    return x <= k && y <= k && Math.hypot(x - k, y - k) >= recess
  if (y > h - fillet && x > h - c - fillet)
    return Math.hypot(x - (h - c - fillet), y - (h - fillet)) <= fillet
  if (x > h - fillet && y > h - c - fillet)
    return Math.hypot(x - (h - fillet), y - (h - c - fillet)) <= fillet
  return true
}

const segmentDistance = (
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) => {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(
    0,
    Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)),
  )
  return Math.hypot(x - ax - t * dx, y - ay - t * dy)
}

const arcDistance = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
) => {
  const angle = (Math.atan2(y - cy, x - cx) + 2 * Math.PI) % (2 * Math.PI)
  if (angle >= start && angle <= end)
    return Math.abs(Math.hypot(x - cx, y - cy) - r)
  return Math.min(
    Math.hypot(x - cx - r * Math.cos(start), y - cy - r * Math.sin(start)),
    Math.hypot(x - cx - r * Math.cos(end), y - cy - r * Math.sin(end)),
  )
}

/** Reject a bore/head that touches or crosses a straight edge or either kind of arc. */
export function fitsNemaRearCircle(
  x: number,
  y: number,
  radius: number,
  p: RearProfile,
) {
  if (!isInsideNemaRearFace(x, y, p)) return false
  const h = p.bodyWidth / 2
  x = Math.abs(x)
  y = Math.abs(y)
  const chamfer = p.rearCornerChamfer ?? 0
  if (!p.rearStepped || chamfer === 0)
    return (
      Math.min(h - x, h - y, (2 * h - chamfer - x - y) / Math.SQRT2) > radius
    )
  const c = chamfer / Math.SQRT2
  const recess = p.rearCornerRecessRadius
  const fillet = p.rearCornerFilletRadius
  const a = h - c - fillet
  const k = h - c + recess
  const distance = Math.min(
    segmentDistance(x, y, -a, h, a, h),
    segmentDistance(x, y, h, -a, h, a),
    segmentDistance(x, y, h - c, h - fillet, h - c, k),
    segmentDistance(x, y, k, h - c, h - fillet, h - c),
    arcDistance(x, y, a, h - fillet, fillet, 0, Math.PI / 2),
    arcDistance(x, y, k, k, recess, Math.PI, (3 * Math.PI) / 2),
    arcDistance(x, y, h - fillet, a, fillet, 0, Math.PI / 2),
  )
  return distance > radius
}
