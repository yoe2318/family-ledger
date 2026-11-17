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

  return { parseMessage: parseMessage, matchName: matchName, splitShares: splitShares, balances: balances, myShare: myShare,
    migrateLegacy: migrateLegacy, buildEntry: buildEntry, describe: describe, amountOf: amountOf, HELP: HELP };
})();
if (typeof module !== "undefined") module.exports = LG;
