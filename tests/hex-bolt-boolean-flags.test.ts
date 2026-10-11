import { expect, test } from "bun:test"
import { mp, hexBoltModelPropsSchema } from "../src"
const source = "hexbolt_m3_l25mm"

test("hexbolt directly exposes boolean selectors", () => {
  const complete = source + "_hex_fullthread_righthanded_male"
  const builder = mp.string(complete)
  expect(builder.params().string).toBe(complete)
  const model = builder.json()
  expect(model).toMatchObject({
    hex: true,
    fullThread: true,
    leftHanded: false,
    male: true,
  })
  for (const property of ["drive", "thread", "threadHand", "threadGender"])
    expect(model).not.toHaveProperty(property)
  expect(
    hexBoltModelPropsSchema.parse({
      metricSize: "M3",
      length: 25,
      hex: true,
      fullThread: true,
      leftHanded: false,
    }),
  ).toMatchObject({ hex: true, fullThread: true, leftHanded: false })
})
test("hexbolt boolean flags accept no values or repetitions", () => {
  for (const tail of [
    "hex_hex",
    "hex(true)",
    "hex1",
    "fullthread_fullthread",
    "fullthread(true)",
    "righthanded_righthanded",
    "righthanded(false)",
    "righthanded_lefthanded",
    "lefthanded_righthanded",
    "lefthanded_lefthanded",
    "male_male",
    "male(true)",
  ])
    expect(() => mp.string(source + "_" + tail).json()).toThrow()
})
test("hexbolt rejects deprecated string selectors and schema properties", () => {
  for (const tail of [
    "drive(hex)",
    "thread(full)",
    "threadhand(right)",
    "threadhand(left)",
    "threadgender(male)",
  ])
    expect(() => mp.string(source + "_" + tail).json()).toThrow()
  for (const invalid of [
    { drive: "hex" },
    { thread: "full" },
    { threadHand: "right" },
    { threadGender: "male" },
    { hex: false },
    { fullThread: false },
    { leftHanded: "left" },
    { male: false },
  ])
    expect(() =>
      hexBoltModelPropsSchema.parse({
        metricSize: "M3",
        length: 25,
        ...invalid,
      }),
    ).toThrow()
})
test("hexbolt both hand flags map to one boolean property", () => {
  expect(mp.string(source + "_lefthanded").json()).toMatchObject({
    leftHanded: true,
  })
  expect(mp.string(source + "_righthanded").json()).toMatchObject({
    leftHanded: false,
  })
  expect(
    hexBoltModelPropsSchema.parse({
      metricSize: "M3",
      length: 25,
      leftHanded: true,
    }),
  ).toMatchObject({ leftHanded: true })
})
