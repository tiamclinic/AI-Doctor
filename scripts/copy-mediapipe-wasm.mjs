import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const dest = join(root, "public", "mediapipe", "wasm");

if (!existsSync(src)) {
  console.warn(
    `[copy-mediapipe-wasm] Skipped: source not found at ${src}. Did you run \`npm install\`?`,
  );
  process.exit(0);
}

mkdirSync(dest, { recursive: true });

const entries = readdirSync(src);
await Promise.all(
  entries.map((file) => copyFile(join(src, file), join(dest, file))),
);

console.log(
  `[copy-mediapipe-wasm] Copied ${entries.length} file(s) to public/mediapipe/wasm`,
);
