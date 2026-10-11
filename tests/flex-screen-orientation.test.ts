import { expect, test } from "bun:test"
import * as publicApi from "../src"
import { flexScreenModelPropsSchema, mp } from "../src"

const flat = {
  sitsFlat: true,
  sitsFlatBelowBoard: false,
  foldedToFaceAboveBoard: false,
  foldedToFaceBelowBoard: false,
  foldedToRightAngleAboveBoard: false,
  foldedToRightAngleBelowBoard: false,
} as const

const placements = [
  ["sitsFlat", ["sitsflat"]],
  ["sitsFlatBelowBoard", ["sitsflatbelow", "sitsflatbelowboard"]],
  [
    "foldedToFaceAboveBoard",
    ["foldsabove", "foldsaboveboard", "foldedtofaceaboveboard"],
  ],
  [
    "foldedToFaceBelowBoard",
    ["foldsbelow", "foldsbelowboard", "foldedtofacebelowboard"],
  ],
  [
    "foldedToRightAngleAboveBoard",
    ["rightangleabove", "rightangleaboveboard", "foldedtorightangleaboveboard"],
  ],
  [
    "foldedToRightAngleBelowBoard",
    ["rightanglebelow", "rightanglebelowboard", "foldedtorightanglebelowboard"],
  ],
] as const

test("FlexScreen exposes boolean placements and resolves a default and aliases", () => {
  expect(flexScreenModelPropsSchema.parse({})).toEqual(flat)
  expect(mp.string("flexscreen30_p0.5").json()).toEqual({
    fn: "flexscreen",
    pinCount: 30,
    pitch: 0.5,
    ...flat,
  })
  expect("flexScreenOrientationSchema" in publicApi).toBe(false)
  for (const [flag, aliases] of placements) {
    const expected = Object.fromEntries(
      placements.map(([key]) => [key, key === flag]),
    ) as Record<keyof typeof flat, boolean>
    expect(flexScreenModelPropsSchema.parse({ [flag]: true })).toEqual(expected)
    expect(flexScreenModelPropsSchema.parse(expected)).toEqual(expected)
    for (const alias of aliases) {
      const source = `flexscreen_w2cm_${alias.toUpperCase()}`
      expect(mp.string(source).params()).toMatchObject({
        [alias]: true,
        string: source,
      })
      expect(mp.string(source).json()).toEqual({
        fn: "flexscreen",
        width: 20,
        ...expected,
      })
    }
  }
  for (const [alias, flag] of [
    ["foldsAboveBoard", "foldedToFaceAboveBoard"],
    ["foldsBelowBoard", "foldedToFaceBelowBoard"],
  ] as const) {
    const normalized = flexScreenModelPropsSchema.parse({ [alias]: true })
    expect(normalized[flag]).toBe(true)
    expect(alias in normalized).toBe(false)
  }
})

test("FlexScreen rejects enum APIs, invalid boolean values, missing selections and repeated aliases", () => {
  for (const value of ["sitsFlat", "foldedToFaceAboveBoard", null, false]) {
    expect(() =>
      flexScreenModelPropsSchema.parse({ orientation: value }),
    ).toThrow()
  }
  for (const [flag] of placements) {
    for (const value of ["true", 1, null]) {
      expect(() =>
        flexScreenModelPropsSchema.parse({ [flag]: value }),
      ).toThrow()
    }
    expect(() => flexScreenModelPropsSchema.parse({ [flag]: false })).toThrow(
      "must be true",
    )
  }
  expect(() =>
    flexScreenModelPropsSchema.parse(
      Object.fromEntries(placements.map(([flag]) => [flag, false])),
    ),
  ).toThrow("must be true")
  expect(() =>
    flexScreenModelPropsSchema.parse({ foldsAboveBoard: false }),
  ).toThrow("must be true")
  expect(() =>
    flexScreenModelPropsSchema.parse({
      foldedToFaceAboveBoard: true,
      foldsAboveBoard: true,
    }),
  ).toThrow("Only one")
  for (const source of [
    "flexscreen_sitsflat_sitsflat",
    "flexscreen_sitsflatbelow_sitsflatbelowboard",
    "flexscreen_foldsabove_foldsaboveboard",
    "flexscreen_foldsbelow_foldedtofacebelowboard",
    "flexscreen_rightangleabove_foldedtorightangleaboveboard",
    "flexscreen_rightanglebelow_rightanglebelowboard",
    "flexscreen_sitsflat_foldsabove",
    "flexscreen_foldsabove_foldsbelow",
    "flexscreen_sitsflat(true)",
    "flexscreen_sitsflatfalse",
    "flexscreen_sitsflat1",
    "flexscreen_orientation(sitsFlat)",
  ])
    expect(() => mp.string(source).json()).toThrow()
})

test("FlexScreen bare folds keep relative distance and value-bearing ratio and color data", () => {
  expect(
    mp
      .string(
        "flexscreen30_w2cm_foldsabove_distance1cm_ratio4x3_screencolor(#123456)",
      )
      .json(),
  ).toMatchObject({
    pinCount: 30,
    width: 20,
    foldedToFaceAboveBoard: true,
    sitsFlat: false,
    distanceAboveBoard: 10,
    aspectRatio: "4:3",
    screenColor: "#123456",
  })
  expect(
    mp.string("flexscreen_foldedtofacebelowboard_distance0.5cm").json(),
  ).toMatchObject({
    foldedToFaceBelowBoard: true,
    distanceBelowBoard: 5,
  })
  expect(() => mp.string("flexscreen_sitsflat_distance10").json()).toThrow(
    "requires foldsabove or foldsbelow",
  )
  expect(
    flexScreenModelPropsSchema.parse({
      aspectRatio: [4, 3],
      screenRotation: [0, "90deg", 0],
      screenColor: "#123456",
    }),
  ).toMatchObject({
    ...flat,
    aspectRatio: [4, 3],
    screenRotation: [0, "90deg", 0],
    screenColor: "#123456",
  })
})
