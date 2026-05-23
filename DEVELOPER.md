# Developer

## Development

```bash
npm install
npm run build
npm test
```

## Browser Playground

The simplest way to try the package in a real browser is the included static playground.

```bash
npm run build
python3 -m http.server 8000
```

Then open `http://localhost:8000/playground/index.html`.

The playground imports the built ESM bundle from `dist/index.js`, so you are testing the package the same way a browser consumer would load it.
It includes a simple dialog example plus a layered scenario with a dialog, a nested popover, and a second dialog stacked above both.
