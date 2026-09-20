#!/usr/bin/env python3
# ★節の 見出しが、★見出しの 印（h1〜h3）に なって いるか（★D109・2026-09-20）。
#   ★★読み上げの 道具と、★骨組みの くらべ の 両方に 効きます。
#   ★★読むだけ です。★1行も 直しません。
#   ★★較正 ── ★わざと `<p>` の 例で 当たり、★`<h3>` の 例で 外れる こと。
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIRU = sorted((ROOT / "components").glob("Ops*.jsx"))

# ★★節の 見出しに 見える 書き方 ── ★`marginBottom` を 持つ 小さな 字 の `<p>`。
AYASHII = re.compile(r"<p style=\{\{ \.\.\.small, marginBottom: \d+ \}\}>([^<]{1,30})</p>")

def calib():
  atari = '<p style={{ ...small, marginBottom: 6 }}>きょうの ながれ</p>'
  hazure = '<h3 style={{ ...small, marginBottom: 6 }}>きょうの ながれ</h3>'
  return bool(AYASHII.search(atari)) and not AYASHII.search(hazure)

def main():
  if not calib():
    print("★止まりました ── ★較正に 落ちました")
    raise SystemExit(1)
  出 = []
  for p in MIRU:
    s = p.read_text(encoding="utf-8", errors="replace")
    for m in AYASHII.finditer(s):
      n = s.count("\n", 0, m.start()) + 1
      出.append((p.name, n, m.group(1).strip()))
  print(f"★見た ファイル {len(MIRU)}本 ／ ★見出しの 印が 無い 節 {len(出)}件")
  for x in 出:
    print(f"  {x[0]}:{x[1]}  {x[2]}")

if __name__ == "__main__":
  main()
