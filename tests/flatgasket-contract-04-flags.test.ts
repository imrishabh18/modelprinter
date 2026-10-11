import { expect, test } from "bun:test"
import { mp } from "../src"

test("flatgasket accepts value-free flags and rejects standalone enum selectors", () => {
  const source = "flatgasket_id20mm_od35mm_t2mm"
  expect(mp.string(`${source}_flatannulus`).json()).toEqual(
    mp.string(source).json(),
  )
  for (const token of [
    "profile(flatannulus)",
    "style(flatannulus)",
    "flatannulus(true)",
    "flatannulus(false)",
    "flatannulus_flatannulus",
  ]) {
    expect(() => mp.string(`${source}_${token}`).json(), token).toThrow()
  }
})
