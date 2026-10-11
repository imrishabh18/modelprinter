import { cableGrommetModelDefinitionSchema } from "./schema"
import type { RawModelprinterParams } from "../../parse-model-string"
import { splitModelStringTokens } from "../../split-model-string-tokens"

const lengths = {
  panelhole: "panelHoleDiameter",
  panelholediameter: "panelHoleDiameter",
  id: "innerDiameter",
  innerdiameter: "innerDiameter",
  od: "outerDiameter",
  outerdiameter: "outerDiameter",
  h: "height",
  height: "height",
  groovew: "grooveWidth",
  groovewidth: "grooveWidth",
  grooved: "grooveDepth",
  groovedepth: "grooveDepth",
} as const

export function parseCableGrommetModelParams(raw: RawModelprinterParams) {
  const tokens = splitModelStringTokens(raw.string)
  if (raw.fn !== "cablegrommet" || !/^cablegrommet$/i.test(tokens[0]!))
    throw new Error("Expected cablegrommet without an inline value")
  const props: Record<string, unknown> = { fn: "cablegrommet" }
  for (const token of tokens.slice(1)) {
    const match = token.match(/^([a-z]+)(.*)$/i)
    const name = match?.[1]?.toLowerCase()
    const value = match?.[2]
    if (!name) throw new Error(`Invalid grommet token "${token}"`)
    let property: string
    let parsed: unknown = value
    if (name in lengths) property = lengths[name as keyof typeof lengths]
    else if (name === "symmetricring") {
      property = "symmetricRing"
      if (value !== "") throw new Error("symmetricring is a value-free flag")
      parsed = true
    } else throw new Error(`Unknown grommet token "${token}"`)
    if (property in props)
      throw new Error(`Grommet property "${property}" is set more than once`)
    props[property] = parsed
  }
  return cableGrommetModelDefinitionSchema.parse(props)
}
