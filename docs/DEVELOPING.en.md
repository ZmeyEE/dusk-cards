# Developer guide (English)

dusk-cards is a tiny card-style UI kit: plain JavaScript + CSS, [SortableJS](https://github.com/SortableJS/Sortable) for dragging, no build step
This page is for people who want to change it, port it, or reuse it somewhere else
(Chinese docs are in the [README](../README.md))

## 1. Map of the repo

```
src/dusk-cards.js     the library (helpers, icons, tearAway, createCard, createBoard, exports)
src/dusk-cards.css    all styles, colors are --dc-* variables at the top
vendor/Sortable.min.js  SortableJS 1.15.6 (MIT), keep its license header
demo/index.html       the demo (4 themes, sample data, event log)
test/index.html       tests that run in the browser, test/run.py runs them in headless Chrome
docs/images/          screenshots used by the README
```

## 2. Try it and test it

```bash
# demo: just open demo/index.html in a browser (no server, no network)
python test/run.py          # runs test/index.html in headless Chrome, prints PASS / FAIL
```

`test/run.py` finds Chrome on its own (or set the `CHROME` environment variable)
The tests cover the API, keyboard, safety (titles never become HTML) and cleanup
Dragging itself needs a real pointer, try it in the demo after you change drag code

## 3. Change the colors

Override the `--dc-*` variables, no need to touch the library

```css
:root { --dc-accent: #3C8570; --dc-card: #F6FCF8; --dc-sky-1: #8FC4B6; }          /* whole page */
.my-sidebar { --dc-card: #2B2F4A; --dc-ink: #E8EAF6; }                            /* only one area */
```

The full list of variables is in the README, and `demo/index.html` has 4 complete examples (mint, sakura, night)
Keep text contrast readable: the default text is above 7:1 on the card color and white on `--dc-accent` is above 4.5:1

## 4. Change the texts and icons (languages)

Nothing is hard-coded except the defaults, pass your own in the options:

```js
DuskCards.createBoard("#board", {
  labels: { empty: "No songs yet", trash: "Drop here to delete", play: "Play now", remove: "Delete" },
  icons: { play: '<path d="M8 5v14l11-7z" fill="currentColor"/>' },   // 24x24, stroke is currentColor
});
```

## 5. How it works (so you can change it safely)

- **Cards are plain DOM**: `createCard(item, opts)` builds one card and attaches nothing, `createBoard` adds the events
- **Keyed updates**: `setItems` compares a signature of each card, so unchanged cards are never rebuilt (no flicker, no lost focus)
- **Dragging**: one SortableJS instance on the board, one on an empty overlay that covers the trash zone
  (SortableJS is most reliable with an empty drop container). Both share a group name so cards can move from the board to the trash
- **Tear effect**: when a card is dropped on the trash, SortableJS has already removed the floating copy, so the board tracks the pointer itself
  (pointerdown / pointermove, no layout reads) and tears a clone at the release point. Only `transform` and `opacity` are animated
- **Release check first**: `onEnd` checks "released over the trash" before "order changed", because a card can be moved around the list on its way to the trash
- **Performance rules** (please keep them): no `backdrop-filter`, never transition `transform` on a card, `contain` on every card, no big shadows repainted while dragging

## 6. Port it

- **React / Vue / Svelte**: call `createBoard` when the component mounts and `destroy()` when it unmounts, drive updates with `setItems`
- **Horizontal or grid layouts**: pass `sortable: { direction: "horizontal" }` and restyle `.dc-board`, this is untested, a pull request is welcome
- **No SortableJS**: the drag code is isolated in the "drag and drop" block of `createBoard`, replace that block with your own

## 7. Releasing

1. Bump `version` in `package.json` and `VERSION` in `src/dusk-cards.js` ([SemVer](https://semver.org/))
2. Add the changes to [CHANGELOG.md](../CHANGELOG.md)
3. Run `python test/run.py`, tag `vX.Y.Z`, create a GitHub release

## 8. Style

- Comments in two languages (中文 / English), short and friendly, explain **why**
- Chinese comments use commas and straight quotes, no corner brackets and no full stops
- Small functions, one job each
