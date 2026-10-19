import { expect, test } from "bun:test";
import { logoFor } from "./logos.ts";

test("matches current Zettle variant names", () => {
    expect(logoFor("Källarmästeriet")).toBe("logos/kallarmasteriet.svg");
    expect(logoFor("Näringslivsutskottet")).toBe("logos/naringslivsutskottet.svg");
    expect(logoFor("Centralprocessorutskottet")).toBe("logos/centralprocessorutskottet.svg");
    expect(logoFor("Medaljelelekommiten")).toBe("logos/medaljelelekommiten.svg");
    expect(logoFor("Studierådet")).toBe("logos/studieradet.svg");
    expect(logoFor("Cafémästeriet")).toBe("logos/cafemasteriet.svg");
});

test("matches the old short names", () => {
    expect(logoFor("Sexet")).toBe("logos/sexmasteriet.svg");
    expect(logoFor("NärU")).toBe("logos/naringslivsutskottet.svg");
    expect(logoFor("SRD")).toBe("logos/studieradet.svg");
    expect(logoFor("CPU")).toBe("logos/centralprocessorutskottet.svg");
});

test("falls back to the D-sek symbol", () => {
    expect(logoFor("Styrelsen")).toBe("logos/dsek.svg");
});
