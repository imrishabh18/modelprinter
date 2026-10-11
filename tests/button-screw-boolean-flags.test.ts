import { expect, test } from "bun:test"
import { mp, buttonScrewModelPropsSchema } from "../src"
const source = "buttonscrew_m3_l10mm"

test("buttonscrew directly exposes boolean selectors", () => {
  const complete = source + "_hexsocket_fullthread_righthanded"
  const builder = mp.string(complete)
  expect(builder.params().string).toBe(complete)
  const model = builder.json()
  expect(model).toMatchObject({
    hexSocket: true,
    fullThread: true,
    leftHanded: false,
  })
  for (const property of ["drive", "thread", "threadHand", "threadGender"])
    expect(model).not.toHaveProperty(property)
  expect(
    buttonScrewModelPropsSchema.parse({
      metricSize: "M3",
      length: 10,
      hexSocket: true,
      fullThread: true,
      leftHanded: false,
    }),
  ).toMatchObject({ hexSocket: true, fullThread: true, leftHanded: false })
})
test("buttonscrew boolean flags accept no values or repetitions", () => {
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
  ])
    expect(() => mp.string(source + "_" + tail).json()).toThrow()
})
test("buttonscrew rejects deprecated string selectors and schema properties", () => {
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
  ])
    expect(() =>
      buttonScrewModelPropsSchema.parse({
        metricSize: "M3",
        length: 10,
        ...invalid,
      }),
    ).toThrow()
})
test("buttonscrew supports only right handed threads", () => {
  expect(mp.string(source + "_righthanded").json()).toMatchObject({
    leftHanded: false,
  })
  expect(() => mp.string(source + "_lefthanded").json()).toThrow()
  expect(() =>
    buttonScrewModelPropsSchema.parse({
      metricSize: "M3",
      length: 10,
      leftHanded: true,
    }),
  ).toThrow()
})
