#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""「もっと」の 先の 画面 ── ★まず 一覧を 作る（2026-09-15）。

  ★出どころ 坂本さん ──「数が 多いので、★まず 全画面の 一覧と
    見本の 有無を 先に 報告して ください」

  ★★見る のは 3つ です。
    ① アプリ側 … その 行を 押すと **何が 起きるか**
    ② 見本側　 … 対応する 画面が **在るか**（★SC[] ／ SH[]）
    ③ 比べられるか … ★道具が 当てられる 形か

  ★★見本には 2つの 形が あります。
    ★SC['名'] … 1枚の 画面（★push で 行く）
    ★SH['名'] … 下から 出る 引き出し（★openSheet）
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MI = os.path.join(ROOT, "docs", "design", "pack-final",
                  "00-動く見本（さわれる・全画面）.html")
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-15-もっとの先-一覧.md")

RAW = io.open(MI, encoding="utf-8").read()
SC = set(re.findall(r"SC\['([^']+)'\]\s*=", RAW))
SH = set(re.findall(r"SH\['([^']+)'\]\s*=", RAW))

UI = io.open(os.path.join(ROOT, "components", "VocalTracker.jsx"), encoding="utf-8").read()
MM = io.open(os.path.join(ROOT, "lib", "moreMenu.js"), encoding="utf-8").read()


def app_mechanism(key):
  """★その 行を 押すと、★アプリは 何を するか。"""
  if key == "もっているもの":
    return ("setOwnedOpen(true)", "★別の 引き出し（★羊の 持ちもの）")
  if re.search(r'key: "%s".*sheet: true' % re.escape(key), MM):
    return ("setRecordSheet", "★下から 出る 紙")
  if key in ("書き出す", "退会"):
    return ('setMoreSection("じぶんの記録")', "★★2つが **同じ 1枚**を 開きます")
  if ('moreSection === "%s"' % key) in UI:
    return ('moreSection === "%s"' % key, "★その 行 専用の 1枚")
  if ('inMore("%s")' % key) in UI:
    n = len(re.findall(r'inMore\("%s"\)' % re.escape(key), UI))
    return ('inMore("%s") × %d' % (key, n), "★もっとの 中で 出し隠し")
  return ("setMoreSection(\"%s\")" % key, "★★行き先の 中身が 見あたりません")


# ★行 → 見本の 名前（★押した 先）
ROWS = [
  ("設定", "設定", "SC"),
  ("聞く", "聞いてほしいこと", "SC"),
  ("アカウント", "account", "SH"),
  ("プラン", "プラン", "SC"),
  ("学ぶ", "学ぶ", "SC"),
  ("もっているもの", "motteru", "SH"),
  ("区切り", None, None),
  ("書き出す", "書き出す", "SC"),
  ("退会", "退会", "SC"),
  ("運営", None, None),
]

LABEL = {}
for m in re.finditer(r'key: "([^"]+)", label: "([^"]+)"', MM):
  LABEL[m.group(1)] = m.group(2)


def build():
  L = []
  w = L.append
  w("# 「もっと」の 先の 画面 ── ★一覧（比べる 前）")
  w("")
  w("")
  w("★2026-09-15 ／ ★この 文は tools/motto_children_inventory.py が 書き出しました。")
  w("★見本の 画面 SC[] %d 枚 ／ 引き出し SH[] %d 枚 を 数えました。" % (len(SC), len(SH)))
  w("")
  w("## 一覧")
  w("")
  w("| # | 行 | 見本に | アプリの しかけ | 比べられるか |")
  w("|---|---|---|---|---|")
  rows = []
  for i, (key, mihon, kind) in enumerate(ROWS, 1):
    label = LABEL.get(key, key)
    if mihon is None:
      has = "★★ありません"
    elif kind == "SC":
      has = "★SC['%s']" % mihon if mihon in SC else "★★ありません"
    else:
      has = "★SH['%s']" % mihon if mihon in SH else "★★ありません"
    mech, note = app_mechanism(key)
    can = "★できます" if has.startswith("★S") else "★★比べる 相手が ありません"
    w("| %d | %s | %s | `%s` | %s |" % (i, label, has, mech, can))
    rows.append({"key": key, "label": label, "has": has, "mech": mech,
                 "note": note, "can": can})
  w("")
  w("## しかけの 内訳")
  w("")
  w("| 行 | どう 開くか |")
  w("|---|---|")
  for r in rows:
    w("| %s | %s |" % (r["label"], r["note"]))
  w("")
  w("## ★気づいた こと（★比べる 前に）")
  w("")
  w("★★① 「書き出す（CSV・JSON）」と「退会する」は、★**同じ 1枚**を 開きます。")
  w("　`setMoreSection(\"じぶんの記録\")` ── ★行は 2つ、★行き先は 1つ です。")
  w("　★★見本は `SC['書き出す']` と `SC['退会']` の **2枚** です。")
  w("")
  w("★★② 「もっているもの」だけ、★別の しかけ です（`setOwnedOpen(true)`）。")
  w("　★見本も `SH['motteru']`（★引き出し）なので、★形は 合って います。")
  w("")
  w("★★③ 「ここから区切りをつける」は、★見本に ありません。")
  w("　★2026-09-11 に 記録の 画面から 引っ越して きた ものです（★お決め 10 ㋑）。")
  w("　★見本は その 引っ越しより **前** の 姿 です。★比べる 相手が ありません。")
  w("")
  w("★★④ 「運営モード」は、★見本では もっとの 中の 1行ですが、")
  w("　★アプリでは **教室ごとに 1行**（★`★50通り-03-事務長 の 運営` など）に なって います。")
  w("　★見本は `○○音楽大学 の 運営` の 1行 だけ です。")
  w("")
  w("## ★次に する こと")
  w("")
  w("| | |")
  w("|---|---|---|")
  w("| 比べられる | 設定 ／ 聞いてほしいこと ／ アカウント ／ プラン ／ 学ぶ ／ もっているもの ／ 書き出す ／ 退会 ── ★**8枚** |")
  w("| 比べる 相手が ない | ここから区切りをつける ／（運営モードは 形が ちがう） |")
  w("")
  w("★★`tools/screen_vs_mihon.py` の `SCREENS` に、★8枚ぶんの")
  w("　★**読む ファイルの 一覧**を 書く 必要が あります。")
  w("　★★ここが、★今日 2度 まちがえた ところ です（★A05 と もっと）。")
  w("　★★だから、★1枚ずつ 作って、★1枚ずつ 確かめます。★まとめて 書きません。")

  body = [x for x in L if x.strip()]
  L[1] = "全%d行 / 末尾は「%s」" % (len(L), body[-1])
  io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
  n = len(io.open(OUT, encoding="utf-8").read().rstrip("\n").split("\n"))
  L[1] = "全%d行 / 末尾は「%s」" % (n, body[-1])
  io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
  print("★書き出しました:", OUT, n, "行")
  for r in rows:
    print("  %-22s %-22s %s" % (r["label"], r["has"], r["mech"]))


if __name__ == "__main__":
  build()
