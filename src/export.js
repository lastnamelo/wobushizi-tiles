import { FONT_STACK, THEME, TILE_PALETTE } from "./config.js";
import { pinyinToDisplay } from "./pinyin.js";

const xmlNamespace = "http://www.w3.org/2000/svg";

export function createGraphicSvg(items, controls) {
  const layout = layoutItems(items, controls);
  const svg = document.createElementNS(xmlNamespace, "svg");
  svg.setAttribute("xmlns", xmlNamespace);
  svg.setAttribute("width", String(layout.width));
  svg.setAttribute("height", String(layout.height));
  svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  svg.setAttribute("role", "img");

  const background = document.createElementNS(xmlNamespace, "rect");
  background.setAttribute("width", "100%");
  background.setAttribute("height", "100%");
  background.setAttribute("fill", "#ffffff");
  svg.append(background);

  for (const box of layout.boxes) {
    const color = TILE_PALETTE[box.colorIndex]?.value ?? TILE_PALETTE[0].value;
    const rect = document.createElementNS(xmlNamespace, "rect");
    rect.setAttribute("x", String(box.x));
    rect.setAttribute("y", String(box.y));
    rect.setAttribute("width", String(box.width));
    rect.setAttribute("height", String(box.height));
    rect.setAttribute("rx", "0");
    rect.setAttribute("fill", color);
    svg.append(rect);

    appendText(svg, box.char, box.x + box.width / 2, box.y + controls.tilePadding + controls.hanziSize * 0.82, {
      size: controls.hanziSize,
      weight: "600",
      anchor: "middle",
      fill: THEME.hanziInk
    });

    appendText(svg, pinyinToDisplay(box.pinyin), box.x + box.width / 2, box.y + box.height - controls.tilePadding * 0.8, {
      size: controls.pinyinSize,
      weight: "500",
      anchor: "middle",
      fill: box.pinyin ? THEME.hanziInk : "#B8ACA1"
    });
  }

  return new XMLSerializer().serializeToString(svg);
}

export async function svgToPngBlob(svgMarkup, scale) {
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();

  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(image.width * scale);
    canvas.height = Math.ceil(image.height * scale);
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(scale, scale);
    context.drawImage(image, 0, 0);

    return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 500);
}

function layoutItems(items, controls) {
  const maxWidth = 1280;
  const boardPadding = 4;
  const tileSize = controls.tileSize ?? controls.hanziSize + controls.pinyinSize + controls.tilePadding * 2.2;
  const boxes = [];
  let x = boardPadding;
  let y = boardPadding;
  let contentWidth = 0;
  let contentHeight = 0;

  for (const item of items) {
    if (item.kind === "break") {
      x = boardPadding;
      y += tileSize + controls.tileGap;
      continue;
    }
    if (item.kind !== "hanzi") continue;

    if (x > boardPadding && x + tileSize + boardPadding > maxWidth) {
      x = boardPadding;
      y += tileSize + controls.tileGap;
    }

    boxes.push({
      ...item,
      pinyin: item.pinyinOptions[item.pinyinIndex] ?? "",
      x,
      y,
      width: tileSize,
      height: tileSize
    });
    contentWidth = Math.max(contentWidth, x + tileSize + boardPadding);
    contentHeight = Math.max(contentHeight, y + tileSize + boardPadding);
    x += tileSize + controls.tileGap;
  }

  return {
    boxes,
    width: Math.max(boardPadding * 2, contentWidth || boardPadding * 2),
    height: Math.max(boardPadding * 2, contentHeight || boardPadding * 2)
  };
}

function appendText(svg, value, x, y, options) {
  const text = document.createElementNS(xmlNamespace, "text");
  text.textContent = value;
  text.setAttribute("x", String(x));
  text.setAttribute("y", String(y));
  text.setAttribute("font-family", FONT_STACK);
  text.setAttribute("font-size", String(options.size));
  text.setAttribute("font-weight", options.weight);
  text.setAttribute("fill", options.fill ?? THEME.ink);
  text.setAttribute("text-anchor", options.anchor);
  text.setAttribute("letter-spacing", "0");
  svg.append(text);
}
