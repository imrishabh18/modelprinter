import { expect, test } from "bun:test"
import { hexNutModelPropsSchema, mp } from "../src"

test("hex nut handedness is a fixed boolean with no enum selector", () => {
  const expected = mp.string("hexnut_m6").json()
  expect(expected).toHaveProperty("rightHanded", true)
  expect(expected).not.toHaveProperty("threadHand")
  expect(mp.string("hexnut_m6_righthanded").json()).toEqual(expected)
  expect(() =>
    hexNutModelPropsSchema.parse({ metricSize: "M6", threadHand: "right" }),
  ).toThrow()
  expect(() =>
    hexNutModelPropsSchema.parse({ metricSize: "M6", rightHanded: false }),
  ).toThrow()
})
