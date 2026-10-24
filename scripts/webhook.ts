// Manages the Zettle webhook (Pusher API subscription) that tells the server about new purchases.
//
//   bun run webhook subscribe https://alumniskatt.dsek.se/api/zettle/webhook you@dsek.se
//   bun run webhook list
//   bun run webhook delete <uuid>
//
// `subscribe` prints the signing key. Set it as ZETTLE_WEBHOOK_SIGNING_KEY on the server,
// which ignores webhook purchases until it has it.

import { clientFromEnv } from "../server/zettle.ts";

/** Zettle requires subscription ids to be version 1 (time-based) UUIDs */
function uuidV1(): string {
    // 100 ns intervals since the Gregorian calendar began (1582-10-15)
    const time = BigInt(Date.now()) * 10_000n + 0x01b21dd213814000n;
    const hex = (n: bigint, width: number) => n.toString(16).padStart(width, "0");
    const random = crypto.getRandomValues(new Uint8Array(8));
    const clockSeq = (((random[0]! & 0x3f) | 0x80) << 8) | random[1]!;
    // The multicast bit marks the node id as random rather than a MAC address
    random[2] = random[2]! | 0x01;
    const node = [...random.slice(2)].map((b) => b.toString(16).padStart(2, "0")).join("");
    return [
        hex(time & 0xffffffffn, 8),
        hex((time >> 32n) & 0xffffn, 4),
        hex(((time >> 48n) & 0x0fffn) | 0x1000n, 4),
        clockSeq.toString(16).padStart(4, "0"),
        node,
    ].join("-");
}

const [command, ...args] = process.argv.slice(2);
const zettle = clientFromEnv();

if (command === "subscribe") {
    const [destination, contactEmail] = args;
    if (!destination?.startsWith("https://") || !contactEmail) {
        throw new Error("Usage: bun run webhook subscribe <https://…/api/zettle/webhook> <contact email>");
    }
    const subscription = await zettle.createSubscription({
        uuid: uuidV1(),
        transportName: "WEBHOOK",
        eventNames: ["PurchaseCreated"],
        destination,
        contactEmail,
    });
    console.log(`Subscribed ${subscription.uuid} → ${subscription.destination} (${subscription.status})`);
    console.log(`\nSet this on the server:\n\nZETTLE_WEBHOOK_SIGNING_KEY=${subscription.signingKey}`);
} else if (command === "list") {
    const subscriptions = await zettle.subscriptions();
    if (subscriptions.length === 0) console.log("No subscriptions");
    for (const s of subscriptions) {
        console.log(`${s.uuid}  ${s.status ?? ""}  ${s.eventNames.join(",")}  → ${s.destination}`);
    }
} else if (command === "delete" && args[0]) {
    await zettle.deleteSubscription(args[0]);
    console.log(`Deleted ${args[0]}`);
} else {
    console.log("Usage: bun run webhook subscribe <url> <email> | list | delete <uuid>");
}
