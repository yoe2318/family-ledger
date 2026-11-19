// node tests/core.test.mjs
import * as C from "../core.js";

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  if (!ok) console.log(`✗ ${name}\n   得到 ${JSON.stringify(got)}\n   應該 ${JSON.stringify(want)}`);
};
const it = (o) => ({ id: C.newId(), type: "out", amt: 100, cat: "餐飲", sub: "", pay: "現金", date: "2026-11-10", note: "", t: 1, ...o });

// 金額
eq("算式", C.evalAmount("120+35-5"), 150);
eq("千分位、全形加號", C.evalAmount("1,200＋300"), 1500);
eq("小數不收", C.evalAmount("12.5"), null);
eq("0 不收", C.evalAmount("5-5"), null);
eq("空的", C.evalAmount(""), null);
eq("亂打", C.evalAmount("12++3"), null);
eq("money", [C.money(1234567), C.money(-50), C.money(0)], ["1,234,567", "−50", "0"]);

// 期間（起算日）
eq("起算 1 號", C.periodOf("2026-11-30", 1), "2026-11");
eq("起算 5 號：4 號屬於上一期", C.periodOf("2026-11-04", 5), "2026-10");
eq("起算 5 號：5 號屬於這一期", C.periodOf("2026-11-05", 5), "2026-11");
eq("跨年", C.periodOf("2027-01-03", 5), "2026-12");
eq("期間範圍", C.periodRange("2026-12", 5), ["2026-12-05", "2027-01-04"]);
eq("期間範圍 1 號", C.periodRange("2026-02", 1), ["2026-02-01", "2026-02-28"]);
eq("標籤", [C.periodLabel("2026-11", 1), C.periodLabel("2026-11", 5)], ["2026 年 11 月", "11/5 – 12/4"]);
eq("日標籤", C.dayLabel("2026-11-18", "2026-11-18"), "今天・11月18日（三）");
eq("昨天", C.dayLabel("2026-11-17", "2026-11-18"), "昨天・11月17日（二）");

// 加總、統計
const items = [it({ amt: 120, sub: "早餐" }), it({ amt: 80, sub: "午餐", pay: "信用卡" }), it({ amt: 300, cat: "交通" }),
  it({ type: "in", amt: 50000, cat: "薪水", date: "2026-11-05" }), it({ amt: 999, date: "2026-10-20" })];
const nov = C.periodItems(items, "2026-11", 1);
eq("期間篩選", nov.length, 4);
eq("加總", C.totals(nov), { out: 500, in: 50000, net: 49500 });
eq("分類", C.byCategory(nov, "out").map((x) => [x.name, x.amt]), [["交通", 300], ["餐飲", 200]]);
eq("二級分類", C.bySub(nov, "out", "餐飲").map((x) => [x.name, x.amt]), [["早餐", 120], ["午餐", 80]]);
eq("付款方式", C.byPay(nov).map((x) => [x.name, x.amt]), [["現金", 420], ["信用卡", 80]]);
eq("依日期分組", C.byDay(nov).map((d) => [d.date, d.out, d.in]), [["2026-11-10", 500, 0], ["2026-11-05", 0, 50000]]);
eq("近 3 期", C.lastPeriods(items, "2026-11", 1, 3).map((x) => [x.key, x.out]), [["2026-09", 0], ["2026-10", 999], ["2026-11", 500]]);
eq("月曆", C.dayTotals(items, "2026-11")["2026-11-10"], { out: 500, in: 0 });

// 預算
let d = { ...C.emptyData(), items, budget: { total: 3000, cats: { 餐飲: 150 } } };
let b = C.budgetStatus(d, "2026-11", "2026-11-21");
eq("預算剩餘", [b.spent, b.left, b.over, b.daysLeft, b.perDay], [500, 2500, false, 10, 250]);
eq("分類預算超過", b.cats.map((c) => [c.cat, c.spent, c.over]), [["餐飲", 200, true]]);
eq("不在這期：沒有每日可花", C.budgetStatus(d, "2026-10", "2026-11-21").perDay, null);
eq("沒設預算", C.budgetStatus({ ...d, budget: { total: 0, cats: {} } }, "2026-11", "2026-11-21").perDay, null);

// 固定收支
d = { ...C.emptyData(), recurring: [{ id: "r1", type: "out", amt: 15000, cat: "居家", sub: "房租", pay: "", note: "", day: 5, from: "2026-09", last: "" }] };
let r = C.applyRecurring(d, "2026-11-04");
eq("補記 9、10 月（11/5 還沒到）", r.added.map((x) => x.date), ["2026-09-05", "2026-10-05"]);
eq("last 更新", r.data.recurring[0].last, "2026-10");
let r2 = C.applyRecurring(r.data, "2026-11-04");
eq("再跑一次不重複", r2.added.length, 0);
let r3 = C.applyRecurring(r2.data, "2026-11-05");
eq("到期再補一筆", [r3.added.length, r3.data.items.length], [1, 3]);
eq("停用的不補", C.applyRecurring({ ...d, recurring: [{ ...d.recurring[0], off: true }] }, "2026-11-30").added.length, 0);

// 借貸、存錢
const debts = [{ id: "a", dir: "lend", who: "小明", amt: 500, pays: [{ amt: 200, date: "2026-11-01" }], done: false },
  { id: "b", dir: "borrow", who: "媽媽", amt: 1000, pays: [], done: false }, { id: "c", dir: "lend", who: "x", amt: 9, pays: [], done: true }];
eq("借貸剩多少", C.debtLeft(debts[0]), 300);
eq("借貸總結", C.debtSummary(debts), { owedToMe: 300, iOwe: 1000 });
const g = { target: 20000, deps: [{ amt: 5000 }, { amt: 3000 }] };
eq("存錢進度", [C.goalSaved(g), C.goalProgress(g)], [8000, 0.4]);

// 搜尋、捷徑
eq("搜尋備註", C.searchItems([it({ note: "全聯 買菜" }), it({ note: "便利商店" })], "全聯").length, 1);
eq("搜尋金額", C.searchItems(items, "300").map((x) => x.cat), ["交通"]);
eq("搜尋兩個字都要有", C.searchItems(items, "餐飲 信用卡").length, 1);
eq("搜尋空的", C.searchItems(items, "  ").length, 0);
const sc = { id: "s", label: "", type: "out", cat: "餐飲", sub: "早餐", pay: "現金", amt: 60 };
eq("捷徑名稱", C.shortcutLabel(sc), "早餐");
const fromSc = C.itemFromShortcut(sc, 60, "2026-11-18");
eq("捷徑記一筆", [fromSc.cat, fromSc.sub, fromSc.amt, fromSc.date], ["餐飲", "早餐", 60, "2026-11-18"]);

// 扇形選單
eq("中間＝取消", C.wheelHit(0, -10, 3, 8), { ring: "cancel" });
eq("正上方內圈", C.wheelHit(0, -80, 3, 8), { ring: "pay", idx: 1 });
eq("左上內圈", C.wheelHit(-70, -20, 3, 8), { ring: "pay", idx: 0 });
eq("右邊外圈最後一格", C.wheelHit(170, -5, 3, 8), { ring: "cat", idx: 7 });
eq("左邊外圈第一格", C.wheelHit(-170, -5, 3, 8), { ring: "cat", idx: 0 });
eq("外圈剛好超出一點還算", C.wheelHit(0, -220, 3, 8), { ring: "cat", idx: 4 });
eq("太遠＝不在選單上", C.wheelHit(0, -300, 3, 8), null);
eq("按鈕下面＝不在選單上", C.wheelHit(0, 80, 3, 8), null);
eq("扇形角度", C.wheelSeg(0, 4), [180, 135]);

// 分類修改
d = { ...C.emptyData(), items: [it({ cat: "娛樂", sub: "電影" })], shortcuts: [{ ...sc, cat: "娛樂" }], budget: { total: 0, cats: { 娛樂: 500 } } };
let d2 = C.renameCategory(d, "out", "娛樂", "休閒");
eq("改名：紀錄、捷徑、預算、扇形跟著改", [d2.items[0].cat, d2.shortcuts[0].cat, d2.budget.cats["休閒"], d2.wheel.cats.includes("休閒")], ["休閒", "休閒", 500, true]);
d2 = C.renameCategory(d, "out", "娛樂", "餐飲");
eq("改成已有的名字＝合併", [d2.cats.out.filter((c) => c.name === "餐飲").length, d2.cats.out.some((c) => c.name === "娛樂"), d2.cats.out.find((c) => c.name === "餐飲").subs.includes("電影")], [1, false, true]);
d2 = C.removeCategory(d, "out", "娛樂");
eq("刪分類：紀錄改其他、二級清掉", [d2.items[0].cat, d2.items[0].sub, d2.wheel.cats.includes("娛樂"), "娛樂" in d2.budget.cats], ["其他", "", false, false]);
eq("其他不能刪", C.removeCategory(d, "out", "其他"), d);
d2 = C.addCategory(d, "out", "寵物", "paw");
eq("新增放在其他前面", d2.cats.out.slice(-2).map((c) => c.name), ["寵物", "其他"]);
d2 = C.setSubs(d, "out", "娛樂", ["旅遊", "旅遊", " "]);
eq("二級分類去重、拿掉的清空", [d2.cats.out.find((c) => c.name === "娛樂").subs, d2.items[0].sub], [["旅遊"], ""]);
d2 = C.moveCategory(d, "out", "交通", -1);
eq("排序", d2.cats.out.slice(0, 2).map((c) => c.name), ["交通", "餐飲"]);
d2 = C.renamePay({ ...d, items: [it({ pay: "信用卡" })] }, "信用卡", "國泰卡");
eq("付款方式改名", [d2.items[0].pay, d2.pays.includes("國泰卡"), d2.wheel.pays.includes("國泰卡")], ["國泰卡", true, true]);

// 備份
eq("不是備份檔", C.cleanData({ hello: 1 }), null);
const dirty = { items: [it({ amt: "120" }), { type: "out", amt: -5, date: "2026-11-01" }, { type: "x" }, it({ cat: "神秘", date: "bad" }), it({ cat: "寵物" })],
  cats: { out: ["餐飲", "交通"] }, prefs: { theme: "nope", monthStart: 40 } };
const clean = C.cleanData(dirty);
eq("壞紀錄丟掉、字串金額轉數字", clean.items.map((x) => x.amt), [120, 100]);
eq("舊格式分類＋紀錄用到的補回來", clean.cats.out.map((c) => c.name), ["餐飲", "交通", "寵物"]);
eq("偏好修好", [clean.prefs.theme, clean.prefs.monthStart], ["terracotta", 28]);
const a = { ...C.emptyData(), items: [it({ id: "1", amt: 1 }), it({ id: "2", amt: 2 })] };
const bk = { ...C.emptyData(), items: [it({ id: "2", amt: 22 }), it({ id: "3", amt: 3 })] };
eq("合併：同 id 以備份為準", C.mergeData(a, bk).items.map((x) => [x.id, x.amt]).sort(), [["1", 1], ["2", 22], ["3", 3]]);
const csv = C.toCSV([it({ note: '說 "好", 吧', sub: "早餐" })]);
eq("CSV", csv.split("\r\n")[1], '2026-11-10,支出,餐飲,早餐,現金,100,"說 ""好"", 吧"');
eq("CSV 有 BOM", csv.charCodeAt(0), 0xfeff);
eq("備份提醒", [C.needBackup({ items: Array(10).fill(0), lastBackup: 0 }), C.needBackup({ items: Array(10).fill(0), lastBackup: Date.now() }), C.needBackup({ items: [], lastBackup: 0 })], [true, false, false]);

// 主題配色：對比都要 ≥ 4.5
for (const [id, p] of Object.entries(C.PALETTES)) for (const mode of ["light", "dark"]) {
  const c = p[mode], s = C.SURFACE[mode];
  for (const [what, x, y] of [["主色上的字", c["on-accent"], c.accent], ["主色文字／紙", c["accent-ink"], s], ["主色文字／淺底", c["accent-ink"], c["accent-soft"]]]) {
    const r = C.contrast(x, y);
    eq(`${p.name} ${mode} ${what} ${r.toFixed(2)} ≥ 4.5`, r >= 4.5, true);
  }
}

// 背景：次要文字、每組主題的主色文字在每種背景上都看得清楚
for (const [id, b] of Object.entries(C.BACKGROUNDS)) for (const mode of ["light", "dark"]) {
  const r = C.contrast(C.mutedOn(id, mode), b[mode]);
  eq(`背景 ${b.name} ${mode} 次要文字 ${r.toFixed(2)} ≥ 4.5`, r >= 4.5, true);
  for (const p of Object.values(C.PALETTES)) { const r2 = C.contrast(p[mode]["accent-ink"], b[mode]); eq(`背景 ${b.name} ${mode} ${p.name}主色文字 ${r2.toFixed(2)} ≥ 4.5`, r2 >= 4.5, true); }
}
eq("鍵盤大小範圍", [C.clampKeyH(10), C.clampKeyH(60), C.clampKeyH(200), C.clampKeyH("x")], [36, 60, 76, 52]);
const cp = C.cleanData({ items: [], prefs: { bg: "sky", pattern: "dots", keyH: 64 } }).prefs;
eq("偏好：背景、款式、鍵盤大小", [cp.bg, cp.pattern, cp.keyH], ["sky", "dots", 64]);
eq("偏好：亂填的改回預設", ((p) => [p.bg, p.pattern, p.keyH])(C.cleanData({ items: [], prefs: { bg: "neon", pattern: "zebra", keyH: -3 } }).prefs), ["paper", "grid", 52]);

// ---- 朋友分帳
const U = encodeURIComponent("https://script.google.com/macros/s/AKfycb-x_1/exec");
eq("連動連結", C.parseLink("#link=" + U + "~abc123def456"), { url: "https://script.google.com/macros/s/AKfycb-x_1/exec", key: "abc123def456" });
eq("連動連結：別的網站不收", C.parseLink("#link=" + encodeURIComponent("https://evil.com/x") + "~abc123def456"), null);
eq("連動連結：沒有", C.parseLink("#home"), null);
const FE = (id, payer, to, amt, kind = "exp", del = false, t = new Date(2026, 10, 3).getTime()) => ({ id, t, g: "G", item: "午餐", amt, payer, to, kind, by: "a", src: "LINE", del });
eq("平分零頭給付款人", C.splitShares(100, ["a", "b", "c"], "a"), { a: 34, b: 33, c: 33 });
eq("淨額相抵", C.friendBalances([FE(1, "b", ["a"], 120), FE(2, "a", ["b"], 50)]), [{ from: "a", to: "b", amt: 70 }]);
eq("還清", C.friendBalances([FE(1, "b", ["a"], 120), FE(2, "a", ["b"], 120, "pay")]), []);
eq("我的份", [C.friendShare(FE(1, "b", ["a"], 120), "a"), C.friendShare(FE(1, "a", ["b"], 120), "a"), C.friendShare(FE(1, "a", ["b"], 120, "pay"), "a"), C.friendShare(FE(1, "a", ["a", "b", "c"], 100), "a")], [120, 0, 0, 34]);
const cats0 = C.emptyData().cats;
eq("猜分類", ["早餐", "昨天（午餐+晚餐）", "西瓜鮮奶", "小籠包", "車票錢和餐費", "藥膏", "口紅", "借錢"].map((x) => { const g = C.guessCat(x, cats0); return g.cat + (g.sub ? "/" + g.sub : ""); }),
  ["餐飲/早餐", "餐飲/午餐", "餐飲/飲料", "餐飲", "交通", "醫療", "購物", "其他"]);
const sync1 = { me: "a", entries: [FE("e1", "b", ["a"], 120), FE("e2", "a", ["b"], 80), FE("e3", "a", ["a", "b"], 300), FE("e4", "b", ["a"], 50, "exp", true)] };
let fr = C.friendItems([{ id: "x", type: "out", amt: 5, cat: "餐飲", sub: "", pay: "", date: "2026-11-01", note: "", t: 0 }], sync1, cats0);
eq("朋友帳變支出：我的份才算", fr.items.filter((x) => x.id.startsWith("fr-")).map((x) => [x.id, x.amt, x.cat, x.sub, x.date]), [["fr-e1", 120, "餐飲", "午餐", "2026-11-03"], ["fr-e3", 150, "餐飲", "午餐", "2026-11-03"]]);
eq("原本的紀錄留著", fr.items[0].id, "x");
const edited = fr.items.map((x) => (x.id === "fr-e1" ? { ...x, cat: "娛樂" } : x));
const fr2 = C.friendItems(edited, { me: "a", entries: [FE("e1", "b", ["a"], 130), FE("e3", "a", ["a", "b"], 300, "exp", true)] }, cats0);
eq("再同步：不重複、改金額、保留我改的分類、刪掉的拿掉", fr2.items.filter((x) => x.id.startsWith("fr-")).map((x) => [x.id, x.amt, x.cat]), [["fr-e1", 130, "娛樂"]]);
eq("再同步：計數", [fr2.added, fr2.removed], [0, 1]);
const cf = C.cleanData({ items: [], prefs: { friend: { url: "https://script.google.com/macros/s/AKfycb-x_1/exec", key: "abc123def456" } }, friends: { me: "a", at: 5, groups: [{ id: "G", name: "我們" }], members: [{ uid: "a", g: "G", name: "我" }], entries: [FE("e1", "b", ["a"], 120), { amt: -1 }] }, friendQ: [{ op: "add", e: {} }, { op: "hack" }] });
eq("備份保留連動設定", cf.prefs.friend, { url: "https://script.google.com/macros/s/AKfycb-x_1/exec", key: "abc123def456", auto: true });
eq("備份保留朋友帳快取（壞的丟掉）", [cf.friends.groups.length, cf.friends.entries.length, cf.friendQ.length], [1, 1, 1]);
eq("亂的連動設定不收", C.cleanData({ items: [], prefs: { friend: { url: "https://evil.com", key: "abc123def456" } } }).prefs.friend, undefined);
eq("沒連動就沒有朋友欄位", ["friends", "friendQ"].map((k) => k in C.cleanData({ items: [] })), [false, false]);

const PT = C.pairTotals([FE(1, "b", ["a"], 6458), FE(2, "a", ["b"], 5840), FE(3, "a", ["b"], 100, "pay"), FE(4, "a", ["a", "b", "c"], 90), FE(5, "c", ["a"], 9, "exp", true)]);
eq("兩人總帳", PT, [{ a: "a", b: "b", ab: 6458, ba: 5840 + 30, apay: 100, bpay: 0, net: { from: "a", to: "b", amt: 488 } }, { a: "a", b: "c", ab: 0, ba: 30, apay: 0, bpay: 0, net: { from: "c", to: "a", amt: 30 } }]);
eq("總帳的相抵和淨額一致", PT.map((p) => p.net), C.friendBalances([FE(1, "b", ["a"], 6458), FE(2, "a", ["b"], 5840), FE(3, "a", ["b"], 100, "pay"), FE(4, "a", ["a", "b", "c"], 90)]));

// ---- 帳戶與移動
{
  const it = (id, type, amt, pay, date, extra = {}) => ({ id, type, amt, cat: "其他", sub: "", pay, date, note: "", t: 0, ...extra });
  let d = C.presetAccounts(C.cleanData({ items: [], pays: ["現金", "信用卡", "LINE Pay"] }));
  eq("快速設定：三個帳戶", d.accounts.map((a) => a.id + ":" + a.name), ["bank:郵局", "cash:錢包", "card:信用卡"]);
  eq("快速設定：付款方式對應", d.payAcct, { 現金: "cash", 信用卡: "card", "LINE Pay": "bank" });
  eq("快速設定：收入進郵局", [d.prefs.inAcct, d.prefs.outAcct], ["bank", "cash"]);
  d = { ...d, accounts: d.accounts.map((a) => (a.id === "bank" ? { ...a, open: 10000 } : a.id === "cash" ? { ...a, open: 500 } : a)) };
  d = { ...d, items: [it("a", "out", 100, "LINE Pay", "2026-11-02"), it("b", "out", 50, "現金", "2026-11-03"), it("c", "in", 3000, "", "2026-11-04"),
    it("d", "out", 3200, "信用卡", "2026-11-04"), it("fr-x", "out", 120, "", "2026-11-05"), it("e", "out", 70, "", "2026-11-06")],
    moves: [{ id: "m1", from: "bank", to: "cash", amt: 1000, date: "2026-11-05", note: "", t: 0 }] };
  eq("餘額：郵局 10000−100+3000−1000", C.acctBalances(d), { bank: 11900, cash: 500 - 50 + 1000 - 70, card: -3200 });
  eq("朋友帳那份不動帳戶", C.acctOf(d, d.items[4]), null);
  eq("沒選付款方式＝從預設帳戶扣", C.acctOf(d, d.items[5]), "cash");
  const d2 = { ...d, items: [...d.items, it("f", "out", 10, "LINE Pay", "2026-11-07", { acct: "cash" })], payAcct: { ...d.payAcct, "LINE Pay": "cash" } };
  eq("改設定：沒存 acct 的照新設定、有存的照舊", [C.acctOf(d2, d2.items[0]), C.acctOf(d2, d2.items[6])], ["cash", "cash"]);
  eq("算到某天為止", C.acctBalances(d, "2026-11-03").bank, 9900);
  // 卡費：每月 5 號結帳、20 號繳
  const card = d.accounts.find((a) => a.id === "card");
  eq("卡費：結帳前還沒有要繳的", C.cardBill(d, card, "2026-11-04").amount, 0);
  eq("卡費：11/5 結帳後要繳 3200、11/20 繳", C.cardBill(d, card, "2026-11-06"), { amount: 3200, closeDate: "2026-11-05", dueDate: "2026-11-20" });
  const paid1 = { ...d, moves: [...d.moves, { id: "p1", from: "bank", to: "card", amt: 1200, date: "2026-11-10", note: "", t: 0 }] };
  eq("卡費：繳一部分還剩 2000", C.cardBill(paid1, card, "2026-11-12").amount, 2000);
  const paid2 = { ...paid1, moves: [...paid1.moves, { id: "p2", from: "bank", to: "card", amt: 2000, date: "2026-11-15", note: "", t: 0 }] };
  eq("卡費：繳清就不提醒", C.cardBill(paid2, card, "2026-11-16").amount, 0);
  eq("卡費：繳費日在下個月", C.cardBill({ ...d, accounts: d.accounts.map((a) => (a.id === "card" ? { ...a, card: { close: 25, due: 10, from: "bank" } } : a)) }, { ...card, card: { close: 25, due: 10, from: "bank" } }, "2026-12-01").dueDate, "2026-12-10");
  eq("帳戶列：設了起始餘額才顯示", [C.acctShown(C.emptyData()), C.acctShown(d)], [false, true]);
  // 改名、刪除
  const r1 = C.renamePay(d, "LINE Pay", "LINEPay");
  eq("付款方式改名：對應跟著改", r1.payAcct.LINEPay, "bank");
  eq("刪付款方式：對應拿掉", "LINE Pay" in C.removePay(d, "LINE Pay").payAcct, false);
  const r2 = C.removeAccount({ ...d, items: [...d.items, it("g", "out", 5, "現金", "2026-11-08", { acct: "bank" })], shortcuts: [{ id: "s", label: "提款", type: "move", from: "bank", to: "cash", amt: 1000, note: "" }] }, "bank");
  eq("刪帳戶：移動、捷徑、對應、紀錄的 acct 一起處理", [r2.accounts.length, r2.moves.length, r2.shortcuts.length, "LINE Pay" in r2.payAcct, "acct" in r2.items.at(-1), r2.prefs.inAcct], [2, 0, 0, false, false, "cash"]);
  eq("最後一個帳戶刪不掉", C.removeAccount(C.emptyData(), "cash").accounts.length, 1);
  // 備份
  const back = C.cleanData(JSON.parse(JSON.stringify({ ...d, shortcuts: [{ id: "s", label: "提款", type: "move", from: "bank", to: "cash", amt: 1000, note: "" }, { type: "move", from: "x", to: "cash" }] })));
  eq("備份：帳戶、移動、對應、移動捷徑都留著", [back.accounts.length, back.moves.length, back.payAcct["LINE Pay"], back.shortcuts.length, back.shortcuts[0].type], [3, 1, "bank", 1, "move"]);
  eq("舊備份沒有帳戶：預設一個錢包", C.cleanData({ items: [] }).accounts, [{ id: "cash", name: "錢包", type: "cash", open: 0 }]);
  eq("亂的移動丟掉", C.cleanData({ items: [], moves: [{ from: "cash", to: "cash", amt: 5, date: "2026-11-01" }, { from: "cash", to: "zz", amt: 5, date: "2026-11-01" }] }).moves.length, 0);
  const mg = C.mergeData(C.cleanData({ items: [] }), back);
  eq("合併：帳戶和移動合在一起", [mg.accounts.map((a) => a.id).sort().join(), mg.moves.length], ["bank,card,cash", 1]);
  eq("CSV 有移動", C.toCSV([], d.moves, (id) => C.acctName(d, id)).includes("移動,郵局 → 錢包,,,1000"), true);
}

eq("連動碼：8 碼", C.parseCode(" k7p2-9qxa "), { url: C.FRIEND_API, key: "K7P29QXA" });
eq("連動碼：舊的 20 碼", C.parseCode("c301300b73164d9497a4"), { url: C.FRIEND_API, key: "c301300b73164d9497a4" });
eq("連動碼：整條連結", C.parseCode("https://yoe2318.github.io/family-ledger/?openExternalBrowser=1#link=" + encodeURIComponent(C.FRIEND_API) + "~K7P29QXA")?.key, "K7P29QXA");
eq("連動碼：亂打不收", [C.parseCode("1234"), C.parseCode("K7P2-9QX0"), C.parseCode("")], [null, null, null]);
eq("朋友快取保留機器人 ID", C.cleanFriends({ me: "a", bot: "@abc123" }).bot, "@abc123");

// ---- 1.4：明細、扇形順序、手續費捷徑
eq("明細：空列丟掉、金額整數", C.cleanLines([{ shop: " 麥味登 ", what: "蛋餅奶茶", amt: "75" }, { shop: "", what: "", amt: "" }, { shop: "7-11", what: "咖啡", amt: 45.4 }, { what: "水", amt: -3 }]),
  [{ shop: "麥味登", what: "蛋餅奶茶", amt: 75 }, { shop: "7-11", what: "咖啡", amt: 45 }, { shop: "", what: "水", amt: 0 }]);
eq("明細：加總", C.linesTotal([{ shop: "a", what: "", amt: 75 }, { shop: "b", what: "", amt: 45 }]), 120);
eq("明細：串成備註", C.linesNote([{ shop: "麥味登", what: "蛋餅奶茶", amt: 75 }, { shop: "7-11", what: "咖啡", amt: 45 }, { shop: "", what: "水", amt: 0 }]), "麥味登 蛋餅奶茶 75 ＋ 7-11 咖啡 45 ＋ 水");
eq("最近的店家", C.recentShops([{ t: 1, lines: [{ shop: "A" }, { shop: "B" }] }, { t: 2, lines: [{ shop: "C" }, { shop: "A" }] }, { t: 3 }]), ["C", "A", "B"]);
eq("扇形順序：往前、往後、到頭不動", [C.moveIn(["a", "b", "c"], "b", -1), C.moveIn(["a", "b", "c"], "b", 1), C.moveIn(["a", "b", "c"], "a", -1), C.moveIn(["a", "b"], "x", 1)], [["b", "a", "c"], ["a", "c", "b"], ["a", "b", "c"], ["a", "b"]]);
{
  const raw = { items: [{ id: "1", type: "out", amt: 120, cat: "餐飲", date: "2026-11-18", lines: [{ shop: "麥味登", what: "蛋餅", amt: 75 }, {}] }, { id: "2", type: "out", amt: 5, cat: "餐飲", date: "2026-11-18", lines: [] }],
    accounts: [{ id: "bank", name: "郵局", type: "bank", open: 0 }, { id: "cash", name: "錢包", type: "cash", open: 0 }],
    shortcuts: [{ id: "s", type: "move", from: "bank", to: "cash", amt: 1000, fee: 15 }, { id: "t", type: "move", from: "bank", to: "cash", amt: 500, fee: -1 }] };
  const c = C.cleanData(raw);
  eq("備份：明細留著、空的不留", [c.items[0].lines, "lines" in c.items[1]], [[{ shop: "麥味登", what: "蛋餅", amt: 75 }], false]);
  eq("備份：移動捷徑的手續費", [c.shortcuts[0].fee, "fee" in c.shortcuts[1]], [15, false]);
}

eq("搜尋找得到明細裡的店家", C.searchItems([{ id: "1", type: "out", amt: 5, cat: "餐飲", date: "2026-11-01", note: "", lines: [{ shop: "麥味登", what: "蛋餅", amt: 5 }] }], "麥味登").length, 1);
eq("CSV 備註有明細", C.toCSV([{ id: "1", type: "out", amt: 5, cat: "餐飲", date: "2026-11-01", note: "早餐", lines: [{ shop: "麥味登", what: "蛋餅", amt: 5 }] }]).includes("早餐｜麥味登 蛋餅 5"), true);
eq("細項多選：組合存起來、拆得開", C.subParts("早餐＋午餐"), ["早餐", "午餐"]);
{
  const it = (amt, sub, lines) => ({ id: String(Math.random()), type: "out", amt, cat: "餐飲", sub, date: "2026-11-01", ...(lines ? { lines } : {}) });
  eq("細項統計：沒明細＝組合；有明細選細項＝照金額分", C.bySub([it(150, "早餐＋午餐"), it(120, "早餐＋午餐", [{ shop: "a", what: "", amt: 75, sub: "早餐" }, { shop: "b", what: "", amt: 45, sub: "午餐" }]), it(100, "晚餐", [{ shop: "c", what: "", amt: 60, sub: "飲料" }])], "out", "餐飲").map((x) => [x.name, x.amt]),
    [["早餐＋午餐", 150], ["早餐", 75], ["飲料", 60], ["午餐", 45], ["晚餐", 40]]);
  eq("明細的細項留著", C.cleanLines([{ shop: "a", amt: 5, sub: "早餐" }])[0].sub, "早餐");
}
eq("扇形交換", [C.swapIn(["a", "b", "c"], "a", "c"), C.swapIn(["a", "b"], "a", "x")], [["c", "b", "a"], ["a", "b"]]);
// 主題風格：字、次要字、主色文字在主題的表面和背景上都看得清楚；每一組主色在每一種主題表面上也看得清楚
for (const [id, st] of Object.entries(C.STYLES)) for (const mode of ["light", "dark"]) {
  const b = st[mode], bg = C.BACKGROUNDS[st.bg][mode], pal = C.PALETTES[st.palette][mode];
  for (const [what, x, y] of [["字／表面", b.ink, b.surface], ["字／背景", b.ink, bg], ["字／鍵盤", b.ink, b.s2], ["次要字／表面", C.mutedOn(st.bg, mode), b.surface], ["正數／表面", b.ok, b.surface], ["主色文字／表面", pal["accent-ink"], b.surface]])
    eq(`主題 ${st.name} ${mode} ${what} ${C.contrast(x, y).toFixed(2)} ≥ 4.5`, C.contrast(x, y) >= 4.5, true);
  for (const p of Object.values(C.PALETTES)) eq(`主題 ${st.name} ${mode} 表面 × ${p.name}主色文字`, C.contrast(p[mode]["accent-ink"], b.surface) >= 4.5, true);
}
eq("套用主題：一次設好", (({ style, theme, bg, pattern, radius, font }) => [style, theme, bg, pattern, radius, font])(C.applyStyle(C.emptyData().prefs, "bow")), ["bow", "ribbon", "bow", "polka", "l", "round"]);
eq("主題偏好：亂填的改回預設", ((p) => [p.style, p.font, p.radius, p.bgImg, p.veil])(C.cleanData({ items: [], prefs: { style: "x", font: "x", radius: "x", veil: 5 } }).prefs), ["notebook", "sans", "m", false, 40]);
eq("紋路 CSS", [C.patternCSS("plain", "", "")[0], C.patternCSS("grid", "red", "")[1], C.patternCSS("stars", "", "#fff")[0].startsWith('url("data:image/svg+xml')], ["none", "24px 24px", true]);
eq("裁切位置：超出範圍拉回來、壞的丟掉", [C.cleanCrop({ x: 2, y: -1, z: 9 }), C.cleanCrop({ x: "a" }), C.cleanCrop(null)], [{ x: 1, y: 0, z: 4 }, null, null]);
eq("中間按鈕偏好", ((p) => [p.fabImg, p.fabPlus, p.fabCrop])(C.cleanData({ items: [], prefs: { fabImg: true, fabPlus: false, fabCrop: { x: .3, y: .4, z: 2 } } }).prefs), [true, false, { x: .3, y: .4, z: 2 }]);
// 店家與菜單
{
  const L = (shop, what, amt, sub) => ({ shop, what, amt, ...(sub ? { sub } : {}) });
  const items = [
    { id: "1", type: "out", amt: 124, cat: "餐飲", sub: "午餐", date: "2026-11-01", t: 1, lines: [L("麥當勞", "雞塊", 65), L("麥當勞", "大薯", 55)] },
    { id: "2", type: "out", amt: 69, cat: "餐飲", sub: "晚餐", date: "2026-11-02", t: 2, lines: [L("麥當勞", "雞塊", 69)] },
    { id: "3", type: "out", amt: 45, cat: "餐飲", sub: "早餐", date: "2026-11-03", t: 3, lines: [L("7-11", "咖啡", 45)] },
    { id: "4", type: "out", amt: 190, cat: "餐飲", sub: "午餐", date: "2026-11-04", t: 4, lines: [L("麥當勞", "雞塊", 69), L("麥當勞", "可樂", 35), L("7-11", "茶", 25)] },
    { id: "5", type: "in", amt: 9, cat: "薪水", date: "2026-11-04", t: 5, lines: [L("公司", "x", 9)] },
  ];
  const idx = C.shopIndex(items), mc = C.findShop(idx, "麥當勞");
  eq("店家：去過幾次（同一筆裡出現兩次只算一次）", mc.count, 3);
  eq("店家：收入不算", C.findShop(idx, "公司"), null);
  eq("店家：品項照次數排、價錢用最近一次", mc.menu.map((x) => [x.what, x.amt, x.count]), [["雞塊", 69, 3], ["可樂", 35, 1], ["大薯", 55, 1]]);
  eq("店家：分類用最近一次", [mc.cat, mc.sub], ["餐飲", "午餐"]);
  eq("店家：上次點的整張單（只有這家的）", mc.lastOrder.map((l) => l.what), ["雞塊", "可樂"]);
  eq("常去的店家", C.topShops(idx).map((s) => s.name), ["麥當勞", "7-11"]);
  const own = C.cleanShops([{ name: "麥當勞", cat: "餐飲", sub: "早餐", menu: [{ what: "玉米湯", amt: 45, t: 9 }, { what: "雞塊", amt: 72, t: 9 }], hide: ["大薯"], photo: true }]);
  const mc2 = C.findShop(C.shopIndex(items, own), "麥當勞");
  eq("店家：自己設的分類優先", [mc2.cat, mc2.sub], ["餐飲", "早餐"]);
  eq("店家：自己加的品項、比較新的價錢蓋過、拿掉的不出現", mc2.menu.map((x) => [x.what, x.amt, x.mine]), [["雞塊", 72, true], ["可樂", 35, false], ["玉米湯", 45, true]]);
  eq("店家：還沒去過的也列得出來", C.findShop(C.shopIndex([], [{ name: "新店", menu: [], hide: [], photo: false }]), "新店").count, 0);
  eq("店家清理：擋亂資料、同名合併", C.cleanShops([null, { name: "" }, { name: " A ", menu: [{ what: "x", amt: "12.6" }, { what: "x", amt: 3 }, { what: "" }] }, { name: "A", hide: ["y", "y"], photo: 1 }]),
    [{ name: "A", menu: [{ what: "x", amt: 13, t: 0 }], hide: ["y"], photo: true }]);
  const d0 = { ...C.emptyData(), items: [items[0], { ...items[2], lines: [L("麥當労", "雞塊", 70)] }], shops: C.cleanShops([{ name: "麥當労", menu: [{ what: "蛋捲", amt: 30 }], photo: true }, { name: "麥當勞", cat: "餐飲", menu: [{ what: "雞塊", amt: 69 }] }]) };
  const d1 = C.renameShop(d0, "麥當労", "麥當勞");
  eq("改店名：紀錄裡的店名一起改", d1.items.flatMap((x) => x.lines.map((l) => l.shop)), ["麥當勞", "麥當勞", "麥當勞"]);
  eq("改店名＝合併：菜單合併、照片留著、分類用原本的", d1.shops.map((s) => [s.name, s.menu.map((x) => x.what), s.photo, s.cat]), [["麥當勞", ["雞塊", "蛋捲"], true, "餐飲"]]);
  eq("設定店家：新增、清掉分類", C.setShop(C.setShop(C.emptyData(), "B", { cat: "餐飲", sub: "早餐" }), "B", { cat: "" }).shops, [{ name: "B", menu: [], hide: [], photo: false }]);
  eq("刪店家：只刪自己整理的", C.delShop(d1, "麥當勞").shops.length + C.delShop(d1, "麥當勞").items.length, 2);
  eq("備份還原會帶店家", C.cleanData({ items: [], shops: [{ name: "X" }] }).shops.map((s) => s.name), ["X"]);
}
// 明細的數量
eq("數量：2 以上才存、亂填改回 1", C.cleanLines([{ what: "水餃", amt: 120, qty: 2 }, { what: "湯", amt: 35, qty: 1 }, { what: "茶", amt: 20, qty: "x" }]).map((l) => l.qty), [2, undefined, undefined]);
eq("數量：備註文字寫 ×2", C.linesNote([{ shop: "八方", what: "水餃", amt: 120, qty: 2 }]), "八方 水餃×2 120");
eq("數量：一份的價錢", [C.unitPrice({ amt: 120, qty: 2 }), C.unitPrice({ amt: 35 }), C.unitPrice({ amt: 0, qty: 3 })], [60, 35, 0]);
eq("數量：菜單記一份的價錢", C.findShop(C.shopIndex([{ id: "q", type: "out", amt: 120, cat: "餐飲", date: "2026-11-20", t: 9, lines: [{ shop: "八方", what: "水餃", amt: 120, qty: 2 }] }]), "八方").menu[0].amt, 60);
// 統計：點進去、付款方式拆朋友帳、店家、每天
{
  const it = [
    { id: "a", type: "out", amt: 100, cat: "其他", sub: "", pay: "現金", date: "2026-11-03", t: 1 },
    { id: "b", type: "out", amt: 80, cat: "其他", sub: "雜費", pay: "", date: "2026-11-05", t: 2 },
    { id: "fr-x", type: "out", amt: 60, cat: "餐飲", sub: "午餐", pay: "", date: "2026-11-05", t: 3, lines: [{ shop: "八方", what: "水餃", amt: 120, qty: 2 }] },
    { id: "c", type: "out", amt: 155, cat: "餐飲", sub: "晚餐", pay: "現金", date: "2026-11-05", t: 4, lines: [{ shop: "八方", what: "水餃", amt: 120, qty: 2, sub: "宵夜" }, { shop: "全家", what: "茶", amt: 35 }] },
    { id: "d", type: "in", amt: 500, cat: "薪水", date: "2026-11-05", t: 5 },
  ];
  eq("統計點進去：沒選細項", C.statItems(it, "out", { cat: "其他", sub: "" }).map((r) => r.item.id), ["a"]);
  eq("統計點進去：整個分類（新的在前）", C.statItems(it, "out", { cat: "其他" }).map((r) => r.item.id), ["b", "a"]);
  eq("統計點進去：明細細項只算那一部分", C.statItems(it, "out", { cat: "餐飲", sub: "宵夜" }).map((r) => [r.item.id, r.amt]), [["c", 120]]);
  eq("統計點進去：剩下的算整筆的細項", C.statItems(it, "out", { cat: "餐飲", sub: "晚餐" }).map((r) => [r.item.id, r.amt]), [["c", 35]]);
  eq("統計點進去：朋友帳那份／真的沒寫分開", [C.statItems(it, "out", { pay: "@fr" }).map((r) => r.item.id), C.statItems(it, "out", { pay: "" }).map((r) => r.item.id)], [["fr-x"], ["b"]]);
  eq("統計點進去：店家用明細的金額（朋友帳只分到一部分就照比例縮）", C.statItems(it, "out", { shop: "八方" }).map((r) => [r.item.id, r.amt]), [["c", 120], ["fr-x", 60]]);
  eq("統計點進去：某一天", C.statItems(it, "out", { day: "2026-11-05" }).length, 3);
  eq("付款方式拆朋友帳", C.payBreakdown(it).map((p) => [p.key, p.amt]), [["現金", 255], ["", 80], ["@fr", 60]]);
  eq("店家排行", C.byShop(it).map((x) => [x.name, x.amt, x.count]), [["八方", 180, 2], ["全家", 35, 1]]);
  const dt = C.dailyTotals(it, "2026-11", 1);
  eq("每天：整期的天數、金額", [dt.length, dt[2].amt, dt[4].amt, dt[0].amt], [30, 100, 295, 0]);
  eq("每天：起算日不是 1 號", [C.dailyTotals([], "2026-11", 25).length, C.dailyTotals([], "2026-11", 25)[0].date], [30, "2026-11-25"]);
}
console.log(fail ? `✗ ${fail} 項沒過（${pass} 項通過）` : `✓ ${pass} 項全部通過`);
process.exit(fail ? 1 : 0);
