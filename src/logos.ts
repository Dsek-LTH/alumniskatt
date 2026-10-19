// Maps Zettle variant names to committee logos in public/logos (from Dsek-LTH/grafik).
// Matched on the start of the name, so both "Sexmästeriet" and "Sexet" work.

const LOGOS: [RegExp, string][] = [
    [/^akt/, "aktu"],
    [/^alumn/, "alumni"],
    [/^caf/, "cafe"],
    [/^(cpu|central)/, "cpu"],
    [/^(d-?www|webb)/, "dwww"],
    [/^fram/, "fram"],
    [/^inf/, "infu"],
    [/^(kallar|km)/, "km"],
    [/^medal/, "medalj"],
    [/^nar/, "naru"],
    [/^noll/, "nollu"],
    [/^root/, "rootm"],
    [/^sex/, "sexm"],
    [/^skatt/, "skattm"],
    [/^(srd|studie)/, "srd"],
    [/^tack/, "tackm"],
    [/^triv/, "trivsel"],
    [/^valb/, "valb"],
];

/** "Källarmästeriet" → "logos/km.svg". Committees without a logo get the D-sek symbol. */
export function logoFor(committee: string): string {
    const normalized = committee
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
    const match = LOGOS.find(([pattern]) => pattern.test(normalized));
    return `logos/${match ? match[1] : "dsek"}.svg`;
}
