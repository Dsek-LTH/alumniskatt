import { expect, test } from "bun:test";
import { extractRows, startPoller } from "./poller.ts";
import { createStore } from "./store.ts";
import type { ZettleClient, ZettlePurchase } from "./zettle.ts";

const PRODUCT = "alumniskatt-uuid";

const purchase = (uuid: string, products: ZettlePurchase["products"]): ZettlePurchase => ({
    purchaseUUID1: uuid,
    timestamp: "2026-10-24T19:00:00.000+0000",
    amount: 0,
    products,
});

test("keeps only alumniskatt rows and normalises the purchaser", () => {
    const rows = extractRows(
        [
            purchase("p1", [
                { productUuid: "beer", quantity: "1", unitPrice: 3000 },
                { productUuid: PRODUCT, variantUuid: "v-sexet", variantName: "Sexet", quantity: "2", unitPrice: 1500, comment: "  Kalle  Anka ", id: "1" },
            ]),
        ],
        PRODUCT,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ amount: 3000, variantName: "Sexet", purchaserRaw: "Kalle  Anka", purchaserKey: "kalle anka" });
});

test("discounts are deducted", () => {
    const rows = extractRows(
        [purchase("p1", [{ productUuid: PRODUCT, quantity: "1", unitPrice: 1500, discountValue: 500 }])],
        PRODUCT,
    );
    expect(rows.map((r) => r.amount)).toEqual([1000]);
});

test("rows without a comment get an empty purchaser", () => {
    const [row] = extractRows([purchase("p1", [{ productUuid: PRODUCT, quantity: "1", unitPrice: 1500 }])], PRODUCT);
    expect(row.purchaserKey).toBe("");
});

test("syncs requested during a sync are coalesced into one more", async () => {
    let fetches = 0;
    let release = () => {};
    const zettle = {
        product: async () => ({ variants: [] }),
        allPurchases: async () => {
            fetches++;
            await new Promise<void>((resolve) => (release = resolve));
            return [];
        },
    } as unknown as ZettleClient;
    const poller = startPoller(createStore(), zettle, { productUuid: PRODUCT, eventStart: () => "2026-10-24", intervalS: 3600 });
    clearInterval(poller.timer);

    // The first sync is running; three webhook calls arrive meanwhile
    await Bun.sleep(0);
    poller.syncNow();
    poller.syncNow();
    const done = poller.syncNow();
    release();
    await Bun.sleep(0);
    release();
    await done;
    expect(fetches).toBe(2);
});
