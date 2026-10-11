import { expect, test } from "bun:test"
import {
  cableGrommetModelPropsSchema,
  getCableGrommetDimensions,
  modelDefinitionSchema,
  modelprinter,
  mp,
  parseCableGrommetModelParams,
} from "../src"

const example =
  "cablegrommet_panelhole20mm_id10mm_od24mm_h8mm_groovew3mm_grooved2mm_symmetricring"

test("cable grommet roadmap example, registry and union", () => {
  const builder = mp.string(example)
  expect(builder.params()).toMatchObject({
    fn: "cablegrommet",
    panelhole: "20mm",
    grooved: "2mm",
  })
  const model = builder.json()
  expect(model).toEqual({
    fn: "cablegrommet",
    panelHoleDiameter: 20,
    innerDiameter: 10,
    outerDiameter: 24,
    height: 8,
    grooveWidth: 3,
    grooveDepth: 2,
    symmetricRing: true,
  })
  expect(modelDefinitionSchema.parse(model)).toEqual(model)
  expect(modelprinter.getModelNames()).toContain("cablegrommet")
  expect(
    getCableGrommetDimensions({
      panelHoleDiameter: 20,
      innerDiameter: 10,
      outerDiameter: 24,
      height: 8,
      grooveWidth: 3,
      grooveDepth: 2,
    }),
  ).toEqual({
    grooveRootDiameter: 20,
    flangeThickness: 2.5,
    minimumWallThickness: 5,
    grooveStartZ: -1.5,
    grooveEndZ: 1.5,
  })
})

test("cable grommet units, default shape and aliases", () => {
  expect(
    mp
      .string(
        "CABLEGROMMET_PANELHOLEDIAMETER2cm_INNERDIAMETER10mm_OUTERDIAMETER0.024m_HEIGHT8mm_GROOVEWIDTH3mm_GROOVEDEPTH0.2cm",
      )
      .json(),
  ).toEqual(mp.string(example).json())
  const props = cableGrommetModelPropsSchema.parse({
    panelHoleDiameter: "1in",
    innerDiameter: "0.5in",
    outerDiameter: "1.2in",
    height: "0.4in",
    grooveWidth: "0.1in",
    grooveDepth: "0.1in",
  })
  expect(props.panelHoleDiameter).toBeCloseTo(25.4)
  expect(props.grooveDepth).toBeCloseTo(2.54)
  const dimensions = getCableGrommetDimensions({
    ...props,
    grooveDepth: props.grooveDepth + 1e-10,
  })
  expect(dimensions.minimumWallThickness).toBe(
    (dimensions.grooveRootDiameter - props.innerDiameter) / 2,
  )
})

test("cable grommet rejects conflicting contracts and malformed strings", () => {
  for (const source of [
    "cablegrommet",
    `${example}_id12mm`,
    `${example}_innerdiameter12mm`,
    `${example}_mystery2mm`,
    example.replace("20mm", "19mm"),
    example.replace("id10mm", "id20mm"),
    example.replace("groovew3mm", "groovew8mm"),
    example.replace("grooved2mm", "grooved12mm"),
    example.replace("symmetricring", "shape(split)"),
    example.replace("symmetricring", "shapesymmetricring"),
    example.replace("id10mm", "id"),
    example.replace("id10mm", "id1.0.1mm"),
    example.replace("id10mm", "id0mm"),
    example.replace("id10mm", "id-1mm"),
    example.replace("cablegrommet_", "cablegrommet2_"),
    `${example}_`,
    example.replace("symmetricring", "symmetricring(true)"),
  ])
    expect(() => mp.string(source).json()).toThrow()
  expect(() =>
    parseCableGrommetModelParams({ fn: "wrong", string: example }),
  ).toThrow()
})

test("cable grommet direct schema enforces dimensions and strictness", () => {
  const props = {
    panelHoleDiameter: 20,
    innerDiameter: 10,
    outerDiameter: 24,
    height: 8,
    grooveWidth: 3,
    grooveDepth: 2,
  }
  for (const changes of [
    { innerDiameter: 20 },
    { panelHoleDiameter: 24 },
    { grooveWidth: 8 },
    { grooveDepth: 3 },
    { height: NaN },
    { outerDiameter: Infinity },
    { innerDiameter: "1.2.3mm" },
    { innerDiameter: 0 },
    { innerDiameter: 19.999999999, grooveDepth: 2.000000001 },
    { extra: true },
  ])
    expect(() =>
      cableGrommetModelPropsSchema.parse({ ...props, ...changes }),
    ).toThrow()
})

test("cablegrommet uses a direct boolean flag and rejects legacy selectors", () => {
  const base =
    "cablegrommet_panelhole20mm_id10mm_od24mm_h8mm_groovew3mm_grooved2mm"
  const omitted = mp.string(base).json()
  if (omitted.fn !== "cablegrommet") throw new Error("Unexpected model")
  expect(omitted.symmetricRing).toBe(true)
  expect(omitted).not.toHaveProperty("shape")
  expect(mp.string(base + "_symmetricring").json()).toEqual(omitted)
  expect(mp.string((base + "_symmetricring").toUpperCase()).json()).toEqual(
    omitted,
  )
  expect(mp.string(base + "_symmetricring").params()).toMatchObject({
    symmetricring: true,
    string: base + "_symmetricring",
  })
  for (const suffix of [
    "symmetricring_symmetricring",
    "symmetricring1",
    "symmetricring(true)",
    "symmetricring(false)",
    "shape(symmetricring)",
    "shape(unsupported)",
  ])
    expect(() => mp.string(base + "_" + suffix).json()).toThrow()
  const { fn, ...props } = omitted
  for (const value of [false, "true", 1, null])
    expect(() =>
      cableGrommetModelPropsSchema.parse({ ...props, symmetricRing: value }),
    ).toThrow()
  expect(() =>
    cableGrommetModelPropsSchema.parse({ ...props, shape: "symmetricring" }),
  ).toThrow()
})
