#!/usr/bin/env python3
# ★注記に 印（class="note"）が 付いて いるか（★段3a 段階2・2026-09-20）。
#   ★★注記は 約束 その もの です。★機械でも 拾える ように します。
#   ★★読むだけ です。★較正 ── ★印の 無い 例で 当たり、★有る 例で 外れる こと。
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# ★★`lib` の 注記の 並び（★`*_NOTES`）を 画面に 出して いる ところ を 見ます。
MAP = re.compile(r"(\w*NOTES?)\.map\(")
MARK = re.compile(r'className="[^"]*note"|className="note[^"]*"')
# ★★UiV2 の `<Note>` `<Warn>` は、★中で 印を 付けて います。★それも 印 と 見ます。
BUHIN = re.compile(r"<Note\b|<Warn\b")

def calib():
  atari = 'NOTES.map((t) => (<p style={small}>{t}</p>))'
  hazure = 'NOTES.map((t) => (<p className="note" style={small}>{t}</p>))'
  def 印なし(s):
    i = s.find(".map(")
    わ = s[max(0, i - 200):i + 200]
    return not MARK.search(わ) and not BUHIN.search(わ)
  # ★★較正 ── ★部品（`<Note>`）で 包んだ 形も、★印 有り と 見る こと。
  buhin = "<Note>{NOTES.map((t) => (<span>{t}</span>))}</Note>"
  return 印なし(atari) and not 印なし(hazure) and not 印なし(buhin)

def main():
  if not calib():
    print("★止まりました ── ★較正に 落ちました")
    raise SystemExit(1)
  出 = []
  for p in sorted((ROOT / "components").glob("*.jsx")):
    s = p.read_text(encoding="utf-8", errors="replace")
    for m in MAP.finditer(s):
      # ★★印は、★並びの あと（1行ずつ 出す 形）にも、
      #   ★★★前（1つの `<p>` の 中に 並べる 形）にも 付きます。★両方 見ます。
      あと = s[m.end():m.end() + 220]
      まえ = s[max(0, m.start() - 220):m.start()]
      わ = あと + まえ
      if ("<p" in わ and not MARK.search(わ) and not BUHIN.search(わ)):
        n = s.count("\n", 0, m.start()) + 1
        出.append((p.name, n, m.group(1)))
  print(f"★注記の 並びを 出して いて、★印の 無い ところ {len(出)}件")
  for x in 出:
    print(f"  {x[0]}:{x[1]}  {x[2]}")

if __name__ == "__main__":
  main()
