# 第三方元件 / Third-party components

本庫本身以 [Unlicense](LICENSE) 釋出（公有領域）
This library itself is released under the [Unlicense](LICENSE) (public domain)

| 元件 / Component | 用途 / What for | 授權 / License | 位置 / Where |
| --- | --- | --- | --- |
| [SortableJS](https://github.com/SortableJS/Sortable) 1.15.6 | 拖曳排序 / drag and drop sorting | MIT | `vendor/Sortable.min.js`（授權標頭請保留 / keep the license header） |

## 說明 / Notes

- SortableJS 是**必要相依**，要先載入再載入 `dusk-cards.js`，你也可以改用自己的版本（1.15 以上）
  SortableJS is a **required dependency**, load it before `dusk-cards.js`; you may use your own copy (1.15 or newer)
- demo 不載入任何外部字體或圖片，縮圖都是即時畫的 SVG；函式庫的 `--dc-font` 預設是 "Huninn"，沒有安裝時會退回系統字體
  The demo loads no external fonts or images, thumbnails are SVG drawn on the fly; `--dc-font` defaults to "Huninn" and falls back to system fonts when it is not installed
- 視覺設計與程式從 [discord-music-bot](https://github.com/ZmeyEE/discord-music-bot) 的網頁看板抽出來，同樣是 Unlicense
  The design and code were extracted from the dashboard of [discord-music-bot](https://github.com/ZmeyEE/discord-music-bot), also Unlicense
- 這份清單是整理給大家參考的，不是法律意見 / this list is a convenience, not legal advice
