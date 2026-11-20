// 用假的試算表跑 gas/Code.js（LINE 指令＋App API），不碰真的 Google：node tests/gas-code.test.mjs
import { readFileSync } from "fs";
import vm from "vm";
let n = 0, bad = 0;
const ok = (c, msg, extra) => { n++; if (!c) { bad++; console.log("✗", msg, extra ?? ""); } };

// ---- 假的試算表
class Sheet {
  constructor(name) { this.name = name; this.v = []; }
  appendRow(r) { this.v.push([...r]); }
  setFrozenRows() {}
  getLastRow() { return this.v.length; }
  getDataRange() { return { getValues: () => this.v.map((r) => [...r]) }; }
  getRange(r, c, nr = 1, nc = 1) { const s = this; return {
    setValue(x) { while (s.v.length < r) s.v.push([]); s.v[r - 1][c - 1] = x; },
    setValues(xs) { xs.forEach((row, i) => row.forEach((x, j) => { s.v[r - 1 + i][c - 1 + j] = x; })); } }; }
}
class SS { constructor() { this.s = {}; } getSheetByName(n) { return this.s[n] || null; } insertSheet(n) { return (this.s[n] = new Sheet(n)); } }
const ss = new SS();
const old = ss.insertSheet("記帳明細");
old.appendRow(["日期", "項目", "金額", "記帳人"]);
[["早餐", 345, "劉芳慈"], ["口紅", 1500, "李宸yo"], ["車票", "", "劉芳慈"], ["晚餐", 195, "李宸yo"]].forEach((r, i) => old.appendRow([new Date(2026, 8, i + 1), ...r]));

const ctx = { console: { log() {}, warn() {}, error: (e) => console.log("ERR", e) }, JSON, Date, Math, Number, String, Array, Object, encodeURIComponent,
  ContentService: { createTextOutput: (s) => ({ s, setMimeType() { return this; } }), MimeType: { JSON: "json" } },
  Utilities: { getUuid: () => Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2) + "-abc" } };
vm.createContext(ctx);
const src = readFileSync(new URL("../gas/logic.js", import.meta.url), "utf8") + "\n" + readFileSync(new URL("../gas/Code.js", import.meta.url), "utf8");
vm.runInContext(src + ";this.LG=LG; this.setTest=function(t){TEST=t;}; this.handle=handleEvent_; this.post=doPost; this.api=api_; this.load=load_;", ctx);
const T = { ss, replies: [], names: { U1: "李宸yo", U2: "劉芳慈", U3: "小明", U4: "阿華" }, counts: { G1: 2, G2: 3 } };
ctx.setTest(T);
const say = (uid, text, gid) => { T.replies = []; ctx.handle({ type: "message", replyToken: "t", source: gid ? { type: "group", groupId: gid, userId: uid } : { type: "user", userId: uid }, message: { type: "text", text } }); return T.replies.join("\n"); };
const rows = (n) => ss.s[n].v.slice(1).filter((r) => r[0]);

// 1. 第一次收到訊息：建表、搬舊帳（3 筆，跳過沒金額的），原兩人群組自動接手舊帳
let r = say("U1", "查詢", "G1");
ok(rows("明細v2").length === 3, "搬了 3 筆", rows("明細v2").length);
ok(/從以前到現在/.test(r), "查詢標題", r);
ok(r.includes("相抵後：李宸yo 欠 劉芳慈 1350") && r.includes("合計 1695") && r.includes("合計 345"), "查詢：兩邊合計＋相抵 1350", r);
ok(rows("明細v2").every((x) => x[2] === "G1"), "舊帳搬進 G1");
ok(!rows("群組").some((x) => x[0] === "legacy"), "legacy 群組拿掉");
ok(rows("明細v2").some((x) => x[5] === "U1" || x[6] === "U1"), "李宸yo 換成真的 userId");
// 2. 對方說話、記帳
r = say("U2", "午餐 120", "G1");
ok(r.includes("劉芳慈 欠 李宸yo 120"), "U2 記：劉芳慈欠李宸yo 120", r);
ok(r.includes("李宸yo 欠 劉芳慈 1230"), "淨額更新 1230", r);
ok(!rows("明細v2").some((x) => String(x[5]).startsWith("old:") || String(x[6]).startsWith("old:")), "old: 都換掉了");
ok(rows("成員").filter((x) => x[1] === "G1").length === 2, "G1 兩個成員", JSON.stringify(rows("成員")));
r = say("U1", "還 230", "G1");
ok(r.includes("李宸yo 欠 劉芳慈 1000"), "還款後 1000", r);
r = say("U1", "哈哈", "G1"); ok(r === "", "聊天不回");
r = say("U1", "刪除", "G1"); ok(r.includes("已刪除：還款 230") && r.includes("1230"), "刪除最後一筆", r);
r = say("U1", "午餐 0", "G1"); ok(r.includes("正整數"), "錯誤金額", r);
r = say("U1", "群組名 我們倆", "G1"); ok(r.includes("我們倆"), "改名");
r = say("U1", "連動碼", "G1"); ok(r.includes("私訊"), "群組裡要私訊");
// 3. 三人新群組
say("U1", "查詢", "G2"); say("U3", "查詢", "G2"); say("U4", "查詢", "G2");
ok(rows("明細v2").every((x) => x[2] === "G1"), "舊帳沒有跑到 G2");
r = say("U1", "晚餐 900 平分", "G2"); ok(r.includes("小明 欠 李宸yo 300") && r.includes("阿華 欠 李宸yo 300"), "三人平分", r);
r = say("U3", "飲料 50", "G2"); ok(r.includes("要寫是誰"), "三人要寫名字", r);
r = say("U3", "飲料 50 阿華", "G2"); ok(r.includes("小明 欠 阿華 50"), "指定名字", r);
// 4. 連動碼與 App API
r = say("U1", "連動碼");
const m = /#link=([^~]+)~(\w+)/.exec(r); ok(!!m, "私訊拿到連結", r);
const key = m && m[2];
ok(/你的連動碼：[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}/.test(r), "8 碼連動碼", r);
ok(r.includes("?openExternalBrowser=1#link="), "連結用外部瀏覽器開");
const show = /連動碼：(\S+)/.exec(r)[1];
ok(ctx.api({ key: show.toLowerCase(), op: "sync" }).ok, "小寫、有 - 也收");
ok(ctx.api({ key, op: "sync" }).bot === "@testbot", "回傳機器人 ID");
ok(/連動碼：(\S+)/.exec(say("U1", "連動碼"))[1] === show, "再要一次是同一組");
let a = ctx.api({ key: "wrong", op: "sync" }); ok(a.ok === false, "錯的連動碼");
ok(ctx.api({ key: "", op: "sync" }).ok === false, "空的連動碼");
a = ctx.api({ key, op: "sync" });
ok(a.ok && a.me === "U1" && a.groups.length === 2, "U1 看得到兩個群組", JSON.stringify(a.groups));
r = say("U3", "連動碼"); const key3 = /~(\w+)/.exec(r)[1];
let a3 = ctx.api({ key: key3, op: "sync" });
ok(a3.groups.length === 1 && a3.groups[0].id === "G2", "小明只看得到 G2");
ok(!a3.entries.some((e) => e.g === "G1"), "小明看不到 G1 的帳");
a = ctx.api({ key, op: "add", e: { id: "Acli1", g: "G1", item: "電影", amt: 300, payer: "U1", to: ["U1", "U2"], kind: "exp" } });
ok(a.ok && a.entries.some((e) => e.id === "Acli1" && e.src === "App"), "App 新增");
ctx.api({ key, op: "add", e: { id: "Acli1", g: "G1", item: "電影", amt: 300, payer: "U1", to: ["U1", "U2"], kind: "exp" } });
ok(rows("明細v2").filter((x) => x[0] === "Acli1").length === 1, "重送不重複");
a = ctx.api({ key: key3, op: "add", e: { id: "Ax", g: "G1", item: "x", amt: 1, payer: "U3", to: ["U3"], kind: "exp" } });
ok(!a.ok, "不能記到沒參加的群組");
a = ctx.api({ key, op: "add", e: { id: "Ay", g: "G1", item: "x", amt: 1.5, payer: "U1", to: ["U2"], kind: "exp" } });
ok(!a.ok, "小數不行");
a = ctx.api({ key: key3, op: "del", id: "Acli1" }); ok(!a.ok, "不能刪別人的");
a = ctx.api({ key, op: "del", id: "Acli1" }); ok(a.ok && a.entries.find((e) => e.id === "Acli1").del, "刪自己的");
r = say("U1", "換連動碼"); a = ctx.api({ key, op: "sync" }); ok(!a.ok, "換碼後舊碼失效");
// 5. 私訊不在舊帳的人記帳 → 請他到群組
r = say("U4", "午餐 100"); ok(r.includes("群組"), "私訊記帳要去群組", r);
// 6. 機器人被邀進新群組
T.replies = []; ctx.handle({ type: "join", replyToken: "t", source: { type: "group", groupId: "G3" } });
ok(T.replies[0].includes("分帳本") && rows("群組").some((x) => x[0] === "G3"), "加入群組會打招呼");

// 7. 假的 LINE 訊息（destination 不對）不處理
const before = rows("明細v2").length;
const ev = (dest) => ({ postData: { contents: JSON.stringify({ destination: dest, events: [{ type: "message", replyToken: "t", source: { type: "group", groupId: "G1", userId: "U1" }, message: { type: "text", text: "假帳 999" } }] }) } });
ctx.post(ev("Uhacker")); ok(rows("明細v2").length === before, "destination 不對：不記");
ctx.post({ postData: { contents: JSON.stringify({ events: [{ type: "message", replyToken: "t", source: { type: "group", groupId: "G1", userId: "U1" }, message: { type: "text", text: "假帳 999" } }] }) } });
ok(rows("明細v2").length === before, "沒有 destination：不記");
ctx.post(ev("Ubot")); ok(rows("明細v2").length === before + 1, "真的機器人訊息：記");

// 8. 店家地址：Google 地圖網址查地址（假的 UrlFetchApp 轉址、假的 Maps）
{
  const hops = { "https://maps.app.goo.gl/Short1": "https://www.google.com/maps/place/%E5%85%AB%E6%96%B9%E9%9B%B2%E9%9B%86/@25.05,121.52,17z/data=!3d25.0512!4d121.5233" };
  const fetched = [];
  ctx.UrlFetchApp = { fetch: (u) => { fetched.push(u); return { getHeaders: () => (hops[u] ? { Location: hops[u] } : {}) }; } };
  const geo = { calls: [], setLanguage() { return this; }, setRegion() { return this; },
    reverseGeocode(lat, lng) { this.calls.push(["rev", lat, lng]); return { results: [{ formatted_address: "104台北市中山區某某路1號" }] }; },
    geocode(q) { this.calls.push(["geo", q]); return { results: [{ formatted_address: "110台北市信義區信義路五段7號", geometry: { location: { lat: 25.03, lng: 121.56 } } }] }; } };
  ctx.Maps = { newGeocoder: () => geo };
  const post = (b) => JSON.parse(ctx.post({ postData: { contents: JSON.stringify(b) } }).s);
  let r = post({ op: "map", url: "https://maps.app.goo.gl/Short1" });
  ok(r.ok && r.addr === "104台北市中山區某某路1號" && r.name === "八方雲集" && r.lat === 25.0512, "短網址：轉址後用店的座標查地址", JSON.stringify(r));
  ok(fetched.length === 1 && geo.calls[0][0] === "rev", "短網址只打開一次、用座標反查");
  r = post({ op: "map", url: "https://maps.google.com/?q=%E5%8F%B0%E5%8C%97101" });
  ok(r.ok && r.addr.includes("信義路") && r.lat === 25.03, "q= 的名稱：查地址", JSON.stringify(r));
  fetched.length = 0;
  r = post({ op: "map", url: "https://evil.com/x" });
  ok(!r.ok && fetched.length === 0, "別的網站：不打開", JSON.stringify(r));
  hops["https://maps.app.goo.gl/Bad"] = "https://evil.com/steal";
  r = post({ op: "map", url: "https://maps.app.goo.gl/Bad" });
  ok(!r.ok && !fetched.includes("https://evil.com/steal"), "轉到別的網站：不跟過去", JSON.stringify(r));
  r = post({ op: "map", url: "https://maps.app.goo.gl/Short1", key: "" });
  ok(r.ok, "查地址不需要連動碼");
}

console.log(bad ? `✗ ${bad}／${n} 項失敗` : `✓ ${n} 項全部通過`);
process.exit(bad ? 1 : 0);
