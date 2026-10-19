import { config } from "./config.ts";
import { startPoller } from "./poller.ts";
import { startServer } from "./server.ts";
import { createStore } from "./store.ts";
import { ZettleClient } from "./zettle.ts";

const store = createStore();
const zettle = new ZettleClient(config.zettleClientId, config.zettleApiKey);

startPoller(store, zettle, {
    productUuid: config.productUuid,
    eventStart: config.eventStart,
    eventEnd: config.eventEnd,
    intervalS: config.pollIntervalS,
});

const server = startServer(store, { port: config.port, pollIntervalS: config.pollIntervalS });

console.log(`alumniskatt listening on ${server.url} (event window from ${config.eventStart()})`);
