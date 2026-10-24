import type { Row, Store } from "./store.ts";
import type { ZettleClient, ZettlePurchase } from "./zettle.ts";

/** "  Lu7015GE-s " → "lu7015ge-s" */
export function purchaserKey(comment: string): string {
    return comment.trim().replace(/\s+/g, " ").toLowerCase();
}

export function extractRows(purchases: ZettlePurchase[], productUuid: string): Row[] {
    const rows: Row[] = [];
    for (const p of purchases) {
        for (const product of p.products) {
            if (product.productUuid !== productUuid) continue;
            const comment = (product.comment ?? "").trim();
            rows.push({
                timestamp: p.timestamp,
                variantUuid: product.variantUuid ?? "",
                variantName: product.variantName ?? "Okänt utskott",
                purchaserRaw: comment,
                purchaserKey: purchaserKey(comment),
                amount: Math.round(Number(product.quantity) * product.unitPrice) - (product.discountValue ?? 0),
            });
        }
    }
    return rows;
}

/**
 * Refetches the whole event window every run and replaces the snapshot. One evening is
 * a handful of pages at most, and refetching makes later edits show up.
 */
export async function syncOnce(
    store: Store,
    zettle: ZettleClient,
    opts: { productUuid: string; eventStart: string; eventEnd?: string },
): Promise<number> {
    const product = await zettle.product(opts.productUuid);
    const purchases = await zettle.allPurchases(opts.eventStart, opts.eventEnd);
    const rows = extractRows(purchases, opts.productUuid);
    store.replace(product.variants, rows);
    return rows.length;
}

/**
 * Syncs every `intervalS` seconds. `syncNow` syncs at once, e.g. when Zettle's webhook
 * reports a purchase. Calls during a sync are coalesced into one more sync after it,
 * so a burst of purchases costs at most two fetches and none is missed.
 */
export function startPoller(
    store: Store,
    zettle: ZettleClient,
    opts: { productUuid: string; eventStart: () => string; eventEnd?: string; intervalS: number },
) {
    const run = async () => {
        try {
            const count = await syncOnce(store, zettle, { ...opts, eventStart: opts.eventStart() });
            console.log(`[poller] ${new Date().toISOString()} synced ${count} alumniskatt row(s)`);
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            console.error(`[poller] ${message}`);
            store.markError(message);
        }
    };

    let running: Promise<void> | null = null;
    let again = false;
    const syncNow = (): Promise<void> => {
        if (running) {
            again = true;
            return running;
        }
        running = (async () => {
            do {
                again = false;
                await run();
            } while (again);
            running = null;
        })();
        return running;
    };

    syncNow();
    const timer = setInterval(syncNow, opts.intervalS * 1000);
    return { syncNow, timer };
}
