import { TILE_PALETTE } from "./config.js";
import { pinyinToDisplay } from "./pinyin.js";

export function renderTiles({ board, items, controls, onColorCycle, onPinyinCycle, onCopyTile }) {
  board.innerHTML = "";
  board.style.setProperty("--hanzi-size", `${controls.hanziSize}px`);
  board.style.setProperty("--pinyin-size", `${controls.pinyinSize}px`);
  board.style.setProperty("--tile-padding", `${controls.tilePadding}px`);
  board.style.setProperty("--tile-gap", `${controls.tileGap}px`);
  board.style.setProperty("--tile-radius", `${controls.borderRadius}px`);
  board.style.setProperty("--tile-size", `${controls.tileSize}px`);

  for (const item of items) {
    if (item.kind === "break") {
      board.append(document.createElement("br"));
      continue;
    }

    if (item.kind !== "hanzi") continue;

    const stack = document.createElement("div");
    stack.className = "tile-stack";
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.style.background = TILE_PALETTE[item.colorIndex]?.value ?? TILE_PALETTE[0].value;
    tile.tabIndex = 0;
    tile.setAttribute("role", "button");
    tile.setAttribute("aria-label", `Change color for ${item.char}`);
    tile.addEventListener("click", () => onColorCycle(item.id));
    tile.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onColorCycle(item.id);
    });

    const hanzi = document.createElement("span");
    hanzi.className = "hanzi";
    hanzi.textContent = item.char;

    const pinyin = document.createElement("button");
    pinyin.type = "button";
    pinyin.className = `pinyin${item.pinyinOptions.length > 1 ? " has-alternates" : ""}`;
    pinyin.textContent = pinyinToDisplay(item.pinyinOptions[item.pinyinIndex]) || " ";
    pinyin.title =
      item.pinyinOptions.length > 1
        ? `Cycle pronunciations: ${item.pinyinOptions.map(pinyinToDisplay).join(", ")}`
        : "No alternate pronunciation in the local dataset";
    pinyin.setAttribute("aria-label", `Change pinyin for ${item.char}`);
    pinyin.addEventListener("click", (event) => {
      event.stopPropagation();
      onPinyinCycle(item.id);
    });

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "copy-tile";
    copy.textContent = "Copy";
    copy.setAttribute("aria-label", `Copy ${item.char} tile as PNG`);
    copy.addEventListener("click", (event) => {
      event.stopPropagation();
      onCopyTile(item.id);
    });

    tile.append(hanzi, pinyin);
    stack.append(tile, copy);
    board.append(stack);
  }
}

export function renderSentence({
  board,
  lines,
  controls,
  onMerge,
  onSplit,
  onMeaningChange,
  onColorCycle,
  onPinyinCycle,
  onCopyWord
}) {
  board.innerHTML = "";
  board.style.setProperty("--sentence-hanzi-size", `${controls.sentenceHanziSize}px`);
  board.style.setProperty("--sentence-pinyin-size", `${controls.sentencePinyinSize}px`);
  board.style.setProperty("--sentence-padding-x", `${controls.sentencePaddingX}px`);
  board.style.setProperty("--sentence-padding-y", `${controls.sentencePaddingY}px`);
  board.style.setProperty("--sentence-padding-top", `${controls.sentencePaddingTop}px`);
  board.style.setProperty("--sentence-gap", `${controls.sentenceGap}px`);

  lines.forEach((line, lineIndex) => {
    const row = document.createElement("div");
    row.className = "sentence-line";

    line.groups.forEach((group, groupIndex) => {
      if (groupIndex > 0) {
        const join = document.createElement("button");
        join.type = "button";
        join.className = "sentence-join";
        join.title = "Join these into one word";
        join.setAttribute("aria-label", `Join ${line.groups[groupIndex - 1].text} and ${group.text}`);
        join.addEventListener("click", () => onMerge(lineIndex, groupIndex - 1));
        row.append(join);
      }

      const stack = document.createElement("span");
      stack.className = "sentence-stack";

      const meaning = document.createElement("input");
      meaning.className = "word-meaning";
      meaning.type = "text";
      meaning.autocomplete = "off";
      meaning.placeholder = "English";
      meaning.value = group.meaning ?? "";
      meaning.setAttribute("aria-label", `English meaning for ${group.text}`);
      meaning.addEventListener("input", () => onMeaningChange(group.id, meaning.value));

      const word = document.createElement("span");
      word.className = "sentence-word";
      word.style.background = TILE_PALETTE[group.colorIndex ?? 0]?.value ?? TILE_PALETTE[0].value;
      word.title = "Double-click to split into characters";
      word.tabIndex = 0;
      word.setAttribute("role", "button");
      word.setAttribute("aria-label", `Change color for ${group.text}`);
      word.addEventListener("click", (event) => {
        if (event.detail > 1) return;
        onColorCycle(group.id);
      });
      word.addEventListener("dblclick", (event) => {
        event.stopPropagation();
        onSplit(lineIndex, groupIndex);
      });
      word.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onColorCycle(group.id);
      });

      const hanziRow = document.createElement("span");
      hanziRow.className = "sentence-hanzi-row";
      const pinyinRow = document.createElement("span");
      pinyinRow.className = "sentence-pinyin-row";

      const chars = group.chars?.length
        ? group.chars
        : Array.from(group.text).map((char, index) => ({
            char,
            pinyinOptions: group.pinyin.split(/\s+/).filter(Boolean),
            pinyinIndex: index
          }));

      chars.forEach((char, charIndex) => {
        const hanzi = document.createElement("span");
        hanzi.className = "sentence-hanzi";
        hanzi.textContent = char.char;
        hanziRow.append(hanzi);

        const pinyin = document.createElement("button");
        pinyin.type = "button";
        pinyin.className = `sentence-pinyin${char.pinyinOptions.length > 1 ? " has-alternates" : ""}`;
        pinyin.textContent = pinyinToDisplay(char.pinyinOptions[char.pinyinIndex] ?? "") || " ";
        pinyin.setAttribute("aria-label", `Change pinyin for ${char.char}`);
        pinyin.addEventListener("click", (event) => {
          event.stopPropagation();
          onPinyinCycle(group.id, charIndex);
        });
        pinyinRow.append(pinyin);
      });

      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "copy-word";
      copy.textContent = "Copy";
      copy.setAttribute("aria-label", `Copy ${group.text} word as PNG`);
      copy.addEventListener("click", () => onCopyWord(group.id));

      word.append(hanziRow, pinyinRow);
      stack.append(meaning, word, copy);
      row.append(stack);
    });

    board.append(row);
  });
}

export function renderPalette(container) {
  container.innerHTML = "";
  for (const color of TILE_PALETTE) {
    const swatch = document.createElement("span");
    swatch.className = "palette-swatch";
    swatch.style.background = color.value;
    swatch.title = color.name;
    swatch.textContent = color.label;
    swatch.setAttribute("aria-label", color.label ? `${color.name}: ${color.label}` : color.name);
    container.append(swatch);
  }
}
