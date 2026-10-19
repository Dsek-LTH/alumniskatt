function required(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing ${name} in .env`);
    return value;
}


// Paypal stores times in UTC, shift to account for our timezone. 
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
    port: Number(process.env.PORT || 3000),
};
