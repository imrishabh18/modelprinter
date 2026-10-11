import { expect, test } from "bun:test"
import { mp, sheetMetalHoleSchema, sheetMetalModelPropsSchema } from "../src"

test("sheetmetal form flags default to plate and normalize individual choices", () => {
  expect(mp.string("sheetmetal_w20_l20").json()).toMatchObject({
    plate: true,
    angle: false,
    channel: false,
  })
  for (const flag of ["plate", "angle", "channel"] as const) {
    expect(mp.string(`sheetmetal_${flag}_w20_l20`).json()).toMatchObject({
      plate: flag === "plate",
      angle: flag === "angle",
      channel: flag === "channel",
    })
    expect(
      sheetMetalModelPropsSchema.parse({
        width: 20,
        baseLength: 20,
        [flag]: true,
      }),
    ).toMatchObject({
      plate: flag === "plate",
      angle: flag === "angle",
      channel: flag === "channel",
    })
  }
  expect(
    sheetMetalModelPropsSchema.parse({
      width: 20,
      baseLength: 20,
      plate: false,
    }),
  ).toMatchObject({ plate: true })
})

test("sheetmetal rejects conflicting flags and legacy selector inputs", () => {
  for (const suffix of [
    "plate_plate",
    "angle_channel",
    "plate_angle",
    "profile(channel)",
    "angle(true)",
  ])
    expect(
      () => mp.string(`sheetmetal_${suffix}_w20_l20`).json(),
      suffix,
    ).toThrow()
  for (const extra of [
    { profile: "angle" },
    { angle: "true" },
    { plate: true, angle: true },
    { angle: true, channel: true },
  ])
    expect(() =>
      sheetMetalModelPropsSchema.parse({ width: 20, baseLength: 20, ...extra }),
    ).toThrow()
})

test("sheetmetal cutout flags preserve panel coordinates and reject legacy shapes", () => {
  const position = { panel: "base", u: 2, v: -3 } as const
  expect(
    sheetMetalHoleSchema.parse({ ...position, round: true, diameter: 4 }),
  ).toEqual({
    ...position,
    round: true,
    slot: false,
    diameter: 4,
  })
  expect(
    sheetMetalHoleSchema.parse({
      ...position,
      slot: true,
      length: 8,
      width: 2,
    }),
  ).toEqual({
    ...position,
    round: false,
    slot: true,
    length: 8,
    width: 2,
    axis: "v",
  })
  for (const extra of [
    { shape: "round", diameter: 4 },
    { shape: "slot", length: 8, width: 2 },
    { round: true, slot: true, diameter: 4 },
    { round: false, slot: false, diameter: 4 },
    { round: "true", diameter: 4 },
  ])
    expect(() =>
      sheetMetalHoleSchema.parse({ ...position, ...extra }),
    ).toThrow()
})
