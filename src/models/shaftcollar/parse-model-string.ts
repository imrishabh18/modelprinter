import { shaftCollarModelDefinitionSchema } from "./schema"
import type { RawModelprinterParams } from "../../parse-model-string"
import { splitModelStringTokens } from "../../split-model-string-tokens"

const tokenProperties: Record<string, string> = {
  bore: "boreDiameter",
  od: "outerDiameter",
  m: "metricSize",
  threadpitch: "threadPitch",
  threadclass: "threadClass",
  chamfer: "chamfer",
  w: "width",
  width: "width",
  screwz: "screwZ",
  screwangle: "screwAngle",
}

export function parseShaftCollarModelParams(raw: RawModelprinterParams) {
  const tokens = splitModelStringTokens(raw.string)
  if (raw.fn !== "shaftcollar" || tokens[0]?.toLowerCase() !== "shaftcollar")
    throw new Error("Expected an unadorned shaftcollar function")
  const props: Record<string, unknown> = {}
  for (const token of tokens.slice(1)) {
    const match = token.match(/^([a-z]+)(.*)$/i)
    const name = match?.[1]?.toLowerCase() ?? ""
    const value = match?.[2] ?? ""
    if (["setscrew", "lefthanded", "righthanded"].includes(name)) {
      if (value) throw new Error(`Flag "${name}" does not take a value`)
      const property = name === "setscrew" ? "setScrew" : "leftHanded"
      if (property in props)
        throw new Error(
          `Duplicate or conflicting shaftcollar flag "${property}"`,
        )
      props[property] = name !== "righthanded"
      continue
    }
    const property = tokenProperties[name]
    if (!property) throw new Error(`Unknown shaftcollar token "${token}"`)
    if (property in props)
      throw new Error(`Duplicate shaftcollar property "${property}"`)
    if (!value) throw new Error(`Token "${name}" requires a value`)
    if (property === "threadClass") {
      const argument = value.match(/^\(([^()]+)\)$/)
      if (!argument)
        throw new Error(`Token "${name}" requires one parenthesized argument`)
      props[property] = argument[1]!.toUpperCase()
    } else if (property === "metricSize") {
      if (!/^\d+(?:\.\d+)?$/.test(value))
        throw new Error("m requires a unitless metric designation")
      props[property] = `M${value}`
    } else if (property === "screwAngle") {
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:deg)?$/i.test(value))
        throw new Error("screwangle requires an angle in degrees")
      props[property] = Number(value.replace(/deg$/i, ""))
    } else {
      props[property] = value
    }
  }
  return shaftCollarModelDefinitionSchema.parse({ fn: "shaftcollar", ...props })
}
