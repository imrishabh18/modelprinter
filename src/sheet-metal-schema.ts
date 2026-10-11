import { z } from "zod"
import {
  modelLengthSchema,
  positiveModelLengthSchema,
} from "./model-length-schema"

const holePosition = {
  panel: z.enum(["base", "left", "right"]),
  /** Panel-local mm, centered on its straight section: u along its length,
   * v along the sheet width. Side-panel u increases upward. */
  u: modelLengthSchema,
  v: modelLengthSchema,
}
export const sheetMetalHoleSchema = z.union([
  z
    .object({
      ...holePosition,
      round: z.literal(true),
      slot: z.literal(false).default(false),
      diameter: positiveModelLengthSchema,
    })
    .strict(),
  z
    .object({
      ...holePosition,
      round: z.literal(false).default(false),
      slot: z.literal(true),
      length: positiveModelLengthSchema,
      width: positiveModelLengthSchema,
      axis: z.enum(["u", "v"]).default("v"),
    })
    .strict(),
])
const sheetMetalShape = {
  plate: z.boolean().default(false),
  angle: z.boolean().default(false),
  channel: z.boolean().default(false),
  width: positiveModelLengthSchema,
  /** Straight base length between bend tangencies, not overall width. */
  baseLength: positiveModelLengthSchema,
  /** Straight flange length above the bend tangent. */
  flangeHeight: positiveModelLengthSchema.default(12),
  thickness: positiveModelLengthSchema.default(1),
  insideBendRadius: positiveModelLengthSchema.default(1),
  holes: z.array(sheetMetalHoleSchema).max(100).default([]),
}
type InputProps = z.output<z.ZodObject<typeof sheetMetalShape>>

function validateFlags(props: InputProps, context: z.RefinementCtx) {
  if ([props.plate, props.angle, props.channel].filter(Boolean).length > 1)
    context.addIssue({
      code: "custom",
      message: "Specify at most one of plate, angle, or channel",
    })
}

function resolveFlags(props: InputProps) {
  return { ...props, plate: props.plate || !(props.angle || props.channel) }
}

export const sheetMetalModelPropsSchema = z
  .object(sheetMetalShape)
  .strict()
  .superRefine(validateFlags)
  .transform(resolveFlags)
export const sheetMetalModelDefinitionSchema = z
  .object({ fn: z.literal("sheetmetal"), ...sheetMetalShape })
  .strict()
  .superRefine(validateFlags)
  .transform((props) => ({ fn: props.fn, ...resolveFlags(props) }))
export type SheetMetalModelPropsInput = z.input<
  typeof sheetMetalModelPropsSchema
>
export type SheetMetalModelProps = z.output<typeof sheetMetalModelPropsSchema>
export type SheetMetalHole = z.output<typeof sheetMetalHoleSchema>
