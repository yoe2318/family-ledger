// 這個檔由 家庭記帳/gas/logic.js + gas/Code.js 合併；整份複製，貼到 Apps Script 的「程式碼.gs」取代原本的內容。
// 朋友分帳的純邏輯（不碰試算表、不碰 LINE）。
// Apps Script 裡是 logic.gs（內容和這個檔一模一樣），Code.gs 用；本機用 tests/gas.test.mjs 測。
// 一筆帳（entry）：{ id, t(毫秒), g(群組id), item, amt(正整數), payer(誰付錢), to:[分給誰], kind:"exp"|"pay", by(誰記的), src:"LINE"|"App", del }
//   kind "exp"：payer 先付，to 裡的人平分（不是 payer 的人各欠 payer 一份）。
//   kind "pay"：還款，payer 拿 amt 給 to[0]（算法一樣：to[0] 欠 payer amt，正好抵掉原本的債）。

var LG = (function () {
  var MAX_AMT = 10000000;
  var KW = { query: ["查詢", "總額", "查帳", "帳"], del: ["刪除", "刪掉", "取消"], link: ["連動碼", "連動"], relink: ["換連動碼"],
    help: ["說明", "help", "幫助", "怎麼用"], claim: ["綁定舊帳"] };

  function toHalf(s) { return String(s).replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); }).replace(/　/g, " "); }
  function amountOf(tok) {
    var m = /^\$?([0-9][0-9,]*)(元|塊)?$/.exec(tok);
    if (!m) return 0;
    var n = Number(m[1].replace(/,/g, ""));
    return n > 0 && n <= MAX_AMT && Math.floor(n) === n ? n : -1;   // -1：看起來是數字但不合理
  }

  // 解析 LINE 訊息。回傳 null 表示不是記帳訊息（聊天就不理它）。
  function parseMessage(text) {
    var s = toHalf(text || "").trim();
    if (!s) return null;
    for (var k in KW) if (KW[k].indexOf(s) >= 0) return { cmd: k };
    var rn = /^群組名\s+(.+)$/.exec(s);
    if (rn) return { cmd: "rename", name: rn[1].trim().slice(0, 20) };
    var toks = s.split(/\s+/);
    var repay = false;
    if (toks[0] === "還" || toks[0] === "還款" || toks[0] === "還錢") { repay = true; toks.shift(); }
    else if (/^還\d/.test(toks[0])) { repay = true; toks[0] = toks[0].slice(1); }
    var ai = -1, amt = 0;
    for (var i = 0; i < toks.length; i++) { var a = amountOf(toks[i]); if (a !== 0) { if (ai >= 0) return { cmd: "error", why: "two" }; ai = i; amt = a; } }
    if (ai < 0) return repay ? { cmd: "error", why: "noamt" } : null;
    if (amt < 0) return { cmd: "error", why: "amt" };
    var before = toks.slice(0, ai), after = toks.slice(ai + 1);
    if (repay) { var who0 = before.concat(after).join(" ").trim(); return { cmd: "repay", amt: amt, who: who0 || null }; }
    var split = false, si = after.indexOf("平分");
    if (si < 0 && before.indexOf("平分") >= 0) { before.splice(before.indexOf("平分"), 1); split = true; }
    if (si >= 0) { after.splice(si, 1); split = true; }
    var item, who = null;
    if (before.length) { item = before.join(" "); who = after.join(" ").trim() || null; }
    else { item = after.join(" ").trim(); }
    if (!item) return { cmd: "error", why: "noitem" };
    return { cmd: "add", item: item.slice(0, 40), amt: amt, who: who, split: split };
  }

  // 名字比對：完全相同 > 開頭相同 > 包含，只有一個符合才算。members: [{uid,name}]
  function matchName(q, members) {
    if (!q) return null;
    var low = String(q).toLowerCase(), tests = [
      function (n) { return n === low; }, function (n) { return n.indexOf(low) === 0; }, function (n) { return n.indexOf(low) >= 0; }];
    for (var t = 0; t < tests.length; t++) {
      var hit = members.filter(function (m) { return tests[t](String(m.name || "").toLowerCase()); });
      if (hit.length === 1) return hit[0];
      if (hit.length > 1) return { many: hit };
    }
    return null;
  }

  // 平分：每人 floor(amt/n)，零頭給付錢的人（他不在名單裡就給第一個）。回傳 { uid: 份額 }
  function splitShares(amt, to, payer) {
    var n = to.length, out = {};
    if (!n) return out;
    var base = Math.floor(amt / n), rem = amt - base * n;
    to.forEach(function (u) { out[u] = (out[u] || 0) + base; });
    out[to.indexOf(payer) >= 0 ? payer : to[0]] += rem;
    return out;
  }

  // 兩兩淨額：回傳 [{ from, to, amt }]（from 欠 to）
  function balances(entries) {
    var net = {};   // "a|b"（a<b）→ 正數＝a 欠 b
    entries.forEach(function (e) {
      if (e.del) return;
      var sh = splitShares(e.amt, e.to, e.payer);
      Object.keys(sh).forEach(function (u) {
        if (u === e.payer || !sh[u]) return;
        var a = u < e.payer ? u : e.payer, b = u < e.payer ? e.payer : u, key = a + "|" + b;
        net[key] = (net[key] || 0) + (u === a ? sh[u] : -sh[u]);
      });
    });
    var out = [];
    Object.keys(net).sort().forEach(function (k) {
      var p = k.split("|"), v = net[k];
      if (v > 0) out.push({ from: p[0], to: p[1], amt: v });
      else if (v < 0) out.push({ from: p[1], to: p[0], amt: -v });
    });
    return out;
  }

  // 兩人之間從以前到現在的總帳：[{ a, b, ab(a 欠 b 合計), ba, apay(a 還 b), bpay, net:{from,to,amt}|null }]
  function pairTotals(entries) {
    var m = {};
    function get(x, y) { var a = x < y ? x : y, b = x < y ? y : x, k = a + "|" + b; if (!m[k]) m[k] = { a: a, b: b, ab: 0, ba: 0, apay: 0, bpay: 0 }; return m[k]; }
    entries.forEach(function (e) {
      if (e.del) return;
      if (e.kind === "pay") { var q = get(e.payer, e.to[0]); if (e.payer === q.a) q.apay += e.amt; else q.bpay += e.amt; return; }
      var sh = splitShares(e.amt, e.to, e.payer);
      Object.keys(sh).forEach(function (u) {
        if (u === e.payer || !sh[u]) return;
        var p = get(u, e.payer); if (u === p.a) p.ab += sh[u]; else p.ba += sh[u];
      });
    });
    return Object.keys(m).sort().map(function (k) {
      var p = m[k], v = p.ab - p.apay - (p.ba - p.bpay);
      p.net = v > 0 ? { from: p.a, to: p.b, amt: v } : v < 0 ? { from: p.b, to: p.a, amt: -v } : null;
      return p;
    });
  }

  // 某人在一筆帳裡「自己花掉」的錢（算進自己的支出用）。還款不算。
  function myShare(e, uid) {
    if (e.del || e.kind !== "exp" || e.to.indexOf(uid) < 0) return 0;
    return splitShares(e.amt, e.to, e.payer)[uid] || 0;
  }

  // 舊的「記帳明細」（日期、項目、金額、記帳人）→ 新格式。規則：記帳的人欠另一位全部。
  // rows 不含標題列；名字用暫時的 uid "old:名字"，本人之後在 LINE 說話時換成真的 userId。
  function migrateLegacy(rows, gid) {
    var names = [], entries = [], skipped = [];
    rows.forEach(function (r) { var n = String(r[3] || "").trim(); if (n && names.indexOf(n) < 0) names.push(n); });
    if (names.length !== 2) return { names: names, entries: [], skipped: rows.map(function (r, i) { return i + 2; }), why: "舊帳不是剛好兩個人，沒有搬" };
    rows.forEach(function (r, i) {
      var item = String(r[1] == null ? "" : r[1]).trim(), amt = amountOf(toHalf(String(r[2] == null ? "" : r[2]).trim())), who = String(r[3] || "").trim();
      if (!(amt > 0) || !item || !who || /^\d+$/.test(item)) { skipped.push(i + 2); return; }
      var other = names[0] === who ? names[1] : names[0];
      var t = r[0] instanceof Date ? r[0].getTime() : Date.parse(r[0]) || 0;
      entries.push({ id: "old-" + (i + 2), t: t, g: gid, item: item.slice(0, 40), amt: amt, payer: "old:" + other, to: ["old:" + who], kind: "exp", by: "old:" + who, src: "LINE", del: false });
    });
    return { names: names, entries: entries, skipped: skipped };
  }

  // 把 parseMessage 的結果變成一筆帳。ctx: { me, members:[{uid,name}](同群組), gid, now, id }
  // 回傳 { entry } 或 { err: "給使用者看的話" }
  function buildEntry(p, ctx) {
    var others = ctx.members.filter(function (m) { return m.uid !== ctx.me; });
    function pick(q) {
      var m = matchName(q, others.concat(ctx.members.filter(function (x) { return x.uid === ctx.me; })));
      if (!m) return { err: "找不到「" + q + "」。這個群組有：" + ctx.members.map(function (x) { return x.name; }).join("、") };
      if (m.many) return { err: "「" + q + "」可能是：" + m.many.map(function (x) { return x.name; }).join("、") + "，請打完整一點" };
      return { m: m };
    }
    function onlyOther() {
      if (others.length === 1) return { m: others[0] };
      if (!others.length) return { err: "還不知道群組裡的其他人是誰。請對方先在群組打一句話（例如「查詢」）。" };
      return { err: "群組有 " + ctx.members.length + " 個人，要寫是誰，例如：" + (p.cmd === "repay" ? "還 500 " : p.item + " " + p.amt + " ") + others[0].name };
    }
    var base = { id: ctx.id, t: ctx.now, g: ctx.gid, amt: p.amt, by: ctx.me, src: "LINE", del: false };
    if (p.cmd === "repay") {
      var r = p.who ? pick(p.who) : onlyOther();
      if (r.err) return r;
      if (r.m.uid === ctx.me) return { err: "不能還錢給自己" };
      return { entry: Object.assign(base, { item: "還款", payer: ctx.me, to: [r.m.uid], kind: "pay" }) };
    }
    if (p.split) {
      var payer = ctx.me;
      if (p.who) { var q = pick(p.who); if (q.err) return q; payer = q.m.uid; }
      if (ctx.members.length < 2) return { err: "群組裡還只有你一個人，平分要等其他人先打一句話" };
      return { entry: Object.assign(base, { item: p.item, payer: payer, to: ctx.members.map(function (m) { return m.uid; }), kind: "exp" }) };
    }
    var o = p.who ? pick(p.who) : onlyOther();
    if (o.err) return o;
    if (o.m.uid === ctx.me) return { err: "不能欠自己錢" };
    return { entry: Object.assign(base, { item: p.item, payer: o.m.uid, to: [ctx.me], kind: "exp" }) };
  }

  // 一筆帳的白話說明，例如「李宸yo 欠 劉芳慈 120」「劉芳慈 付，3 人平分（每人 40）」
  function describe(e, nameOf) {
    if (e.kind === "pay") return nameOf(e.payer) + " 還 " + nameOf(e.to[0]) + " " + e.amt;
    if (e.to.length === 1) return nameOf(e.to[0]) + " 欠 " + nameOf(e.payer) + " " + e.amt;
    var sh = splitShares(e.amt, e.to, e.payer), each = Math.floor(e.amt / e.to.length);
    return nameOf(e.payer) + " 付 " + e.amt + "，" + e.to.length + " 人平分（每人 " + each + (sh[e.payer] !== each ? "，零頭算 " + nameOf(e.payer) : "") + "）";
  }

  var HELP = "【記帳怎麼打】\n" +
    "・午餐 120 → 我欠對方 120（兩個人的群組）\n" +
    "・午餐 120 小明 → 我欠小明 120\n" +
    "・晚餐 900 平分 → 我付的，大家平分\n" +
    "・晚餐 900 平分 小明 → 小明付的，大家平分\n" +
    "・還 500 小明 → 我還小明 500（兩個人可以不寫名字）\n" +
    "・查詢 → 看誰欠誰多少\n" +
    "・刪除 → 刪掉我最後記的一筆\n" +
    "・群組名 宿舍飯錢 → 幫這本帳取名字\n" +
    "・私訊我「連動碼」→ 在記帳 App 裡看帳、記帳";

  return { parseMessage: parseMessage, matchName: matchName, splitShares: splitShares, balances: balances, pairTotals: pairTotals, myShare: myShare,
    migrateLegacy: migrateLegacy, buildEntry: buildEntry, describe: describe, amountOf: amountOf, HELP: HELP };
})();
if (typeof module !== "undefined") module.exports = LG;

// LINE 記帳機器人＋記帳 App 的朋友分帳 API（Google Apps Script）。
// Apps Script 專案裡有兩個檔：Code.gs（這個檔）和 logic.gs（= gas/logic.js）。
// 機密放在「專案設定 → 指令碼屬性」：LINE_TOKEN（LINE channel access token）、SHEET_ID（試算表 id）。程式碼裡不放。
// 部署：「部署 → 管理部署作業 → 編輯（鉛筆）→ 版本：新版本 → 部署」，網址不變，LINE 那邊不用改。
// 試算表：舊的「記帳明細」「花費統計」不動（備份）；新資料在「群組」「成員」「連動」「明細v2」，第一次收到訊息時自動建立並搬舊帳。

var APP_URL = "https://yoe2318.github.io/family-ledger/";
var LEGACY = "legacy";
var TEST = null;   // 測試用：{ ss, replies:[], names:{uid:暱稱}, counts:{gid:人數} }，正式執行時是 null

var COLS = {
  g: ["群組", ["群組id", "名稱", "建立時間"]],
  m: ["成員", ["userId", "群組id", "暱稱", "加入時間"]],
  k: ["連動", ["userId", "連動碼", "建立時間"]],
  e: ["明細v2", ["id", "時間", "群組id", "項目", "金額", "付款人", "分給", "類型", "記帳人", "來源", "刪除", "說明"]],
};

// ------------------------------------------------------------------ 入口
function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || "{}"); } catch (err) { return json_({ ok: false, err: "bad json" }); }
  if (body.events) {                       // LINE 來的
    for (var i = 0; i < body.events.length; i++) {
      try { withLock_(function () { handleEvent_(body.events[i]); }); } catch (err) { console.error(err && err.stack || err); }
    }
    return ContentService.createTextOutput("ok");
  }
  return json_(withLock_(function () { return api_(body); }));   // 記帳 App 來的
}
function doGet() { return json_({ ok: true, app: "family-ledger friends" }); }

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function withLock_(fn) {
  if (TEST) return fn();
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try { return fn(); } finally { lock.releaseLock(); }
}

// ------------------------------------------------------------------ 試算表
function ss_() { return TEST ? TEST.ss : SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SHEET_ID")); }

function sheet_(ss, k) {
  var c = COLS[k], sh = ss.getSheetByName(c[0]);
  if (!sh) { sh = ss.insertSheet(c[0]); sh.appendRow(c[1]); sh.setFrozenRows(1); }
  return sh;
}
// 讀全部（資料量小，每次讀整張最簡單也最不會錯）
function load_(ss) {
  var created = !ss.getSheetByName(COLS.e[0]);
  var db = { ss: ss, sh: {}, groups: [], members: [], keys: [], entries: [] };
  for (var k in COLS) db.sh[k] = sheet_(ss, k);
  var rows = function (k) { var v = db.sh[k].getDataRange().getValues(); v.shift(); return v; };
  rows("g").forEach(function (r, i) { if (r[0]) db.groups.push({ row: i + 2, id: String(r[0]), name: String(r[1] || "") }); });
  rows("m").forEach(function (r, i) { if (r[0]) db.members.push({ row: i + 2, uid: String(r[0]), g: String(r[1]), name: String(r[2] || "") }); });
  rows("k").forEach(function (r, i) { if (r[0]) db.keys.push({ row: i + 2, uid: String(r[0]), key: String(r[1]) }); });
  rows("e").forEach(function (r, i) {
    if (!r[0]) return;
    db.entries.push({ row: i + 2, id: String(r[0]), t: r[1] instanceof Date ? r[1].getTime() : Number(r[1]) || 0, g: String(r[2]), item: String(r[3]), amt: Number(r[4]) || 0,
      payer: String(r[5]), to: String(r[6]).split(",").filter(String), kind: r[7] === "還款" ? "pay" : "exp", by: String(r[8]), src: String(r[9] || ""), del: !!r[10] });
  });
  if (created) migrate_(db);
  return db;
}
function nameOf_(db, uid) {
  for (var i = 0; i < db.members.length; i++) if (db.members[i].uid === uid && db.members[i].name) return db.members[i].name;
  return uid.indexOf("old:") === 0 ? uid.slice(4) : "某人";
}
function addEntry_(db, e) {
  db.sh.e.appendRow([e.id, new Date(e.t), e.g, e.item, e.amt, e.payer, e.to.join(","), e.kind === "pay" ? "還款" : "記帳", e.by, e.src, "",
    LG.describe(e, function (u) { return nameOf_(db, u); })]);
  e.row = db.sh.e.getLastRow();
  db.entries.push(e);
}
function groupOf_(db, gid) { for (var i = 0; i < db.groups.length; i++) if (db.groups[i].id === gid) return db.groups[i]; return null; }
function membersOf_(db, gid) { return db.members.filter(function (m) { return m.g === gid; }); }
function ensureGroup_(db, gid, name) {
  var g = groupOf_(db, gid);
  if (g) return g;
  db.sh.g.appendRow([gid, name || "", new Date()]);
  g = { row: db.sh.g.getLastRow(), id: gid, name: name || "" };
  db.groups.push(g);
  return g;
}
function ensureMember_(db, uid, gid, name) {
  var m = db.members.filter(function (x) { return x.uid === uid && x.g === gid; })[0];
  if (m) { if (name && m.name !== name) { m.name = name; db.sh.m.getRange(m.row, 3).setValue(name); } return m; }
  db.sh.m.appendRow([uid, gid, name || "", new Date()]);
  m = { row: db.sh.m.getLastRow(), uid: uid, g: gid, name: name || "" };
  db.members.push(m);
  return m;
}

// 第一次：把舊的「記帳明細」搬進「明細v2」，放在暫時的群組 legacy
function migrate_(db) {
  var old = db.ss.getSheetByName("記帳明細");
  if (!old) return;
  var v = old.getDataRange().getValues(); v.shift();
  var r = LG.migrateLegacy(v, LEGACY);
  if (!r.entries.length) { console.log("舊帳沒搬：" + (r.why || "沒有資料")); return; }
  ensureGroup_(db, LEGACY, "舊的 LINE 記帳");
  r.names.forEach(function (n) { ensureMember_(db, "old:" + n, LEGACY, n); });
  r.entries.forEach(function (e) { addEntry_(db, e); });
  console.log("舊帳搬了 " + r.entries.length + " 筆，跳過第 " + r.skipped.join("、") + " 列");
}

// 舊帳裡的名字（old:暱稱）遇到本人說話時，換成真的 userId
function claimName_(db, uid, name) {
  var old = "old:" + name;
  if (!name || !db.members.some(function (m) { return m.uid === old; })) return;
  db.members.forEach(function (m) { if (m.uid === old) { m.uid = uid; db.sh.m.getRange(m.row, 1).setValue(uid); } });
  db.entries.forEach(function (e) {
    var ch = false;
    if (e.payer === old) { e.payer = uid; db.sh.e.getRange(e.row, 6).setValue(uid); ch = true; }
    if (e.by === old) { e.by = uid; db.sh.e.getRange(e.row, 9).setValue(uid); }
    if (e.to.indexOf(old) >= 0) { e.to = e.to.map(function (u) { return u === old ? uid : u; }); db.sh.e.getRange(e.row, 7).setValue(e.to.join(",")); }
  });
}
// 舊帳搬到真的 LINE 群組（第一次在「剛好兩個人、還沒有帳」的群組說話時自動，或打「綁定舊帳」）
function moveLegacy_(db, gid) {
  var lg = groupOf_(db, LEGACY);
  if (!lg) return false;
  // 不刪列（列號會亂），改成：成員改群組；已經在新群組的就把舊列清空（讀的時候會跳過空白列）
  membersOf_(db, LEGACY).forEach(function (m) {
    var dup = db.members.some(function (x) { return x !== m && x.uid === m.uid && x.g === gid; });
    if (dup) { m.g = ""; db.sh.m.getRange(m.row, 1, 1, 2).setValues([["", ""]]); }
    else { m.g = gid; db.sh.m.getRange(m.row, 2).setValue(gid); }
  });
  db.members = db.members.filter(function (m) { return m.g; });
  db.entries.forEach(function (e) { if (e.g === LEGACY) { e.g = gid; db.sh.e.getRange(e.row, 3).setValue(gid); } });
  db.sh.g.getRange(lg.row, 1).setValue("");
  db.groups = db.groups.filter(function (g) { return g !== lg; });
  var ng = groupOf_(db, gid);
  if (ng && !ng.name) { ng.name = lg.name; db.sh.g.getRange(ng.row, 2).setValue(lg.name); }
  return true;
}

// ------------------------------------------------------------------ LINE
function lineApi_(path, payload) {
  if (TEST) {
    if (payload) { TEST.replies.push(payload.messages.map(function (m) { return m.text; }).join("\n")); return null; }
    var mc = /members\/count$/.test(path), gid = path.split("/")[1];
    if (mc) return { count: (TEST.counts || {})[gid] || 0 };
    if (/summary$/.test(path)) return { groupName: "測試群組" };
    var uid = path.split("/").pop();
    return { displayName: (TEST.names || {})[uid] || "" };
  }
  var opt = { headers: { Authorization: "Bearer " + PropertiesService.getScriptProperties().getProperty("LINE_TOKEN") }, muteHttpExceptions: true };
  if (payload) { opt.method = "post"; opt.contentType = "application/json; charset=UTF-8"; opt.payload = JSON.stringify(payload); }
  var r = UrlFetchApp.fetch("https://api.line.me/v2/bot/" + path, opt);
  if (r.getResponseCode() >= 300) { console.warn("LINE " + path + " " + r.getResponseCode() + " " + r.getContentText()); return null; }
  try { return JSON.parse(r.getContentText() || "{}"); } catch (e) { return {}; }
}
function reply_(token, text) { if (token) lineApi_("message/reply", { replyToken: token, messages: [{ type: "text", text: String(text).slice(0, 4900) }] }); }
function chatId_(src) { return src.groupId || src.roomId || null; }
function profileName_(src, uid) {
  var p = src.groupId ? lineApi_("group/" + src.groupId + "/member/" + uid) : src.roomId ? lineApi_("room/" + src.roomId + "/member/" + uid) : lineApi_("profile/" + uid);
  return (p && p.displayName) || "";
}
function memberCount_(src) {
  var r = src.groupId ? lineApi_("group/" + src.groupId + "/members/count") : src.roomId ? lineApi_("room/" + src.roomId + "/members/count") : null;
  return r && r.count || 0;
}
function balanceText_(db, gid) {
  var b = LG.balances(db.entries.filter(function (e) { return e.g === gid; }));
  if (!b.length) return "目前沒有人欠錢";
  return b.map(function (x) { return nameOf_(db, x.from) + " 欠 " + nameOf_(db, x.to) + " " + x.amt + " 元"; }).join("\n");
}
function linkFor_(db, uid, renew) {
  var k = db.keys.filter(function (x) { return x.uid === uid; })[0];
  var key = Utilities.getUuid().replace(/-/g, "").slice(0, 20);
  if (k && !renew) key = k.key;
  else if (k) { db.sh.k.getRange(k.row, 2).setValue(key); k.key = key; }
  else { db.sh.k.appendRow([uid, key, new Date()]); db.keys.push({ row: db.sh.k.getLastRow(), uid: uid, key: key }); }
  var url = TEST ? "TEST_URL" : ScriptApp.getService().getUrl();
  return APP_URL + "#link=" + encodeURIComponent(url) + "~" + key;
}

// 「查詢」用：每兩個人從以前到現在各欠多少、還了多少、相抵後誰欠誰
function totalsText_(db, gid) {
  var ps = LG.pairTotals(db.entries.filter(function (e) { return e.g === gid; }));
  if (!ps.length) return "目前還沒有帳";
  return ps.map(function (p) {
    var A = nameOf_(db, p.a), B = nameOf_(db, p.b);
    var lines = [A + " ↔ " + B, "・" + A + " 欠 " + B + " 合計 " + p.ab, "・" + B + " 欠 " + A + " 合計 " + p.ba];
    if (p.apay || p.bpay) lines.push("・已還：" + A + " 還 " + p.apay + "、" + B + " 還 " + p.bpay);
    lines.push(p.net ? "➜ 相抵後：" + nameOf_(db, p.net.from) + " 欠 " + nameOf_(db, p.net.to) + " " + p.net.amt + " 元" : "➜ 相抵後：兩清");
    return lines.join("\n");
  }).join("\n\n");
}

var ERR = { two: "一則訊息只能有一個金額喔", amt: "金額要是正整數（例如 120）", noamt: "要寫金額，例如：還 500", noitem: "要寫項目，例如：午餐 120" };

function handleEvent_(ev) {
  var src = ev.source || {}, gid = chatId_(src), uid = src.userId, tk = ev.replyToken;
  var db = load_(ss_());
  if (ev.type === "join" && gid) {
    var s = src.groupId ? lineApi_("group/" + gid + "/summary") : null;
    ensureGroup_(db, gid, (s && s.groupName) || "");
    return reply_(tk, "大家好！這個群組現在是一本分帳本。\n每個人先打一句話（例如「查詢」），我才認得你。\n\n" + LG.HELP);
  }
  if (ev.type === "memberJoined" && gid) {
    ensureGroup_(db, gid, "");
    (ev.joined && ev.joined.members || []).forEach(function (m) { if (m.userId) ensureMember_(db, m.userId, gid, profileName_(src, m.userId)); });
    return;
  }
  if (ev.type !== "message" || !ev.message || ev.message.type !== "text" || !uid) return;
  var p = LG.parseMessage(ev.message.text);
  var name = profileName_(src, uid);
  claimName_(db, uid, name);

  if (!gid) {                                   // 私訊機器人
    if (p && (p.cmd === "link" || p.cmd === "relink")) {
      return reply_(tk, (p.cmd === "relink" ? "已換新的連動碼，舊的不能用了。\n\n" : "") +
        "用手機點下面的連結，就會打開記帳 App 並連上你的朋友帳（只看得到你有參加的群組）。\n連結等於鑰匙，不要傳給別人；外流了就私訊我「換連動碼」。\n\n" + linkFor_(db, uid, p.cmd === "relink"));
    }
    var inLegacy = db.members.some(function (m) { return m.g === LEGACY && m.uid === uid; });
    if (!inLegacy) return reply_(tk, p && p.cmd !== "help" ? "記帳要在群組裡打喔：開一個 LINE 群組、把我邀進去就是一本分帳本。\n私訊我可以打「連動碼」。" : LG.HELP);
    gid = LEGACY;                               // 舊的兩人帳還沒搬到群組前，私訊照舊可以記
  } else {
    var g = groupOf_(db, gid);
    if (!g) { var s2 = src.groupId ? lineApi_("group/" + gid + "/summary") : null; g = ensureGroup_(db, gid, (s2 && s2.groupName) || ""); }
    ensureMember_(db, uid, gid, name);
    var legacyMember = db.members.some(function (m) { return m.g === LEGACY && m.uid === uid; });
    if (legacyMember && p && p.cmd === "claim") {
      moveLegacy_(db, gid);
      return reply_(tk, "舊的帳搬到這個群組了。\n" + balanceText_(db, gid));
    }
    if (legacyMember && groupOf_(db, LEGACY) && !db.entries.some(function (e) { return e.g === gid; }) && memberCount_(src) === membersOf_(db, LEGACY).length) {
      moveLegacy_(db, gid);                     // 原本那兩個人的群組：自動把舊帳搬過來
    }
  }
  if (!p) return;
  if (p.cmd === "help") return reply_(tk, LG.HELP);
  if (p.cmd === "link" || p.cmd === "relink") return reply_(tk, "連動碼是你的鑰匙，請私訊我「連動碼」（點我的頭像 → 聊天）。");
  if (p.cmd === "error") return reply_(tk, ERR[p.why] + "\n打「說明」看怎麼記。");
  if (p.cmd === "claim") return reply_(tk, "沒有舊帳可以搬。");
  if (p.cmd === "query") {
    var gname = (groupOf_(db, gid) || {}).name;
    return reply_(tk, "【" + (gname || "這個群組") + "】從以前到現在\n\n" + totalsText_(db, gid));
  }
  if (p.cmd === "rename") {
    var gg = groupOf_(db, gid); gg.name = p.name; db.sh.g.getRange(gg.row, 2).setValue(p.name);
    return reply_(tk, "這本帳的名字改成「" + p.name + "」了。");
  }
  if (p.cmd === "del") {
    var mine = db.entries.filter(function (e) { return e.g === gid && e.by === uid && !e.del; }).sort(function (a, b) { return b.t - a.t; })[0];
    if (!mine) return reply_(tk, "你在這裡還沒有可以刪的帳。");
    mine.del = true; db.sh.e.getRange(mine.row, 11).setValue(1);
    return reply_(tk, "已刪除：" + mine.item + " " + mine.amt + "\n\n" + balanceText_(db, gid));
  }
  var ms = membersOf_(db, gid).map(function (m) { return { uid: m.uid, name: m.name || nameOf_(db, m.uid) }; });
  var r = LG.buildEntry(p, { me: uid, members: ms, gid: gid, now: Date.now(), id: "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) });
  if (r.err) return reply_(tk, r.err);
  addEntry_(db, r.entry);
  reply_(tk, "已記：" + r.entry.item + " " + r.entry.amt + "\n" + LG.describe(r.entry, function (u) { return nameOf_(db, u); }) + "\n\n目前：\n" + balanceText_(db, gid));
}

// ------------------------------------------------------------------ 記帳 App 的 API（POST，body 是 JSON 文字）
function api_(q) {
  var db = load_(ss_());
  var k = db.keys.filter(function (x) { return x.key && x.key === String(q.key || ""); })[0];
  if (!k) return { ok: false, err: "key" };
  var uid = k.uid;
  var myGroups = db.members.filter(function (m) { return m.uid === uid; }).map(function (m) { return m.g; });
  if (q.op === "add") {
    var e = q.e || {}, gid = String(e.g || "");
    if (myGroups.indexOf(gid) < 0) return { ok: false, err: "不在這個群組" };
    var ids = membersOf_(db, gid).map(function (m) { return m.uid; });
    var amt = Number(e.amt), to = Array.isArray(e.to) ? e.to.map(String) : [];
    if (!(amt > 0 && amt <= 10000000 && Math.floor(amt) === amt)) return { ok: false, err: "金額要是正整數" };
    if (ids.indexOf(String(e.payer)) < 0 || !to.length || to.some(function (u) { return ids.indexOf(u) < 0; })) return { ok: false, err: "成員不對" };
    if (e.kind !== "exp" && e.kind !== "pay") return { ok: false, err: "類型不對" };
    var id = String(e.id || "").slice(0, 40) || "A" + Date.now().toString(36);
    if (!db.entries.some(function (x) { return x.id === id; })) {      // 同一筆重送不會記兩次
      addEntry_(db, { id: id, t: Number(e.t) || Date.now(), g: gid, item: String(e.item || (e.kind === "pay" ? "還款" : "")).slice(0, 40) || "未命名",
        amt: amt, payer: String(e.payer), to: to, kind: e.kind, by: uid, src: "App", del: false });
    }
  } else if (q.op === "del") {
    var x = db.entries.filter(function (y) { return y.id === String(q.id); })[0];
    if (x && x.by !== uid) return { ok: false, err: "只能刪自己記的" };
    if (x && !x.del) { x.del = true; db.sh.e.getRange(x.row, 11).setValue(1); }
  } else if (q.op !== "sync") return { ok: false, err: "op" };
  return {
    ok: true, me: uid, at: Date.now(),
    groups: db.groups.filter(function (g) { return myGroups.indexOf(g.id) >= 0; }).map(function (g) { return { id: g.id, name: g.name || (g.id === LEGACY ? "舊的 LINE 記帳" : "LINE 群組") }; }),
    members: db.members.filter(function (m) { return myGroups.indexOf(m.g) >= 0; }).map(function (m) { return { uid: m.uid, g: m.g, name: m.name || nameOf_(db, m.uid) }; }),
    entries: db.entries.filter(function (e) { return myGroups.indexOf(e.g) >= 0; }).map(function (e) {
      return { id: e.id, t: e.t, g: e.g, item: e.item, amt: e.amt, payer: e.payer, to: e.to, kind: e.kind, by: e.by, src: e.src, del: e.del };
    }),
  };
}

// ------------------------------------------------------------------ 在 Apps Script 編輯器裡手動執行的
// 用「試算表的副本」跑一遍搬家和幾個指令，不碰正式資料。看「執行記錄」。
function testWithCopy() {   // 用試算表副本測試
  var copy = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SHEET_ID")).copy("Line _記帳（測試副本，可刪）");
  ["群組", "成員", "連動", "明細v2"].forEach(function (n) { var s = copy.getSheetByName(n); if (s) copy.deleteSheet(s); });
  TEST = { ss: copy, replies: [], names: { U1: "李宸yo", U2: "劉芳慈" }, counts: { G1: 2 } };
  var ev = function (uid, text, gid) { return { type: "message", replyToken: "t", source: gid ? { type: "group", groupId: gid, userId: uid } : { type: "user", userId: uid }, message: { type: "text", text: text } }; };
  handleEvent_(ev("U1", "查詢", "G1"));
  handleEvent_(ev("U2", "午餐 120", "G1"));
  handleEvent_(ev("U1", "還 100", "G1"));
  handleEvent_(ev("U1", "連動碼"));
  TEST.replies.forEach(function (r) { console.log(r + "\n----"); });
  console.log("副本網址：" + copy.getUrl());
  TEST = null;
}
