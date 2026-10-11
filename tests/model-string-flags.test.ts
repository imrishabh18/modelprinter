import { expect, test } from "bun:test"
import {
  mp,
  parseModelStringParams,
  modelDefinitionSchema,
  ModelRegistry,
} from "../src"
import { registerAllModels } from "../src/generated/models"
import { modelStringFlagCases } from "./fixtures/model-string-flag-cases"

const registry = new ModelRegistry()
registerAllModels(registry)

for (const [base, flag, deprecated, property, value] of modelStringFlagCases) {
  test(`${base.split("_")[0]} ${flag} resolves to a boolean without enum expansion`, () => {
    const source = `${base}_${flag}`
    const expected = { ...mp.string(base).json(), [property]: value }
    const builder = mp.string(source)
    expect(builder.json()).toEqual(expected)
    expect(registry.parse(parseModelStringParams(source))).toEqual(expected)
    expect(modelDefinitionSchema.parse(expected)).toEqual(expected)
    expect(mp.string(source.toUpperCase()).json()).toEqual(expected)
    expect(builder.params()).toEqual(parseModelStringParams(source))
    expect(mp.string(builder.params().string).json()).toEqual(expected)
    const parsed = builder.json() as unknown as Record<string, unknown>
    expect(typeof parsed[property]).toBe("boolean")
    // Check the old selector alone so duplicate-flag rejection cannot hide it.
    const retired = mp.string(`${base}_${deprecated}`)
    expect(retired.params()).toEqual(
      parseModelStringParams(`${base}_${deprecated}`),
    )
    expect(() => retired.json()).toThrow()
    for (const invalid of [
      `${source}_${flag}`,
      `${base}_${flag}(true)`,
      `${base}_${flag}1`,
    ])
      expect(() => mp.string(invalid).json()).toThrow()
  })
}

test("handedness alternatives cannot be repeated or combined", () => {
  for (const base of [
    "shaftcollar_bore8mm_od16mm_w8mm_m4",
    "hexbolt_m4_l20mm",
    "compressionspring_od8mm_wire1mm_l20mm_turns8",
  ])
    for (const flags of [
      "lefthanded_righthanded",
      "righthanded_lefthanded",
      "lefthanded_lefthanded",
      "righthanded_righthanded",
    ])
      expect(() =>
        registry.parse(parseModelStringParams(`${base}_${flags}`)),
      ).toThrow()
})

test("geometry flags remain model-local and retain unsupported-option validation", () => {
  for (const source of [
    "plainbushing_id8mm_od12mm_l20mm_setscrew",
    "shaftcollar_bore8mm_od16mm_w8mm_m4_singleclamp",
    "hexbolt_m4_l20mm_phillips",
    "buttonscrew_m4_l20mm_lefthanded",
    "hexnut_m6_lefthanded",
  ])
    expect(() => mp.string(source).json()).toThrow()
})
