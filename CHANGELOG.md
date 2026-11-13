# Changelog / 更新紀錄

格式參考 [Keep a Changelog](https://keepachangelog.com/)，版本號遵循 [SemVer](https://semver.org/lang/zh-TW/)
Format follows [Keep a Changelog](https://keepachangelog.com/), versions follow [SemVer](https://semver.org/)

## [1.0.0] - 2026-11-14

第一個公開版本，從 discord-music-bot 的網頁看板抽出來 / first public release, extracted from the dashboard of discord-music-bot

### 功能 / Features
- `createBoard`：拖曳排序、序號徽章、懸停按鈕（播放／移除）、事件回呼 / drag to reorder, number badges, hover buttons, event callbacks
- 垃圾桶：拖進去在放手的位置撕裂消失 / trash zone: a dropped card tears in two where you let go
- `add` `remove` `move` `setItems` `getItems` `destroy`
- 鍵盤：Alt+↑ / Alt+↓ 移動，Delete 刪除 / keyboard: Alt+Up / Down to move, Delete to remove
- 全部顏色都是 `--dc-*` 變數，附 4 組範例主題 / every color is a `--dc-*` variable, 4 example themes included
- 瀏覽器內測試與 CI / in-browser tests and CI

### 已知限制 / Known limits
- 只有垂直清單，橫向與格狀沒測過 / vertical lists only, horizontal and grid are untested
- 只在 Chrome 測過，觸控需要更多回饋 / tested in Chrome only, touch needs more feedback
- 沒有 React / Vue 包裝 / no React / Vue wrappers
