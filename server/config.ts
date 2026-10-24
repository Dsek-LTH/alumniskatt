function required(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing ${name} in .env`);
    return value;
}

// Local midnight (TZ=Europe/Stockholm in Docker), as an ISO string in UTC
function startOfToday(): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

export const config = {
    zettleClientId: required("ZETTLE_CLIENT_ID"),
    zettleApiKey: required("ZETTLE_API_KEY"),
    // The library product whose variants are the committees
    productUuid: required("ALUMNISKATT_PRODUCT_UUID"),
    // Only purchases inside this window count. Defaults to "today", re-evaluated on every
    // poll so a long-running server rolls over at midnight.
    eventStart: () => process.env.EVENT_START || startOfToday(),
    eventEnd: process.env.EVENT_END || undefined,
    pollIntervalS: Number(process.env.POLL_INTERVAL_S || 60),
    // From `bun run webhook subscribe`. Without it, webhook purchases are ignored and
    // the board only updates on the poll.
    zettleWebhookSigningKey: process.env.ZETTLE_WEBHOOK_SIGNING_KEY || undefined,
    port: Number(process.env.PORT || 3000),
};
