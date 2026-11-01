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

/**
 * Explains a signature mismatch without logging secrets: which header names arrived, the
 * signature's shape, and whether any plausible variant of Zettle's scheme would have matched.
 */
function diagnose(signingKey: string, timestamp: string, payload: string, signature: string, headers: Headers, body: string): string {
    const variants: Record<string, string> = {};
    const keys: Record<string, Buffer | string> = { "key as text": signingKey, "key base64-decoded": Buffer.from(signingKey, "base64") };
    // The payload as it appears in the body, still JSON-escaped
    const rawPayload = /"payload"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(body)?.[1] ?? "";
    const messages: Record<string, string> = {
        "timestamp.payload": `${timestamp}.${payload}`,
        payload,
        "timestamp.rawPayload": `${timestamp}.${rawPayload}`,
        rawPayload,
        body,
    };
    for (const [keyName, key] of Object.entries(keys)) {
        for (const [msgName, msg] of Object.entries(messages)) {
            const mac = createHmac("sha256", key).update(msg).digest();
            variants[`hex, ${keyName}, ${msgName}`] = mac.toString("hex");
            variants[`base64, ${keyName}, ${msgName}`] = mac.toString("base64");
        }
    }
    const given = signature.trim();
    const match = Object.entries(variants).find(([, v]) => v.toLowerCase() === given.toLowerCase())?.[0];
    return JSON.stringify({
        match: match ?? "none",
        signatureLength: given.length,
        signatureStart: given.slice(0, 6),
        keyLength: signingKey.length,
        timestamp,
        payloadLength: payload.length,
        rawPayloadLength: rawPayload.length,
        nonAscii: /[^\x00-\x7f]/.test(payload),
        headers: [...headers.keys()],
    });
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
        const body = await req.text();
        let message: Message;
        try {
            message = JSON.parse(body) as Message;
        } catch {
            return new Response("Expected JSON", { status: 400 });
        }

        // Sent once when the subscription is created, before the signing key is configured
        if (message.eventName === "TestMessage") return new Response("OK");

        if (!opts.signingKey) {
            console.warn(`[webhook] ${message.eventName} ignored: ZETTLE_WEBHOOK_SIGNING_KEY is not set`);
            return new Response("Not configured", { status: 202 });
        }
        const { timestamp, payload } = message;
        const signature = req.headers.get("x-izettle-signature") ?? "";
        if (typeof timestamp !== "string" || typeof payload !== "string" || !signature) {
            console.warn(`[webhook] rejected a malformed message (signature header: ${signature ? "present" : "missing"}, timestamp: ${typeof timestamp}, payload: ${typeof payload})`);
            return new Response("Bad signature", { status: 401 });
        }
        if (!validSignature(opts.signingKey, timestamp, payload, signature)) {
            console.warn(`[webhook] rejected a message with a wrong signature: ${diagnose(opts.signingKey, timestamp, payload, signature, req.headers, body)}`);
            return new Response("Bad signature", { status: 401 });
        }

        // Other events are only verified, which lets `bun run webhook events` test the
        // signature with e.g. ProductUpdated instead of a sale
        if (message.eventName !== "PurchaseCreated") {
            console.log(`[webhook] signature OK on ${message.eventName}, ignored`);
            return new Response("Ignored");
        }
        if (hasProduct(payload, opts.productUuid)) {
            console.log("[webhook] alumniskatt purchase → syncing");
            opts.onPurchase();
        }
        return new Response("OK");
    };
}
