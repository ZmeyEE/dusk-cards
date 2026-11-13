/*!
 * dusk-cards 1.0.0 — 卡片式 UI：拖曳排序、拖到垃圾桶撕裂消失、可換色
 * dusk-cards 1.0.0 — card-style UI: drag to reorder, drag to the trash to tear a card away, easy to recolor
 *
 * 原生 JavaScript，沒有框架；拖曳排序用 SortableJS（要先載入，全域名稱 Sortable）
 * Vanilla JavaScript, no framework; drag & drop uses SortableJS (load it first, global name Sortable)
 *
 * Unlicense (public domain) — 想怎麼改都可以 / do whatever you want
 *
 * 檔案地圖 / File map:
 *   小工具 Helpers -> 圖示 Icons -> 撕裂特效 tearAway -> 卡片 createCard -> 清單 createBoard -> 匯出 Exports
 */
(function (global) {
  "use strict";

  const VERSION = "1.0.0";
  const NS = "http://www.w3.org/2000/svg";
  const REDUCED_MOTION = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ================================================================== 小工具 / Helpers */

  /** 建立元素：el("div", "dc-card", "文字") / Create an element: el(tag, className, text). */
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  /** 秒數 -> m:ss 或 h:mm:ss；不是數字就原樣回傳 / Seconds -> m:ss or h:mm:ss; non-numbers are returned as they are. */
  function formatDuration(value) {
    if (typeof value !== "number" || !isFinite(value) || value < 0) return value == null ? "" : String(value);
    const s = Math.floor(value);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
  }

  /** 檢查 SortableJS 有沒有先載入 / Make sure SortableJS has been loaded first. */
  function requireSortable() {
    if (typeof global.Sortable !== "function") {
      throw new Error("dusk-cards: SortableJS is not loaded. Add <script src=\"Sortable.min.js\"></script> before dusk-cards.js");
    }
    return global.Sortable;
  }

  /* ================================================================== 圖示 / Icons */
  // 手繪線條圖示：想換圖示就改這裡，或在 options.icons 傳入自己的 SVG 內容
  // Hand-drawn line icons: edit them here, or pass your own SVG markup in options.icons
  const ICONS = {
    play: '<path d="M9 6.3 18 12 9 17.7z" fill="currentColor" stroke-width="2.6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    note: '<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  };

  /** 建立 <svg> 圖示 / Build an <svg> icon. */
  function icon(name, custom) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.9");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = (custom && custom[name]) || ICONS[name] || "";
    return svg;
  }

  /* ================================================================== 撕裂特效 / Tear-away effect */

  /**
   * 把元素複製成左右兩片，沿著鋸齒線切開，各自旋轉、飄開、淡出，最後移除，只動 transform 和 opacity
   * Clone the element into a left and a right piece, cut along a jagged line; each piece rotates, drifts away,
   * fades and is removed. Only transform and opacity are animated, so it runs on the compositor.
   *
   * @param {Element} node  要撕掉的元素 / the element to tear
   * @param {{delay?: number, rect?: {left:number, top:number, width:number, height:number}}} [opts]
   *        delay：動畫延遲（毫秒）/ animation delay in ms
   *        rect：指定位置（元素已不在原處時用）/ explicit rectangle (when the node is no longer where it was)
   */
  function tearAway(node, opts) {
    opts = opts || {};
    if (!node || (!opts.rect && !node.isConnected)) return;
    // 這是一次性的短暫回饋，即使系統設為"減少動態效果"也會播，只是幅度與時間減半
    // Brief one-off feedback: it also plays with "reduce motion" on, at half the distance and duration
    const k = REDUCED_MOTION ? 0.5 : 1;
    const r = opts.rect || node.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;

    // 鋸齒撕裂線：從上到下，x 在中間附近隨機抖動 / jagged tear line: top to bottom, x jitters around the middle
    const cx = 38 + Math.random() * 24;
    const steps = 14;
    const edge = [];
    for (let i = 0; i <= steps; i++) {
      const jag = (i % 2 ? 3.2 : -3.2) + (Math.random() - 0.5) * 4;
      edge.push([Math.min(92, Math.max(8, cx + jag)), (i / steps) * 100]);
    }
    const poly = (pts) => "polygon(" + pts.map(([x, y]) => `${x.toFixed(1)}% ${y.toFixed(1)}%`).join(", ") + ")";
    const pieces = [
      { clip: poly([[0, 0], ...edge, [0, 100]]), origin: "0% 100%", to: { x: -34 * k, y: 14 * k, rot: -9 * k } },
      { clip: poly([[100, 0], ...edge, [100, 100]]), origin: "100% 100%", to: { x: 34 * k, y: 6 * k, rot: 8 * k } },
    ];
    for (const p of pieces) {
      const wrap = el("div", "dc-tear-piece");
      Object.assign(wrap.style, {
        left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, transformOrigin: p.origin,
      });
      const clone = node.cloneNode(true);
      clone.classList.remove("dc-fallback", "dc-ghost");
      clone.removeAttribute("style");     // 拖曳中的浮動複本帶有行內樣式，要清掉 / the floating drag copy carries inline styles, strip them
      clone.style.clipPath = p.clip;
      clone.style.webkitClipPath = p.clip;
      wrap.appendChild(clone);
      document.body.appendChild(wrap);
      const anim = wrap.animate(
        [
          { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
          { transform: `translate(${p.to.x * 0.35}px, ${p.to.y * 0.2}px) rotate(${p.to.rot * 0.4}deg)`, opacity: 0.95, offset: 0.3 },
          { transform: `translate(${p.to.x}px, ${p.to.y + 26 * k}px) rotate(${p.to.rot}deg)`, opacity: 0 },
        ],
        { duration: 760 * (REDUCED_MOTION ? 0.75 : 1), delay: opts.delay || 0, easing: "cubic-bezier(.25,.7,.3,1)", fill: "both" },
      );
      anim.onfinish = () => wrap.remove();
    }
  }

  /* ================================================================== 卡片 / Card */

  /**
   * 建立一張卡片（只回傳 DOM，不接任何事件）
   * Build one card element (DOM only, no events attached)
   *
   * item：{ id, title, thumbnail?, duration?, tags?: [{text, tone?}], meta?: [string] }
   *   tone：可以是 "rose" 或 "steel"，會套用 .dc-pill--rose / .dc-pill--steel / tone can be "rose" or "steel"
   *
   * @param {object} item
   * @param {object} [opts]  { index?: number, numbered?: boolean, actions?: [{name,label,icon}], icons?: object }
   * @returns {HTMLElement}
   */
  function createCard(item, opts) {
    opts = opts || {};
    const card = el("div", "dc-card");
    card.dataset.id = String(item.id);
    card.tabIndex = 0;

    // 縮圖 + 序號徽章 / thumbnail + number badge
    const thumb = el("div", "dc-thumb");
    const fallback = () => thumb.prepend(icon("note", opts.icons));
    if (item.thumbnail) {
      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.decoding = "async";
      img.loading = "lazy";
      img.draggable = false;
      img.alt = "";
      img.onerror = () => { img.remove(); fallback(); };
      img.src = item.thumbnail;
      thumb.appendChild(img);
    } else {
      fallback();
    }
    if (opts.numbered !== false) {
      const idx = el("span", "dc-idx", String((opts.index || 0) + 1));
      thumb.appendChild(idx);
      card._idx = idx;
    }
    card.appendChild(thumb);

    // 標題 + 標籤列 / title + tag row
    const info = el("div", "dc-info");
    info.appendChild(el("div", "dc-title", item.title == null ? "" : String(item.title)));
    const meta = el("div", "dc-meta");
    if (item.duration != null && item.duration !== "") meta.appendChild(el("span", "dc-pill", formatDuration(item.duration)));
    for (const tag of item.tags || []) {
      meta.appendChild(el("span", "dc-pill" + (tag.tone ? ` dc-pill--${tag.tone}` : ""), tag.text));
    }
    for (const text of item.meta || []) meta.appendChild(el("span", "dc-meta-text", text));
    info.appendChild(meta);
    card.appendChild(info);

    // 懸停按鈕 / hover buttons
    const actions = el("div", "dc-actions");
    for (const a of opts.actions || []) {
      const b = el("button");
      b.type = "button";
      b.dataset.name = a.name;
      b.title = a.label || a.name;
      b.setAttribute("aria-label", a.label || a.name);
      b.appendChild(icon(a.icon || a.name, opts.icons));
      actions.appendChild(b);
    }
    card.appendChild(actions);
    return card;
  }

  /** 卡片內容簽章：沒變就不用重建 / A card's content signature: unchanged means no rebuild. */
  const signature = (item) => JSON.stringify([item.title, item.thumbnail, item.duration, item.tags, item.meta]);

  /* ================================================================== 清單 / Board */

  let boardCounter = 0;

  /**
   * 把一個容器變成可拖曳排序的卡片清單
   * Turn a container into a drag-sortable card list
   *
   * options：
   *   items      初始卡片 / initial cards (array of item, see createCard)
   *   trash      刪除區（元素或選擇器），拖進去就刪除並撕裂消失 / trash zone (element or selector): drop a card there to delete it
   *   numbered   是否顯示序號，預設 true / show the number badge, default true
   *   actions    懸停按鈕，預設 [播放, 移除] / hover buttons, default [play, remove]；"remove" 內建會撕裂並移除 / "remove" is built in and tears the card away
   *   labels     文字：{ empty, trash, play, remove } / texts, translate them here
   *   icons      自訂圖示（name -> SVG 內容）/ custom icons (name -> SVG markup)
   *   sortable   額外傳給 SortableJS 的設定 / extra options passed to SortableJS
   *   onReorder  ({ id, from, to, items }) 順序改變 / order changed
   *   onRemove   ({ item, items, reason })  reason: "trash" | "button" | "api" | "keyboard"
   *   onAction   ({ name, item })           按了其他按鈕 / another button was pressed
   *
   * @returns {{ add, remove, move, setItems, getItems, destroy, element }}
   */
  function createBoard(container, options) {
    const Sortable = requireSortable();
    if (typeof container === "string") container = document.querySelector(container);
    if (!container) throw new Error("dusk-cards: container not found");
    options = options || {};

    const labels = Object.assign({ empty: "Nothing here yet", trash: "Drop here to delete", play: "Play", remove: "Remove" }, options.labels);
    const actions = options.actions || [
      { name: "play", label: labels.play, icon: "play" },
      { name: "remove", label: labels.remove, icon: "close" },
    ];
    const cardOpts = () => ({ numbered: options.numbered, actions, icons: options.icons });
    const uid = `dc-board-${++boardCounter}`;

    let items = [];
    const nodes = new Map();      // id -> 卡片元素 / id -> card element
    const handled = new Set();    // 這次拖曳已處理過的卡片（避免重複刪除）/ cards already handled in this drag (no double delete)

    container.classList.add("dc-board");
    container.dataset.empty = labels.empty;

    /* ---------- 小幫手 / small helpers ---------- */
    const keyOf = (item) => String(item.id);
    const emit = (name, payload) => { if (typeof options[name] === "function") options[name](payload); };
    const renumber = () => {
      if (options.numbered === false) return;
      [...container.children].forEach((n, i) => { if (n._idx) n._idx.textContent = String(i + 1); });
    };
    /** 依畫面上的順序重排 items / Rebuild items in the order shown on the page. */
    const syncFromDom = () => {
      const byKey = new Map(items.map((it) => [keyOf(it), it]));
      items = [...container.children].map((n) => byKey.get(n.dataset.id)).filter(Boolean);
      renumber();
    };

    /* ---------- 新增／移除／移動 / add, remove, move ---------- */
    function add(item, index) {
      const key = keyOf(item);
      if (nodes.has(key)) throw new Error(`dusk-cards: duplicate id "${key}"`);
      const i = index == null ? items.length : Math.max(0, Math.min(index, items.length));
      const node = createCard(item, Object.assign(cardOpts(), { index: i }));
      node.dataset.sig = signature(item);
      items.splice(i, 0, item);
      nodes.set(key, node);
      container.insertBefore(node, container.children[i] || null);
      renumber();
      return node;
    }

    /** reason 決定要不要撕裂：拖到垃圾桶時由拖曳邏輯自己撕（在放開的位置）/ the drag logic tears the card itself (at the release point) when it came from the trash */
    function remove(id, reason, rect) {
      const key = String(id);
      const node = nodes.get(key);
      const item = items.find((it) => keyOf(it) === key);
      if (!node || !item) return false;
      if (reason !== "api") tearAway(node, rect ? { rect } : undefined);
      node.remove();
      nodes.delete(key);
      items = items.filter((it) => it !== item);
      renumber();
      emit("onRemove", { item, items: items.slice(), reason: reason || "api" });
      return true;
    }

    function move(id, to) {
      const key = String(id);
      const node = nodes.get(key);
      const from = items.findIndex((it) => keyOf(it) === key);
      if (!node || from < 0) return false;
      to = Math.max(0, Math.min(to, items.length - 1));
      if (to === from) return true;
      container.insertBefore(node, container.children[to > from ? to + 1 : to] || null);
      syncFromDom();
      emit("onReorder", { id: items[to] && keyOf(items[to]), from, to, items: items.slice() });
      node.focus({ preventScroll: true });
      return true;
    }

    /** 整批換掉：只新增／移除／更新有變的卡片，順序不對才移動 / Replace everything: only add / remove / update what changed, move only when the order is wrong. */
    function setItems(next) {
      const wanted = new Set(next.map(keyOf));
      for (const [key, node] of [...nodes]) {
        if (!wanted.has(key)) { node.remove(); nodes.delete(key); }
      }
      next.forEach((item, i) => {
        const key = keyOf(item);
        let node = nodes.get(key);
        if (node && node.dataset.sig !== signature(item)) {
          const fresh = createCard(item, Object.assign(cardOpts(), { index: i }));
          fresh.dataset.sig = signature(item);
          node.replaceWith(fresh);
          nodes.set(key, fresh);
          node = fresh;
        } else if (!node) {
          node = createCard(item, Object.assign(cardOpts(), { index: i }));
          node.dataset.sig = signature(item);
          nodes.set(key, node);
        }
        if (container.children[i] !== node) container.insertBefore(node, container.children[i] || null);
      });
      items = next.slice();
      renumber();
    }

    /* ---------- 卡片上的事件（按鈕、鍵盤）/ events on cards (buttons, keyboard) ---------- */
    const onClick = (e) => {
      const btn = e.target.closest(".dc-actions button");
      if (!btn || !container.contains(btn)) return;
      e.stopPropagation();
      const card = btn.closest(".dc-card");
      const item = items.find((it) => keyOf(it) === card.dataset.id);
      if (!item) return;
      if (btn.dataset.name === "remove") remove(item.id, "button");
      else emit("onAction", { name: btn.dataset.name, item });
    };
    // 鍵盤：Alt+上下 移動，Delete 移除 / keyboard: Alt+Up / Down moves, Delete removes
    const onKey = (e) => {
      const card = e.target.closest && e.target.closest(".dc-card");
      if (!card || e.target !== card) return;
      const from = [...container.children].indexOf(card);
      if (e.altKey && e.key === "ArrowUp") { e.preventDefault(); move(card.dataset.id, from - 1); }
      else if (e.altKey && e.key === "ArrowDown") { e.preventDefault(); move(card.dataset.id, from + 1); }
      else if (e.key === "Delete") { e.preventDefault(); remove(card.dataset.id, "keyboard"); }
    };
    container.addEventListener("click", onClick);
    container.addEventListener("keydown", onKey);

    /* ---------- 拖曳 / drag and drop ---------- */
    const trashEl = typeof options.trash === "string" ? document.querySelector(options.trash) : options.trash || null;
    if (trashEl) {
      trashEl.classList.add("dc-trash");
      if (!trashEl.children.length) {
        trashEl.append(icon("trash", options.icons), el("div", null, labels.trash));
      }
    }

    // 撕裂特效要知道"放開手時卡片在哪"，所以自己記錄指標位置（不讀版面、不用 rAF）
    // The tear effect needs to know where the card was at release, so we track the pointer ourselves (no layout reads, no rAF)
    let dragging = false, downPt = null, lastPt = null, grab = null, dragSize = null, dragClone = null;
    const onDown = (e) => { downPt = { x: e.clientX, y: e.clientY }; };
    const onMove = (e) => { if (dragging) lastPt = { x: e.clientX, y: e.clientY }; };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointermove", onMove, { passive: true });
    const ghostRect = () => (lastPt && grab && dragSize
      ? { left: lastPt.x - grab.x, top: lastPt.y - grab.y, width: dragSize.w, height: dragSize.h }
      : null);

    const startDrag = (evt) => {
      dragging = true;
      document.body.classList.add("dc-dragging");
      const r = evt.item.getBoundingClientRect();
      dragSize = { w: r.width, h: r.height };
      grab = downPt ? { x: downPt.x - r.left, y: downPt.y - r.top } : { x: r.width / 2, y: r.height / 2 };
      lastPt = downPt;
      dragClone = evt.item.cloneNode(true);
    };
    const endDrag = () => {
      dragging = false;
      dragClone = grab = dragSize = lastPt = null;
      document.body.classList.remove("dc-dragging");
      if (trashEl) trashEl.classList.remove("dc-trash--over");
      handled.clear();
    };
    /** 放開時指標是否在刪除區上（備援：即使 SortableJS 沒觸發 onAdd 也能刪除）/ Was the pointer over the trash at release? (a fallback in case SortableJS did not fire onAdd) */
    const releasedOverTrash = (evt) => {
      if (!trashEl) return false;
      const e = evt.originalEvent;
      if (!e) return false;
      const p = (e.changedTouches && e.changedTouches[0]) || e;
      if (p.clientX == null) return false;
      const r = trashEl.getBoundingClientRect();
      return p.clientX >= r.left && p.clientX <= r.right && p.clientY >= r.top && p.clientY <= r.bottom;
    };
    /** 拖到垃圾桶：在放開的位置撕開，然後移除 / Dropped on the trash: tear it where the hand let go, then remove. */
    const deleteByDrag = (item) => {
      const key = item.dataset.id;
      if (handled.has(key)) return;
      handled.add(key);
      const rect = ghostRect();
      if (dragClone && rect) tearAway(dragClone, { rect });
      else tearAway(item);
      const data = items.find((it) => keyOf(it) === key);
      item.remove();
      nodes.delete(key);
      items = items.filter((it) => it !== data);
      renumber();
      if (data) emit("onRemove", { item: data, items: items.slice(), reason: "trash" });
    };

    const common = Object.assign({
      animation: 150, ghostClass: "dc-ghost", fallbackClass: "dc-fallback", forceFallback: true, fallbackOnBody: true,
      fallbackTolerance: 3, delay: 80, delayOnTouchOnly: true, direction: "vertical",
    }, options.sortable);

    const sortBoard = new Sortable(container, Object.assign({}, common, {
      group: { name: uid, pull: !!trashEl, put: false },
      onStart: startDrag,
      onEnd(evt) {
        if (evt.to === evt.from && releasedOverTrash(evt)) {
          // 放在刪除區上：先檢查這個，因為拖曳途中卡片可能已被暫時換過位置
          // Released over the trash: check this first, the card may have been moved around during the drag
          deleteByDrag(evt.item);
        } else if (evt.to === evt.from && evt.oldIndex !== evt.newIndex) {
          syncFromDom();
          emit("onReorder", { id: evt.item.dataset.id, from: evt.oldIndex, to: evt.newIndex, items: items.slice() });
        }
        endDrag();
      },
    }));

    let sortTrash = null, dropEl = null;
    const onEnter = () => { if (dragging) trashEl.classList.add("dc-trash--over"); };
    const onLeave = () => trashEl.classList.remove("dc-trash--over");
    if (trashEl) {
      // 接收卡片的是一個鋪滿整個刪除區的空元素（SortableJS 對空容器最穩）
      // The element that receives cards is an empty overlay covering the whole trash zone (SortableJS is most reliable with an empty container)
      dropEl = el("div", "dc-trash-drop");
      trashEl.appendChild(dropEl);
      sortTrash = new Sortable(dropEl, Object.assign({}, common, {
        group: { name: uid, pull: false, put: true },
        onAdd: (evt) => deleteByDrag(evt.item),
      }));
      trashEl.addEventListener("pointerenter", onEnter);
      trashEl.addEventListener("pointerleave", onLeave);
    }

    /* ---------- 初始內容 / initial content ---------- */
    (options.items || []).forEach((item) => add(item));

    /* ---------- 對外的方法 / public methods ---------- */
    return {
      element: container,
      add,
      remove: (id) => remove(id, "api"),
      move,
      setItems,
      getItems: () => items.slice(),
      destroy() {
        sortBoard.destroy();
        if (sortTrash) sortTrash.destroy();
        container.removeEventListener("click", onClick);
        container.removeEventListener("keydown", onKey);
        document.removeEventListener("pointerdown", onDown, true);
        document.removeEventListener("pointermove", onMove);
        if (trashEl) {
          trashEl.removeEventListener("pointerenter", onEnter);
          trashEl.removeEventListener("pointerleave", onLeave);
          if (dropEl) dropEl.remove();
        }
        container.replaceChildren();
        container.classList.remove("dc-board");
        nodes.clear();
        items = [];
      },
    };
  }

  /* ================================================================== 匯出 / Exports */
  const api = { version: VERSION, createBoard, createCard, tearAway, formatDuration, icons: ICONS };
  if (typeof module === "object" && module.exports) module.exports = api;
  global.DuskCards = api;
})(typeof window !== "undefined" ? window : this);
