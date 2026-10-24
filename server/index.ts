import { config } from "./config.ts";
import { startPoller } from "./poller.ts";
import { startServer } from "./server.ts";
import { createSimulation, demoRoutes, simulateActivity } from "./simulation.ts";
import { createStore } from "./store.ts";
import { zettleWebhook } from "./webhook.ts";
import { ZettleClient } from "./zettle.ts";

const store = createStore();
const zettle = new ZettleClient(config.zettleClientId, config.zettleApiKey);

const poller = startPoller(store, zettle, {
    productUuid: config.productUuid,
    eventStart: config.eventStart,
    eventEnd: config.eventEnd,
    intervalS: config.pollIntervalS,
});

// /demo shows the board on simulated donations, for checking how it looks on the
// real screens with activity going on. It has its own store, apart from Zettle's.
const demo = createSimulation();
simulateActivity(demo);

const server = startServer(store, {
    port: config.port,
    pollIntervalS: config.pollIntervalS,
    extraRoutes: {
        ...demoRoutes(demo),
        // Zettle calls this on every purchase (see scripts/webhook.ts), so the board syncs at once
        "/api/zettle/webhook": {
            POST: zettleWebhook({
                signingKey: config.zettleWebhookSigningKey,
                productUuid: config.productUuid,
                onPurchase: () => void poller.syncNow(),
            }),
        },
    },
});

console.log(`alumniskatt listening on ${server.url} (event window from ${config.eventStart()})`);
