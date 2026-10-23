import { MotionConfig } from "motion/react";
import { useRef } from "react";
import { useCelebration, useFitToScreen, useLeaderboard } from "../lib/hooks.ts";
import { Celebration } from "./Celebration.tsx";
import { CommitteeBoard } from "./CommitteeBoard.tsx";
import { DonorBoard } from "./DonorBoard.tsx";
import { Footer } from "./Footer.tsx";
import { Header } from "./Header.tsx";
import { Ticker } from "./Ticker.tsx";

export type Mode = "both" | "committees" | "donors";

type Props = { mode: Mode; demo: boolean; refreshMs: number };

export function Leaderboard({ mode, demo, refreshMs }: Props) {
    const data = useLeaderboard(demo ? "/demo/api/leaderboard" : "/api/leaderboard", refreshMs);
    const celebrating = useCelebration(data?.recent);
    const ref = useRef<HTMLDivElement>(null);
    useFitToScreen(ref, [data, mode]);

    return (
        <MotionConfig reducedMotion="user">
            <div ref={ref} className="leaderboard" data-mode={mode === "both" ? undefined : mode}>
                <Header total={data?.total ?? 0} donations={data?.donations ?? 0} />
                {/* Keyed on the mode, so /rotate fades each board in as it switches */}
                <main key={mode}>
                    {data && mode !== "donors" && <CommitteeBoard committees={data.committees} />}
                    {data && mode !== "committees" && <DonorBoard donors={data.donors} />}
                </main>
                <Ticker recent={data?.recent ?? []} />
                <Footer updatedAt={data?.updatedAt ?? null} demo={demo} />
                <Celebration donation={celebrating} />
            </div>
        </MotionConfig>
    );
}
