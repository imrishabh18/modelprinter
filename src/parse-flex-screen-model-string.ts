import {
  flexScreenModelDefinitionSchema,
  type FlexScreenModelDefinition,
  type FlexScreenModelProps,
} from "./models/flexscreen/schema"
import type { RawModelprinterParams } from "./parse-model-string"
import { splitModelStringTokens } from "./split-model-string-tokens"

type OrientationFlag =
  | "sitsFlat"
  | "sitsFlatBelowBoard"
  | "foldedToFaceAboveBoard"
  | "foldedToFaceBelowBoard"
  | "foldedToRightAngleAboveBoard"
  | "foldedToRightAngleBelowBoard"

const orientationTokens: Record<string, OrientationFlag> = {
  sitsflat: "sitsFlat",
  sitsflatbelow: "sitsFlatBelowBoard",
  sitsflatbelowboard: "sitsFlatBelowBoard",
  foldsabove: "foldedToFaceAboveBoard",
  foldsaboveboard: "foldedToFaceAboveBoard",
  foldedtofaceaboveboard: "foldedToFaceAboveBoard",
  foldsbelow: "foldedToFaceBelowBoard",
  foldsbelowboard: "foldedToFaceBelowBoard",
  foldedtofacebelowboard: "foldedToFaceBelowBoard",
  rightangleabove: "foldedToRightAngleAboveBoard",
  rightangleaboveboard: "foldedToRightAngleAboveBoard",
  foldedtorightangleaboveboard: "foldedToRightAngleAboveBoard",
  rightanglebelow: "foldedToRightAngleBelowBoard",
  rightanglebelowboard: "foldedToRightAngleBelowBoard",
  foldedtorightanglebelowboard: "foldedToRightAngleBelowBoard",
}

const lengthProperties = {
  width: ["width", "w"],
  height: ["height", "h"],
  diagonal: ["diagonal", "diag", "d"],
  defaultDiagonal: ["defaultdiagonal", "defaultdiag"],
  screenThickness: ["screenthickness"],
  bezelInset: ["bezelinset"],
  bezelDepth: ["bezeldepth"],
  activeAreaWidth: ["activeareawidth", "activew"],
  activeAreaHeight: ["activeareaheight", "activeh"],
  flexCableLength: ["flexcablelength", "flexlength", "flex"],
  flexCableWidth: ["flexcablewidth", "flexwidth"],
  flexCableThickness: ["flexcablethickness", "flexthickness"],
  pitch: ["pitch", "p"],
  padWidth: ["padwidth", "pw"],
  padLength: ["padlength", "pl"],
  tailLength: ["taillength", "tail"],
  taperLength: ["taperlength", "taper"],
  conductorPitch: ["conductorpitch"],
  conductorWidth: ["conductorwidth"],
  conductorThickness: ["conductorthickness"],
  cableEdgeMargin: ["cableedgemargin", "edgemargin"],
  exposedContactLength: ["exposedcontactlength", "contactlength"],
  stiffenerLength: ["stiffenerlength"],
  stiffenerThickness: ["stiffenerthickness"],
  bendRadius: ["bendradius"],
  rightAngleVerticalLead: ["rightangleverticallead", "verticallead"],
  distanceAboveBoard: ["distanceaboveboard", "distanceabove"],
  distanceBelowBoard: ["distancebelowboard", "distancebelow"],
  foldDistanceFromConnector: [
    "folddistancefromconnector",
    "folddistance",
    "foldstart",
  ],
  foldOutset: ["foldoutset", "outset"],
  screenGap: ["screengap"],
  boardTopZ: ["boardtopz"],
  boardThickness: ["boardthickness"],
  boardClearance: ["boardclearance"],
  cableStartX: ["cablestartx"],
  cableStartY: ["cablestarty"],
  cableStartZ: ["cablestartz"],
  cableLateralOffset: ["cablelateraloffset", "lateraloffset"],
} satisfies Partial<Record<keyof FlexScreenModelProps, readonly string[]>>

const lengthTokenToProperty = Object.fromEntries(
  Object.entries(lengthProperties).flatMap(([property, tokens]) =>
    tokens.map((token) => [token, property]),
  ),
)

const integerTokenToProperty: Record<string, keyof FlexScreenModelProps> = {
  num_pins: "pinCount",
  pincount: "pinCount",
  conductorcount: "conductorCount",
  conductors: "conductorCount",
  bendsegments: "bendSegments",
  foldsegments: "foldSegments",
}

const booleanTokens = {
  showscreen: ["showScreen", true],
  hidescreen: ["showScreen", false],
  showflex: ["showFlexCable", true],
  hideflex: ["showFlexCable", false],
  showconductors: ["showConductors", true],
  hideconductors: ["showConductors", false],
  showstiffeners: ["showStiffeners", true],
  hidestiffeners: ["showStiffeners", false],
} as const

const colorProperties = {
  screencolor: "screenColor",
  bezelcolor: "bezelColor",
  flexcolor: "flexCableColor",
  conductorcolor: "conductorColor",
  stiffenercolor: "stiffenerColor",
} as const

const parseAspectRatio = (value: unknown): number | `${number}:${number}` => {
  const normalized = String(value).toLowerCase().replace("x", ":")
  if (normalized.includes(":")) {
    const [width, height, extra] = normalized.split(":")
    const numericWidth = Number(width)
    const numericHeight = Number(height)
    if (
      extra !== undefined ||
      !Number.isFinite(numericWidth) ||
      !Number.isFinite(numericHeight) ||
      numericWidth <= 0 ||
      numericHeight <= 0
    ) {
      throw new Error(`Invalid FlexScreen aspect ratio "${String(value)}"`)
    }
    return `${numericWidth}:${numericHeight}` as `${number}:${number}`
  }
  const numeric = Number(normalized)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`Invalid FlexScreen aspect ratio "${String(value)}"`)
  }
  return numeric
}

const unwrapFunctionValue = (value: unknown, token: string): string => {
  if (typeof value !== "string" || !/^\(.+\)$/.test(value)) {
    throw new Error(`FlexScreen token "${token}" requires a value in (...)`)
  }
  return value.slice(1, -1)
}

const assertBareToken = (value: unknown, token: string) => {
  if (value !== true) {
    throw new Error(`FlexScreen token "${token}" does not accept a value`)
  }
}

export const parseFlexScreenModelParams = (
  rawParams: RawModelprinterParams,
): FlexScreenModelDefinition => {
  if (rawParams.fn !== "flexscreen") {
    throw new Error(`Expected FlexScreen params, got "${rawParams.fn}"`)
  }

  const props: Record<string, unknown> = {}
  let orientation: OrientationFlag | undefined
  // Raw parameter objects collapse repeated tokens; inspect the original string
  // to reject repeated canonical flags and their aliases before that collapse.
  for (const part of splitModelStringTokens(rawParams.string).slice(1)) {
    const match = part.match(/^([a-zA-Z]+)(.*)$/)
    if (!match) continue
    const token = match[1]!.toLowerCase()
    const selected = orientationTokens[token]
    if (!selected) continue
    if (match[2] !== "") {
      throw new Error(`FlexScreen token "${token}" does not accept a value`)
    }
    if (orientation !== undefined) {
      throw new Error(
        orientation === selected
          ? `Duplicate FlexScreen orientation flag "${token}"`
          : "A FlexScreen model string can only set one orientation",
      )
    }
    orientation = selected
    props[selected] = true
  }
  let relativeDistance: unknown

  for (const [token, value] of Object.entries(rawParams)) {
    if (token === "fn" || token === "string" || token === "flexscreen") {
      continue
    }

    const tokenOrientation = orientationTokens[token]
    if (tokenOrientation) {
      assertBareToken(value, token)
      continue
    }

    if (token in booleanTokens) {
      assertBareToken(value, token)
      const [property, enabled] =
        booleanTokens[token as keyof typeof booleanTokens]
      props[property] = enabled
      continue
    }

    const colorProperty = colorProperties[token as keyof typeof colorProperties]
    if (colorProperty) {
      props[colorProperty] = unwrapFunctionValue(value, token)
      continue
    }

    if (token === "ratio") {
      props.aspectRatio = parseAspectRatio(value)
      continue
    }

    const lengthProperty = lengthTokenToProperty[token]
    if (lengthProperty) {
      props[lengthProperty] = value
      continue
    }

    if (token === "distance") {
      relativeDistance = value
      continue
    }

    const integerProperty = integerTokenToProperty[token]
    if (integerProperty) {
      const parsed = Number(value)
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new Error(
          `Invalid positive integer in FlexScreen token "${token}${String(value)}"`,
        )
      }
      props[integerProperty] = parsed
      continue
    }

    throw new Error(`Unknown FlexScreen model token "${token}${String(value)}"`)
  }

  if (relativeDistance !== undefined) {
    if (orientation === "foldedToFaceAboveBoard") {
      props.distanceAboveBoard = relativeDistance
    } else if (orientation === "foldedToFaceBelowBoard") {
      props.distanceBelowBoard = relativeDistance
    } else {
      throw new Error(
        'The "distance" token requires foldsabove or foldsbelow; use distanceabove or distancebelow for an explicit side',
      )
    }
  }

  return flexScreenModelDefinitionSchema.parse({ fn: "flexscreen", ...props })
}
