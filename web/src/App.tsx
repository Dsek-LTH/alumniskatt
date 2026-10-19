import { lazy, Suspense } from "react";
import { Leaderboard, type Mode } from "./components/Leaderboard.tsx";
import { findTheme } from "./lib/themes.ts";

// Only loaded on /dev, so the TV page never downloads it
const DevPanel = lazy(() => import("./dev/DevPanel.tsx"));

export function App() {
    const view = location.pathname.split("/").filter(Boolean).pop() ?? "";

    if (view === "dev") {
        return (
            <Suspense>
                <DevPanel />
            </Suspense>
        );
    }

    // /committees and /donors show a single board, anything else shows both.
    // ?refresh=1 polls every second, which the dev panel's preview uses.
    // ?theme=noir picks a design.
    const params = new URLSearchParams(location.search);
    const mode: Mode = view === "committees" || view === "donors" ? view : "both";
    const refreshS = Number(params.get("refresh")) || 15;
    const theme = findTheme(params.get("theme"));

    return <Leaderboard mode={mode} refreshMs={refreshS * 1000} theme={theme} />;
}
