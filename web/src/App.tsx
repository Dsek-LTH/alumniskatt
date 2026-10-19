import { lazy, Suspense } from "react";
import { Leaderboard, type Mode } from "./components/Leaderboard.tsx";

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

    // /committees and /donors show a single board, anything else shows both.
    // Under /demo the same views show simulated donations instead of Zettle's.
    // ?refresh=1 polls every second, which the dev panel's preview uses.
    const params = new URLSearchParams(location.search);
    const mode: Mode = view === "committees" || view === "donors" ? view : "both";
    const demo = segments[0] === "demo";
    const refreshS = Number(params.get("refresh")) || 15;

    return <Leaderboard mode={mode} demo={demo} refreshMs={refreshS * 1000} />;
}
