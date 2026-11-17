# 記帳（家庭記帳 App）

每個人自己的記帳本。帳**只存在自己的手機**（瀏覽器的儲存空間），不會上傳到任何地方；家人每個人裝一次，各自是一本全新的空帳本，互相看不到。

## 家人怎麼安裝
- **iPhone／iPad**：用 Safari 打開網址 → 點下面的「分享」→「加入主畫面」→「新增」。一定要從主畫面的 App 打開（只開在 Safari 裡，太久沒用可能被系統清掉）。
- **Android（Samsung）**：用 Chrome 或 Samsung 瀏覽器打開網址 → 右上角選單 →「安裝應用程式」或「加到主畫面」。
- 裝好後從桌面打開，全螢幕、沒網路也能記。

## 怎麼用
- **點一下** 下面中間的 ＋：完整的記一筆（支出／收入、分類、細項、付款方式、日期、備註）。
- **按住** ＋ 往上劃：先經過內圈選付款方式，停在外圈的分類放手，再打金額就記好了。
- 金額可以打算式，例如 `120+35`。
- 首頁的「常用捷徑」：一點就記（沒寫金額的會跳出鍵盤）。記一筆時勾「存成常用捷徑」就會出現在首頁。
- 更多：借入借出、存錢目標、每月預算、固定收支（每月自動記）、分類／細項、付款方式、扇形選單、主題顏色、每月起算日、備份與還原。

## 備份（很重要）
換手機、刪掉 App、清除瀏覽器資料時帳會不見。偶爾到「更多 → 備份與還原 → 匯出備份檔」，把檔案存到雲端硬碟或傳給自己。超過 30 天沒備份，首頁會提醒。換手機時在新手機「從備份檔還原」。

## 給之後修改的人（Claude Code）
- 純網頁，沒有打包工具：`index.html`、`style.css`、`app.js`（畫面）、`core.js`（純邏輯）、`sw.js`（離線）、`manifest.webmanifest`、`icons/`。
- 測試：`node tests/core.test.mjs`（core.js 的邏輯、主題配色對比 ≥ 4.5）。
- 本機試：`python -m http.server 8300 --bind 127.0.0.1`，打開 http://127.0.0.1:8300/。
- **改了檔案要上線**：把 `sw.js` 的 `VERSION` 改一下，再 push；家人重開 App 就是新版（sw 有網路時先拿最新的）。
- 樣式照 `D:\yoe23\桌面\大學\設計規範\`（`style.css` 開頭是 tokens.css 的複本；主題色在 `core.js` 的 `PALETTES`）。
- 資料存在 localStorage `ledger-v1`，格式（`core.js` 的 `emptyData`／`cleanData`）：
  ```
  { v, items: [{ id, type: out|in, amt(整數), cat, sub, pay, date, note, t, rec? }],
    cats: { out: [{ name, icon, subs }], in: [...] }, pays, shortcuts, wheel: { cats, pays },
    budget: { total, cats }, recurring: [{ id, type, amt, cat, sub, pay, note, day, from, last, off }],
    debts: [{ id, dir: lend|borrow, who, amt, date, note, pays, done }], goals: [{ id, name, target, deps, done }],
    prefs: { theme, mode, monthStart, lastPay }, lastBackup }
  ```
  讀不懂的舊資料不會被蓋掉，會另存成 `ledger-v1-broken-時間`。
- 圖示是 Lucide（ISC 授權），內嵌在 `app.js` 的 `ICONS`。
