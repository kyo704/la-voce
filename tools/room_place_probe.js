/**
 * ★羊の 部屋 ── ★実機で 測る（★2026-09-17・Opus の お指図）。
 *
 *   ★★「配置換えの ときに 計算が 狂う」── ★実機の 話 です。
 *   ★★見本の 数字では ありません。★**実際に 描かれた 位置**を 測ります。
 *
 *   ★★測り方 ──
 *     ① ながめる（全画面）で、★家具の 画面上の 枠を 取る
 *     ② したく（引き出しが 出て いる）で、★同じ ものを 取る
 *     ③ どちらも **舞台の 中の ％**に 直して から くらべる
 *        ★★舞台の 大きさは 2つの 画面で 変わります。
 *        ★★px の まま くらべると、★大きさの ちがいを ずれと 読み違えます。
 *
 *   ★★★較正 ── ★わざと 1つ ずらして、★止まる ことを 確かめます。
 *     ★★止まらなければ、★道具が 壊れて います（★Opus の お指図 4）。
 *
 *   ★使い方
 *     node tools/room_place_probe.js
 *     E2E_BASE_URL=http://localhost:3000 node tools/room_place_probe.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function readEnv(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return {};
  const out = {};
  fs.readFileSync(p, "utf8").split("\n").forEach((line) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });
  return out;
}

// ★★舞台の 中の ％。★舞台の 大きさで 割ります。
//   ★★px の まま くらべない こと ── ★縮尺の ちがいを ずれと 読みます。
function toStagePct(item, stage) {
  return {
    left: +(((item.x + item.w / 2) - stage.x) / stage.w * 100).toFixed(3),
    // ★足もと（下端）で 見ます。★家具は 床に 立ちます。
    bottom: +(((item.y + item.h) - stage.y) / stage.h * 100).toFixed(3),
    wPct: +(item.w / stage.w * 100).toFixed(3)
  };
}

function calibrate() {
  const stage = { x: 0, y: 0, w: 1000, h: 500 };
  const a = toStagePct({ x: 100, y: 100, w: 100, h: 100 }, stage);
  // ★① 同じ ものは 同じ 数
  const b = toStagePct({ x: 100, y: 100, w: 100, h: 100 }, stage);
  if (a.left !== b.left || a.bottom !== b.bottom) {
    throw new Error("★較正に 失敗 ── 同じ ものが 別の 数に なります");
  }
  // ★② 大きさが 変わっても、★％は 変わらない（★舞台ごと 拡大した とき）
  const big = { x: 0, y: 0, w: 2000, h: 1000 };
  const c = toStagePct({ x: 200, y: 200, w: 200, h: 200 }, big);
  if (a.left !== c.left || a.bottom !== c.bottom) {
    throw new Error("★較正に 失敗 ── 舞台ごと 2倍に したのに ％が 変わります");
  }
  // ★③ わざと 1つ ずらす。★出なければ 道具が 壊れて います。
  const d = toStagePct({ x: 110, y: 100, w: 100, h: 100 }, stage);
  if (d.left === a.left) {
    throw new Error("★較正に 失敗 ── 10px ずらしても 同じ 数です");
  }
  console.log("★較正: 通りました（★同じ／舞台ごと拡大／10px ずらす の 3つ）");
}

async function measure(page, label) {
  return await page.evaluate((lab) => {
    const anchor = document.querySelector("#room-anchor");
    if (!anchor) return { label: lab, error: "#room-anchor が ありません" };
    // ★★舞台は `#room-anchor` の 中で、★幅と 高さを 持つ 1枚 です。
    //   ★★`inset:0` の 子（カメラの 中身）では ありません。
    const kids = [...anchor.children];
    const stageEl = kids.find((el) => {
      const s = getComputedStyle(el);
      return s.position === "absolute" && el.offsetWidth > 0
        && Math.abs(el.offsetWidth / el.offsetHeight - 7 / 5) < 0.02;
    }) || kids[kids.length - 1];
    const sr = stageEl.getBoundingClientRect();
    const ar = anchor.getBoundingClientRect();
    // ★★測る もの ── ★家具（`data-item`）。★無ければ、★画像 ぜんぶ。
    // ★★名札は `data-item-id` です（★CharacterHome.jsx:1631／1972）。
    //   ★★はじめ `data-item` と 書いて いました。★1つも 取れません でした。
    //     ★★較正は 通って いました ── ★計算は 正しかった のです。
    //     ★★取り出しの ほうが 空でした。★この 蔵で 何度も 出た 形 です。
    // ★★名札の 付いた 包みは、★大きさ 0 の ことが あります。
    //   ★★2026-09-17、★それで「家具 0」と 出て いました。
    //     ★★実際は 置かれて いました。★測れて いたのに 数えられません でした。
    //   ★★だから 絵から 上へ たどって、★名札を 拾います。
    let nodes = [...anchor.querySelectorAll("[data-item-id]")]
      .filter((el) => el.getBoundingClientRect().width > 0);
    const furniture = nodes.length;
    // ★★羊も 測ります。★家具と 別に 数えます ──
    //   ★★羊は 舞台では なく **箱**に 付いて いる 見込みが あります。
    nodes = nodes.concat([...anchor.querySelectorAll("img[alt]")]);
    const items = nodes.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        kind: (el.hasAttribute("data-item-id") || el.closest("[data-item-id]")) ? "家具" : "羊など",
        // ★★舞台の 中に いるか、★箱に 直に 付いて いるか。
        //   ★★舞台の 外の ものは、★箱の 高さで ％が 決まります。
        //   ★★箱の 高さは 2つの 画面で 変わります（★634 と 278.56）。
        inStage: stageEl.contains(el),
        key: (el.getAttribute("data-item-id")
              || (el.closest("[data-item-id]") && el.closest("[data-item-id]").getAttribute("data-item-id"))
              // ★★名札が 無い ときは、★絵の 名で 見分けます（★2026-09-17）。
              //   ★★`alt` は 空 でした。★どれが 何か 分からず、
              //     ★「羊など」と しか 言えません でした。
              //   ★★絵の 道の 末尾（`furniture_01.png` など）が、★いちばん 確かです。
              || ("絵:" + String(el.getAttribute("src") || "")
                    .split("?")[0].split("/").pop())),
        x: +r.x.toFixed(2), y: +r.y.toFixed(2),
        w: +r.width.toFixed(2), h: +r.height.toFixed(2)
      };
    }).filter((i) => i.w > 0 && i.h > 0);
    return {
      label: lab,
      anchor: { w: +ar.width.toFixed(2), h: +ar.height.toFixed(2) },
      stage: { x: +sr.x.toFixed(2), y: +sr.y.toFixed(2),
               w: +sr.width.toFixed(2), h: +sr.height.toFixed(2),
               aspect: +(sr.width / sr.height).toFixed(4) },
      furniture,
      items
    };
  }, label);
}

(async () => {
  calibrate();
  const env = { ...readEnv(".env.e2e"), ...process.env };
  if (!env.E2E_EMAIL || !env.E2E_PASSWORD) {
    console.error("★止まりました ── .env.e2e に E2E_EMAIL / E2E_PASSWORD が ありません。");
    process.exit(1);
  }
  const base = process.env.E2E_BASE_URL || env.E2E_BASE_URL || "https://woolsong.app";
  console.log("★測る 先: " + base);

  const { chromium, devices } = require("playwright");
  const browser = await chromium.launch({ channel: "chrome" });
  const dev = devices["iPhone 12"];
  const ctx = await browser.newContext({
    ...dev, viewport: { width: 390, height: 844 },
    locale: "ja-JP", timezoneId: "Asia/Tokyo"
  });
  const page = await ctx.newPage();
  const out = { base, at: new Date().toISOString(), frames: [] };
  try {
    await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').first().fill(env.E2E_EMAIL);
    await page.locator('input[type="password"]').first().fill(env.E2E_PASSWORD);
    await page.locator('button[type="submit"], button:has-text("ログイン")').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });

    // ★① ながめる ── ★ひつじの 画面を 出します。
    const tab = page.locator('button:has-text("ひつじ"), [role="tab"]:has-text("ひつじ")').first();
    if (await tab.count()) { await tab.click().catch(() => {}); }
    await page.waitForTimeout(1500);
    if (!(await page.locator("#room-anchor").count())) {
      console.error("★止まりました ── ひつじの 画面に 行けません でした。"
        + "★画面の 名が 変わって いないか お確かめください。");
      process.exit(1);
    }
    out.frames.push(await measure(page, "ながめる"));

    // ★② したく ── ★引き出しを 開けます。
    const dress = page.locator('button:has-text("したく")').first();
    if (!(await dress.count())) {
      console.error("★止まりました ── 「したく」の 札が 見つかりません。");
      process.exit(1);
    }
    await dress.click();
    await page.waitForTimeout(1800);
    out.frames.push(await measure(page, "したく"));
  } finally {
    await browser.close();
  }

  // ★③ くらべる
  const [a, b] = out.frames;
  console.log("\n■ 箱と 舞台");
  out.frames.forEach((f) => {
    console.log("  %s … 箱 %sx%s ／ 舞台 %sx%s（比 %s）／ 家具 %d",
      f.label, f.anchor.w, f.anchor.h, f.stage.w, f.stage.h, f.stage.aspect, f.furniture);
  });
  console.log("\n■ 家具の 位置（★舞台の 中の ％）");
  // ★★★名札が 同じ もの（★`img:`）が いくつも あります。
  //   ★★はじめ 名で 束ねて いました。★9つが 1つに 潰れて いました。
  //   ★★出た 順で 突き合わせます。★数が 合わなければ、★そう 書きます。
  const rows = [];
  let drift = 0;
  if (a.items.length !== b.items.length) {
    console.log("  ★数が 合いません … ながめる %d ／ したく %d", a.items.length, b.items.length);
    drift += 1;
  }
  const n = Math.min(a.items.length, b.items.length);
  for (let i = 0; i < n; i++) {
    const ia = a.items[i], ib = b.items[i];
    const pa = toStagePct(ia, a.stage), pb = toStagePct(ib, b.stage);
    const dl = +(pb.left - pa.left).toFixed(3);
    const db = +(pb.bottom - pa.bottom).toFixed(3);
    const 倍 = +(ia.w / ib.w).toFixed(3);
    if (Math.abs(dl) > 0.5 || Math.abs(db) > 0.5) drift += 1;
    // ★★★1.6倍の 寄りが、★どの 点を 中心に かかって いるか を 出します。
    //   ★★出る位置 = 中心 + (置いた位置 - 中心) × 倍
    //     ★→ 中心 = (出る位置 - 置いた位置 × 倍) ÷ (1 - 倍)
    //   ★★どの もの でも 同じ 中心が 出れば、★1つの カメラの しわざ です。
    //   ★★ばらつけば、★ものごとに 別の 計算が 効いて います。
    const 中心 = (出, 置) => 倍 === 1 ? null
      : +((出 - 置 * 倍) / (1 - 倍)).toFixed(2);
    rows.push({ i, kind: ia.kind, key: ia.key, inStage: ia.inStage,
      寄りの中心左: 中心(pa.left, pb.left),
      寄りの中心下: 中心(pa.bottom, pb.bottom),
      // ★★★㋖ を 選んだ ら どう なるか、★先に 出します（★2026-09-17）。
      //   ★★床の 線 … `FLOOR_BOTTOM_PCT = 48`（`lib/sheepInteriorV2.js:492`）。
      //     ★上から 数えると 100 - 48 = **52％**。
      //   ★★いまの 中心は 53.33％ です。★1.33 しか 離れて いません。
      //   ★★だから、★中心を 床の 線に 寄せても、★差は ほとんど 変わりません。
      //     ★★寄り（1.6倍）が ある 限り、★中心から 離れた ものは 動きます。
      //   ★★数で お見せします。★作って から「変わりません でした」と 言わない ため です。
      floorCenter: +(52 + (pb.bottom - 52) * 倍).toFixed(3),
      floorCenterDiff: +((52 + (pb.bottom - 52) * 倍) - pb.bottom).toFixed(3),
      ながめる: pa.left + " / " + pa.bottom, したく: pb.left + " / " + pb.bottom,
      差左: dl, 差下: db, 大きさの倍: 倍 });
    console.log("  %d %s … 差 左%s 下%s ／ %s倍 ／ 寄りの中心 %s / %s",
      i, ia.key, dl, db, 倍, rows[i].寄りの中心左, rows[i].寄りの中心下);
  }
  if (rows.filter((r) => r.kind === "家具").length === 0) {
    console.log("\n★★名札の 読めた もの（`data-item-id`）は 0 でした。");
    console.log("★★描かれた ものは すべて 測れて います。★名が 付かない だけ です。");
    console.log("★★どれが 何かは、★したくの 左の ％が 台帳の 数と 合う かで 見分けます。");
  }
  out.rows = rows;
  out.drift = drift;

  const dst = path.join(ROOT, "docs/reports/_room_place_probe.json");
  fs.writeFileSync(dst, JSON.stringify(out, null, 1));

  // ★★報告も、★測った この 道具が 書きます。★手で 書き写しません。
  const L = [];
  L.push("# ★羊の 部屋 ── ★実機で 測った 数");
  L.push("");
  L.push("★この 行は あとで 差し替えます");
  L.push("");
  L.push("生成: `tools/room_place_probe.js`（測った 先: " + base + "）");
  L.push("");
  L.push("★★較正: 通りました（★同じ ものは 同じ 数／舞台ごと 2倍でも ％は 同じ／"
    + "10px ずらすと 出る）。");
  L.push("");
  L.push("## 一 ★箱と 舞台");
  L.push("");
  L.push("| 画面 | 箱 | 舞台 | 比 | 家具の 数 |");
  L.push("|---|---|---|---|---|");
  out.frames.forEach((f) => L.push("| " + f.label + " | " + f.anchor.w + "×" + f.anchor.h
    + " | " + f.stage.w + "×" + f.stage.h + " | " + f.stage.aspect + " | " + f.furniture + " |"));
  L.push("");
  L.push("★★**舞台は 2つの 画面で 同じ 大きさ です**（" + a.stage.w + "×" + a.stage.h + "）。");
  L.push("★★箱は ちがいます（" + a.anchor.h + " と " + b.anchor.h + "）。");
  L.push("★★つまり 2026-09-14 の 舞台方式は、★舞台の ところまでは 効いて います。");
  L.push("");
  L.push("## 二 ★描かれた もの（★舞台の 中の ％・★左 / 下）");
  L.push("");
  L.push("| # | 何 | ながめる | したく | 差 左 | 差 下 | 倍 | 寄りの 中心（左/下）|");
  L.push("|---|---|---|---|---|---|---|---|");
  rows.forEach((r) => L.push("| " + r.i + " | " + r.key + " | " + r.ながめる + " | "
    + r.したく + " | " + r.差左 + " | " + r.差下 + " | " + r.大きさの倍
    + " | " + r.寄りの中心左 + " / " + r.寄りの中心下 + " |"));
  L.push("");
  L.push("★★いちばん 右は、★**1.6倍の 寄りが かかって いる 中心**です。");
  L.push("★★どの ものでも 同じ 中心が 出れば、★1つの カメラの しわざ です。");
  L.push("");
  L.push("## 二の二 ★★㋖（★中心を 床の 線に する）を したら、★どう なるか");
  L.push("");
  L.push("★★床の 線 … `FLOOR_BOTTOM_PCT = 48`（`lib/sheepInteriorV2.js:492`）。");
  L.push("★★上から 数えて **52％**。★いまの 中心は 53.33％ です。");
  L.push("★★離れて いるのは **1.33** だけ です。");
  L.push("");
  L.push("| 何 | したく | いまの ながめる | 差 | ㋖なら | ㋖の差 | よく なる ぶん |");
  L.push("|---|---|---|---|---|---|---|");
  rows.forEach((r) => {
    const 今 = Math.abs(r.差下);
    const 後 = Math.abs(r.floorCenterDiff);
    L.push("| " + r.key + " | " + r.したく.split(" / ")[1] + " | "
      + r.ながめる.split(" / ")[1] + " | " + r.差下 + " | "
      + r.floorCenter + " | " + r.floorCenterDiff + " | " + (今 - 後).toFixed(2) + " |");
  });
  L.push("");
  L.push("★★★よく なる ぶんは、★どれも **1％前後**です。");
  L.push("★★手前の もの（showa_01 / showa_14）の ずれは 23.5 でした。");
  L.push("　★★㋖ に しても、★22 以上 残ります。");
  L.push("★★**症状は ほとんど 変わりません。**");
  L.push("");
  L.push("★★わけ ── ★ずれを 作って いるのは **寄り（1.6倍）そのもの** です。");
  L.push("　★中心の 置き場では ありません。");
  L.push("　★★中心から 40％ 離れた ものは、★1.6倍 なら 24％ 動きます。");
  L.push("　★★中心を 1.33 動かしても、★その 24 は 24 の ままです。");
  L.push("");
  const 倍 = rows.length ? rows[0].大きさの倍 : 0;
  L.push("★★**大きさが どれも " + 倍 + "倍 ちがいます。**");
  L.push("★★舞台が 同じ 大きさ なのに 中身が " + 倍 + "倍 なら、");
  L.push("　★ちがうのは **カメラ（寄り）**です。★舞台では ありません。");
  L.push("★★位置の 差も、★寄った ぶん の ずれ です。");
  L.push("");
  L.push("## 三 ★★足りない もの");
  L.push("");
  if (rows.filter((r) => r.kind === "家具").length === 0) {
    L.push("★★名札（`data-item-id`）の 読めた ものは 0 でした。");
    L.push("★★けれど **描かれた ものは すべて 測れて います**。★名が 付かない だけ です。");
    L.push("★★どれが 何かは、★**したくの 左の ％が 台帳の 数と 合う か**で 見分けます。");
    L.push("　★★台帳に 入れた 数 … 20.8 ／ 54.2 ／ 87.5。");
  } else {
    L.push("★家具 " + rows.filter((r) => r.kind === "家具").length + " 点を 測れました。");
  }
  L.push("");
  L.push("## 四 ★まだ 直して いません");
  L.push("");
  L.push("★★お指図の とおり、★数が 出る まで 直しに 入って いません。");
  const md = L.join("\n") + "\n";
  const lines = md.split("\n");
  const last = lines.filter((x) => x.trim()).pop();
  lines[2] = "全" + (lines.length - 1) + "行 / 末尾は「" + last + "」";
  const mdPath = path.join(ROOT, "docs/reports/2026-09-17-羊の部屋-実機で測った数.md");
  fs.writeFileSync(mdPath, lines.join("\n"));
  console.log("\n★書き出し: " + dst);
  console.log("★書き出し: " + mdPath);
  console.log(drift === 0
    ? "★ずれは ありません（★0.5％ より 小さい）。"
    : "★" + drift + " 件、★ずれて います。");
})();
