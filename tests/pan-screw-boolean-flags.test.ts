import { expect, test } from "bun:test"
import { mp, panScrewModelPropsSchema } from "../src"
const source = "panscrew_m3_l10mm"

test("panscrew directly exposes boolean selectors", () => {
  const complete = source + "_phillips_fullthread_righthanded_male"
  const builder = mp.string(complete)
  expect(builder.params().string).toBe(complete)
  const model = builder.json()
  expect(model).toMatchObject({
    phillips: true,
    fullThread: true,
    leftHanded: false,
    male: true,
  })
  for (const property of ["drive", "thread", "threadHand", "threadGender"])
    expect(model).not.toHaveProperty(property)
  expect(
    panScrewModelPropsSchema.parse({
      metricSize: "M3",
      length: 10,
      phillips: true,
      fullThread: true,
      leftHanded: false,
    }),
  ).toMatchObject({ phillips: true, fullThread: true, leftHanded: false })
})
test("panscrew boolean flags accept no values or repetitions", () => {
  for (const tail of [
    "phillips_phillips",
    "phillips(true)",
    "phillips1",
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
test("panscrew rejects deprecated string selectors and schema properties", () => {
  for (const tail of [
    "drive(phillips)",
    "thread(full)",
    "threadhand(right)",
    "threadhand(left)",
    "threadgender(male)",
  ])
    expect(() => mp.string(source + "_" + tail).json()).toThrow()
  for (const invalid of [
    { drive: "phillips" },
    { thread: "full" },
    { threadHand: "right" },
    { threadGender: "male" },
    { phillips: false },
    { fullThread: false },
    { leftHanded: "left" },
    { male: false },
  ])
    expect(() =>
      panScrewModelPropsSchema.parse({
        metricSize: "M3",
        length: 10,
        ...invalid,
      }),
    ).toThrow()
})
test("panscrew both hand flags map to one boolean property", () => {
  expect(mp.string(source + "_lefthanded").json()).toMatchObject({
    leftHanded: true,
  })
  expect(mp.string(source + "_righthanded").json()).toMatchObject({
    leftHanded: false,
  })
  expect(
    panScrewModelPropsSchema.parse({
      metricSize: "M3",
      length: 10,
      leftHanded: true,
    }),
  ).toMatchObject({ leftHanded: true })
})
