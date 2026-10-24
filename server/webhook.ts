// Zettle's Pusher API POSTs here when a purchase is made, so the board can sync at once
// instead of waiting for the next poll. The message only triggers a sync: Zettle's
// Purchase API stays the source of truth.

import { createHmac, timingSafeEqual } from "node:crypto";

/** The envelope Zettle sends. `payload` is the event as a JSON string. */
type Message = {
    eventName?: string;
    timestamp?: string;
    payload?: unknown;
};

/** Zettle signs "<timestamp>.<payload>" with HMAC-SHA256 and the subscription's signing key */
export function validSignature(signingKey: string, timestamp: string, payload: string, signature: string): boolean {
    const expected = Buffer.from(createHmac("sha256", signingKey).update(`${timestamp}.${payload}`).digest("hex"));
    const given = Buffer.from(signature.trim().toLowerCase());
    return expected.length === given.length && timingSafeEqual(expected, given);
}

/** True if a PurchaseCreated payload has an alumniskatt row */
function hasProduct(payload: string, productUuid: string): boolean {
    try {
        const purchase = JSON.parse(payload) as { products?: { productUuid?: string }[] };
        return purchase.products?.some((p) => p.productUuid === productUuid) ?? false;
    } catch {
        return false;
    }
}

/**
 * The webhook route. It answers at once (Zettle gives up after 10 seconds) and calls
 * `onPurchase` for signed purchases with an alumniskatt row; the caller syncs in the background.
 */
export function zettleWebhook(opts: { signingKey?: string; productUuid: string; onPurchase: () => void }) {
    return async (req: Request): Promise<Response> => {
        let message: Message;
        try {
            message = (await req.json()) as Message;
        } catch {
            return new Response("Expected JSON", { status: 400 });
        }

        // Sent once when the subscription is created, before the signing key is configured
        if (message.eventName === "TestMessage") return new Response("OK");
        if (message.eventName !== "PurchaseCreated") return new Response("Ignored");

        if (!opts.signingKey) {
            console.warn("[webhook] purchase ignored: ZETTLE_WEBHOOK_SIGNING_KEY is not set");
            return new Response("Not configured", { status: 202 });
        }
        const { timestamp, payload } = message;
        const signature = req.headers.get("x-izettle-signature") ?? "";
        if (typeof timestamp !== "string" || typeof payload !== "string" || !validSignature(opts.signingKey, timestamp, payload, signature)) {
            console.warn("[webhook] rejected a message with a missing or wrong signature");
            return new Response("Bad signature", { status: 401 });
        }

        if (hasProduct(payload, opts.productUuid)) {
            console.log("[webhook] alumniskatt purchase → syncing");
            opts.onPurchase();
        }
        return new Response("OK");
    };
}
