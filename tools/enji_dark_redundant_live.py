#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★いらなく なった 上書きを、★字づらでは なく **動かして** 見分ける。

  ★出どころ 2026-09-14、★No.013 DECISION_1 THEN（★ON_UNCERTAIN: STOP_AND_REPORT）

  ★★字づらの 数えでは 決められません でした。
    ★★もとの 決まりが `border:1px solid var(--enji-bg)` の ひとまとめ 書きで、
      ★上書きは `border-color:` の 一言 書きです。★字では くらべられません。
    ★★1行に 決まりが いくつも 並ぶ ところも あり、★拾い落とします。

  ★★だから 実際に 開いて、★次の 手で 見ます ──
    ★① 暗い ほうに して、★上書きが 効いて いる ときの 見え方を 控える
    ★② その 上書きの 一言を 取り消す
    ★③ もう一度 見え方を 控え、★①と くらべる
    ★★変わらなければ、★その 一言は 要りません。
  ★★「見え方」は、★その 決まりに 当たる すべての 札の
    ★background-color / border-*-color / color を 読んだ ものです。
"""

import io
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "docs", "design", "pack-final")
OUT = os.path.join(ROOT, "docs", "reports")
MIHON = [f for f in sorted(os.listdir(PACK)) if f.startswith("00-動く見本")]

JS = r"""
const { chromium } = require("playwright");
const PROPS = ["background-color", "border-top-color", "border-right-color",
  "border-bottom-color", "border-left-color", "color"];

(async () => {
  const files = JSON.parse(process.argv[2]);
  const b = await chromium.launch({ channel: "chrome" });
  const all = [];
  for (const src of files) {
    const p = await b.newPage({ viewport: { width: 430, height: 900 } });
    await p.goto("file://" + src);
    await p.waitForTimeout(500);
    await p.evaluate(() => document.documentElement.setAttribute("data-th", "dark"));
    await p.waitForTimeout(400);
    const res = await p.evaluate((PROPS) => {
      const out = [];
      // ★★画面に 出て いない 札は、★くらべられません。
      //   ★★見本は 1枚ずつ 出す 作りなので、★多くの 札が 最初は 居ません。
      //   ★★そこで、★選び方から **にせの 札**を 作って 置きます。
      //     ★`.mini .mg b.t` なら、★div.mini > div.mg > b.t を 作ります。
      //   ★★親から 掛かる 決まりも、★これで 同じように 掛かります。
      const build = (sel) => {
        const parts = sel.trim().split(/\s+/);
        let root = null, cur = null;
        for (const part of parts) {
          const m = part.match(/^([a-zA-Z][a-zA-Z0-9]*)?((?:[.#][\w-]+)*)/);
          if (!m) return null;
          const tag = m[1] || "div";
          const el = document.createElement(tag);
          (m[2].match(/\.[\w-]+/g) || []).forEach((c) =>
            el.classList.add(c.slice(1)));
          (m[2].match(/#[\w-]+/g) || []).forEach((c) =>
            el.id = c.slice(1));
          if (!root) { root = el; cur = el; }
          else { cur.appendChild(el); cur = el; }
        }
        if (!root) return null;
        cur.textContent = "あ";
        root.setAttribute("data-probe", "1");
        document.body.appendChild(root);
        return { root: root, leaf: cur };
      };
      const snap = (sel) => {
        const els = Array.from(document.querySelectorAll(sel));
        return els.map((e) => {
          const s = getComputedStyle(e);
          return PROPS.map((k) => s.getPropertyValue(k)).join("|");
        }).join("~");
      };
      for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try { rules = Array.from(sheet.cssRules); } catch (e) { continue; }
        for (const r of rules) {
          if (!r.selectorText) continue;
          if (!r.selectorText.includes('data-th="dark"')) continue;
          // ★この 決まりが --enji-bg を 使って いるか
          const txt = r.style.cssText || "";
          if (!txt.includes("--enji-bg")) continue;
          const plain = r.selectorText.split(",")
            .map((s) => s.replace(/html\[data-th="dark"\]/g, "").trim())
            .filter(Boolean).join(",");
          if (!plain) continue;
          let matched = 0;
          try { matched = document.querySelectorAll(plain).length; }
          catch (e) { matched = -1; }
          // ★★画面に 居なければ、★にせの 札を 立てて から くらべます。
          let probes = [];
          if (matched === 0) {
            for (const one of plain.split(",")) {
              const b2 = build(one.trim());
              if (b2) probes.push(b2);
            }
            try { matched = document.querySelectorAll(plain).length; }
            catch (e) { matched = -1; }
          }
          const rec = { sel: r.selectorText, plain: plain, matched: matched,
            decls: [] };
          const props = Array.from(r.style);
          for (const k of props) {
            const v = r.style.getPropertyValue(k);
            if (!v.includes("--enji-bg")) continue;
            const before = matched > 0 ? snap(plain) : null;
            r.style.removeProperty(k);
            const after = matched > 0 ? snap(plain) : null;
            r.style.setProperty(k, v);
            rec.decls.push({ prop: k, value: v,
              redundant: matched > 0 ? (before === after) : null });
          }
          // ★この 決まりの 一言が ぜんぶ 要らないか
          const before = matched > 0 ? snap(plain) : null;
          const saved = r.style.cssText;
          r.style.cssText = "";
          const after = matched > 0 ? snap(plain) : null;
          r.style.cssText = saved;
          rec.wholeRuleRedundant = matched > 0 ? (before === after) : null;
          rec.probed = probes.length > 0;
          probes.forEach((b3) => b3.root.remove());
          out.push(rec);
        }
      }
      return out;
    }, PROPS);
    all.push({ file: src.split("/").pop(), rules: res });
    await p.close();
  }
  await b.close();
  console.log(JSON.stringify(all));
})();
"""
js = os.path.join(OUT, "_redundant.js")
io.open(js, "w", encoding="utf-8").write(JS)
srcs = [os.path.join(PACK, f) for f in MIHON]
r = subprocess.run(["node", js, json.dumps(srcs)], capture_output=True, text=True,
                   cwd=ROOT)
os.remove(js)
if r.returncode:
  print("ERR: " + r.stderr.strip()[:400])
  sys.exit(1)
data = json.loads(r.stdout.strip().split("\n")[-1])

whole, partial, nomatch = [], [], []
for f in data:
  for rule in f["rules"]:
    rec = dict(rule, file=f["file"])
    if rule["matched"] <= 0:
      nomatch.append(rec)
    elif rule["wholeRuleRedundant"]:
      whole.append(rec)
    else:
      red = [d for d in rule["decls"] if d["redundant"]]
      (partial if red else nomatch).append(dict(rec, red=red))

print("★決まり ごと 要らない : " + str(len(whole)))
for x in whole:
  print("   " + x["file"][:20] + "  " + x["plain"][:60] + "  （札 "
        + str(x["matched"]) + ("・にせ" if x.get("probed") else "・実") + "）")
print("\n★一言だけ 要らない : " + str(len(partial)))
for x in partial:
  print("   " + x["file"][:20] + "  " + x["plain"][:48] + "  → "
        + ", ".join(d["prop"] for d in x.get("red", [])))
print("\n★要る（または 札が 出て いない） : " + str(len(nomatch)))
for x in nomatch:
  print("   " + x["file"][:20] + "  " + x["plain"][:48]
        + "  札 " + str(x["matched"]) + ("・にせ" if x.get("probed") else "・実"))
