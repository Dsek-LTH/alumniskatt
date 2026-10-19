import { MotionConfig } from "motion/react";
import { useRef } from "react";
import { useFitToScreen, useLeaderboard } from "../lib/hooks.ts";
import { ThemeContext, useThemeFonts, type Theme } from "../lib/themes.ts";
import { CommitteeBoard } from "./CommitteeBoard.tsx";
import { DonorBoard } from "./DonorBoard.tsx";
import { Footer } from "./Footer.tsx";
import { GlassFilter } from "./GlassFilter.tsx";
import { Header } from "./Header.tsx";

export type Mode = "both" | "committees" | "donors";

type Props = { mode: Mode; refreshMs: number; theme: Theme; };

export function Leaderboard({ mode, refreshMs, theme }: Props) {
    const data = useLeaderboard(refreshMs);
    const ref = useRef<HTMLDivElement>(null);
    useThemeFonts(theme);
    useFitToScreen(ref, [data, mode, theme ]);

    return (
        <ThemeContext value={theme}>
            <MotionConfig reducedMotion="user">
                <div
                    ref={ref}
                    className="leaderboard"
                    data-theme={theme.id}
                    data-mode={mode === "both" ? undefined : mode}
                >
                    <GlassFilter />
                <Header total={data?.total ?? 0} donations={data?.donations ?? 0} />
                    <main>
                        {data && mode !== "donors" && <CommitteeBoard committees={data.committees} />}
                        {data && mode !== "committees" && <DonorBoard donors={data.donors} />}
                    </main>
                    <Footer updatedAt={data?.updatedAt ?? null} />
                </div>
            </MotionConfig>
        </ThemeContext>
    );
}
