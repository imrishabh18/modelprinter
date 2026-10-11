import { expect, test } from "bun:test"
import { mp } from "../src"

test("tslotcoverstrip accepts value-free flags and rejects standalone enum selectors", () => {
  const source =
    "tslotcoverstrip_l100mm_w8mm_t1mm_stemw5.8mm_stemh2mm_barbw6.2mm"
  expect(mp.string(`${source}_tee`).json()).toEqual(mp.string(source).json())
  for (const token of [
    "profile(tee)",
    "style(tee)",
    "tee(true)",
    "tee(false)",
    "tee_tee",
  ]) {
    expect(() => mp.string(`${source}_${token}`).json(), token).toThrow()
  }
})
