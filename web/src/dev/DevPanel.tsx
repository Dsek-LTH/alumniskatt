// Control panel for the demo server (`bun run demo`): add donations, load scenarios
// and preview the leaderboard at different screen sizes.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Logo } from "../components/ui.tsx";
import { DEFAULT_THEME, THEMES } from "../lib/themes.ts";
import "./dev.css";

type Options = { committees: { name: string; logo: string }[]; names: string[] };

const VIEWS = [
    { value: "", label: "Båda" },
    { value: "committees", label: "Utskott" },
    { value: "donors", label: "Givare" },
];

const SCREENS = [
    { value: [1920, 1080], label: "TV" },
    { value: [1080, 1920], label: "Stående" },
    { value: [1440, 900], label: "Laptop" },
    { value: [390, 844], label: "Mobil" },
] as const;

const AMOUNTS = [
    { value: 15, label: "15 kr" },
    { value: 30, label: "30 kr" },
    { value: 45, label: "45 kr" },
    { value: 100, label: "100 kr" },
];

const SCENARIOS = [
    { value: "empty", label: "Tom" },
    { value: "early", label: "Tidig kväll" },
    { value: "full", label: "Full kväll" },
];

async function post(path: string, body: object) {
    const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status}`);
}

export default function DevPanel() {
    const [options, setOptions] = useState<Options>({ committees: [], names: [] });
    const [view, setView] = useState("");
    const [screen, setScreen] = useState<readonly [number, number]>(SCREENS[0].value);
    const [amount, setAmount] = useState(15);
    const [name, setName] = useState("Kalle Anka");
    const [auto, setAuto] = useState(false);
    const [theme, setTheme] = useState(DEFAULT_THEME);
    const [log, setLog] = useState<{ id: number; text: string }[]>([]);
    // Bumped to reload the preview, e.g. after loading a scenario
    const [previewKey, setPreviewKey] = useState(0);

    useEffect(() => {
        fetch("/dev/api/options")
            .then((res) => res.json())
            .then(setOptions)
            .catch(() => addLog("Kunde inte nå demoservern. Kör `bun run demo`."));
    }, []);

    function addLog(text: string) {
        const time = new Date().toLocaleTimeString("sv-SE");
        setLog((entries) => [{ id: (entries[0]?.id ?? 0) + 1, text: `${time} · ${text}` }, ...entries].slice(0, 12));
    }

    async function donate(committee: string) {
        try {
            await post("/dev/api/donate", { committee, name, amount });
            const who = name.trim() || "Anonym";
            addLog(`${who} → ${committee}, ${amount} kr`);
        } catch (e) {
            addLog(`Fel: ${e}`);
        }
    }

    async function randomDonation() {
        try {
            await post("/dev/api/donate", {});
            addLog("Slumpad inbetalning");
        } catch (e) {
            addLog(`Fel: ${e}`);
        }
    }

    async function loadScenario(scenario: { value: string; label: string }) {
        try {
            await post("/dev/api/scenario", { scenario: scenario.value });
            addLog(`Scenario: ${scenario.label}`);
            // Reload so the board starts fresh instead of animating every row at once
            setPreviewKey((k) => k + 1);
        } catch (e) {
            addLog(`Fel: ${e}`);
        }
    }

    // A ref so the interval always calls the latest randomDonation
    const randomRef = useRef(randomDonation);
    randomRef.current = randomDonation;
    useEffect(() => {
        if (!auto) return;
        const timer = setInterval(() => randomRef.current(), 2500);
        return () => clearInterval(timer);
    }, [auto]);

    const pickName = () => setName(options.names[Math.floor(Math.random() * options.names.length)] ?? "");

    const params = new URLSearchParams({ refresh: "1", theme });
    const previewUrl = `/${view}?${params}`;

    return (
        <div className="dev-panel">
            <aside>
                <h1>
                    Alumniskatt <span>dev</span>
                </h1>

                <Group title="Vy">
                    <Segmented items={VIEWS} value={view} onChange={setView} />
                </Group>

                <Group title="Tema">
                    <div className="themes">
                        {THEMES.map((t) => (
                            <button key={t.id} aria-pressed={t.id === theme} onClick={() => setTheme(t.id)}>
                                <strong>{t.label}</strong>
                                <span>{t.description}</span>
                            </button>
                        ))}
                    </div>
                </Group>

                <Group title="Skärm">
                    <Segmented items={SCREENS} value={screen} onChange={setScreen} />
                </Group>

                <Group title="Givare">
                    <div className="donor-input">
                        <input
                            list="dev-names"
                            placeholder="Namn (tomt = anonym)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <button title="Slumpa namn" onClick={pickName}>
                            🎲
                        </button>
                    </div>
                    <datalist id="dev-names">
                        {options.names.map((n) => (
                            <option key={n} value={n} />
                        ))}
                    </datalist>
                </Group>

                <Group title="Belopp">
                    <Segmented items={AMOUNTS} value={amount} onChange={setAmount} />
                </Group>

                <Group title="Betala till utskott">
                    <div className="committee-buttons">
                        {options.committees.map((c) => (
                            <button key={c.name} title={c.name} onClick={() => donate(c.name)}>
                                <Logo src={c.logo} className="" />
                                <span>{c.name}</span>
                            </button>
                        ))}
                    </div>
                    <p className="hint">Klicka på ett utskott för att lägga till en inbetalning.</p>
                </Group>

                <Group title="Händelser">
                    <div className="actions">
                        <button className="primary" onClick={randomDonation}>
                            Slumpa inbetalning
                        </button>
                        <button className={auto ? "on" : ""} onClick={() => setAuto((a) => !a)}>
                            Auto: {auto ? "på" : "av"}
                        </button>
                    </div>
                </Group>

                <Group title="Scenario">
                    <div className="actions">
                        {SCENARIOS.map((s) => (
                            <button key={s.value} onClick={() => loadScenario(s)}>
                                {s.label}
                            </button>
                        ))}
                    </div>
                </Group>

                <Group title="Logg">
                    <ol className="log">
                        {log.map((entry) => (
                            <li key={entry.id}>{entry.text}</li>
                        ))}
                    </ol>
                </Group>
            </aside>

            <Preview key={previewKey} url={previewUrl} size={screen} />
        </div>
    );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2>{title}</h2>
            {children}
        </section>
    );
}

function Segmented<T>({
    items,
    value,
    onChange,
}: {
    items: readonly { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
}) {
    return (
        <div className="segmented">
            {items.map((item) => (
                <button
                    key={item.label}
                    aria-pressed={item.value === value}
                    onClick={() => onChange(item.value)}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}

/** Renders the page at the real screen size and scales it down to fit */
function Preview({ url, size }: { url: string; size: readonly [number, number] }) {
    const stage = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [w, h] = size;

    useLayoutEffect(() => {
        const el = stage.current;
        if (!el) return;
        const update = () => {
            const rect = el.getBoundingClientRect();
            setScale(Math.min(rect.width / w, rect.height / h, 1));
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [w, h]);

    return (
        <main>
            <div className="preview-bar">
                <span>
                    {w} × {h} · {Math.round(scale * 100)} %
                </span>
                <a href={url} target="_blank">
                    Öppna i ny flik ↗
                </a>
            </div>
            <div className="stage" ref={stage}>
                <iframe
                    className="screen"
                    title="Förhandsvisning"
                    src={url}
                    style={{ width: w, height: h, transform: `translate(-50%, -50%) scale(${scale})` }}
                />
            </div>
        </main>
    );
}
