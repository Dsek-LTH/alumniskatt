import { createContext, useContext, useEffect } from "react";

// Design directions to pick from. Colours and typography live in themes.css under
// .leaderboard[data-theme="<id>"]; this file holds what the app needs to know.

export type Theme = {
    id: string;
    label: string;
    description: string;
    /** Dark themes use the dark variants of the committee logos */
    dark: boolean;
    /** Google Fonts families, loaded only when the theme is used */
    fonts: string[];
};

export const THEMES: Theme[] = [
    {
        id: "noir",
        label: "Champagne Noir",
        description: "Svart, champagneguld och tunna linjer. Galamiddag.",
        dark: true,
        fonts: ["Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600", "Manrope:wght@400;500;600;700;800"],
    },
    {
        id: "velvet",
        label: "Velvet Lounge",
        description: "Plommonsammet i rörelse bakom flytande glas. Cocktailbar.",
        dark: true,
        fonts: ["Bodoni+Moda:ital,opsz,wght@1,6..96,400..700", "Jost:wght@300..700"],
    },
    {
        id: "invite",
        label: "Members' Club",
        description: "Elfenbenskartong, guldfolie och graverad typografi. Inbjudningskort.",
        dark: false,
        fonts: ["Playfair+Display:ital,wght@0,500..900;1,500..900", "Outfit:wght@300..800"],
    },
    {
        id: "club",
        label: "Midnight Club",
        description: "Nästan svart med skarp neonrosa och violett. VIP-listan.",
        dark: true,
        fonts: ["Syne:wght@500..800", "Inter:wght@400;500;600;700;800"],
    },
    {
        id: "bauhaus",
        label: "Bauhaus",
        description: "Papper, röd, blå och gul, tjocka svarta ramar och raka hörn.",
        dark: false,
        fonts: ["League+Spartan:wght@500..900", "Jost:wght@400..700"],
    },
    {
        id: "utility",
        label: "Utilitarian",
        description: "Grått, monospace och hårfina linjer. En instrumentpanel.",
        dark: false,
        fonts: ["IBM+Plex+Mono:wght@400;500;600", "IBM+Plex+Sans:wght@400;500;600;700"],
    },
    {
        id: "neobrutal",
        label: "Neo-Brutalism",
        description: "Svarta konturer, hårda skuggor och klara platta färger.",
        dark: false,
        fonts: ["Archivo+Black", "Space+Grotesk:wght@400..700"],
    },
    {
        id: "aurora",
        label: "Aurora",
        description: "Norrsken som böljar över natthimlen bakom frostat glas.",
        dark: true,
        fonts: ["Instrument+Serif:ital@0;1", "Manrope:wght@400..800"],
    },
    {
        id: "ethereal",
        label: "Ethereal",
        description: "Ljusa pasteller, svävande dimma och tunn kursiv serif.",
        dark: false,
        fonts: ["Cormorant+Garamond:ital,wght@0,400..700;1,400..700", "Mulish:wght@300..800"],
    },
    {
        id: "classic",
        label: "Classic",
        description: "Den nuvarande ljusa designen.",
        dark: false,
        fonts: ["Cinzel:wght@600;800", "Inter:wght@400;500;600;700;800"],
    },
];

export const DEFAULT_THEME = "velvet";

export function findTheme(id: string | null): Theme {
    return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME)!;
}

/** Adds the theme's Google Fonts stylesheet to the page (once per theme). */
export function useThemeFonts(theme: Theme) {
    useEffect(() => {
        const id = `fonts-${theme.id}`;
        if (document.getElementById(id)) return;
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?${theme.fonts.map((f) => `family=${f}`).join("&")}&display=swap`;
        document.head.append(link);
    }, [theme]);
}

export const ThemeContext = createContext<Theme>(findTheme(null));

export const useTheme = () => useContext(ThemeContext);
