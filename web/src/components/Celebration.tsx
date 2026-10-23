import { AnimatePresence, motion } from "motion/react";
import type { CSSProperties } from "react";
import type { Donation } from "../../../server/types.ts";
import { kr } from "../lib/format.ts";
import { Logo } from "./ui.tsx";

const COLOURS = ["var(--dsek)", "var(--infocom)", "var(--lime)"];

// Confetti pieces flying out from the middle: an angle, a distance and a spin each.
// Fixed rather than random, so a re-render doesn't scatter them anew.
const PIECES = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2 + (i % 3) * 0.25;
    const distance = 28 + ((i * 37) % 22);
    return {
        "--dx": `${Math.cos(angle) * distance}vw`,
        "--dy": `${Math.sin(angle) * distance * 0.7}vh`,
        "--spin": `${((i * 97) % 720) - 360}deg`,
        "--delay": `${(i % 5) * 40}ms`,
        background: COLOURS[i % COLOURS.length],
        borderRadius: i % 4 === 0 ? "50%" : undefined,
    } as CSSProperties;
});

/** A banner over the boards for a donation that just came in */
export function Celebration({ donation }: { donation: Donation | null }) {
    return (
        <div className="celebration" aria-live="polite">
            <AnimatePresence>
                {donation && (
                    <motion.div
                        key={donation.id}
                        className="celebration-card"
                        initial={{ opacity: 0, scale: 1.6, rotate: -8 }}
                        animate={{ opacity: 1, scale: 1, rotate: -2 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    >
                        <span className="celebration-label">Ny alumniskatt!</span>
                        <span className="celebration-name">{donation.name || "Någon"}</span>
                        <span className="celebration-line">
                            gav <b className="num">{kr(donation.amount)}</b> till
                            <Logo src={donation.logo} className="mini" />
                            <b>{donation.committee}</b>
                        </span>
                        <span className="confetti" aria-hidden>
                            {PIECES.map((style, i) => (
                                <i key={i} style={style} />
                            ))}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
