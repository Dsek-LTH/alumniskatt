import { expect, mock, test } from "bun:test";
import { createHmac } from "node:crypto";
import { validSignature, zettleWebhook } from "./webhook.ts";

const KEY = "signing-key";
const PRODUCT = "alumniskatt-uuid";

const sign = (timestamp: string, payload: string) => createHmac("sha256", KEY).update(`${timestamp}.${payload}`).digest("hex");

function post(body: object, signature?: string) {
    return new Request("http://localhost/api/zettle/webhook", {
        method: "POST",
        headers: signature ? { "X-iZettle-Signature": signature } : {},
        body: JSON.stringify(body),
    });
}

function purchase(productUuid: string) {
    const timestamp = "2026-10-24T19:00:00.000Z";
    const payload = JSON.stringify({ purchaseUuid: "p1", products: [{ productUuid }] });
    return { eventName: "PurchaseCreated", timestamp, payload };
}

test("checks the HMAC of timestamp and payload", () => {
    expect(validSignature(KEY, "t", "p", sign("t", "p"))).toBe(true);
    expect(validSignature(KEY, "t", "p", sign("t", "other"))).toBe(false);
    expect(validSignature(KEY, "t", "p", "")).toBe(false);
});

test("a signed alumniskatt purchase triggers a sync", async () => {
    const onPurchase = mock();
    const handle = zettleWebhook({ signingKey: KEY, productUuid: PRODUCT, onPurchase });
    const message = purchase(PRODUCT);
    const res = await handle(post(message, sign(message.timestamp, message.payload)));
    expect(res.status).toBe(200);
    expect(onPurchase).toHaveBeenCalledTimes(1);
});

test("other purchases, bad signatures and test messages don't", async () => {
    const onPurchase = mock();
    const handle = zettleWebhook({ signingKey: KEY, productUuid: PRODUCT, onPurchase });

    const beer = purchase("beer");
    expect((await handle(post(beer, sign(beer.timestamp, beer.payload)))).status).toBe(200);

    const forged = purchase(PRODUCT);
    expect((await handle(post(forged, sign(forged.timestamp, "something else")))).status).toBe(401);
    expect((await handle(post(forged))).status).toBe(401);

    expect((await handle(post({ eventName: "TestMessage", payload: "{}" }))).status).toBe(200);
    expect(onPurchase).not.toHaveBeenCalled();
});

test("without a signing key, purchases are ignored", async () => {
    const onPurchase = mock();
    const handle = zettleWebhook({ productUuid: PRODUCT, onPurchase });
    const message = purchase(PRODUCT);
    expect((await handle(post(message, sign(message.timestamp, message.payload)))).status).toBe(202);
    expect(onPurchase).not.toHaveBeenCalled();
});
