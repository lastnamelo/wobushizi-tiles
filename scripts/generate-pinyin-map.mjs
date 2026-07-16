import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(".");
const sourcePath = resolve(root, "../data/hanzidb.json");
const outputPath = resolve(root, "data/pinyin-map.js");
const rows = JSON.parse(readFileSync(sourcePath, "utf8"));
const map = {};

for (const row of rows) {
  if (!row.character || !row.pinyin) continue;

  const options = [row.pinyin, ...(typeof row.pinyin_alternates === "string" ? row.pinyin_alternates.split("|") : [])]
    .map((value) => value.trim())
    .filter(Boolean);
  const uniqueOptions = Array.from(new Set(options));
  if (uniqueOptions.length > 0) {
    map[row.character] = uniqueOptions;
  }
}

const content = `// Generated from ../data/hanzidb.json. Do not edit by hand.\n// Run npm run generate:pinyin from tiles/ after updating the source dataset.\nexport const PINYIN_MAP = ${JSON.stringify(map, null, 2)};\n`;

writeFileSync(outputPath, content);
console.log(`Wrote ${Object.keys(map).length} character pinyin entries to ${outputPath}`);
