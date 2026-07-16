import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(".");
const dist = resolve(root, "dist");

if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
}

mkdirSync(dist, { recursive: true });
for (const entry of ["index.html", "src", "data"]) {
  cpSync(resolve(root, entry), resolve(dist, entry), { recursive: true });
}

console.log("Built static Tiles app in dist/");
