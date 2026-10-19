// Minimal Zettle client: API-key auth + Purchase API v2.
// Amounts are in minor units (öre).

const TOKEN_URL = "https://oauth.zettle.com/token";
const PURCHASES_URL = "https://purchase.izettle.com/purchases/v2";
const PRODUCTS_URL = "https://products.izettle.com/organizations/self/products";

export type ZettleLibraryProduct = {
    uuid: string;
    name: string;
    variants: { uuid: string; name: string }[];
};

export type ZettleProduct = {
    name?: string;
    variantName?: string;
    variantUuid?: string;
    productUuid?: string;
    quantity: string | number; // sent as a string
    unitPrice: number;
    discountValue?: number;
    comment?: string;
    type?: "PRODUCT" | "CUSTOM_AMOUNT" | "GIFTCARD";
    [key: string]: unknown;
};

export type ZettlePurchase = {
    purchaseUUID1: string;
    timestamp: string;
    amount: number;
    userDisplayName?: string;
    products: ZettleProduct[];
    [key: string]: unknown;
};

type PurchasesPage = {
    purchases: ZettlePurchase[];
    lastPurchaseHash?: string;
};

export class ZettleClient {
    private token?: { value: string; expiresAt: number };
    private clientId: string;
    private apiKey: string;

    constructor(clientId: string, apiKey: string) {
        this.clientId = clientId;
        this.apiKey = apiKey;
    }

    private async accessToken(): Promise<string> {
        // Refresh a minute before expiry
        if (this.token && Date.now() < this.token.expiresAt - 60_000) {
            return this.token.value;
        }
        const res = await fetch(TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                client_id: this.clientId,
                assertion: this.apiKey,
            }),
        });
        if (!res.ok) {
            throw new Error(`Zettle auth failed: ${res.status} ${await res.text()}`);
        }
        const body = (await res.json()) as { access_token: string; expires_in: number };
        this.token = {
            value: body.access_token,
            expiresAt: Date.now() + body.expires_in * 1000,
        };
        return this.token.value;
    }

    /** One page of purchases, oldest first. Pass the previous page's hash to continue. */
    async purchases(opts: {
        startDate?: string;
        endDate?: string;
        lastPurchaseHash?: string;
        limit?: number;
    }): Promise<PurchasesPage> {
        const params = new URLSearchParams({ limit: String(opts.limit ?? 1000) });
        if (opts.startDate) params.set("startDate", opts.startDate);
        if (opts.endDate) params.set("endDate", opts.endDate);
        if (opts.lastPurchaseHash) params.set("lastPurchaseHash", opts.lastPurchaseHash);

        const res = await fetch(`${PURCHASES_URL}?${params}`, {
            headers: { Authorization: `Bearer ${await this.accessToken()}` },
        });
        if (!res.ok) {
            throw new Error(`Zettle purchases failed: ${res.status} ${await res.text()}`);
        }
        return (await res.json()) as PurchasesPage;
    }

    /** All purchases in a date range, following pagination. */
    async allPurchases(startDate: string, endDate?: string): Promise<ZettlePurchase[]> {
        const all: ZettlePurchase[] = [];
        let lastPurchaseHash: string | undefined;
        while (true) {
            const page = await this.purchases({ startDate, endDate, lastPurchaseHash, limit: 1000 });
            all.push(...page.purchases);
            if (page.purchases.length < 1000 || !page.lastPurchaseHash) return all;
            lastPurchaseHash = page.lastPurchaseHash;
        }
    }

    /** A product from the library, including its variants. */
    async product(productUuid: string): Promise<ZettleLibraryProduct> {
        const res = await fetch(`${PRODUCTS_URL}/${productUuid}`, {
            headers: { Authorization: `Bearer ${await this.accessToken()}` },
        });
        if (!res.ok) {
            throw new Error(`Zettle product failed: ${res.status} ${await res.text()}`);
        }
        return (await res.json()) as ZettleLibraryProduct;
    }
}

export function clientFromEnv(): ZettleClient {
    const { ZETTLE_CLIENT_ID, ZETTLE_API_KEY } = process.env;
    if (!ZETTLE_CLIENT_ID || !ZETTLE_API_KEY) {
        throw new Error("Set ZETTLE_CLIENT_ID and ZETTLE_API_KEY in .env");
    }
    return new ZettleClient(ZETTLE_CLIENT_ID, ZETTLE_API_KEY);
}
