import { expect, test } from "bun:test"
import {
  helicalGearModelDefinitionSchema,
  helicalGearModelPropsSchema,
  mp,
  wormGearModelDefinitionSchema,
  wormGearModelPropsSchema,
} from "../src"

const families = [
  {
    name: "helicalgear",
    propsSchema: helicalGearModelPropsSchema,
    definitionSchema: helicalGearModelDefinitionSchema,
  },
  {
    name: "wormgear",
    propsSchema: wormGearModelPropsSchema,
    definitionSchema: wormGearModelDefinitionSchema,
  },
] as const

for (const { name, propsSchema, definitionSchema } of families) {
  test(`${name} uses a boolean hand property without rewriting its string`, () => {
    expect(propsSchema.parse({}).leftHanded).toBe(false)
    for (const [flag, leftHanded] of [
      ["left", true],
      ["right", false],
    ] as const) {
      const source = `${name}_${flag}`
      const builder = mp.string(source)
      expect(builder.params().string).toBe(source)
      expect<unknown>(builder.json()).toEqual({
        fn: name,
        ...propsSchema.parse({ leftHanded }),
      })
      expect<unknown>(definitionSchema.parse(builder.json())).toEqual(
        builder.json(),
      )
      expect(builder.json()).not.toHaveProperty("handedness")
    }
  })

  test(`${name} rejects hand repeats, conflicts, payloads and deprecated selectors`, () => {
    for (const suffix of [
      "left_left",
      "right_right",
      "left_right",
      "right_left",
      "left(true)",
      "right(false)",
      "left1",
      "right0",
      "hand(left)",
      "handedness(right)",
      "leftHanded(true)",
    ]) {
      expect(() => mp.string(`${name}_${suffix}`).json()).toThrow()
    }
    for (const props of [
      { handedness: "left" },
      { handedness: "right" },
      { leftHanded: "left" },
      { leftHanded: 1 },
    ]) {
      expect(() => propsSchema.parse(props)).toThrow()
      expect(() => definitionSchema.parse({ fn: name, ...props })).toThrow()
    }
  })
}
