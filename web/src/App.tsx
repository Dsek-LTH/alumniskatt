import { lazy, Suspense, useEffect, useState } from "react";
import { Leaderboard, type Mode } from "./components/Leaderboard.tsx";
import { useNow } from "./lib/hooks.ts";

// Only loaded on /dev, so the TV page never downloads it
const DevPanel = lazy(() => import("./dev/DevPanel.tsx"));

export function App() {
    const segments = location.pathname.split("/").filter(Boolean);
    const view = segments.at(-1) ?? "";

    if (view === "dev") {
        return (
            <Suspense>
                <DevPanel />
            </Suspense>
        );
    }

    return <Board view={view} demo={segments[0] === "demo"} />;
}

function Board({ view, demo }: { view: string; demo: boolean }) {
    // /committees and /donors show a single board, /rotate switches between them
    // every ?interval=20 seconds, anything else shows both.
    // Under /demo the same views show simulated donations instead of Zettle's.
    // ?refresh=1 polls every second, which the dev panel's preview uses.
    // ?theme=light or ?theme=dark picks a theme; by default it is dark in the evening.
    const params = new URLSearchParams(location.search);
    const refreshS = Number(params.get("refresh")) || 15;
    const intervalS = Number(params.get("interval")) || 20;
    useTheme(params.get("theme"));

    const fixed: Mode = view === "committees" || view === "donors" ? view : "both";
    const mode = useRotatingMode(view === "rotate", intervalS * 1000) ?? fixed;

    return <Leaderboard mode={mode} demo={demo} refreshMs={refreshS * 1000} />;
}

/** Alternates between the two boards while `enabled`, otherwise null */
function useRotatingMode(enabled: boolean, intervalMs: number): Mode | null {
    const [mode, setMode] = useState<Mode>("committees");
    useEffect(() => {
        if (!enabled) return;
        const timer = setInterval(() => setMode((m) => (m === "committees" ? "donors" : "committees")), intervalMs);
        return () => clearInterval(timer);
    }, [enabled, intervalMs]);
    return enabled ? mode : null;
}

// The pub is dark in the evening, when a bright screen would dazzle
const DARK_FROM_HOUR = 18;
const DARK_UNTIL_HOUR = 6;

/** Sets data-theme on <html>: "light", "dark", or by the time of day */
function useTheme(choice: string | null) {
    const hour = new Date(useNow(60_000)).getHours();
    const theme =
        choice === "light" || choice === "dark"
            ? choice
            : hour >= DARK_FROM_HOUR || hour < DARK_UNTIL_HOUR
              ? "dark"
              : "light";
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);
}
