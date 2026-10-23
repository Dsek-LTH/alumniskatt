import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { Donation, Leaderboard } from "../../../server/types.ts";

/** Polls the leaderboard API at `url`. Returns null until the first response. */
export function useLeaderboard(url: string, refreshMs: number): Leaderboard | null {
    const [data, setData] = useState<Leaderboard | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const res = await fetch(url);
                if (res.ok && !cancelled) setData(await res.json());
            } catch (e) {
                console.error(e);
            }
        };
        load();
        const timer = setInterval(load, refreshMs);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [url, refreshMs]);

    return data;
}

export type Bump = { id: number; delta: number };

/**
 * Reports when a total grows, so the caller can flash and show "+15 kr".
 * When `identity` changes (a new leader) it still bumps, but without a delta.
 * Each bump gets a new id, used as a React key to restart the animation.
 */
export function useBump(total: number, identity = ""): Bump | null {
    const previous = useRef<{ total: number; identity: string } | null>(null);
    const [bump, setBump] = useState<Bump | null>(null);

    useEffect(() => {
        const last = previous.current;
        previous.current = { total, identity };
        if (last && total > last.total) {
            const delta = last.identity === identity ? total - last.total : 0;
            setBump((b) => ({ id: (b?.id ?? 0) + 1, delta }));
        }
    }, [total, identity]);

    return bump;
}

/**
 * Counts how often `value` has changed since the first render, e.g. a new leader.
 * Used as a React key to replay an animation on every change.
 */
export function useChangeCount(value: string): number {
    const previous = useRef(value);
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (previous.current !== value) setCount((c) => c + 1);
        previous.current = value;
    }, [value]);
    return count;
}

export type Climb = { id: number; by: number };

/** Reports when a row moves up the list, and by how many places */
export function useClimb(rank: number): Climb | null {
    const previous = useRef(rank);
    const [climb, setClimb] = useState<Climb | null>(null);
    useEffect(() => {
        if (rank < previous.current) {
            const by = previous.current - rank;
            setClimb((c) => ({ id: (c?.id ?? 0) + 1, by }));
        }
        previous.current = rank;
    }, [rank]);
    return climb;
}

// How long each celebration is on screen, and how many can wait their turn.
// Zettle is polled every minute, so a few donations often arrive at once.
const CELEBRATION_MS = 4500;
const MAX_QUEUED = 4;

/**
 * The donation to celebrate right now, if any. Donations already there when the
 * page loads are not celebrated; new ones are shown one at a time, oldest first.
 */
export function useCelebration(recent: Donation[] | undefined): Donation | null {
    const seen = useRef<Set<string> | null>(null);
    const [queue, setQueue] = useState<Donation[]>([]);

    useEffect(() => {
        if (!recent) return;
        if (!seen.current) {
            seen.current = new Set(recent.map((d) => d.id));
            return;
        }
        const fresh = recent.filter((d) => !seen.current!.has(d.id)).reverse();
        for (const d of fresh) seen.current.add(d.id);
        if (fresh.length > 0) setQueue((q) => [...q, ...fresh].slice(-MAX_QUEUED));
    }, [recent]);

    const current = queue[0] ?? null;
    useEffect(() => {
        if (!current) return;
        const timer = setTimeout(() => setQueue((q) => q.slice(1)), CELEBRATION_MS);
        return () => clearTimeout(timer);
    }, [current]);

    return current;
}

/** The current time, updated every `intervalMs`. */
export function useNow(intervalMs: number): number {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);
    return now;
}

/**
 * Shrinks the layout in small steps (via the --fit CSS variable) until the page fits
 * the screen without scrolling. Reruns when `deps` change, on resize and once webfonts load.
 */
export function useFitToScreen(ref: RefObject<HTMLElement | null>, deps: unknown[]) {
    const fit = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        const root = document.documentElement;
        let value = 1;
        el.style.setProperty("--fit", String(value));
        while (root.scrollHeight > innerHeight + 1 && value > 0.5) {
            value -= 0.05;
            el.style.setProperty("--fit", value.toFixed(2));
        }
    }, [ref]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useLayoutEffect(fit, deps);

    useEffect(() => {
        addEventListener("resize", fit);
        document.fonts.ready.then(fit);
        return () => removeEventListener("resize", fit);
    }, [fit]);
}
