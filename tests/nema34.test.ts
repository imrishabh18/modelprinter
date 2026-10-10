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
