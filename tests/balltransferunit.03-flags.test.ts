import { expect, test } from "bun:test"
import { mp } from "../src"

test("balltransferunit accepts value-free flags and rejects standalone enum selectors", () => {
  const source =
    "balltransferunit_balld25mm_flangeod45mm_h30mm_pcd36mm_holed4mm"
  expect(mp.string(`${source}_face3hole`).json()).toEqual(
    mp.string(source).json(),
  )
  for (const token of [
    "mount(face3hole)",
    "style(face3hole)",
    "face3hole(true)",
    "face3hole(false)",
    "face3hole_face3hole",
  ]) {
    expect(() => mp.string(`${source}_${token}`).json(), token).toThrow()
  }
})
