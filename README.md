# Tiles

Tiles is a small local-first web app for creating Chinese teaching graphics. Paste Chinese text, submit it, then get one square tile per Hanzi character. Punctuation is omitted from the tile board. Click tile backgrounds to cycle study colors, click pinyin to cycle alternate pronunciations from a local dataset, and copy individual tiles.

## Install

No dependencies are required. The app uses plain browser JavaScript modules and a tiny Node static server for local testing.

```bash
cd tiles
npm install
```

`npm install` only creates a lockfile if you want one; there are no packages to download.

## Run Locally

```bash
npm run dev
```

Open `http://localhost:5173`.

You can choose another port:

```bash
PORT=5180 npm run dev
```

## Build

```bash
npm run build
```

The static app is copied to `tiles/dist/`.

## Deploy Later

Deploy the contents of `tiles/dist/` to any static host and point `tiles.wobushizi.com` at that deployment. The app has no backend, auth, database, Supabase dependency, or runtime writes.

## Dataset

The sample pinyin data lives in `data/pinyin-map.js`.

Replace or expand it with your real character-to-pinyin dataset:

```js
export const PINYIN_MAP = {
  "你": ["ni3"],
  "好": ["hao3"],
  "行": ["xing2", "hang2"]
};
```

The first pronunciation in the array is used by default, so put the most common/default pinyin first when you swap in a larger dataset. If a character has alternates, clicking its pinyin cycles through them. Missing characters render with blank pinyin so they can still be used in the graphic.

## Colors

The tile color cycle lives in `src/config.js` and is ordered:

white, red subject, green verb, blue object, grey grammar, yellow measure, purple other, pink expression.

## Export

Each Hanzi tile has its own copy control. Clipboard copy rasterizes a tight SVG for that tile in the browser.

## Structure

- `index.html` - standalone app shell
- `src/app.js` - UI state and event wiring
- `src/parser.js` - character-level parsing
- `src/pinyin.js` - lookup helpers and tone-mark display
- `src/renderer.js` - editable preview rendering
- `src/export.js` - SVG and PNG export utilities
- `src/config.js` - palette, theme, and default controls
- `data/pinyin-map.js` - replaceable local pinyin dataset
