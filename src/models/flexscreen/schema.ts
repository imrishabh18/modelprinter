import { z } from "zod"
import {
  modelLengthSchema,
  positiveModelLengthSchema,
  nonnegativeModelLengthSchema,
} from "../../model-length-schema"
export {
  modelLengthSchema,
  positiveModelLengthSchema,
  nonnegativeModelLengthSchema,
} from "../../model-length-schema"

const positiveFiniteNumberSchema = z.number().finite().positive()

const aspectRatioStringSchema = z
  .string()
  .refine((value) => {
    const parts = value.split(":")
    if (parts.length !== 2) return false
    const width = Number(parts[0])
    const height = Number(parts[1])
    return (
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width > 0 &&
      height > 0
    )
  }, 'Aspect ratio must look like "16:9"')
  .transform((value) => value as `${number}:${number}`)

export const flexScreenAspectRatioSchema = z.union([
  positiveFiniteNumberSchema,
  aspectRatioStringSchema,
  z.tuple([positiveFiniteNumberSchema, positiveFiniteNumberSchema]),
])

const modelPointSchema = z
  .object({
    x: modelLengthSchema.optional(),
    y: modelLengthSchema.optional(),
    z: modelLengthSchema.optional(),
  })
  .strict()

const rotationValueSchema = z.union([z.number().finite(), z.string().min(1)])

const modelRotationSchema = z.tuple([
  rotationValueSchema,
  rotationValueSchema,
  rotationValueSchema,
])

const orientationShortcutKeys = [
  "sitsFlat",
  "sitsFlatBelowBoard",
  "foldedToFaceAboveBoard",
  "foldedToFaceBelowBoard",
  "foldsAboveBoard",
  "foldsBelowBoard",
  "foldedToRightAngleAboveBoard",
  "foldedToRightAngleBelowBoard",
] as const

const flexScreenModelPropsShape = {
  width: positiveModelLengthSchema.optional(),
  height: positiveModelLengthSchema.optional(),
  diagonal: positiveModelLengthSchema.optional(),
  aspectRatio: flexScreenAspectRatioSchema.optional(),
  ratio: flexScreenAspectRatioSchema.optional(),
  defaultDiagonal: positiveModelLengthSchema.optional(),

  sitsFlat: z.boolean().optional(),
  sitsFlatBelowBoard: z.boolean().optional(),
  foldedToFaceAboveBoard: z.boolean().optional(),
  foldedToFaceBelowBoard: z.boolean().optional(),
  foldsAboveBoard: z.boolean().optional(),
  foldsBelowBoard: z.boolean().optional(),
  foldedToRightAngleAboveBoard: z.boolean().optional(),
  foldedToRightAngleBelowBoard: z.boolean().optional(),

  screenThickness: positiveModelLengthSchema.optional(),
  bezelInset: nonnegativeModelLengthSchema.optional(),
  bezelDepth: positiveModelLengthSchema.optional(),
  activeAreaWidth: positiveModelLengthSchema.optional(),
  activeAreaHeight: positiveModelLengthSchema.optional(),
  screenColor: z.string().min(1).optional(),
  bezelColor: z.string().min(1).optional(),
  showScreen: z.boolean().optional(),

  flexCableLength: positiveModelLengthSchema.optional(),
  flexCableWidth: positiveModelLengthSchema.optional(),
  flexCableThickness: positiveModelLengthSchema.optional(),
  flexCableColor: z.string().min(1).optional(),
  /** FPC contact parameters, matching the corresponding connector renderer. */
  pinCount: z.number().int().positive().optional(),
  pitch: positiveModelLengthSchema.optional(),
  padWidth: positiveModelLengthSchema.optional(),
  padLength: nonnegativeModelLengthSchema.optional(),
  /** Length of the widened straight connector tail, before the taper. */
  tailLength: positiveModelLengthSchema.optional(),
  /** Length of the transition from connector tail to cable body. */
  taperLength: positiveModelLengthSchema.optional(),
  conductorCount: z.number().int().positive().optional(),
  conductorPitch: positiveModelLengthSchema.optional(),
  conductorWidth: positiveModelLengthSchema.optional(),
  conductorThickness: positiveModelLengthSchema.optional(),
  conductorColor: z.string().min(1).optional(),
  cableEdgeMargin: nonnegativeModelLengthSchema.optional(),
  exposedContactLength: nonnegativeModelLengthSchema.optional(),
  showConductors: z.boolean().optional(),
  showFlexCable: z.boolean().optional(),

  showStiffeners: z.boolean().optional(),
  stiffenerLength: nonnegativeModelLengthSchema.optional(),
  stiffenerThickness: positiveModelLengthSchema.optional(),
  stiffenerColor: z.string().min(1).optional(),

  bendRadius: positiveModelLengthSchema.optional(),
  bendSegments: z.number().int().min(2).optional(),
  rightAngleVerticalLead: nonnegativeModelLengthSchema.optional(),
  distanceAboveBoard: nonnegativeModelLengthSchema.optional(),
  distanceBelowBoard: nonnegativeModelLengthSchema.optional(),
  foldDistanceFromConnector: nonnegativeModelLengthSchema.optional(),
  foldOutset: positiveModelLengthSchema.optional(),
  foldSegments: z.number().int().min(4).optional(),
  screenGap: nonnegativeModelLengthSchema.optional(),

  boardTopZ: modelLengthSchema.optional(),
  boardThickness: positiveModelLengthSchema.optional(),
  boardClearance: nonnegativeModelLengthSchema.optional(),
  cableStartX: modelLengthSchema.optional(),
  cableStartY: modelLengthSchema.optional(),
  cableStartZ: modelLengthSchema.optional(),
  cableLateralOffset: modelLengthSchema.optional(),

  screenOffset: modelPointSchema.optional(),
  screenRotation: modelRotationSchema.optional(),
  rotation: modelRotationSchema.optional(),
  offset: modelPointSchema.optional(),
}

const addOrientationShortcutIssue = (
  props: Record<string, unknown>,
  addIssue: (path: string, message: string) => void,
) => {
  const selectedShortcuts = orientationShortcutKeys.filter(
    (key) => props[key] === true,
  )
  if (selectedShortcuts.length > 1) {
    addIssue(
      selectedShortcuts[1]!,
      "Only one FlexScreen orientation shortcut can be true",
    )
  } else if (
    selectedShortcuts.length === 0 &&
    orientationShortcutKeys.some((key) => props[key] !== undefined)
  ) {
    addIssue(
      "sitsFlat",
      "A FlexScreen orientation flag must be true when placement flags are supplied",
    )
  }
}

type OrientationFlags = Partial<
  Record<(typeof orientationShortcutKeys)[number], boolean>
>

const normalizeOrientationFlags = <T extends OrientationFlags>(props: T) => {
  const {
    sitsFlat,
    sitsFlatBelowBoard,
    foldedToFaceAboveBoard,
    foldedToFaceBelowBoard,
    foldedToRightAngleAboveBoard,
    foldedToRightAngleBelowBoard,
    foldsAboveBoard,
    foldsBelowBoard,
    ...rest
  } = props
  const above = foldedToFaceAboveBoard === true || foldsAboveBoard === true
  const below = foldedToFaceBelowBoard === true || foldsBelowBoard === true
  const selected =
    sitsFlatBelowBoard === true ||
    above ||
    below ||
    foldedToRightAngleAboveBoard === true ||
    foldedToRightAngleBelowBoard === true
  return {
    ...rest,
    sitsFlat: sitsFlat === true || !selected,
    sitsFlatBelowBoard: sitsFlatBelowBoard === true,
    foldedToFaceAboveBoard: above,
    foldedToFaceBelowBoard: below,
    foldedToRightAngleAboveBoard: foldedToRightAngleAboveBoard === true,
    foldedToRightAngleBelowBoard: foldedToRightAngleBelowBoard === true,
  }
}

const validateTailLengths = (
  props: {
    flexCableLength?: number
    tailLength?: number
    taperLength?: number
  },
  context: z.RefinementCtx,
) => {
  if (props.flexCableLength === undefined) return
  if (
    props.tailLength !== undefined &&
    props.tailLength >= props.flexCableLength
  ) {
    context.addIssue({
      code: "custom",
      message: "tailLength must be shorter than flexCableLength",
      path: ["tailLength"],
    })
  }
  if (
    (props.tailLength ?? 0) + (props.taperLength ?? 0) >
    props.flexCableLength
  ) {
    context.addIssue({
      code: "custom",
      message: "tailLength and taperLength must fit within flexCableLength",
      path: ["taperLength"],
    })
  }
}

/**
 * Canonical, renderer-independent properties for a parameterized FlexScreen.
 * Every length accepts either millimeters as a number or a unit-bearing string
 * and is normalized to millimeters by the schema.
 */
export const flexScreenModelPropsSchema = z
  .object(flexScreenModelPropsShape)
  .strict()
  .superRefine((props, context) => {
    validateTailLengths(props, context)
    addOrientationShortcutIssue(props, (path, message) => {
      context.addIssue({
        code: "custom",
        message,
        path: [path],
      })
    })
  })
  .transform(normalizeOrientationFlags)

export type FlexScreenAspectRatio = z.infer<typeof flexScreenAspectRatioSchema>
export type FlexScreenModelPropsInput = z.input<
  typeof flexScreenModelPropsSchema
>
export type FlexScreenModelProps = z.output<typeof flexScreenModelPropsSchema>

export const flexScreenModelDefinitionSchema = z
  .object({
    fn: z.literal("flexscreen"),
    ...flexScreenModelPropsShape,
  })
  .strict()
  .superRefine((model, context) => {
    validateTailLengths(model, context)
    addOrientationShortcutIssue(model, (path, message) => {
      context.addIssue({
        code: "custom",
        message,
        path: [path],
      })
    })
  })
  .transform(normalizeOrientationFlags)

export type FlexScreenModelDefinition = z.infer<
  typeof flexScreenModelDefinitionSchema
>
