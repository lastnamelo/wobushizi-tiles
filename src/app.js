import { DEFAULT_CONTROLS, TILE_PALETTE } from "./config.js";
import { createGraphicSvg, svgToPngBlob } from "./export.js";
import { parseTextToTiles } from "./parser.js";
import { renderPalette, renderTiles } from "./renderer.js";

const controls = { ...DEFAULT_CONTROLS };
let items = [];

const elements = {
  inputPage: document.querySelector("#inputPage"),
  tilesPage: document.querySelector("#tilesPage"),
  sourceText: document.querySelector("#sourceText"),
  makeTiles: document.querySelector("#makeTiles"),
  editText: document.querySelector("#editText"),
  copyAllSvg: document.querySelector("#copyAllSvg"),
  clearInput: document.querySelector("#clearInput"),
  board: document.querySelector("#tileBoard"),
  inputStatus: document.querySelector("#inputStatus"),
  status: document.querySelector("#status"),
  paletteStrip: document.querySelector("#paletteStrip")
};

renderPalette(elements.paletteStrip);
bindEvents();

function bindEvents() {
  elements.makeTiles.addEventListener("click", () => {
    if (!elements.sourceText.value.trim()) {
      setStatus("Paste some Chinese text first.", elements.inputStatus);
      return;
    }
    reparse();
    showTilesPage();
  });
  elements.editText.addEventListener("click", showInputPage);
  elements.copyAllSvg.addEventListener("click", copyAllSvg);
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
  renderTiles({
    board: elements.board,
    items,
    controls,
    onColorCycle: cycleColor,
    onPinyinCycle: cyclePinyin,
    onCopyTile: copySingleTile
  });
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
  try {
    const svg = createGraphicSvg(items, controls);
    const clipboardTypes = {
      "text/html": new Blob([svg], { type: "text/html" }),
      "text/plain": new Blob([svg], { type: "text/plain" })
    };
    if (ClipboardItem.supports?.("image/svg+xml")) {
      clipboardTypes["image/svg+xml"] = new Blob([svg], { type: "image/svg+xml" });
    }

    await navigator.clipboard.write([new ClipboardItem(clipboardTypes)]);
    setStatus("SVG copied.");
  } catch (error) {
    console.error(error);
    try {
      copyTextFallback(createGraphicSvg(items, controls));
      setStatus("SVG markup copied.");
    } catch (fallbackError) {
      console.error(fallbackError);
      setStatus("SVG copy is unavailable in this browser.");
    }
  }
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
