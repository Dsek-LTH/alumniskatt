import { MotionConfig } from "motion/react";
import { useRef } from "react";
import { useFitToScreen, useLeaderboard } from "../lib/hooks.ts";
import { CommitteeBoard } from "./CommitteeBoard.tsx";
import { DonorBoard } from "./DonorBoard.tsx";
import { Footer } from "./Footer.tsx";
import { Header } from "./Header.tsx";

export type Mode = "both" | "committees" | "donors";

type Props = { mode: Mode; demo: boolean; refreshMs: number };

export function Leaderboard({ mode, demo, refreshMs }: Props) {
    const data = useLeaderboard(demo ? "/demo/api/leaderboard" : "/api/leaderboard", refreshMs);
    const ref = useRef<HTMLDivElement>(null);
    useFitToScreen(ref, [data, mode]);

    return (
        <MotionConfig reducedMotion="user">
            <div ref={ref} className="leaderboard" data-mode={mode === "both" ? undefined : mode}>
                <Header total={data?.total ?? 0} donations={data?.donations ?? 0} />
                <main>
                    {data && mode !== "donors" && <CommitteeBoard committees={data.committees} />}
                    {data && mode !== "committees" && <DonorBoard donors={data.donors} />}
                </main>
                <Footer updatedAt={data?.updatedAt ?? null} demo={demo} />
            </div>
        </MotionConfig>
    );
}
