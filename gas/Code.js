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
    // 網址是公開的：只收 destination＝我們機器人的訊息（LINE 每次都會帶，外人不知道這個 ID），假的直接丟掉
    var bu = botUserId_();                 // 查不到（LINE 暫時連不上）就先不擋，免得機器人整個不回
    if (bu && body.destination !== bu) return ContentService.createTextOutput("ok");
    for (var i = 0; i < body.events.length; i++) {
      try { withLock_(function () { handleEvent_(body.events[i]); }); } catch (err) { console.error(err && err.stack || err); }
    }
    return ContentService.createTextOutput("ok");
  }
  if (body.op === "map") return json_(mapLookup_(body.url));        // 記帳 App 的店家地址：貼 Google 地圖網址查地址（不用連動碼）
  if (body.op === "search") return json_(mapSearch_(body.q, body.lat, body.lng));
  if (body.op === "place") return json_(placeInfo_(body));          // 記帳 App：查店家的電話和營業時間（Google Places）   // 記帳 App：打店名（＋地區）找地址，有手機位置就先找附近的
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
// 連動碼：8 個字（沒有 0/O、1/I/L 這些容易看錯的），顯示成 XXXX-XXXX。比對時不分大小寫、忽略「-」。
// 一個人可以有好幾組（舊的 20 碼長連結照樣能用）；「換連動碼」會把這個人的全部作廢、換一組新的。
var CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function normKey_(k) { return String(k || "").toUpperCase().replace(/[^0-9A-Z]/g, ""); }
function newCode_(db) {
  for (;;) {
    var c = "";
    for (var i = 0; i < 8; i++) c += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
    if (!db.keys.some(function (x) { return normKey_(x.key) === c; })) return c;
  }
}
function linkFor_(db, uid, renew) {
  var mine = db.keys.filter(function (x) { return x.uid === uid; });
  if (renew) mine.forEach(function (x) { db.sh.k.getRange(x.row, 1, 1, 2).setValues([["", ""]]); x.key = ""; });
  var short = renew ? null : mine.filter(function (x) { return /^[0-9A-Z]{8}$/.test(normKey_(x.key)); })[0];
  var key = short ? normKey_(short.key) : newCode_(db);
  if (!short) { db.sh.k.appendRow([uid, key, new Date()]); db.keys.push({ row: db.sh.k.getLastRow(), uid: uid, key: key }); }
  var url = TEST ? "TEST_URL" : ScriptApp.getService().getUrl();
  return { key: key, show: key.slice(0, 4) + "-" + key.slice(4), url: APP_URL + "?openExternalBrowser=1#link=" + encodeURIComponent(url) + "~" + key };
}
// 機器人的 LINE ID（例如 @123abcd），給 App 做「加機器人好友」的按鈕；查一次存在指令碼屬性
function botUserId_() {
  if (TEST) return "Ubot";
  var pr = PropertiesService.getScriptProperties(), v = pr.getProperty("BOT_UID");
  if (v) return v;
  var info = lineApi_("info");
  v = (info && info.userId) || "";
  if (v) pr.setProperty("BOT_UID", v);
  return v;
}
function botId_() {
  if (TEST) return "@testbot";
  var pr = PropertiesService.getScriptProperties(), v = pr.getProperty("BOT_ID");
  if (v) return v;
  var info = lineApi_("info");
  v = (info && info.basicId) || "";
  if (v) pr.setProperty("BOT_ID", v);
  return v;
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
      var L = linkFor_(db, uid, p.cmd === "relink");
      return reply_(tk, (p.cmd === "relink" ? "已換新的連動碼，舊的都不能用了。\n\n" : "") +
        "你的連動碼：" + L.show + "\n\n打開記帳 App →「更多」→ 最下面「輸入連動碼」，打這 8 個字就連上了（只看得到你有參加的群組）。\n連動碼等於鑰匙，不要給別人；外流了就私訊我「換連動碼」。\n\n也可以直接點：\n" + L.url);
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
  var qk = normKey_(q.key);
  var k = qk && db.keys.filter(function (x) { return x.key && normKey_(x.key) === qk; })[0];
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
    ok: true, me: uid, at: Date.now(), bot: botId_(),
    groups: db.groups.filter(function (g) { return myGroups.indexOf(g.id) >= 0; }).map(function (g) { return { id: g.id, name: g.name || (g.id === LEGACY ? "舊的 LINE 記帳" : "LINE 群組") }; }),
    members: db.members.filter(function (m) { return myGroups.indexOf(m.g) >= 0; }).map(function (m) { return { uid: m.uid, g: m.g, name: m.name || nameOf_(db, m.uid) }; }),
    entries: db.entries.filter(function (e) { return myGroups.indexOf(e.g) >= 0; }).map(function (e) {
      return { id: e.id, t: e.t, g: e.g, item: e.item, amt: e.amt, payer: e.payer, to: e.to, kind: e.kind, by: e.by, src: e.src, del: e.del };
    }),
  };
}

// ------------------------------------------------------------------ Google 地圖網址 → 地址
// 短網址（maps.app.goo.gl）一步一步跟著轉址到長網址，從長網址找座標或名稱，再用 Google 的地圖服務換成地址
function mapLookup_(url) {
  url = String(url || "").trim().slice(0, 2000);
  if (!LG.isMapHost(url)) return { ok: false, err: "這不是 Google 地圖的網址" };
  var u = url;
  for (var i = 0; i < 6; i++) {
    var p = LG.parseMapUrl(u);
    if (p.lat !== null || p.name || p.query) break;            // 已經是長網址了
    var r = UrlFetchApp.fetch(u, { followRedirects: false, muteHttpExceptions: true });
    var h = r.getHeaders(), loc = h.Location || h.location;
    if (!loc) break;
    if (!LG.isMapHost(loc)) break;
    u = loc;
  }
  var info = LG.parseMapUrl(u), addr = "", lat = info.lat, lng = info.lng;
  var geo = Maps.newGeocoder().setLanguage("zh-TW").setRegion("tw");
  try {
    if (lat !== null) {
      var rv = geo.reverseGeocode(lat, lng);
      if (rv && rv.results && rv.results.length) addr = rv.results[0].formatted_address || "";
    }
    if (!addr && (info.query || info.name)) {
      var g = geo.geocode(info.query || info.name);
      if (g && g.results && g.results.length) {
        addr = g.results[0].formatted_address || "";
        if (lat === null && g.results[0].geometry) { lat = g.results[0].geometry.location.lat; lng = g.results[0].geometry.location.lng; }
      }
    }
  } catch (err) { console.error(err && err.stack || err); }
  if (!addr && !info.name) return { ok: false, err: "查不到" };
  return { ok: true, name: info.name && info.name !== addr ? info.name : "", addr: addr, lat: lat, lng: lng };
}

// ------------------------------------------------------------------ Google Places（店名找店、電話、營業時間）
// 金鑰放在指令碼屬性 PLACES_KEY；沒設就用下面的免費地址查詢。每天有上限，不會超過 Google 每月的免費額度：
//   找店（Text Search Pro，每月免費 5000 次）每天最多 150 次；查電話和營業時間（Place Details Enterprise，每月免費 1000 次）每天最多 30 次。
var PLACES_MAX = { search: 150, detail: 30 };
var QUOTA_MSG = { search: "今天找店的次數用完了，明天再找；也可以貼 Google 地圖網址。", detail: "今天查電話和營業時間的次數用完了，明天再查；也可以自己填。" };
function placesKey_() { return TEST ? (TEST.placesKey || "") : (PropertiesService.getScriptProperties().getProperty("PLACES_KEY") || ""); }
// 台灣時間的今天；屬性只存一個「日期:次數」，換天自動歸零
function quota_(kind) {
  var day = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
  var get = TEST ? function (k) { return (TEST.props || {})[k]; } : function (k) { return PropertiesService.getScriptProperties().getProperty(k); };
  var set = TEST ? function (k, v) { (TEST.props = TEST.props || {})[k] = v; } : function (k, v) { PropertiesService.getScriptProperties().setProperty(k, v); };
  var cur = String(get("Q_" + kind) || "").split(":"), n = cur[0] === day ? Number(cur[1]) || 0 : 0;
  if (n >= PLACES_MAX[kind]) return false;
  set("Q_" + kind, day + ":" + (n + 1));
  return true;
}
function places_(path, body, mask) {
  var opt = { method: body ? "post" : "get", headers: { "X-Goog-Api-Key": placesKey_(), "X-Goog-FieldMask": mask }, muteHttpExceptions: true };
  if (body) { opt.contentType = "application/json"; opt.payload = JSON.stringify(body); }
  var r = UrlFetchApp.fetch("https://places.googleapis.com/v1/" + path, opt);
  if (r.getResponseCode() >= 300) { console.warn("Places " + r.getResponseCode() + " " + r.getContentText()); return null; }
  try { return JSON.parse(r.getContentText() || "{}"); } catch (e) { return null; }
}
// 找店：只拿 id、店名、地址、座標（Pro 等級）；有位置就偏向附近、照距離排
function placesSearch_(q, lat, lng, n) {
  if (!quota_("search")) return { err: "quota" };
  var body = { textQuery: q, languageCode: "zh-TW", regionCode: "TW", maxResultCount: n };
  if (lat != null) body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 20000 } };
  var j = places_("places:searchText", body, "places.id,places.displayName,places.formattedAddress,places.location");
  if (!j) return { err: "api" };
  var out = (j.places || []).map(function (p) {
    return { id: p.id, name: (p.displayName && p.displayName.text) || "", addr: p.formattedAddress || "", lat: p.location ? p.location.latitude : null, lng: p.location ? p.location.longitude : null };
  });
  if (lat != null) {
    out.forEach(function (x) { if (x.lat != null) x.km = Math.round(LG.distKm(lat, lng, x.lat, x.lng) * 10) / 10; });
    out.sort(function (a, b) { return (a.km == null ? 1e9 : a.km) - (b.km == null ? 1e9 : b.km); });
  }
  return { results: out };
}
// 電話和營業時間：有 id 就直接查；沒有就先用店名（＋地址或位置）找出最像的一家。同一家 6 小時內不重查。
function placeInfo_(b) {
  if (!placesKey_()) return { ok: false, err: "還沒設定 Google 地點服務，請先自己填" };
  var id = String(b.id || "").replace(/[^\w-]/g, "").slice(0, 300);
  if (!id) {
    var q = String(b.q || "").replace(/\s+/g, " ").trim().slice(0, 120);
    if (!q) return { ok: false, err: "沒有店名" };
    var lat = Number(b.lat), lng = Number(b.lng), has = b.lat != null && b.lng != null && isFinite(lat) && isFinite(lng);
    var s = placesSearch_(q, has ? lat : null, has ? lng : null, 1);
    if (s.err) return { ok: false, err: s.err === "quota" ? QUOTA_MSG.search : "查不到（Google 沒回應）" };
    if (!s.results.length) return { ok: false, err: "Google 上找不到這家店" };
    id = s.results[0].id;
  }
  var cache = TEST ? null : CacheService.getScriptCache(), hit = cache && cache.get("pl:" + id);
  if (hit) return JSON.parse(hit);
  if (!quota_("detail")) return { ok: false, err: QUOTA_MSG.detail };
  var p = places_("places/" + encodeURIComponent(id) + "?languageCode=zh-TW&regionCode=TW", null, "id,displayName,formattedAddress,nationalPhoneNumber,regularOpeningHours");
  if (!p) return { ok: false, err: "查不到（Google 沒回應）" };
  var out = { ok: true, id: p.id || id, name: (p.displayName && p.displayName.text) || "", addr: p.formattedAddress || "", phone: p.nationalPhoneNumber || "",
    hours: (p.regularOpeningHours && p.regularOpeningHours.weekdayDescriptions) || [] };
  if (cache) cache.put("pl:" + id, JSON.stringify(out), 21600);
  return out;
}

// 打店名找地址：Google 的地圖服務查，最多回 5 個（同一個地址只留一個）
// 有手機位置（lat、lng）：先在附近（約 15 公里內）找，再找全台；結果照距離排、附上距離
function mapSearch_(q, lat, lng) {
  q = String(q || "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (!q) return { ok: false, err: "沒有打店名" };
  lat = Number(lat); lng = Number(lng);
  var near = isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat || lng);
  if (placesKey_()) {                      // 有 Places：找得到連鎖店、附近的店，結果帶店名和 id（之後查電話用）
    var ps = placesSearch_(q, near ? lat : null, near ? lng : null, 5);
    if (ps.err === "quota") return { ok: false, err: QUOTA_MSG.search };
    if (ps.results && ps.results.length) return { ok: true, results: ps.results };
  }
  var out = [];
  var add = function (g) {
    (g && g.results || []).forEach(function (x) {
      var a = x.formatted_address || "", loc = x.geometry && x.geometry.location;
      if ((x.types || []).indexOf("political") >= 0 || !LG.isPlaceAddr(a)) return;   // 只是「嘉義縣」「中山區」這種地區（Google 找不到店時的退路），不要
      if (a && !out.some(function (y) { return y.addr === a; })) out.push({ addr: a, lat: loc ? loc.lat : null, lng: loc ? loc.lng : null });
    });
  };
  var geo = function () { return Maps.newGeocoder().setLanguage("zh-TW").setRegion("tw"); };
  var nearGeo = function (s) { add(geo().setBounds(lat - 0.15, lng - 0.15, lat + 0.15, lng + 0.15).geocode(s)); };
  try {
    if (near) {
      // Google 的地址查詢光打「麥當勞」常常找不到；先查出手機在哪個鄉鎮區，自動接在店名後面
      var area = null, rev = geo().reverseGeocode(lat, lng);
      (rev && rev.results || []).some(function (x) { area = LG.areaOf(x.formatted_address); return !!area; });
      var has = function (w) { return q.indexOf(w.replace(/[縣市鄉鎮區]$/, "")) >= 0; };
      if (area && !has(area.town)) nearGeo(q + " " + area.town);
      if (area && !has(area.city) && out.length < 2) nearGeo(q + " " + area.city);
      nearGeo(q);
    }
    add(geo().geocode(q));
  } catch (err) { console.error(err && err.stack || err); }
  if (near) {
    out.forEach(function (x) { if (x.lat != null) x.km = Math.round(LG.distKm(lat, lng, x.lat, x.lng) * 10) / 10; });
    out.sort(function (a, b) { return (a.km == null ? 1e9 : a.km) - (b.km == null ? 1e9 : b.km); });
  }
  out = out.slice(0, 5);
  return out.length ? { ok: true, results: out } : { ok: false, err: "找不到，試試看加上地區（例如：民雄、中山區）" };
}

// ------------------------------------------------------------------ 在 Apps Script 編輯器裡手動執行的
// 部署新版之前先跑一次：第一次會要你同意「地圖」權限；看「執行記錄」有沒有印出地址
function testMapLookup() {
  console.log(JSON.stringify(mapLookup_("https://www.google.com/maps/place/%E5%8F%B0%E5%8C%97101/@25.0339639,121.5644722,17z")));
}

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
