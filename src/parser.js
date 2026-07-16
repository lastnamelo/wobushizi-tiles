import { lookupPinyin } from "./pinyin.js";

const hanziRegex = /\p{Script=Han}/u;

export function parseTextToTiles(text) {
  return Array.from(text).flatMap((char, index) => {
    const isHanzi = hanziRegex.test(char);
    if (!isHanzi && char !== "\n") return [];

    const options = isHanzi ? lookupPinyin(char) : [];

    return {
      id: `${index}-${char.codePointAt(0)}`,
      char,
      kind: char === "\n" ? "break" : "hanzi",
      pinyinOptions: options,
      pinyinIndex: 0,
      colorIndex: 0
    };
  });
}
