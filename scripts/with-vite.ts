// Runs a Bun API server and the Vite dev server together; Ctrl+C stops both.
//
//   bun scripts/with-vite.ts src/dev.ts     (bun run demo)
//   bun scripts/with-vite.ts src/index.ts   (bun run dev)

const entry = process.argv[2];
if (!entry) throw new Error("Usage: bun scripts/with-vite.ts <server entry>");

// Vite proxies /api to this port (see vite.config.ts)
const env = { ...process.env, PORT: "3001", API_PORT: "3001" };

const children = [
    Bun.spawn(["bun", "--watch", "run", entry], { env, stdout: "inherit", stderr: "inherit" }),
    Bun.spawn(["bunx", "vite"], { env, stdout: "inherit", stderr: "inherit" }),
];

const shutdown = () => {
    for (const child of children) child.kill();
    process.exit();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// If either one dies, take the other down too
await Promise.race(children.map((child) => child.exited));
shutdown();

export {};
