import { motion } from "motion/react";
import type { Ref } from "react";
import type { Committee, Donor } from "../../../server/types.ts";
import { kr } from "../lib/format.ts";
import { useBump, useClimb } from "../lib/hooks.ts";
import { BumpEffects, ClimbBadge, FavouriteLine, Logo, Rank } from "./ui.tsx";

// Rows slide to their new rank and fade in and out of the list. The ref is passed
// on so AnimatePresence's popLayout mode can lift a leaving row out of the layout.
const rowMotion = {
    layout: "position",
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] },
} as const;

type CommitteeRowProps = { committee: Committee; rank: number; max: number; ref?: Ref<HTMLLIElement> };

export function CommitteeRow({ committee, rank, max, ref }: CommitteeRowProps) {
    const bump = useBump(committee.total);
    const climb = useClimb(rank);

    return (
        <motion.li ref={ref} {...rowMotion} className={rank <= 3 ? "committee podium" : "committee"}>
            <BumpEffects bump={bump} />
            <ClimbBadge climb={climb} />
            <Rank n={rank} />
            <Logo src={committee.logo} />
            <span className="name">{committee.name}</span>
            <div className="bar-track">
                <div className="bar" style={{ width: `${(committee.total / max) * 100}%` }} />
            </div>
            <span className="money num">{kr(committee.total)}</span>
        </motion.li>
    );
}

export function DonorRow({ donor, rank, ref }: { donor: Donor; rank: number; ref?: Ref<HTMLLIElement> }) {
    const bump = useBump(donor.total);
    const climb = useClimb(rank);

    return (
        <motion.li ref={ref} {...rowMotion} className={rank <= 3 ? "donor podium" : "donor"}>
            <BumpEffects bump={bump} />
            <ClimbBadge climb={climb} />
            <Rank n={rank} />
            <span className="name">
                {donor.name}
                <FavouriteLine donor={donor} />
            </span>
            <span className="money num">{kr(donor.total)}</span>
        </motion.li>
    );
}
