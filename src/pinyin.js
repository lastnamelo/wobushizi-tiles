import { PINYIN_MAP } from "../data/pinyin-map.js";

const toneMarks = {
  a: ["a", "ā", "á", "ǎ", "à"],
  e: ["e", "ē", "é", "ě", "è"],
  i: ["i", "ī", "í", "ǐ", "ì"],
  o: ["o", "ō", "ó", "ǒ", "ò"],
  u: ["u", "ū", "ú", "ǔ", "ù"],
  v: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
  ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"]
};

export function lookupPinyin(char) {
  return PINYIN_MAP[char] ?? [];
}

export function pinyinToDisplay(raw) {
  if (!raw) return "";

  const syllables = raw.trim().split(/\s+/);
  return syllables.map(markSyllable).join(" ");
}

function markSyllable(syllable) {
  const match = syllable.match(/^(.+?)([1-5])$/);
  if (!match) return syllable.replaceAll("v", "ü");

  const base = match[1].replaceAll("u:", "v").replaceAll("ü", "v");
  const tone = Number(match[2]);
  const readable = base.replaceAll("v", "ü");
  if (tone === 5) return readable;

  const lower = base.toLowerCase();
  const targetIndex = findToneTarget(lower);
  if (targetIndex === -1) return readable;

  const source = base[targetIndex].toLowerCase();
  const marked = toneMarks[source]?.[tone] ?? source;
  return `${readable.slice(0, targetIndex)}${marked}${readable.slice(targetIndex + 1)}`;
}

function findToneTarget(syllable) {
  const priority = ["a", "e", "ou"];
  for (const target of priority) {
    const index = syllable.indexOf(target);
    if (index !== -1) return index;
  }

  for (let index = syllable.length - 1; index >= 0; index -= 1) {
    if ("aeiouvü".includes(syllable[index])) return index;
  }
  return -1;
}
