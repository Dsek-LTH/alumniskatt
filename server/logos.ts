// Maps Zettle variant names to committee logos in public/logos (from Dsek-LTH/grafik).
// Matched on the start of the name, so both "Sexmästeriet" and "Sexet" work.

const LOGOS: [RegExp, string][] = [
    [/^akt/, "aktivitetsutskottet"],
    [/^alumn/, "alumnigruppen"],
    [/^caf/, "cafemasteriet"],
    [/^(cpu|central)/, "centralprocessorutskottet"],
    [/^fram/, "framtidsutskottet"],
    [/^inf/, "informationsutskottet"],
    [/^(kallar|km)/, "kallarmasteriet"],
    [/^medal/, "medaljelelekommiten"],
    [/^nar/, "naringslivsutskottet"],
    [/^noll/, "nollningsutskottet"],
    [/^sex/, "sexmasteriet"],
    [/^skatt/, "skattmasteriet"],
    [/^(srd|studie)/, "studieradet"],
    [/^tack/, "tackmasteriet"],
    [/^triv/, "trivselradet"],
    [/^valb/, "valberedningen"],
];

/** "Källarmästeriet" → "logos/kallarmasteriet.svg". Committees without a logo get the D-sek symbol. */
export function logoFor(committee: string): string {
    const normalized = committee
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
    const match = LOGOS.find(([pattern]) => pattern.test(normalized));
    return `logos/${match ? match[1] : "dsek"}.svg`;
}
