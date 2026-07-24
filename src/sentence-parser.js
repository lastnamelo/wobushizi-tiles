import { SENTENCE_WORDS } from "./config.js";
import { lookupPinyin } from "./pinyin.js";

const hanziRegex = /\p{Script=Han}/u;
const wordList = [...new Set(SENTENCE_WORDS)].sort((a, b) => b.length - a.length);

export function parseTextToSentence(text) {
  const lines = text
    .split(/\n/)
    .map((line, lineIndex) => ({
      id: `line-${lineIndex}`,
      groups: parseLine(line.trim(), lineIndex)
    }))
    .filter((line) => line.groups.length > 0);

  return lines.length > 0 ? lines : [{ id: "line-0", groups: [] }];
}

function parseLine(line, lineIndex) {
  if (!line) return [];

  if (/\s/.test(line)) {
    return line
      .split(/\s+/)
      .filter(Boolean)
      .flatMap((segment, segmentIndex) => parseSegment(segment, `${lineIndex}-${segmentIndex}`));
  }

  return parseSegment(line, String(lineIndex));
}

function parseSegment(segment, prefix) {
  const groups = [];
  let index = 0;

  while (index < segment.length) {
    const char = segment[index];
    if (!hanziRegex.test(char)) {
      index += 1;
      continue;
    }

    const word = findWord(segment.slice(index)) ?? char;
    groups.push({
      id: `${prefix}-${index}-${word}`,
      text: word,
      pinyin: wordToPinyin(word),
      chars: wordToChars(word),
      colorIndex: 0
    });
    index += word.length;
  }

  return groups;
}

function findWord(source) {
  return wordList.find((word) => source.startsWith(word));
}

function wordToPinyin(word) {
  return Array.from(word)
    .map((char) => lookupPinyin(char)[0] ?? "")
    .filter(Boolean)
    .join(" ");
}

function wordToChars(word) {
  return Array.from(word).map((char, index) => {
    const options = lookupPinyin(char);
    return {
      id: `${index}-${char.codePointAt(0)}`,
      char,
      pinyinOptions: options,
      pinyinIndex: 0
    };
  });
}
