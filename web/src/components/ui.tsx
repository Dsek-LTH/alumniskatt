import type { Donor } from "../../../src/types.ts";
import { kr } from "../lib/format.ts";
import type { Bump } from "../lib/hooks.ts";
import { useTheme } from "../lib/themes.ts";

// Logo paths come from our own API ("logos/km.svg"), never from the till.
// Dark themes use the variants in logos/dark/, drawn for dark backgrounds.
export function Logo({ src, className = "logo" }: { src: string; className?: string }) {
    const { dark } = useTheme();
    const path = dark ? src.replace(/^logos\//, "logos/dark/") : src;
    return <img className={className} src={`/${path}`} alt="" />;
}

export function Rank({ n }: { n: number }) {
    return <span className="rank">{n}</span>;
}

/** "9 st · mest till 🍺 Sexmästeriet" */
export function FavouriteLine({ donor }: { donor: Donor }) {
    return (
        <span className="sub">
            {donor.donations} st - mest till
            <Logo src={donor.favouriteLogo} className="mini" />
            {donor.favourite}
        </span>
    );
}

/** "Kalle Anka" → "KA", shown in a medallion on the top donor's card */
export function Monogram({ name }: { name: string }) {
    const initials = name
        .split(/[\s-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]!.toUpperCase())
        .join("");
    return (
        <span className="monogram" aria-hidden>
            {initials}
        </span>
    );
}

/**
 * The flash behind a row and the floating "+15 kr". Keyed by the bump id,
 * so each new bump remounts them and restarts the animation.
 */
export function BumpEffects({ bump }: { bump: Bump | null }) {
    if (!bump) return null;
    return (
        <>
            <span key={`flash-${bump.id}`} className="flash" aria-hidden />
            {bump.delta > 0 && (
                <span key={`delta-${bump.id}`} className="delta num">
                    +{kr(bump.delta)}
                </span>
            )}
        </>
    );
}
