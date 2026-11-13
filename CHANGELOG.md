# Changelog / 更新紀錄

## [1.0.0] - 2026-11-14

第一版，從 discord-music-bot 的網頁看板抽出來 / first release, extracted from the dashboard of discord-music-bot

### 功能 / Features
- `createBoard`：拖曳排序、序號、懸停按鈕、事件回呼 / drag to reorder, numbers, hover buttons, callbacks
- 垃圾桶：放開滑鼠時卡片撕成兩半 / trash: the card tears in two when you let go
- `add` `remove` `move` `setItems` `getItems` `destroy`
- 鍵盤：Alt+↑ / Alt+↓ 移動，Delete 刪除 / keyboard: Alt+Up / Down, Delete
- 顏色都是 `--dc-*`，附 4 組主題 / colors are `--dc-*`, 4 themes included
- 瀏覽器測試 + CI / browser tests + CI

### 限制 / Limits
- 只有垂直清單 / vertical lists only
- 只在 Chrome 測過 / tested in Chrome only
- 沒有 React / Vue 包裝 / no React / Vue wrappers
