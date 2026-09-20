#!/usr/bin/env python3
# ★注記の 印（class="note"）が、★画面に ほんとうに 出るか（★段3a 段階2・2026-09-20）。
#
#   ★★★`*_NOTES.map(` の 形 だけ を 見て いました（`note_mark_check.py`）。
#     ★★実機の 名簿は `rosterNotes()` を 呼びます。★名が ちがいます。
#     ★★だから 見落として いました。★印の 無い 注記が 残って いました。
#
#   ★★見つけ方 ── ★`lib/` が 持つ 注記の 並び を **名で 探さず**、
#     ★★画面が 出して いる ところ を 探します ──
#     ★`…Notes()` ／ `…NOTES` ／ `…_NOTE` を `.map(` で 回して いる ところ。
#   ★★較正 ── ★印の 無い 例で 当たり、★有る 例と 部品（`<Note>`）で 外れる こと。
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
YOBI = re.compile(r"(\w*(?:NOTES?|Notes|_NOTE)\w*)\s*(?:\(\))?\s*\.map\(")
MARK = re.compile(r'className="[^"]*\bnote\b[^"]*"')
BUHIN = re.compile(r"<Note\b|<Warn\b|<Usu\b")

def calib():
  なし = 'rosterNotes().map((t) => (<span>{t}</span>))'
  あり = '<p className="note">{rosterNotes().map((t) => (<span>{t}</span>))}</p>'
  部品 = '<Note>{rosterNotes().map((t) => (<span>{t}</span>))}</Note>'
  def 印なし(s):
    m = YOBI.search(s)
    if not m:
      return False
    わ = s[max(0, m.start() - 220):m.end() + 220]
    return not MARK.search(わ) and not BUHIN.search(わ)
  return 印なし(なし) and not 印なし(あり) and not 印なし(部品)

def main():
  if not calib():
    print("★止まりました ── ★較正に 落ちました")
    raise SystemExit(1)
  出 = []
  for p in sorted((ROOT / "components").rglob("*.jsx")):
    if "tests" in p.parts:
      continue
    s = p.read_text(encoding="utf-8", errors="replace")
    for m in YOBI.finditer(s):
      わ = s[max(0, m.start() - 220):m.end() + 220]
      if MARK.search(わ) or BUHIN.search(わ):
        continue
      n = s.count("\n", 0, m.start()) + 1
      出.append((p.name, n, m.group(1)))
  print(f"★注記を 出して いて、★印の 無い ところ {len(出)}件")
  for x in 出:
    print(f"  {x[0]}:{x[1]}  {x[2]}")

if __name__ == "__main__":
  main()
