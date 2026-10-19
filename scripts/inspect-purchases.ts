// Verifies that row comments and variants come through the Purchase API.
//
//   bun run inspect              # last 3 days
//   bun run inspect 2026-10-01   # since a date
//   bun run inspect --raw        # also dump the raw JSON of the newest purchase

import { clientFromEnv } from "../server/zettle.ts";

const args = process.argv.slice(2);
const raw = args.includes("--raw");
const since =
    args.find((a) => !a.startsWith("--")) ??
    new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().slice(0, 10);

const zettle = clientFromEnv();
const { purchases } = await zettle.purchases({ startDate: since, limit: 100 });

console.log(`${purchases.length} purchase(s) since ${since}\n`);

let rows = 0;
let withComment = 0;
let withVariant = 0;

for (const p of purchases) {
    console.log(`${p.timestamp}  ${(p.amount / 100).toFixed(2)} kr  ${p.purchaseUUID1}`);
    for (const r of p.products) {
        rows++;
        if (r.comment) withComment++;
        if (r.variantName) withVariant++;
        console.log(
            `   ${String(r.quantity).padStart(3)} × ${r.name ?? "?"}` +
                (r.variantName ? ` [${r.variantName}]` : "") +
                `  ${(r.unitPrice / 100).toFixed(2)} kr` +
                (r.comment ? `  comment: "${r.comment}"` : ""),
        );
    }
}

console.log(`\nRows: ${rows}, with comment: ${withComment}, with variant: ${withVariant}`);
if (rows > 0 && withComment === 0) {
    console.log("No comments found. Make a test sale with a row comment and rerun.");
}

if (raw && purchases.length > 0) {
    console.log("\nRaw JSON of newest purchase:");
    console.log(JSON.stringify(purchases.at(-1), null, 2));
}
