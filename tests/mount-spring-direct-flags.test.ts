import { expect, test } from "bun:test"
import { parseShaftCollarModelParams } from "../src/models/shaftcollar/parse-model-string"
import { parseClampingShaftCollarModelParams } from "../src/models/clampingshaftcollar/parse-model-string"
import { parseRigidCouplerModelParams } from "../src/models/rigidcoupler/parse-model-string"
import { parseCompressionSpringModelParams } from "../src/models/compressionspring/parse-model-string"

const cases = [
  {
    fn: "shaftcollar",
    base: "shaftcollar_bore8mm_od16mm_w8mm_m4",
    parse: parseShaftCollarModelParams,
    flags: "setscrew_lefthanded",
    legacy: ["mount(setscrew)", "threadhand(left)"],
  },
  {
    fn: "clampingshaftcollar",
    base: "clampingshaftcollar_bore8mm_od18mm_w9mm_split1mm_m4",
    parse: parseClampingShaftCollarModelParams,
    flags: "singleclamp_lefthanded",
    legacy: ["mount(singleclamp)", "threadhand(left)"],
  },
  {
    fn: "rigidcoupler",
    base: "rigidcoupler_bore8mm_od20mm_l25mm_m4",
    parse: parseRigidCouplerModelParams,
    flags: "setscrew_lefthanded",
    legacy: ["mount(setscrew)", "threadhand(left)"],
  },
  {
    fn: "compressionspring",
    base: "compressionspring_od8mm_wire1mm_l20mm_turns8",
    parse: parseCompressionSpringModelParams,
    flags: "custom_closedground_free_lefthanded",
    legacy: ["spec(custom)", "ends(closedground)", "hand(left)", "state(free)"],
  },
]

for (const entry of cases) {
  test(`${entry.fn} direct parser accepts flags and rejects legacy selectors`, () => {
    const direct = (suffix: string) =>
      entry.parse({ fn: entry.fn, string: `${entry.base}_${suffix}` })
    expect(direct(entry.flags).leftHanded).toBe(true)
    expect(direct("righthanded").leftHanded).toBe(false)
    for (const suffix of [
      ...entry.legacy,
      "lefthanded_righthanded",
      "lefthanded(true)",
    ])
      expect(() => direct(suffix), suffix).toThrow()
  })
}
