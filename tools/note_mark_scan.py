#!/usr/bin/env python3
# ★注記の 印（class="note" など）が、★画面に ほんとうに 出るか（★段3a 段階2・2026-09-20）。
#
#   ★★★もとの 道具（`note_mark_check.py`）は `*_NOTES.map(` の 形 だけ を 見て いました。
#     ★★実機の 名簿は `rosterNotes()` を 呼びます。★名が ちがい、★見落として いました。
#
#   ★★見つけ方 ── ★名で 探さず、★**注記の 並びを `.map(` で 回して いる ところ** を 探します。
#
#   ★★★3つの 直し（★2026-09-20・最初の 6件を 1件ずつ 見た あと）──
#     ★① 名は **終わりで** 見ます（`…NOTE` / `…NOTES` / `…Notes`）。
#        ★★`NOTE_KINDS` は 注記では ありません。★ノートの **種類** の 帯 です。
#        ★★頭で 見て いたので、★注記だと 思って いました。
#     ★② 近さは **説明を 除いた 字** で 測ります。
#        ★★`OpsPosts.jsx` は `<Note fold>` の 中に 在りましたが、★あいだに 長い 説明が あり、
#          ★★440字 離れて 見えて いました。★印は 有ったのに、★無いと 報せて いました。
#     ★③ 印に `wl` を 足します。★見本にも `.wl` が 在ります（★`--band2` の 箱）。
#        ★★`Warn`（#F6F1E4）とは 別の 箱 です。★見本が 使い分けて います。
#
#   ★★較正 ── ★印の 無い 例で 当たり、★次の 4つで 外れる こと。
#     ★className で 印が 有る ／ 部品（`<Note>`）で 囲う ／
#     ★部品と あいだに 長い 説明が 在る ／ `NOTE_KINDS` の ような 頭だけ 一致。
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ★名は 終わりで 見ます。★`NOTE_KINDS` を 拾いません。
YOBI = re.compile(r"\b(\w*(?:NOTE|NOTES|Note|Notes))\s*(?:\(\))?\s*\.map\(")
# ★印 ── ★見本が 使う 4つ（note / warn / usu / wl）。
MARK = re.compile(r'className="[^"]*\b(?:note|warn|usu|wl)\b[^"]*"')
BUHIN = re.compile(r"<(?:Note|Warn|Usu|Wl)\b")
MADO = 400  # ★説明を 除いた 字 で 前後 400字

def 説明をのぞく(s):
  """★`/* */` と `//` を 取り除き、★残った 字 の もとの 位置 を 返します。"""
  出, 位 = [], []
  i, n = 0, len(s)
  while i < n:
    if s.startswith("/*", i):
      j = s.find("*/", i + 2)
      i = n if j < 0 else j + 2
      continue
    if s.startswith("//", i):
      j = s.find("\n", i)
      i = n if j < 0 else j
      continue
    出.append(s[i]); 位.append(i); i += 1
  return "".join(出), 位

def 印なし(s):
  き, 位 = 説明をのぞく(s)
  出 = []
  for m in YOBI.finditer(き):
    わ = き[max(0, m.start() - MADO):m.end() + MADO]
    if MARK.search(わ) or BUHIN.search(わ):
      continue
    出.append((位[m.start()], m.group(1)))
  return 出

def calib():
  なし = 'rosterNotes().map((t) => (<span>{t}</span>))'
  あり = '<p className="note">{rosterNotes().map((t) => (<span>{t}</span>))}</p>'
  部品 = '<Note>{rosterNotes().map((t) => (<span>{t}</span>))}</Note>'
  遠い = '<Note fold>\n{/* ' + ("★" * 300) + ' */}\n{TABLE_NOTES.map((n) => (<span>{n}</span>))}</Note>'
  種類 = 'NOTE_KINDS.map((k) => ({ key: k.key }))'
  return (len(印なし(なし)) == 1 and not 印なし(あり) and not 印なし(部品)
          and not 印なし(遠い) and not 印なし(種類))

def main():
  if not calib():
    print("★止まりました ── ★較正に 落ちました")
    raise SystemExit(1)
  出 = []
  for p in sorted((ROOT / "components").rglob("*.jsx")):
    if "tests" in p.parts:
      continue
    s = p.read_text(encoding="utf-8", errors="replace")
    for もと, 名 in 印なし(s):
      出.append((p.name, s.count("\n", 0, もと) + 1, 名))
  print(f"★注記を 出して いて、★印の 無い ところ {len(出)}件")
  for x in 出:
    print(f"  {x[0]}:{x[1]}  {x[2]}")
  return len(出)

if __name__ == "__main__":
  main()
