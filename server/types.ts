// Shared by the server and the web app (web/), so it must not import anything Bun-specific.

export type Committee = { name: string; logo: string; total: number; donations: number };

export type Donor = {
    name: string;
    total: number;
    donations: number;
    favourite: string;
    favouriteLogo: string;
};

/** One alumniskatt, as shown when it comes in. `name` is empty if no name was given. */
export type Donation = {
    id: string;
    name: string;
    committee: string;
    logo: string;
    amount: number;
    timestamp: string;
};

/** GET /api/leaderboard. Amounts are in öre. */
export type Leaderboard = {
    updatedAt: string | null;
    lastError: string | null;
    total: number;
    donations: number;
    committees: Committee[];
    donors: Donor[];
    /** The latest donations, newest first */
    recent: Donation[];
};
