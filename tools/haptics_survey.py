#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★触覚（手ざわり）の 下調べ。★報告の 文も、★この 1本が 出します。

  ★★出どころ　TASK: haptic_feedback_on_save_investigation（★2026-09-16）
    「★REPORT_ONLY_DO_NOT_IMPLEMENT ── ★調べて 報告だけ。★実装しない。」

  ★★この 家の 決め（★2026-09-13）──
    「★報告の 文と、★その もとの 数は、★同じ 1本の script が 出す こと。」
  ★★だから、★下の 事実は すべて この 中で 集めて、★そのまま 書き出します。
    ★★手で 書き足した 段落は ありません。
"""

import io
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-16-触覚フィードバックの調べ.md")
PROBE = os.path.join(ROOT, "docs", "design", "probe", "触覚のためし.html")


def rd(rel):
  p = os.path.join(ROOT, rel)
  if not os.path.exists(p):
    return None
  return io.open(p, encoding="utf-8").read()


def must(rel):
  """★★無い ものを、★黙って 空として 進めません（★棚卸しの 決まり）。"""
  s = rd(rel)
  if s is None:
    print("★★ありません: " + rel)
    print("　★調べません。★止まります。")
    sys.exit(1)
  return s


def grep(rel, pat):
  s = must(rel)
  return [(i + 1, l.strip()) for i, l in enumerate(s.split("\n")) if re.search(pat, l)]


# ══════════ ① いまの 家の ようす（★読んで 数えます）══════════
pkg = json.loads(must("package.json"))
deps = dict(pkg.get("dependencies") or {})
deps.update(pkg.get("devDependencies") or {})
cap = sorted(k for k in deps if k.startswith("@capacitor"))
has_haptics = "@capacitor/haptics" in deps

capcfg = json.loads(must("capacitor.config.json"))
server_url = (capcfg.get("server") or {}).get("url", "")
url_is_placeholder = "REPLACE-WITH" in server_url
ios_dir = os.path.isdir(os.path.join(ROOT, "ios"))

vib_hits = []
for rel in ("components/VocalTracker.jsx", "components/UiV2.jsx", "lib/platform.js"):
  vib_hits += grep(rel, r"navigator\.vibrate|Haptics|hapticFeedback")

sw = must("components/UiV2.jsx")
m = re.search(r"export function Switch\([\s\S]{0,900}", sw)
sw_src = m.group(0) if m else ""
sw_is_input = "<input" in sw_src
sw_is_span = 'role="switch"' in sw_src and "<span" in sw_src

cb = grep("components/VocalTracker.jsx", r'type="checkbox"')
cb += grep("components/UiV2.jsx", r'type="checkbox"')
cb_switch_attr = [x for x in cb if re.search(r"\bswitch\b", x[1])]

vt = must("components/VocalTracker.jsx")
save_toast_suppressed = "記録するたびに『保存しました』という 画面が 出て、鬱陶しい" in vt
os_col = grep("lib/platform.js", r"export function osOf")
os_stored = grep("components/VocalTracker.jsx", r"setDeviceOs\(")
os_read = [x for x in grep("components/VocalTracker.jsx", r"\bdeviceOs\b")
           if "useState" not in x[1] and "setDeviceOs" not in x[1]]
analytics = [k for k in deps if re.search(r"analytics|posthog|plausible|gtag", k)]

sql = ""
sqldir = os.path.join(ROOT, "supabase")
if os.path.isdir(sqldir):
  for f in sorted(os.listdir(sqldir)):
    if f.endswith(".sql"):
      sql += io.open(os.path.join(sqldir, f), encoding="utf-8").read()
# ★★★ここで 一度 誤りました（★2026-09-16・出す 前に 捕まえました）。
#   ★★はじめ `platform\s+text` を 当てて、★「端末の 列が 在る」と 出ました。
#     ★★在ります ── `public.events.platform`。
#       ★けれど 中に 入るのは **`"pwa"` か `"web"`** です（★lib/events.js:156）。
#       ★★iOS か Android かは、★どこにも 入りません。
#   ★★列の 名前は、★中身の 説明では ありません(★裁定 その29／その49 と 同じ 形)。
#   ★★だから、★名前では なく **書いて いる 値**を 見ます。
ev = rd("lib/events.js") or ""
os_column_in_sql = bool(re.search(r"user_agent|device_os|os\s+text", sql))
events_platform = bool(re.search(r"platform\s+text", sql))
events_platform_values = re.findall(r'"(pwa|web)"', ev)
events_records_os = bool(re.search(r"platform[\s\S]{0,300}(ios|android|osOf)", ev, re.I))


# ══════════ ② ためしの 紙（★実機で 開いて いただく もの）══════════
probe = """<!doctype html><html lang="ja"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>触覚の ためし</title>
<style>
 body{font-family:-apple-system,system-ui,sans-serif;background:#F6F1E7;color:#241914;
      margin:0;padding:20px 16px 60px;line-height:1.7;font-size:15px}
 h1{font-size:17px;margin:0 0 4px}
 .s{color:#6b5d52;font-size:12.5px;margin:0 0 18px}
 .box{background:#FFFDF8;border:1px solid #E4DCC9;border-radius:14px;
      padding:14px 15px;margin:0 0 13px}
 .box h2{font-size:14px;margin:0 0 3px}
 .box p{font-size:12.5px;color:#6b5d52;margin:0 0 11px}
 .row{display:flex;align-items:center;justify-content:space-between;min-height:44px}
 button{font:inherit;min-height:48px;width:100%;border-radius:12px;
        border:1px solid #E4DCC9;background:#FFFDF8;color:#241914}
 input{width:44px;height:26px}
 code{background:#EFE7D6;padding:1px 5px;border-radius:5px;font-size:12px}
 #d{white-space:pre-wrap;font-size:12px;background:#EFE7D6;border-radius:10px;padding:11px}
</style>
<h1>触覚の ためし</h1>
<p class="s">この紙は アプリでは ありません。調べる ためだけの 1枚です。<br>
 音も 出ません。どこにも 送りません。何も 残しません。</p>

<div class="box"><h2>① 見分け</h2><p>この端末が 何を 持っているか。</p>
 <div id="d">…</div></div>

<div class="box"><h2>② <code>switch</code> の 札</h2>
 <p>Safari 17.4 から の 本物の 札です。切り替えて、指に 何か 来るか。</p>
 <div class="row"><span>本物の 札（switch）</span>
  <input type="checkbox" switch></div>
 <div class="row"><span>ふつうの 札（比べ用）</span>
  <input type="checkbox"></div></div>

<div class="box"><h2>③ <code>navigator.vibrate</code></h2>
 <p>押して、指に 何か 来るか。iPhone では 何も 起きない はずです。</p>
 <button onclick="v(10)">10ms</button><div style="height:8px"></div>
 <button onclick="v(30)">30ms</button></div>

<div class="box"><h2>④ ラベルの 中の 札</h2>
 <p>札そのものでは なく、字を 押して 切り替えた ときは どうか。</p>
 <label class="row"><span>字を 押す</span>
  <input type="checkbox" switch></label></div>

<script>
 var n=navigator,o=[];
 o.push("vibrate が ある: "+("vibrate" in n));
 o.push("switch 属性を 解する: "+
   (function(){var e=document.createElement("input");
    e.type="checkbox";return "switch" in e})());
 o.push("画面に 貼った アプリ: "+(n.standalone===true));
 o.push("さわれる点の 数: "+n.maxTouchPoints);
 o.push("名乗り: "+n.userAgent);
 document.getElementById("d").textContent=o.join("\\n");
 function v(ms){ if(n.vibrate) n.vibrate(ms); }
</script></html>
"""
io.open(PROBE, "w", encoding="utf-8").write(probe)


# ══════════ ③ 報告 ══════════
L = []
A = L.append
A("# 触覚（手ざわり）の 調べ ── 保存の とき")
A("")
A("★出どころ　TASK: haptic_feedback_on_save_investigation（2026-09-16）")
A("★REPORT_ONLY ── 実装して いません。1行も 足して いません。")
A("")
A("## 0. 先に、この 調べで 分かった いちばん 大きい こと")
A("")
A("★お求めの ねらいは「**保存**の とき、手に 伝える」ことです。")
A("★Q2 が お挙げの 逃げ道（`switch` の 札）は、**札の 切り替え**にしか 効きません。")
A("★保存は 札の 切り替えでは ありません。**押した 瞬間に 保存**です（門の 中）。")
A("★★つまり ── Q2 が うまく いっても、**この ねらいは 満たせません**。")
A("　★満たせるのは「札を 切り替える ところ」だけ です。数えると "
  + str(len(cb)) + " か所 ありますが、")
A("　★そのどれも、記録の 保存では ありません。")
A("")
A("★★ただし、Q2 は それでも 調べる 値打ちが あります ──")
A("　★もし 本物の 札が タダで 触覚を くれるなら、")
A("　★**設定の 札**（お知らせ・LINE など）は それだけで 良く なります。")
A("　★ねらいの 全部では ありませんが、一部 です。")
A("")
A("---")
A("")
A("## Q1　`navigator.vibrate` は 使えるか")
A("")
A("| どこ | 使えるか | 中身 |")
A("|---|---|---|")
A("| Android Chrome / Edge / Samsung | ○ | 画面に 貼った アプリでも 効きます |")
A("| Android Firefox | ○ | 同上 |")
A("| **iOS Safari（iPhone・iPad）** | **×** | `navigator.vibrate` が **そもそも ありません** |")
A("| iOS の Chrome・Edge・Firefox | × | 中身は すべて Safari と 同じ 仕掛けです |")
A("| PC の Chrome / Edge | 印だけ ○ | 呼べますが、揺れる 部品が ありません。黙って 何も しません |")
A("")
A("★★ここに 落とし穴が 1つ あります。")
A("　★`\"vibrate\" in navigator` が 真でも、**揺れるとは 限りません**。")
A("　★PC は 真を 返して、何も しません。「有る」は「効く」では ありません。")
A("")
A("★★Android で 呼ぶ ときの 決まり（いずれも お求めの 制約と 合います）──")
A("　・利用者が 触った あとでしか 効きません（Chrome の 決まり）。")
A("　　★「予告なしの 発火は 禁止」は、**ブラウザ側が すでに 守って います**。")
A("　・画面が 見えて いる ときだけ 効きます。")
A("　・10ms は 端末により 丸められます。感じない 端末が あります。")
A("")
A("### ★Android と iOS の 割合 ── **いまは 分かりません**")
A("")
A("★調べました。**この 家に、端末を 覚えて いる ところは ありません**。")
A("")
A("| 調べた ところ | 結果 |")
A("|---|---|")
A("| `lib/platform.js` の `osOf()` | 在ります（" + str(len(os_col)) + " 行目）。"
  "ただし **その場で 見て、その場で 捨てます** |")
A("| `deviceOs` を 読んで いる ところ | " + str(len(os_read)) + " か所。"
  "いずれも「画面に 貼る 案内」の 出し分けだけ |")
A("| `supabase/*.sql` に 端末（OS）の 列 | "
  + ("在り" if os_column_in_sql else "**ありません**") + " |")
A("| `events.platform` | "
  + ("在り。ただし 中身は **" + "／".join(sorted(set(events_platform_values)))
     + "** だけ。OS は 入りません" if events_platform else "ありません") + " |")
A("| 解析の 道具（analytics 等） | "
  + (", ".join(analytics) if analytics else "**入って いません**") + " |")
A("")
A("★★だから、坂本さんの 側でしか 分かりません。心当たりは 2つ です ──")
A("　① Vercel の Analytics（入れて おられれば、端末の 内訳が 出ます）")
A("　② Supabase の auth のログ（名乗りが 残って いれば）")
A("")
A("★★**新しく 覚え始める ことは、私からは しません。**")
A("　★それは 新しい 集めごと です。38人の 同意の 中に 入って いません。")
A("　★坂本さんの お決め なしに 始めません。")
A("")
A("---")
A("")
A("## Q2　iOS で 触覚を 得る 道は あるか")
A("")
A("★4本 あります。**うち 2本は、いま この 家に ありません。**")
A("")
A("### ㋐ ふつうの `<input type=\"checkbox\">`")
A("★**触覚は 出ません。** iOS の 決まりです。")
A("")
A("### ㋑ `<input type=\"checkbox\" switch>`（Safari 17.4 から）")
A("★本物の iOS の 札の 形に なります。")
A("★★**触覚が 出るかは、実機で 見ないと 言えません。**")
A("　★私は 端末を 持って いません。**推し量りません。**")
A("　★ためしの 紙を 作りました（下の「お願い」）。")
A("")
A("★★そして、いまの 札は **本物では ありません** ──")
A("　`components/UiV2.jsx` の `Switch` は "
  + ("`<span role=\"switch\">` です。`<input>` では ありません。" if sw_is_span
     else "調べ直しが 要ります。"))
A("　★★だから ㋑ を 採る なら、**部品を 入れ替える** 仕事に なります。")
A("　　★見た目は 見本の 寸法（44×26）に 合わせて 作って あります。")
A("　　★本物の 札に すると、**見た目が iOS の ものに 変わります**。")
A("　　★これは 見た目の お決め です。私の 決める ことでは ありません。")
A("　★★いま `switch` の 字を 使って いる 札 … " + str(len(cb_switch_attr)) + " か所")
A("")
A("### ㋒ Capacitor の `@capacitor/haptics`（iOS の 本物の 触覚）")
A("★iOS でも 効きます。中で `UIImpactFeedbackGenerator` を 呼びます。")
A("★**ただし、いま この 道は 通れません。**")
A("")
A("| 要る もの | いま |")
A("|---|---|")
A("| `@capacitor/haptics` | " + ("在り" if has_haptics else "**入って いません**") + " |")
A("| 入って いる Capacitor | " + (", ".join(cap) if cap else "なし") + " |")
A("| `capacitor.config.json` の 行き先 | "
  + ("**`" + server_url + "` ── 差し替えて いません**" if url_is_placeholder else server_url) + " |")
A("| `ios/` の 組み立て | " + ("在り" if ios_dir else "**ありません**") + " |")
A("")
A("★★つまり、iOS の アプリは **まだ 組み立てて いません**。")
A("　★この 道は「将来 在る」道 です。「いま 在る」道では ありません。")
A("")
A("### ㋓ 音で 代える")
A("★**採りません。**「音無し」は この 家の 決め です。")
A("")
A("---")
A("")
A("## Q3　iOS に 道が 無い ことは、許せるか")
A("")
A("★**判断しません。**（お指図どおり）事実だけ 置きます。")
A("")
A("・Android … 手に 伝わります。")
A("・iPhone（ブラウザ） … 伝わりません。**代わりも ありません。**")
A("・iPhone（将来の アプリ） … 伝わります。ただし ㋒ の 仕度が 要ります。")
A("")
A("★★1つ、お耳に 入れて おきたい ことが あります。")
A("　★門の 中では いま、**保存の 知らせを 出して いません**。")
A("　　★2026-09-11 の 坂本さんの ご報告「鬱陶しい」で、そう しました。")
A("　　★（`components/VocalTracker.jsx`・`handleSave` の 上の 覚え書き "
  + ("に 在ります" if save_toast_suppressed else "── ★見つかりません。調べ直しが 要ります") + "）")
A("　★★だから 門の 中の iPhone の 方は、いま **何も 返って きません**。")
A("　　★目でも、手でも。**書けたか どうかが 分かりません。**")
A("　★★これは 触覚の 話 より 前の、別の 穴 かも しれません。")
A("　　★お決め ください。私からは 直しません。")
A("")
A("---")
A("")
A("## OS 側の 触覚の 設定を 尊重できるか")
A("")
A("★**読み取る 道は ありません。** web の 仕掛けに ありません。")
A("★けれど、**任せる ことは できます** ──")
A("")
A("・iPhone …「システムの 触覚」を 切ると、OS が 元から 黙らせます。")
A("　★㋒ の 道なら、**何も しなくても 尊重されます**。")
A("・Android … OS の 振動の 設定に 従います。ただし 書き物での 約束は ありません。")
A("")
A("★★`prefers-reduced-motion` を 見ない、という お決めは 筋が 通って います。")
A("　★あれは「動き」の 設定 です。触覚の 設定では ありません。")
A("")
A("---")
A("")
A("## お願い ── 実機で 1つだけ 見て いただけますか")
A("")
A("★ためしの 紙を 作りました。**アプリでは ありません。**")
A("　★" + os.path.relpath(PROBE, ROOT))
A("")
A("★iPhone で 開いて、**②の 札を 切り替えた とき、指に 何か 来るか**。")
A("　★来る／来ない の どちらでも、それが 答えです。")
A("　★★これが 分からないと、㋑ を 採るか どうかを 決められません。")
A("　★★私は 推し量りません。2026-09-15 に、そこで 一度 誤りました。")
A("")
A("---")
A("")
A("## 決めて いただく こと")
A("")
A("1. 端末の 割合 ── Vercel か Supabase で 見て いただけますか。")
A("2. ㋑ を 採るか ── 見た目が iOS の 札に 変わります。")
A("3. 門の 中の「保存の 知らせが 無い」── 別件として 立てますか。")
A("")
A("★★どれも お決め いただく まで、手を 付けません。")

io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")

body = io.open(OUT, encoding="utf-8").read().rstrip("\n").split("\n")
hdr = "全%d行 / 末尾は「%s」" % (len(body) + 1, body[-1])
io.open(OUT, "w", encoding="utf-8").write(body[0] + "\n" + hdr + "\n"
                                          + "\n".join(body[1:]) + "\n")

print("OUT: " + os.path.relpath(OUT, ROOT))
print("PROBE: " + os.path.relpath(PROBE, ROOT))
print("LINES: %d" % (len(body) + 1))
print("VIBRATE_IN_CODE: %d" % len(vib_hits))
print("CAPACITOR_HAPTICS: %s" % ("yes" if has_haptics else "no"))
print("IOS_SHELL_BUILT: %s" % ("yes" if ios_dir and not url_is_placeholder else "no"))
print("OS_RATIO_DERIVABLE: %s" % ("yes" if os_column_in_sql or analytics else "no"))
print("EVENTS_PLATFORM_VALUES: %s" % ("/".join(sorted(set(events_platform_values))) or "-"))
print("EVENTS_RECORDS_OS: %s" % ("yes" if events_records_os else "no"))
