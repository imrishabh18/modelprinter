import { expect, test } from "bun:test"
import { mp, nemaMotorModelPropsSchema } from "../src"

test("NEMA rejects enum selectors, flag values, repeated and conflicting choices", () => {
  for (const input of [
    { backFace: "holes" },
    { shaftShape: "round" },
    { cornerProfile: "stepped" },
    { wireConnection: "none" },
    { wireConnection: "stubs" },
    { backFaceHoles: true, backFaceScrews: true },
    { backFacePlain: true, backFaceHoles: true },
    { roundShaft: true, dShaft: true },
    { chamfered: true, stepped: true },
    { noWires: true, wireStubs: true },
    { wireConnection: "jst-ph-4", noWires: true },
    { wireConnection: "jst-sh-4", wireStubs: true },
    { backFacePlain: false },
    { roundShaft: false, dShaft: false },
    { chamfered: false },
    { noWires: false, wireStubs: false },
    { dShaft: "true" },
    { noWires: 1 },
  ])
    expect(() =>
      nemaMotorModelPropsSchema.parse({ nemaSize: 17, ...input }),
    ).toThrow()
  for (const token of [
    "backface(holes)",
    "shaftshape(round)",
    "cornerprofile(stepped)",
    "wireconnection(none)",
    "style(stepped)",
    "profile(stepped)",
    "backfaceholes(true)",
    "roundshaft(false)",
    "stepped(true)",
    "nowires(false)",
    "backfaceholes_backfaceholes",
    "plainbackface_backfaceplain",
    "backfaceholes_backfacescrews",
    "round_dshaft",
    "dshaft_round",
    "round_roundshaft",
    "chamfered_stepped",
    "stepped_chamfered",
    "nowires_wirestubs",
    "wirestubs_nowires",
    "jstph4_wirestubs",
    "wirestubs_jstph4",
    "jstsh4_nowires",
    "nowires_jstsh4",
  ])
    expect(() => mp.string(`nema17_${token}`).json()).toThrow()
})
