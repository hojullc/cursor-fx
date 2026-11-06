# 🖱️ cursor-fx

> Experimental cursor tracking — trail, magnetic, spotlight, blob, text-label effects. Zero dependencies. 3 KB gzipped.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/hojullc/cursor-fx)](https://github.com/hojullc/cursor-fx/releases)

## Effects

| Effect | Description |
|--------|-------------|
| `createCursor` | Smooth custom cursor with scale-on-hover |
| `trail` | Particle chain following the cursor |
| `magnetic` | Elements that magnetically attract the cursor |
| `spotlight` | Dark overlay with radial spotlight on mouse |
| `blob` | Morphing SVG blob cursor |
| `label` | Hover labels via `data-cfx-label` |

## Install

**CDN**
```html
<script src="https://cdn.jsdelivr.net/gh/hojullc/cursor-fx@1/src/cursor-fx.js"></script>
```

**npm**
```bash
npm install cursor-fx
```

## Quick start

```js
// Smooth custom cursor
CursorFx.createCursor({ size: 20, color: 'rgba(112,100,255,.85)' });

// Particle trail
CursorFx.trail({ count: 12, color: '#7064ff' });

// Morphing blob
CursorFx.blob({ size: 48, morph: true });

// Magnetic pull on elements
CursorFx.magnetic('[data-magnetic]', { strength: 0.35 });

// Spotlight on a container
CursorFx.spotlight('#hero', { radius: 220, dark: true });

// Hover label — add data-cfx-label="text" to any element
CursorFx.label();
```

## Options

### createCursor(opts)
| Option | Default | Description |
|--------|---------|-------------|
| `size` | `20` | Cursor diameter in px |
| `color` | `'rgba(112,100,255,.85)'` | Fill color |
| `mixBlend` | `'difference'` | CSS mix-blend-mode |
| `smooth` | `0.12` | Lerp factor (0–1) |
| `hideNative` | `true` | Hide the browser cursor |

### trail(opts)
| Option | Default | Description |
|--------|---------|-------------|
| `count` | `12` | Number of trail dots |
| `size` | `10` | Dot diameter |
| `color` | `'#7064ff'` | Dot color |
| `fade` | `true` | Fade dots toward the tail |

### blob(opts)
| Option | Default | Description |
|--------|---------|-------------|
| `size` | `48` | SVG viewport size |
| `color` | `'rgba(112,100,255,.6)'` | Fill color |
| `morph` | `true` | Animate shape continuously |
| `speed` | `0.8` | Morph speed multiplier |

## Demo

Open `demo/index.html` or see the [live demo](https://github.com/hojullc/cursor-fx).

## License

MIT © [Hoju LLC](https://hoju.us)
