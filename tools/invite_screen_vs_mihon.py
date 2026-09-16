# -*- coding: utf-8 -*-
"""★「生徒を 招待する」の 画面 ── ★見本との 突き合わせ（★2026-09-16）。

  ★★きょう 一日、★この 画面だけ 一度も 突き合わせて いません でした。
  ★★4つの 網 ── ★文言／構造／配線／画像。
    ★★画像は 私には 撮れません。★そこは 撮って いない と 書きます。

  ★★3つの 組で 報告します（★坂本さんの お決め・2026-09-16）──
    ① 見本に 在って 実装に 無い …… ★漏れ
    ② 実装に 在って 見本に 無い …… ★足したもの（★わけを 書く）
    ③ 見本に 在るが 意図して 実装して いない …… ★除外（★引き金つき）

  ★★★較正 ── ★当たる はずの ものを 通して から 報告します。
"""

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIHON = os.path.join(ROOT, "docs/design/pack-final/00-動く見本（さわれる・全画面）.html")
VT = os.path.join(ROOT, "components/VocalTracker.jsx")
EXCL = os.path.join(ROOT, "tools/excluded_by_design.json")

for p in (MIHON, VT, EXCL):
  if not os.path.exists(p):
    sys.exit("★止まりました ── 見つかりません: " + p)


def mihon_screen(name):
  """★見本の 1画面を 切り出します。"""
  s = io.open(MIHON, encoding="utf-8").read()
  head = "SC['%s']=function(" % name
  i = s.find(head)
  if i < 0:
    sys.exit("★止まりました ── 見本に SC['%s'] が ありません。" % name)
  j = s.find("\nSC['", i + 1)
  k = s.find("\n/*", i + 1)
  ends = [x for x in (j, k) if x > 0]
  return s[i:min(ends) if ends else i + 6000]


def visible_text(html):
  """★札の 中の 字 だけ を 取り出します（★DOM の 取り出しと 同じ 考え）。"""
  # ★JS の 文字列を つないだ 形 なので、★まず 引用符を ほどきます。
  parts = re.findall(r"'((?:[^'\\]|\\.)*)'", html)
  glued = "".join(p.replace("\\'", "'") for p in parts)
  glued = re.sub(r"<br\s*/?>", "\n", glued)
  glued = re.sub(r"&#10;", "\n", glued)
  glued = re.sub(r"<[^>]+>", "\n", glued)
  out = []
  for line in glued.split("\n"):
    t = line.strip()
    # ★JS の かけら を 落とします。
    if not t or re.match(r"^[\w.\[\]()+,;:=&|!<>{}'\"-]*$", t) and not re.search(r"[ぁ-んァ-ヶ一-龥]", t):
      continue
    out.append(t)
  return out


def mihon_structure(html):
  """★札の 種類の 並び（★構造の 網）。"""
  order = []
  for m in re.finditer(r'class="(h3|usu|warn|note|btn|pill|box|li|card|ta|inp|hd|two)\b', html):
    order.append(m.group(1))
  return order


def jsx_block():
  """★実装の 1枚を 切り出します（★`inviteStudentTitle` の 折りたたみ）。"""
  s = io.open(VT, encoding="utf-8").read()
  # ★★`canSeeBetaFeatures` は ほかにも あります（★歯車の 札 など）。
  #   ★★`inviteStudentTitle` を 持つ ものが、★この 画面 です。
  #   ★★2026-09-16、★はじめ 最初の 1つを 取り、★歯車の 札を 掴んで いました。
  #     ★★較正が 止めました ── ★字が 1つも 取れません でした。
  key = s.find('t("inviteStudentTitle")')
  if key < 0:
    sys.exit("★止まりました ── `inviteStudentTitle` が 見つかりません。")
  i = s.rfind('{canSeeBetaFeatures(profile) && (', 0, key)
  if i < 0:
    sys.exit("★止まりました ── 実装の 折りたたみが 見つかりません。")
  # ★対応する 閉じを、★括弧の つり合いで さがします。
  depth, j = 0, i
  while j < len(s):
    if s[j] == "{":
      depth += 1
    elif s[j] == "}":
      depth -= 1
      if depth == 0:
        break
    j += 1
  return s[i:j + 1]


def jsx_visible(block):
  """★画面に 出る 字（★べた書き と `t("…")` の 鍵）。"""
  raw = re.findall(r">\s*([^<>{}\n][^<>{}]*?)\s*<", block)
  lines = [x.strip() for x in raw if re.search(r"[ぁ-んァ-ヶ一-龥]", x)]
  keys = re.findall(r't\("(\w+)"\)', block)
  return lines, sorted(set(keys))


def translations(keys):
  s = io.open(os.path.join(ROOT, "lib/translations.js"), encoding="utf-8").read()
  out = {}
  for k in keys:
    m = re.search(r'\b' + k + r':\s*\{\s*ja:\s*"([^"]*)"', s)
    if m:
      out[k] = m.group(1)
  return out


def calibrate(mi_text, im_text):
  if not mi_text:
    sys.exit("★止まりました ── 較正に 失敗。見本から 字を 1つも 取れて いません。")
  if not im_text:
    sys.exit("★止まりました ── 較正に 失敗。実装から 字を 1つも 取れて いません。")
  # ★★当たる はずの もの ── ★見本の「送る」は 実装に ありません。
  if any("送る" == x for x in im_text):
    sys.exit("★止まりました ── 較正に 失敗。実装に「送る」は 無い はずです。")
  if not any("メールで お送りします" in x for x in mi_text):
    sys.exit("★止まりました ── 較正に 失敗。見本の 見出しが 取れて いません。")
  return True


def main():
  html = mihon_screen("招く")
  mi_text = visible_text(html)
  mi_struct = mihon_structure(html)
  block = jsx_block()
  im_lines, im_keys = jsx_visible(block)
  im_labels = translations(im_keys)
  im_text = im_lines + list(im_labels.values())
  calibrate(mi_text, im_text)

  excl = json.load(io.open(EXCL, encoding="utf-8"))

  # ★★配線の 網 ── ★どこへ 書き、★何で 守って いるか。
  wiring = {
    "書き先": sorted(set(re.findall(r'from\("(\w+)"\)', block))
                  or re.findall(r'from\("(\w+)"\)',
                                io.open(VT, encoding="utf-8").read()
                                [io.open(VT, encoding="utf-8").read()
                                 .find("async function handleGenerateTeacherInvite"):][:1500])),
    "呼ぶ手": sorted(set(re.findall(r"onClick=\{([\w.]+)\}", block))),
    "門": "canSeeBetaFeatures(profile) … is_admin か teacher_beta_access",
    "layoutV2": ("包まれて いません（★門の 内外 どちらでも 出ます）"
                 if "layoutV2" not in block else "包まれて います"),
  }

  out = []
  w = out.append
  w("# ★「生徒を 招待する」── ★見本との 突き合わせ")
  w("")
  w("★この 行は あとで 差し替えます")
  w("")
  w("生成: `tools/invite_screen_vs_mihon.py`（2026-09-16）")
  w("")
  w("★★較正: 通りました（★見本・実装 とも 字を 取れ、★当たらない はずの ものが 出ません）。")
  w("")
  w("## 〇 ★★どの 見本に 当たるか ── ★**当たる 1枚が ありません**")
  w("")
  w("★★`SC['招く']` が いちばん 近い もの です。★けれど 別の もの でした ──")
  w("")
  w("| | 見本 `SC['招く']` | 実装「生徒を招待する（テスト機能）」|")
  w("|---|---|---|")
  w("| 誰が 使うか | 学校（名簿 → 招く）| 先生 ひとり |")
  w("| 渡し方 | **メール**で 送る | **8文字の 合言葉**を 画面に 出す |")
  w("| 入れる もの | メールアドレス・学年・学科 | 何も 入れない（押すだけ）|")
  w("| 書き先 | （見本は 書きません）| `teacher_invitations` |")
  w("| 戻る 先 | 名簿 | （無し・折りたたみ）|")
  w("")
  w("★★見本の 中で 合言葉に ふれて いるのは、★`SC['招く']` の 注記の **1行 だけ** です ──")
  w("")
  w("> 合言葉（8文字）でも 入れます。教室を こちらから 探すことは できません。")
  w("")
  w("★★つまり 見本は、★合言葉を **出す 側**の 画面を 持って いません。")
  w("★★受ける 側（`SC['合言葉で入る']`）だけ が あります。")
  w("")
  w("## 一 ★文言の 網")
  w("")
  w("### ① 見本に 在って、★実装に 無い")
  w("")
  mi_only = [x for x in mi_text if not any(x in y or y in x for y in im_text)]
  for x in mi_only:
    w("- 「%s」" % x)
  w("")
  w("★★ほとんどが **メールで 招く** ための もの です。")
  w("★★実装は 合言葉を 出す だけ な ので、★入れる 欄が ありません。")
  w("")
  w("★★★けれど、★**仕組みの 話では ない もの**が 混ざって います ──")
  w("")
  # ★★安全の 字 ── ★仕組みが 違っても、★言う べき ことは 同じ です。
  #   ★★「メールの 欄が 無い から 要らない」では ありません。
  SAFETY = ["同意", "18歳未満", "保護者", "ご請求", "見えません", "承知"]
  safety = [x for x in mi_only if any(k in x for k in SAFETY)]
  for x in safety:
    w("- ★「%s」" % x)
  w("")
  w("★★この 4行は、★**渡し方が メールでも 合言葉でも 同じ** こと を 言って います ──")
  w("　★お代の こと、★同意は ご本人から、★18歳未満の 方、")
  w("　★押される まで 相手からは 見えない こと。")
  w("★★実装の 画面には、★1つも ありません。")
  w("★★合言葉を 渡す 先生は、★これを 知らない まま 渡して います。")
  w("★★★ここは「見本と 形が 違う」では なく、★**言う べき ことを 言って いない** です。")
  w("　★★ほかの ①（メールアドレス・学年・学科・送る）とは 重みが 違います。")
  w("")
  w("### ② 実装に 在って、★見本に 無い")
  w("")
  im_only = [x for x in im_text if not any(x in y or y in x for y in mi_text)]
  for x in im_only:
    w("- 「%s」" % x)
  w("")
  w("### ③ 見本に 在るが、★意図して 実装して いない")
  w("")
  w("★★`tools/excluded_by_design.json` に、★この 画面の 棚は ありません。")
  w("★★きょうまで 一度も 突き合わせて いない ため です。")
  w("★★①の うち どれを ここへ 移すかは、★坂本さんの お決めです。")
  w("")
  w("## 二 ★構造の 網")
  w("")
  w("★見本の 並び … `%s`" % " → ".join(mi_struct))
  w("")
  w("★★実装は 折りたたみ（`<details>`）の 中 です。★見本に 折りたたみは ありません。")
  w("★★見本は 1枚の 画面 で、★戻る 道（`bk('名簿')`）を 持ちます。")
  w("★★実装には 戻る 道が ありません。★閉じる だけ です。")
  w("")
  w("## 三 ★配線の 網")
  w("")
  for k, v in wiring.items():
    w("- **%s** … %s" % (k, v if isinstance(v, str) else ", ".join(v) or "（なし）"))
  w("")
  w("★★★`layoutV2` に 包まれて いません。")
  w("　★★「門の 外だけ に 出る」と 聞いて いましたが、★**そうでは ありません**。")
  w("　★★門の 内でも 外でも、★`is_admin` か `teacher_beta_access` の 方に 出ます。")
  w("　★★門の 中の 方は「もっと ▸ 生徒を 招待する」から 来ます（★No.025）。")
  w("")
  w("## 四 ★画像の 網")
  w("")
  w("★★**撮って いません。**")
  w("★★私には 実機の 画面を 撮る 道が ありません。")
  w("★★見た目は 未確認 です。★坂本さんに お撮りいただく ほか ありません。")
  w("")
  w("## 五 ★決めて いただきたい こと")
  w("")
  w("★★この 画面を、★どう 扱うか です。")
  w("")
  w("- ㋐ ★見本に 合わせて 作り直す（★メールで 招く 形に する）")
  w("- ㋑ ★いまの まま 残し、★`__added__` に わけを 書いて 除外する")
  w("- ㋒ ★見本の `SC['招く']` を 学校の 側の 画面と して 別に 作り、")
  w("　★いまの ものは 先生 ひとりの 道と して 残す")
  w("")
  w("★★私は ㋑ が いまは 合って いると 思います ──")
  w("　★この 画面は、★きょう 坂本さんが 合言葉を 発行する のに 使った、")
  w("　★**いま 動いて いる ただ 1つの 入口** です。")
  w("　★見本に 無い から と いって 外すと、★先生の 側の 入口が また 0に なります。")
  w("★★けれど これは 坂本さんの お決め です。")

  body = "\n".join(out) + "\n"
  lines = body.split("\n")
  last = [l for l in lines if l.strip()][-1]
  lines[2] = "全%d行 / 末尾は「%s」" % (len(lines) - 1, last)
  path = os.path.join(ROOT, "docs/reports/2026-09-16-生徒を招待する-見本との突き合わせ.md")
  io.open(path, "w", encoding="utf-8").write("\n".join(lines))
  print(path)
  print("見本の字 %d / 実装の字 %d / ①漏れ %d / ②足したもの %d"
        % (len(mi_text), len(im_text), len(mi_only), len(im_only)))


main()
