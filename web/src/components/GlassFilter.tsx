// SVG filter for the "liquid glass" refraction, used by the Velvet theme through
// `backdrop-filter: url(#liquid-glass)`. Near the edges it bends what is behind the
// glass inwards, like a lens; the middle is left untouched. Chromium only — other
// browsers fall back to plain blur (see themes.css).
//
// The displacement map is built from two gradients: red shifts pixels horizontally,
// green vertically, and 50% grey means no shift. They are drawn per element via
// objectBoundingBox units, so one filter fits every card size.

const EDGE = 0.07; // how far in from each edge the lens reaches, as a fraction of the size

function gradientMap(channel: "red" | "green") {
    const colour = (v: number) => (channel === "red" ? `rgb(${v},0,0)` : `rgb(0,${v},0)`);
    const [x2, y2] = channel === "red" ? [1, 0] : [0, 1];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <linearGradient id="g" x1="0" y1="0" x2="${x2}" y2="${y2}">
            <stop offset="0" stop-color="${colour(255)}"/>
            <stop offset="${EDGE}" stop-color="${colour(128)}"/>
            <stop offset="${1 - EDGE}" stop-color="${colour(128)}"/>
            <stop offset="1" stop-color="${colour(0)}"/>
        </linearGradient>
        <rect width="100" height="100" fill="url(#g)"/>
    </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function GlassFilter() {
    return (
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
            <filter
                id="liquid-glass"
                x="0"
                y="0"
                width="1"
                height="1"
                primitiveUnits="objectBoundingBox"
                colorInterpolationFilters="sRGB"
            >
                <feImage href={gradientMap("red")} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="red" />
                <feImage href={gradientMap("green")} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="green" />
                <feComposite in="red" in2="green" operator="arithmetic" k2="1" k3="1" result="map" />
                <feDisplacementMap in="SourceGraphic" in2="map" scale="0.06" xChannelSelector="R" yChannelSelector="G" />
            </filter>
        </svg>
    );
}
