import { expect, test } from "bun:test";
import { computeLeaderboard, type Row } from "./store.ts";

const variants = [
    { uuid: "sexm", name: "Sexmästeriet" },
    { uuid: "km", name: "Källarmästeriet" },
    { uuid: "cafe", name: "Cafémästeriet" },
];

const row = (variantUuid: string, purchaser: string, amount: number, minute = 0): Row => ({
    timestamp: `2026-10-24T19:${String(minute).padStart(2, "0")}:00.000+0000`,
    variantUuid,
    variantName: variants.find((v) => v.uuid === variantUuid)?.name ?? "Okänt utskott",
    purchaserRaw: purchaser,
    purchaserKey: purchaser.toLowerCase(),
    amount,
});

test("sums per committee and lists empty ones last", () => {
    const board = computeLeaderboard(variants, [row("km", "A", 1500), row("km", "B", 1500), row("sexm", "A", 1500)]);
    expect(board.committees.map((c) => [c.name, c.total, c.donations])).toEqual([
        ["Källarmästeriet", 3000, 2],
        ["Sexmästeriet", 1500, 1],
        ["Cafémästeriet", 0, 0],
    ]);
    expect(board.committees[0]!.logo).toBe("logos/kallarmasteriet.svg");
});

test("committees with the same total are in Swedish alphabetical order", () => {
    const ties = [
        { uuid: "o", name: "Övriga" },
        { uuid: "a", name: "Aktivitetsutskottet" },
        { uuid: "k", name: "Källarmästeriet" },
        { uuid: "z", name: "Ändringsrådet" },
    ];
    const board = computeLeaderboard(ties, []);
    expect(board.committees.map((c) => c.name)).toEqual(["Aktivitetsutskottet", "Källarmästeriet", "Ändringsrådet", "Övriga"]);
});

test("anonymous rows count for committees but not on the donor board", () => {
    const board = computeLeaderboard(variants, [row("cafe", "", 1500)]);
    expect(board.committees[0]).toMatchObject({ name: "Cafémästeriet", total: 1500 });
    expect(board.donors).toEqual([]);
});

test("donors show their latest spelling and the committee they gave most to", () => {
    const rows = [
        { ...row("km", "kalle anka", 1500, 1), purchaserKey: "kalle anka" },
        { ...row("sexm", "Kalle Anka", 3000, 2), purchaserKey: "kalle anka" },
    ];
    const [donor] = computeLeaderboard(variants, rows).donors;
    expect(donor).toMatchObject({ name: "Kalle Anka", total: 4500, donations: 2, favourite: "Sexmästeriet" });
    expect(donor!.favouriteLogo).toBe("logos/sexmasteriet.svg");
});

test("only the top ten donors are shown", () => {
    const rows = Array.from({ length: 12 }, (_, i) => row("km", `Donor ${i}`, (i + 1) * 100));
    const { donors } = computeLeaderboard(variants, rows);
    expect(donors).toHaveLength(10);
    expect(donors[0]!.name).toBe("Donor 11");
});

test("rows for a variant no longer on the product still count, under their own name", () => {
    const old: Row = { ...row("km", "A", 1000), variantUuid: "removed", variantName: "Skatt" };
    const board = computeLeaderboard(variants, [old]);
    expect(board.committees[0]).toMatchObject({ name: "Skatt", total: 1000 });
    expect(board.committees).toHaveLength(4);
});

test("recent donations are the newest first, with ids that stay the same between syncs", () => {
    const rows = Array.from({ length: 10 }, (_, i) => row(i % 2 ? "km" : "sexm", i === 9 ? "" : `Donor ${i}`, 1500, i));
    const { recent } = computeLeaderboard(variants, rows);
    expect(recent).toHaveLength(8);
    expect(recent[0]).toMatchObject({ name: "", committee: "Källarmästeriet", amount: 1500, timestamp: "2026-10-24T19:09:00.000Z" });
    expect(recent[0]!.logo).toBe("logos/kallarmasteriet.svg");
    expect(recent.at(-1)!.name).toBe("Donor 2");
    expect(computeLeaderboard(variants, rows).recent.map((d) => d.id)).toEqual(recent.map((d) => d.id));
});

test("identical rows get different ids", () => {
    const { recent } = computeLeaderboard(variants, [row("km", "A", 1500), row("km", "A", 1500)]);
    expect(new Set(recent.map((d) => d.id)).size).toBe(2);
});
