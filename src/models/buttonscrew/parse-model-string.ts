import { buttonScrewModelDefinitionSchema } from "./schema"
import type { RawModelprinterParams } from "../../parse-model-string"
import { splitModelStringTokens } from "../../split-model-string-tokens"

export function parseButtonScrewModelParams(raw: RawModelprinterParams) {
  const tokens = splitModelStringTokens(raw.string)
  if (raw.fn !== "buttonscrew" || tokens[0]?.toLowerCase() !== "buttonscrew")
    throw new Error("Expected buttonscrew without an inline argument")
  const props: Record<string, unknown> = { fn: "buttonscrew" }
  const lengths = {
    l: "length",
    length: "length",
    threadpitch: "threadPitch",
  } as const
  const selectors = {
    threadclass: "threadClass",
  } as const
  const booleanFlags: Record<string, { property: string; value: boolean }> = {
    hexsocket: { property: "hexSocket", value: true },
    fullthread: { property: "fullThread", value: true },
    righthanded: { property: "leftHanded", value: false },
    lefthanded: { property: "leftHanded", value: true },
  }
  for (const token of tokens.slice(1)) {
    if (token.toLowerCase() === "iso7380-1") {
      if ("iso73801" in props)
        throw new Error('Duplicate button screw property "iso73801"')
      props.iso73801 = true
      continue
    }
    const match = token.match(/^([a-z]+)(.*)$/i)
    if (!match) throw new Error(`Invalid button screw token "${token}"`)
    const name = match[1]!.toLowerCase()
    const value = match[2]!
    let property: string
    let parsed: unknown = value
    if (Object.hasOwn(booleanFlags, name)) {
      if (value) throw new Error(`Flag "${name}" does not accept a value`)
      property = booleanFlags[name]!.property
      parsed = booleanFlags[name]!.value
    } else if (name === "m") {
      property = "metricSize"
      parsed = `M${value}`
    } else if (Object.hasOwn(lengths, name))
      property = lengths[name as keyof typeof lengths]
    else if (Object.hasOwn(selectors, name)) {
      property = selectors[name as keyof typeof selectors]
      if (!/^\([^()]+\)$/.test(value))
        throw new Error(`Expected a parenthesized ${name}`)
      parsed = value.slice(1, -1).toLowerCase()
    } else if (name === "threads" || name === "nothreads") {
      if (value) throw new Error("Thread visibility flags cannot have a value")
      property = "showThreads"
      parsed = name === "threads"
    } else throw new Error(`Unknown button screw token "${token}"`)
    if (property in props)
      throw new Error(`Duplicate button screw property "${property}"`)
    props[property] = parsed
  }
  return buttonScrewModelDefinitionSchema.parse(props)
}
