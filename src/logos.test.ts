import { expect, test } from "bun:test";
import { logoFor } from "./logos.ts";

test("matches current Zettle variant names", () => {
    expect(logoFor("Källarmästeriet")).toBe("logos/km.svg");
    expect(logoFor("Näringslivsutskottet")).toBe("logos/naru.svg");
    expect(logoFor("Centralprocessorutskottet")).toBe("logos/cpu.svg");
    expect(logoFor("Medaljelelekommiten")).toBe("logos/medalj.svg");
    expect(logoFor("Studierådet")).toBe("logos/srd.svg");
    expect(logoFor("Cafémästeriet")).toBe("logos/cafe.svg");
});

test("matches the old short names", () => {
    expect(logoFor("Sexet")).toBe("logos/sexm.svg");
    expect(logoFor("NärU")).toBe("logos/naru.svg");
    expect(logoFor("SRD")).toBe("logos/srd.svg");
    expect(logoFor("CPU")).toBe("logos/cpu.svg");
});

test("falls back to the D-sek symbol", () => {
    expect(logoFor("Styrelsen")).toBe("logos/dsek.svg");
});
