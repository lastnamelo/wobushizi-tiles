import { DEFAULT_CONTROLS, TILE_PALETTE } from "./config.js";
import { createGraphicSvg, createSentenceSvg, createSentenceWordSvg, svgToPngBlob } from "./export.js";
import { parseTextToTiles } from "./parser.js";
import { lookupPinyin } from "./pinyin.js";
import { renderPalette, renderSentence, renderTiles } from "./renderer.js";
import { parseTextToSentence } from "./sentence-parser.js";

const controls = { ...DEFAULT_CONTROLS };
let items = [];
let sentenceLines = [];
let mode = "tiles";

const elements = {
  inputPage: document.querySelector("#inputPage"),
  tilesPage: document.querySelector("#tilesPage"),
  sourceText: document.querySelector("#sourceText"),
  makeTiles: document.querySelector("#makeTiles"),
  makeSentence: document.querySelector("#makeSentence"),
  editText: document.querySelector("#editText"),
  copyAllSvg: document.querySelector("#copyAllSvg"),
  copySentencePng: document.querySelector("#copySentencePng"),
  clearInput: document.querySelector("#clearInput"),
  board: document.querySelector("#tileBoard"),
  sentenceBoard: document.querySelector("#sentenceBoard"),
  sentenceMeaningBar: document.querySelector("#sentenceMeaningBar"),
  inputStatus: document.querySelector("#inputStatus"),
  status: document.querySelector("#status"),
  paletteStrip: document.querySelector("#paletteStrip")
};

if (elements.paletteStrip) {
  renderPalette(elements.paletteStrip);
}
bindEvents();

function bindEvents() {
  elements.makeTiles.addEventListener("click", () => {
    if (!elements.sourceText.value.trim()) {
      setStatus("Paste some Chinese text first.", elements.inputStatus);
      return;
    }
    mode = "tiles";
    reparse();
    showTilesPage();
  });
  elements.makeSentence?.addEventListener("click", () => {
    if (!elements.sourceText.value.trim()) {
      setStatus("Paste some Chinese text first.", elements.inputStatus);
      return;
    }
    mode = "sentence";
    parseSentence();
    showTilesPage();
  });
  elements.editText.addEventListener("click", showInputPage);
  elements.copyAllSvg.addEventListener("click", copyAllSvg);
  elements.copySentencePng?.addEventListener("click", copySentencePng);
  elements.clearInput.addEventListener("click", () => {
    elements.sourceText.value = "";
    setStatus("Input cleared.", elements.inputStatus);
  });
}

function reparse() {
  const previousBySlot = new Map(items.map((item, index) => [`${index}-${item.char}`, item]));
  items = parseTextToTiles(elements.sourceText.value).map((item, index) => {
    const previous = previousBySlot.get(`${index}-${item.char}`);
    if (!previous) return item;
    return {
      ...item,
      colorIndex: previous.colorIndex,
      pinyinIndex: Math.min(previous.pinyinIndex, Math.max(item.pinyinOptions.length - 1, 0))
    };
  });
  render();
}

function render() {
  elements.paletteStrip?.classList.toggle("is-hidden", mode !== "tiles");
  elements.board.classList.toggle("is-hidden", mode !== "tiles");
  elements.sentenceBoard?.classList.toggle("is-hidden", mode !== "sentence");
  elements.sentenceMeaningBar?.classList.add("is-hidden");
  elements.copySentencePng?.classList.add("is-hidden");
  elements.copyAllSvg.classList.toggle("is-hidden", mode === "sentence");
  elements.copyAllSvg.textContent = "Copy all as SVG";

  if (mode === "sentence" && elements.sentenceBoard) {
    renderSentence({
      board: elements.sentenceBoard,
      lines: sentenceLines,
      controls,
      onMerge: mergeSentenceGroups,
      onSplit: splitSentenceGroup,
      onMeaningChange: updateSentenceMeaning,
      onColorCycle: cycleSentenceColor,
      onPinyinCycle: cycleSentencePinyin,
      onCopyWord: copySentenceWord
    });
    return;
  }

  renderTiles({
    board: elements.board,
    items,
    controls,
    onColorCycle: cycleColor,
    onPinyinCycle: cyclePinyin,
    onCopyTile: copySingleTile
  });
}

function parseSentence() {
  sentenceLines = parseTextToSentence(elements.sourceText.value);
  render();
}

function updateSentenceMeaning(id, meaning) {
  sentenceLines = sentenceLines.map((line) => ({
    ...line,
    groups: line.groups.map((group) => (group.id === id ? { ...group, meaning } : group))
  }));
}

function mergeSentenceGroups(lineIndex, groupIndex) {
  const line = sentenceLines[lineIndex];
  if (!line || groupIndex < 0 || groupIndex >= line.groups.length - 1) return;

  const first = line.groups[groupIndex];
  const second = line.groups[groupIndex + 1];
  const pinyin = [first.pinyin, second.pinyin].filter(Boolean).join(" ");
  const merged = {
    id: `${first.id}-${second.id}`,
    text: `${first.text}${second.text}`,
    pinyin,
    chars: [...groupToChars(first), ...groupToChars(second)],
    colorIndex: first.colorIndex ?? 0,
    meaning: [first.meaning, second.meaning].filter(Boolean).join(" / ")
  };

  sentenceLines = sentenceLines.map((candidate, candidateIndex) => {
    if (candidateIndex !== lineIndex) return candidate;
    return {
      ...candidate,
      groups: [
        ...candidate.groups.slice(0, groupIndex),
        merged,
        ...candidate.groups.slice(groupIndex + 2)
      ]
    };
  });
  render();
}

function splitSentenceGroup(lineIndex, groupIndex) {
  const line = sentenceLines[lineIndex];
  const group = line?.groups[groupIndex];
  if (!group) return;

  const chars = Array.from(group.text);
  if (chars.length <= 1) return;

  const syllables = group.pinyin.trim().split(/\s+/).filter(Boolean);
  const splitGroups = chars.map((char, index) => ({
    id: `${group.id}-split-${index}-${char.codePointAt(0)}`,
    text: char,
    pinyin: groupToChars(group)[index]?.pinyinOptions[groupToChars(group)[index]?.pinyinIndex] ?? syllables[index] ?? lookupPinyin(char)[0] ?? "",
    chars: [groupToChars(group)[index] ?? createSentenceChar(char, index)],
    colorIndex: group.colorIndex ?? 0,
    meaning: ""
  }));

  sentenceLines = sentenceLines.map((candidate, candidateIndex) => {
    if (candidateIndex !== lineIndex) return candidate;
    return {
      ...candidate,
      groups: [
        ...candidate.groups.slice(0, groupIndex),
        ...splitGroups,
        ...candidate.groups.slice(groupIndex + 1)
      ]
    };
  });
  render();
}

function cycleSentenceColor(id) {
  sentenceLines = sentenceLines.map((line) => ({
    ...line,
    groups: line.groups.map((group) =>
      group.id === id
        ? { ...group, colorIndex: ((group.colorIndex ?? 0) + 1) % TILE_PALETTE.length }
        : group
    )
  }));
  render();
}

function cycleSentencePinyin(groupId, charIndex) {
  sentenceLines = sentenceLines.map((line) => ({
    ...line,
    groups: line.groups.map((group) => {
      if (group.id !== groupId) return group;
      const chars = groupToChars(group).map((char, index) => {
        if (index !== charIndex || char.pinyinOptions.length <= 1) return char;
        return { ...char, pinyinIndex: (char.pinyinIndex + 1) % char.pinyinOptions.length };
      });
      return withUpdatedPinyin({ ...group, chars });
    })
  }));
  render();
}

function groupToChars(group) {
  if (group.chars?.length) return group.chars;
  const syllables = group.pinyin.trim().split(/\s+/).filter(Boolean);
  return Array.from(group.text).map((char, index) => ({
    ...createSentenceChar(char, index),
    pinyinOptions: syllables[index] ? [syllables[index], ...lookupPinyin(char).filter((item) => item !== syllables[index])] : lookupPinyin(char)
  }));
}

function createSentenceChar(char, index) {
  const options = lookupPinyin(char);
  return {
    id: `${index}-${char.codePointAt(0)}`,
    char,
    pinyinOptions: options,
    pinyinIndex: 0
  };
}

function withUpdatedPinyin(group) {
  return {
    ...group,
    pinyin: groupToChars(group)
      .map((char) => char.pinyinOptions[char.pinyinIndex] ?? "")
      .filter(Boolean)
      .join(" ")
  };
}

function cycleColor(id) {
  items = items.map((item) =>
    item.id === id ? { ...item, colorIndex: (item.colorIndex + 1) % TILE_PALETTE.length } : item
  );
  render();
}

function cyclePinyin(id) {
  items = items.map((item) => {
    if (item.id !== id || item.pinyinOptions.length <= 1) return item;
    return { ...item, pinyinIndex: (item.pinyinIndex + 1) % item.pinyinOptions.length };
  });
  render();
}

async function copySingleTile(id) {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) return;

  try {
    const blob = await svgToPngBlob(createGraphicSvg([item], controls), controls.exportScale);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setStatus(`${item.char} tile copied.`);
  } catch (error) {
    console.error(error);
    setStatus("Clipboard copy is unavailable in this browser.");
  }
}

async function copyAllSvg() {
  const svg =
    mode === "sentence"
      ? createSentenceSvg(sentenceLines, controls)
      : createGraphicSvg(items, controls);
  try {
    await navigator.clipboard.writeText(svg);
    setStatus("SVG markup copied.");
  } catch (error) {
    console.error(error);
    try {
      copyTextFallback(svg);
      setStatus("SVG markup copied.");
    } catch (fallbackError) {
      console.error(fallbackError);
      setStatus("SVG copy is unavailable in this browser.");
    }
  }
}

async function copySentencePng() {
  if (mode !== "sentence") return;

  try {
    const blob = await svgToPngBlob(
      createSentenceSvg(sentenceLines, controls),
      controls.exportScale
    );
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setStatus("Sentence PNG copied.");
  } catch (error) {
    console.error(error);
    setStatus("Sentence PNG copy is unavailable in this browser.");
  }
}

async function copySentenceWord(id) {
  const group = findSentenceGroup(id);
  if (!group) return;
  const svg = createSentenceWordSvg(group, controls, group.meaning ?? "");

  try {
    const blob = await svgToPngBlob(svg, controls.exportScale);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setStatus(`${group.text} copied.`);
  } catch (error) {
    console.error(error);
    try {
      await navigator.clipboard.writeText(svg);
      setStatus(`${group.text} SVG copied.`);
    } catch (fallbackError) {
      console.error(fallbackError);
      try {
        copyTextFallback(svg);
        setStatus(`${group.text} SVG copied.`);
      } catch (finalError) {
        console.error(finalError);
        setStatus("Word copy is unavailable in this browser.");
      }
    }
  }
}

function findSentenceGroup(id) {
  for (const line of sentenceLines) {
    const group = line.groups.find((candidate) => candidate.id === id);
    if (group) return group;
  }
  return null;
}

function copyTextFallback(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.append(textarea);
  textarea.select();
  const didCopy = document.execCommand("copy");
  textarea.remove();
  if (!didCopy) {
    throw new Error("Fallback copy failed.");
  }
}

function showInputPage() {
  elements.inputPage.classList.remove("is-hidden");
  elements.tilesPage.classList.add("is-hidden");
  elements.sourceText.focus();
}

function showTilesPage() {
  elements.inputPage.classList.add("is-hidden");
  elements.tilesPage.classList.remove("is-hidden");
}

function setStatus(message, target = elements.status) {
  target.textContent = message;
  window.clearTimeout(setStatus.timeout);
  setStatus.timeout = window.setTimeout(() => {
    target.textContent = "";
  }, 3000);
}
