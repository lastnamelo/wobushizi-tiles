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
