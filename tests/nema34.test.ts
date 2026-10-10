import { expect, test } from "bun:test"
import {
  mp,
  nemaMotorModelPropsSchema,
  getNemaMotorReferencePoints,
} from "../src"

test("NEMA34 resolves its envelope and assembly reference points", () => {
  const definition = mp.string("nema34").json()
  if (definition.fn !== "nema") throw new Error("Expected NEMA")
  expect(definition).toMatchObject({
    fn: "nema",
    nemaSize: 34,
    bodyWidth: 86,
    bodyLength: 80,
    mountingHoleSpacing: 69.6,
    mountingHoleDiameter: 6.5,
    mountingHoleThrough: true,
    pilotDiameter: 73,
    pilotLength: 1.6,
    shaftDiameter: 14,
    shaftLength: 32,
    shaftShape: "round",
  })
  const { fn, ...props } = definition
  expect(nemaMotorModelPropsSchema.parse({ nemaSize: 34 })).toEqual(props)
  const references = getNemaMotorReferencePoints({ nemaSize: 34 })
  expect(references.backface.position).toEqual({ x: 0, y: 0, z: -80 })
  expect(references.shafttip.position).toEqual({ x: 0, y: 0, z: 32 })
  expect(references.shaftflat).toBeUndefined()
  expect(
    mp.string("NEMA34_l10cm_shaftdiameter0.5in_shaftlength4cm").json(),
  ).toMatchObject({ bodyLength: 100, shaftDiameter: 12.7, shaftLength: 40 })
})

test("NEMA34 accepts wire aliases and rejects unsupported frames and conflicts", () => {
  for (const family of ["ph", "sh"]) {
    const canonical = mp.string(`nema34_jst${family}4_wireangle90deg`).json()
    for (const alias of [
      `jst4_${family}`,
      `jst_${family}_4`,
      `jst-${family}-4`,
    ])
      expect(mp.string(`NEMA34_${alias}_wireangle90deg`).json()).toEqual(
        canonical,
      )
  }
  for (const source of [
    "nema340",
    "nema34.5",
    "nema35",
    "nema34_jst4_ph_nowires",
    "nema34_jst17_ph",
    "nema34_round_dshaft",
    "nema34_pilotdiameter86mm",
    "nema34_holespacing85mm",
  ])
    expect(() => mp.string(source).json()).toThrow()
})

test("NEMA34 rear profile and fasteners are independent of the front flange", () => {
  expect(mp.string("nema34").json()).toMatchObject({
    backFaceHoleSpacing: 40,
    rearCornerChamfer: 24,
    mountingHoleSpacing: 69.6,
    faceCornerChamfer: 2,
    cornerProfile: "stepped",
    backFace: "plain",
    wireSideAngle: 90,
    wireLength: 25,
  })
  expect(
    mp.string("nema34_holespacing68mm_facechamfer3mm").json(),
  ).toMatchObject({
    backFaceHoleSpacing: 40,
    rearCornerChamfer: 24,
  })
  expect(
    mp.string("nema34_rearchamfer1cm_backholespacing6cm").json(),
  ).toMatchObject({
    rearCornerChamfer: 10,
    backFaceHoleSpacing: 60,
  })
  for (const source of [
    "nema34_backfacescrews_backholespacing69.6mm",
    "nema34_backfacescrews_backholespacing58mm",
    "nema34_plainbackface_rearchamfer43mm",
  ])
    expect(() => mp.string(source).json()).toThrow()
})

test("NEMA34 wire exit follows the stepped body and stays consistent when hidden", () => {
  const p = { nemaSize: 34 as const, wireSideAngle: 45 }
  const visible = getNemaMotorReferencePoints(p).wireside
  expect(visible.position.x).toBeCloseTo(27.2010101268, 5)
  expect(visible.position.y).toBeCloseTo(visible.position.x, 5)
  expect(visible.position.z).toBe(-69)
  expect(
    getNemaMotorReferencePoints({ ...p, wireConnection: "none" }).wireside,
  ).toEqual(visible)
})
