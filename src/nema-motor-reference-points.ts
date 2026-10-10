import {
  nemaMotorModelPropsSchema,
  type NemaMotorModelPropsInput,
} from "./nema-motor-schema"

export interface NemaMotorReferencePoint {
  position: { x: number; y: number; z: number }
  direction: { x: number; y: number; z: number }
}

/** Named points/directions in the motor-local right-handed mm frame: +X right,
 * +Y top, +Z along the shaft. Origin is the front mounting face. Points acquire
 * translation; unit directions do not. No geometry is generated here.
 */
export function getNemaMotorReferencePoints(input: NemaMotorModelPropsInput) {
  const p = nemaMotorModelPropsSchema.parse(input)
  const radians = (p.wireSideAngle * Math.PI) / 180
  const x = Math.cos(radians),
    y = Math.sin(radians)
  // Intersect the direction with the cap's chamfered square specification.
  let radius = Math.min(
    p.bodyWidth / 2 / Math.max(Math.abs(x), Math.abs(y)),
    (p.bodyWidth - p.faceCornerChamfer) / (Math.abs(x) + Math.abs(y)),
  )
  if (p.nemaSize === 34 && p.cornerProfile === "stepped") {
    const h = p.bodyWidth / 2,
      c = p.bodyCornerChamfer / Math.SQRT2,
      r = Math.min(4, c / 4)
    const contains = (distance: number) => {
      const a = Math.abs(distance * x),
        b = Math.abs(distance * y)
      if (a > h || b > h) return false
      if (c === 0) return true
      if (a > h - c && b > h - c)
        return (
          a <= h - c + r &&
          b <= h - c + r &&
          Math.hypot(a - (h - c + r), b - (h - c + r)) >= r
        )
      if (b > h - r && a > h - c - r)
        return Math.hypot(a - (h - c - r), b - (h - r)) <= r
      if (a > h - r && b > h - c - r)
        return Math.hypot(a - (h - r), b - (h - c - r)) <= r
      return true
    }
    let low = 0,
      high = p.bodyWidth
    for (let i = 0; i < 50; i++) {
      const mid = (low + high) / 2
      if (contains(mid)) low = mid
      else high = mid
    }
    radius = low
  }
  const flatRadians = (p.shaftFlatAngle * Math.PI) / 180
  return {
    frontface: {
      position: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 0, z: 1 },
    },
    backface: {
      position: { x: 0, y: 0, z: -p.bodyLength },
      direction: { x: 0, y: 0, z: -1 },
    },
    shafttip: {
      position: { x: 0, y: 0, z: p.shaftLength },
      direction: { x: 0, y: 0, z: 1 },
    },
    wireside: {
      position: {
        x: radius * x,
        y: radius * y,
        z:
          p.nemaSize === 34
            ? -p.bodyLength + p.rearCapLength + 3
            : -p.bodyLength + p.rearCapLength / 2,
      },
      direction: { x, y, z: 0 },
    },
    shaftflat:
      p.shaftShape === "d"
        ? {
            position: {
              x:
                (p.shaftDiameter / 2 - p.shaftFlatDepth) *
                Math.cos(flatRadians),
              y:
                (p.shaftDiameter / 2 - p.shaftFlatDepth) *
                Math.sin(flatRadians),
              z: p.shaftLength - p.shaftFlatLength / 2,
            },
            direction: {
              x: Math.cos(flatRadians),
              y: Math.sin(flatRadians),
              z: 0,
            },
          }
        : undefined,
  } satisfies Record<string, NemaMotorReferencePoint | undefined>
}
