import { expect, test } from "bun:test"
import { mp, flatHeadScrewModelPropsSchema } from "../src"
const source = "flatheadscrew_m3_l10mm"

test("flatheadscrew directly exposes boolean selectors", () => {
  const complete = source + "_hexsocket_fullthread_righthanded_male"
  const builder = mp.string(complete)
  expect(builder.params().string).toBe(complete)
  const model = builder.json()
  expect(model).toMatchObject({
    hexSocket: true,
    fullThread: true,
    leftHanded: false,
    male: true,
  })
  for (const property of ["drive", "thread", "threadHand", "threadGender"])
    expect(model).not.toHaveProperty(property)
  expect(
    flatHeadScrewModelPropsSchema.parse({
      metricSize: "M3",
      length: 10,
      hexSocket: true,
      fullThread: true,
      leftHanded: false,
    }),
  ).toMatchObject({ hexSocket: true, fullThread: true, leftHanded: false })
})
test("flatheadscrew boolean flags accept no values or repetitions", () => {
  for (const tail of [
    "hexsocket_hexsocket",
    "hexsocket(true)",
    "hexsocket1",
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
test("flatheadscrew rejects deprecated string selectors and schema properties", () => {
  for (const tail of [
    "drive(hexsocket)",
    "thread(full)",
    "threadhand(right)",
    "threadhand(left)",
    "threadgender(male)",
  ])
    expect(() => mp.string(source + "_" + tail).json()).toThrow()
  for (const invalid of [
    { drive: "hexsocket" },
    { thread: "full" },
    { threadHand: "right" },
    { threadGender: "male" },
    { hexSocket: false },
    { fullThread: false },
    { leftHanded: "left" },
    { male: false },
  ])
    expect(() =>
      flatHeadScrewModelPropsSchema.parse({
        metricSize: "M3",
        length: 10,
        ...invalid,
      }),
    ).toThrow()
})
test("flatheadscrew both hand flags map to one boolean property", () => {
  expect(mp.string(source + "_lefthanded").json()).toMatchObject({
    leftHanded: true,
  })
  expect(mp.string(source + "_righthanded").json()).toMatchObject({
    leftHanded: false,
  })
  expect(
    flatHeadScrewModelPropsSchema.parse({
      metricSize: "M3",
      length: 10,
      leftHanded: true,
    }),
  ).toMatchObject({ leftHanded: true })
})
