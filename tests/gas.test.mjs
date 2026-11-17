// 測 gas/logic.js（朋友分帳的純邏輯）：node tests/gas.test.mjs
// logic.js 是給 Apps Script 用的一般腳本（不是 module），用 vm 跑起來拿 LG
import { readFileSync } from "fs";
import vm from "vm";
const box = {}; vm.createContext(box);
vm.runInContext(readFileSync(new URL("../gas/logic.js", import.meta.url), "utf8") + ";this.LG = LG;", box);
const LG = box.LG;
let n = 0, bad = 0;
const eq = (a, b, msg) => { n++; const A = JSON.stringify(a), B = JSON.stringify(b); if (A !== B) { bad++; console.log("✗", msg, "\n  得到", A, "\n  應為", B); } };

// ---- parseMessage
const P = LG.parseMessage;
eq(P("午餐 120"), { cmd: "add", item: "午餐", amt: 120, who: null, split: false }, "基本");
eq(P("午餐　１２０"), { cmd: "add", item: "午餐", amt: 120, who: null, split: false }, "全形");
eq(P("午餐 120元"), { cmd: "add", item: "午餐", amt: 120, who: null, split: false }, "元");
eq(P("午餐 1,200"), { cmd: "add", item: "午餐", amt: 1200, who: null, split: false }, "千分位");
eq(P("315 昨天早餐+今天午餐"), { cmd: "add", item: "昨天早餐+今天午餐", amt: 315, who: null, split: false }, "金額在前");
eq(P("午餐 120 芳慈"), { cmd: "add", item: "午餐", amt: 120, who: "芳慈", split: false }, "指定名字");
eq(P("晚餐 900 平分"), { cmd: "add", item: "晚餐", amt: 900, who: null, split: true }, "平分");
eq(P("晚餐 900 平分 小明"), { cmd: "add", item: "晚餐", amt: 900, who: "小明", split: true }, "平分+付款人");
eq(P("還 500 芳慈"), { cmd: "repay", amt: 500, who: "芳慈" }, "還款");
eq(P("還500"), { cmd: "repay", amt: 500, who: null }, "還款黏在一起");
eq(P("還款 300"), { cmd: "repay", amt: 300, who: null }, "還款2");
eq(P("查詢"), { cmd: "query" }, "查詢");
eq(P("總額"), { cmd: "query" }, "總額");
eq(P("刪除"), { cmd: "del" }, "刪除");
eq(P("連動碼"), { cmd: "link" }, "連動碼");
eq(P("換連動碼"), { cmd: "relink" }, "換連動碼");
eq(P("群組名 宿舍飯錢"), { cmd: "rename", name: "宿舍飯錢" }, "群組名");
eq(P("哈哈好啊"), null, "聊天不理");
eq(P("午餐 0"), { cmd: "error", why: "amt" }, "0 元");
eq(P("午餐 12.5"), null, "小數不是金額→不理");
eq(P("午餐 120 130"), { cmd: "error", why: "two" }, "兩個金額");
eq(P("120"), { cmd: "error", why: "noitem" }, "只有金額");

// ---- matchName
const M = [{ uid: "a", name: "李宸yo" }, { uid: "b", name: "劉芳慈" }, { uid: "c", name: "劉小明" }];
eq(LG.matchName("芳慈", M)?.uid, "b", "包含");
eq(LG.matchName("劉芳慈", M)?.uid, "b", "完整");
eq(LG.matchName("李", M)?.uid, "a", "開頭");
eq(!!LG.matchName("劉", M)?.many, true, "兩個符合");
eq(LG.matchName("王", M), null, "沒有");
eq(LG.matchName("YO", M)?.uid, "a", "大小寫");

// ---- splitShares / balances
eq(LG.splitShares(100, ["a", "b", "c"], "a"), { a: 34, b: 33, c: 33 }, "零頭給付款人");
eq(LG.splitShares(100, ["b", "c", "d"], "a"), { b: 34, c: 33, d: 33 }, "付款人不在名單→給第一個");
const E = (payer, to, amt, kind = "exp", del = false) => ({ payer, to, amt, kind, del });
eq(LG.balances([E("b", ["a"], 120), E("a", ["b"], 50)]), [{ from: "a", to: "b", amt: 70 }], "兩兩相抵");
eq(LG.balances([E("a", ["a", "b", "c"], 90)]), [{ from: "b", to: "a", amt: 30 }, { from: "c", to: "a", amt: 30 }], "平分");
eq(LG.balances([E("b", ["a"], 120), E("a", ["b"], 120, "pay")]), [], "還清");
eq(LG.balances([E("b", ["a"], 120, "exp", true)]), [], "刪除的不算");
eq(LG.myShare({ ...E("a", ["a", "b", "c"], 100), kind: "exp" }, "a"), 34, "我的份（含零頭）");
eq(LG.myShare(E("b", ["a"], 120), "a"), 120, "別人幫我付");
eq(LG.myShare(E("a", ["b"], 120), "a"), 0, "我幫別人付不是我的支出");
eq(LG.myShare(E("a", ["b"], 120, "pay"), "a"), 0, "還款不是支出");

// ---- buildEntry
const ctx2 = { me: "a", members: M.slice(0, 2), gid: "g", now: 1, id: "x" };
eq(LG.buildEntry(P("午餐 120"), ctx2).entry, { id: "x", t: 1, g: "g", amt: 120, by: "a", src: "LINE", del: false, item: "午餐", payer: "b", to: ["a"], kind: "exp" }, "兩人預設：我欠對方");
eq(LG.buildEntry(P("還 500"), ctx2).entry.kind, "pay", "兩人還款");
eq(LG.buildEntry(P("還 500"), ctx2).entry.to, ["b"], "還給對方");
const ctx3 = { ...ctx2, members: M };
eq(!!LG.buildEntry(P("午餐 120"), ctx3).err, true, "三人要寫名字");
eq(LG.buildEntry(P("午餐 120 小明"), ctx3).entry.payer, "c", "三人指定");
eq(LG.buildEntry(P("晚餐 900 平分"), ctx3).entry.to, ["a", "b", "c"], "三人平分");
eq(LG.buildEntry(P("晚餐 900 平分 芳慈"), ctx3).entry.payer, "b", "芳慈付平分");
eq(!!LG.buildEntry(P("午餐 120"), { ...ctx2, members: [M[0]] }).err, true, "對方還沒說話");
eq(!!LG.buildEntry(P("午餐 120 李宸"), ctx2).err, true, "不能欠自己");

// ---- 舊資料搬家（試算表「記帳明細」2026-11-18 的內容）
const L = "李宸yo", F = "劉芳慈";
const raw = [["早餐",345,F],["早餐晚餐",145,F],["給芳慈",820,L],["早餐",60,F],["口紅",1500,L],["手機保護殼",138,L],["西瓜鮮奶",50,L],["遊戲和早餐",620,F],["西瓜鮮奶",50,L],
["車票錢+餐費","",F],["車票錢和餐費","",F],["車票錢和餐費",615,F],["晚餐",300,F],["夾娃娃",50,F],["早餐",145,F],["娃娃錢",255,L],["晚餐",145,F],["晚餐",280,F],["午餐",120,F],["晚餐",165,F],
["午餐（便當）",120,L],["午餐",120,L],["晚餐",265,F],["午餐",120,F],["小籠包",140,F],["315","昨天早餐+今天午餐",L],["昨天早餐+今天午餐",315,L],["飲料",50,L],["昨天（午餐+晚餐）",245,L],
["晚餐",180,F],["晚餐",160,L],["中餐+晚餐",255,L],["藥膏",200,L],["晚餐",100,F],["中餐",150,L],["晚餐滷味",125,F],["中餐",220,L],["晚餐炒飯",85,F],["早餐",95,L],["晚餐",290,F],
["早餐",145,F],["晚餐",120,F],["早餐",95,L],["顏料午餐",420,F],["晚餐",180,F],["早餐",100,F],["昨晚餐+今早餐",425,L],["借錢",1000,L],["便當+飲料",175,F],["晚餐",135,F],["麥味登",145,F],["晚餐",125,F],["晚餐",195,L]]
  .map((r, i) => [new Date(2026, 7, 26 + i), r[0], r[1], r[2]]);
const mg = LG.migrateLegacy(raw, "legacy");
eq(raw.length, 53, "53 列");
eq(mg.skipped, [11, 12, 27], "跳過：兩筆沒金額、一筆放反");
eq(mg.entries.length, 50, "搬 50 筆");
const sum = (who) => mg.entries.filter((e) => e.by === "old:" + who).reduce((a, e) => a + e.amt, 0);
eq([sum(L), sum(F)], [6458, 5840], "和「花費統計」一樣");
eq(LG.balances(mg.entries), [{ from: "old:" + L, to: "old:" + F, amt: 618 }], "淨額：李宸yo 欠 劉芳慈 618");
eq(LG.migrateLegacy([[new Date(), "a", 1, "x"]], "g").entries, [], "不是兩個人不搬");

eq(LG.pairTotals(mg.entries).map((p) => [p.ab, p.ba, p.net.amt]), [[5840, 6458, 618]], "舊帳總帳：芳慈欠 5840／李宸yo欠 6458／相抵 618");

// ---- describe
const nm = (u) => ({ a: "李宸yo", b: "劉芳慈", c: "劉小明" }[u]);
eq(LG.describe(E("b", ["a"], 120), nm), "李宸yo 欠 劉芳慈 120", "說明1");
eq(LG.describe(E("a", ["a", "b", "c"], 100), nm), "李宸yo 付 100，3 人平分（每人 33，零頭算 李宸yo）", "說明2");
eq(LG.describe(E("a", ["b"], 500, "pay"), nm), "李宸yo 還 劉芳慈 500", "說明3");

console.log(bad ? `✗ ${bad}／${n} 項失敗` : `✓ ${n} 項全部通過`);
process.exit(bad ? 1 : 0);
