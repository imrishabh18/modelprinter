import { expect, test } from "bun:test"
import { mp } from "../src"

test("rectangulargasket accepts value-free flags and rejects standalone enum selectors", () => {
  const source = "rectangulargasket_w80mm_h50mm_border5mm_t2mm_cornerr5mm"
  expect(mp.string(`${source}_flatframe`).json()).toEqual(
    mp.string(source).json(),
  )
  for (const token of [
    "profile(flatframe)",
    "style(flatframe)",
    "flatframe(true)",
    "flatframe(false)",
    "flatframe_flatframe",
  ]) {
    expect(() => mp.string(`${source}_${token}`).json(), token).toThrow()
  }
})
