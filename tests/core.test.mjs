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

console.log(fail ? `✗ ${fail} 項沒過（${pass} 項通過）` : `✓ ${pass} 項全部通過`);
process.exit(fail ? 1 : 0);
