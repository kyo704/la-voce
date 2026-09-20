#!/usr/bin/env python3
# ★§8 の 総ざらい ── ★画面の px や 倍率から 出た 値を、★しまって いないか。
#   ★出どころ `docs/opus/.../ruling-71-sheep-room-coordinates.md` §8。
#   ★★読むだけ です。★1行も 直しません。
#
#   ★★見つけ方（★決め打ちの 見立てを しません）
#     ①しまう ところを 数えます（★台帳への 書き込み・★端末への 覚え書き）。
#     ②px の もと（clientX・getBoundingClientRect・offsetWidth・innerWidth …）
#       ★が 出て くる ところを 数えます。
#     ③**同じ かたまり（関数）の 中**に ①と② が 両方 あるものを「要確かめ」に します。
#       ★★流れを 追い切れません。★だから「無い」を 言わず、★「見る ところ」を 出します。
#     ④しまう 中身の うち、★名前が 大きさ・位置に 見える ものを 拾い、
#       ★その 値の 書きぶりから「割合」か「px」かを 見ます。
#
#   ★★較正 ── ★わざと 当たる 例と、★当たらない 例で 試します。
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIRU = ["components", "lib", "app"]

PX_MOTO = [
  "clientX", "clientY", "getBoundingClientRect", "offsetWidth", "offsetHeight",
  "innerWidth", "innerHeight", "devicePixelRatio", "scrollTop", "scrollLeft",
  "clientWidth", "clientHeight", "pageX", "pageY"
]
SHIMAU = [r"\.insert\(", r"\.upsert\(", r"\.update\(", r"localStorage\.setItem\("]
# ★大きさ・位置に 見える 名（★中身を 見ます）。
AYASHII = re.compile(r"(width|height|left|top|size|scale|zoom|px|x_|_x|y_|_y)", re.I)

def files():
  out = []
  for d in MIRU:
    for p in (ROOT / d).rglob("*"):
      if p.suffix in (".js", ".jsx") and "tests" not in p.parts and "node_modules" not in p.parts:
        out.append(p)
  return sorted(out)

def strip_comments(s):
  # ★★★行の 数を 変えません（★2026-09-20 に 誤りました）。
  #   ★★まとめて 消すと、★改行ごと 消えて 行の 番が ずれます。
  #   ★★報告に 出す 番が、★本文と 合わなく なります。
  def keep_newlines(m):
    return "\n" * m.group(0).count("\n")
  s = re.sub(r"/\*[\s\S]*?\*/", keep_newlines, s)
  return "\n".join(re.sub(r"(^|[^:])//.*$", r"\1", l) for l in s.split("\n"))

def blocks(src):
  """★かたまり（関数）を、★名と 行の 幅で 返します。

     ★★★はじめ「次の 関数の 手前 まで」で 切って いました（★2026-09-20）。
       ★★大きい ファイルでは、★間に ある 何もかもが 入りました。
       ★★関わりの 無い 行を「同じ かたまり」と 数えて いました。
     ★★★中かっこを 数えて、★その 関数の 終わりで 切ります。
  """
  out = []
  pat = re.compile(r"(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(", re.M)
  for m in pat.finditer(src):
    name = m.group(1)
    i = src.find("{", m.end())
    if i < 0:
      continue
    depth, j, n = 0, i, len(src)
    while j < n:
      c = src[j]
      if c == "{":
        depth += 1
      elif c == "}":
        depth -= 1
        if depth == 0:
          break
      j += 1
    start = src.count("\n", 0, m.start()) + 1
    end = src.count("\n", 0, min(j, n - 1)) + 1
    out.append((name, start, end))
  return out

def sweep():
  hits, stores = [], []
  for p in files():
    raw = p.read_text(encoding="utf-8", errors="replace")
    src = strip_comments(raw)
    lines = src.split("\n")
    rel = str(p.relative_to(ROOT))
    px_lines = [i + 1 for i, l in enumerate(lines)
                if any(k in l for k in PX_MOTO)]
    st_lines = [i + 1 for i, l in enumerate(lines)
                if any(re.search(r, l) for r in SHIMAU)]
    if not px_lines or not st_lines:
      if st_lines:
        stores.append((rel, len(st_lines)))
      continue
    for name, a, b in blocks(src):
      inp = [n for n in px_lines if a <= n <= b]
      ins = [n for n in st_lines if a <= n <= b]
      if inp and ins:
        hits.append({"file": rel, "block": name, "px": inp, "store": ins})
    stores.append((rel, len(st_lines)))
  return hits, stores

def named_values():
  """★しまう 中身の うち、★大きさ・位置に 見える 名 と その 値。"""
  out = []
  for p in files():
    src = strip_comments(p.read_text(encoding="utf-8", errors="replace"))
    rel = str(p.relative_to(ROOT))
    for m in re.finditer(r"\.(?:insert|upsert|update)\(\s*\{([^}]{0,600})\}", src):
      for kv in re.finditer(r"(\w+)\s*:\s*([^,\n]{1,80})", m.group(1)):
        k, v = kv.group(1), kv.group(2).strip()
        if AYASHII.search(k):
          kind = ("px" if any(x in v for x in PX_MOTO)
                  else "割合" if re.search(r"Pct|percent|/ 100|\* 100", v)
                  else "その他")
          out.append((rel, k, v[:60], kind))
  return out

def positions():
  """★羊の 部屋の 置き場所 ── ★何で しまって いるか（★§2 の ②）。"""
  out = []
  for rel in ["components/VocalTracker.jsx", "components/InteriorLayer.jsx",
              "components/CharacterHome.jsx"]:
    p = ROOT / rel
    if not p.exists():
      continue
    src = strip_comments(p.read_text(encoding="utf-8", errors="replace"))
    for m in re.finditer(r"(interiorPositions|Positions`|leftPct|topPct)[^\n]{0,110}", src):
      n = src.count("\n", 0, m.start()) + 1
      out.append((rel, n, m.group(0).strip()[:90]))
  return out

def calibrate():
  """★当たる 例（★px の もとを 使い、★しまう）と、★当たらない 例。

     ★★★かたまりの 切り方も 一緒に 試します（★2026-09-20 に 誤りました）。
       ★★「次の 関数の 手前 まで」で 切ると、★関わりの 無い 行まで 入り、
         ★★同じ かたまりに 見えて しまいます。
  """
  atari = ("function f(){ const r = el.getBoundingClientRect();"
           " db.insert({ w: r.width }); }")
  hazure = ("function g(){ db.insert({ w: 100 }); }\n"
            "function h(){ const r = el.getBoundingClientRect(); return r.width; }")
  def hit(s):
    src = strip_comments(s)
    lines = src.split("\n")
    px = [i + 1 for i, l in enumerate(lines) if any(k in l for k in PX_MOTO)]
    st = [i + 1 for i, l in enumerate(lines)
          if any(re.search(r, l) for r in SHIMAU)]
    for _, a, b in blocks(src):
      if [n for n in px if a <= n <= b] and [n for n in st if a <= n <= b]:
        return True
    return False
  # ★★当たる 例で 当たり、★2つの 関数に 分かれた 例では 外れる こと。
  return hit(atari) and not hit(hazure)

def main():
  hits, stores = sweep()
  vals = named_values()
  ok = calibrate()
  L = []
  L.append("# ★§8 総ざらい ── ★画面の px を、★ほかに しまって いないか\n")
  L.append("★この 紙は `tools/px_sweep.py` が 書きました。★手で 足して いません。")
  L.append(f"★道具の 較正 …… {'○ 見分けられました' if ok else '✗ 見分けられません'}"
           "（★わざと 当たる 例で 当たり、★当たらない 例で 外れる）\n")
  L.append(f"★見た ファイル {len(files())}本 ／ ★しまう ところの ある ファイル {len(stores)}本\n")

  L.append("\n## ★一 ★同じ かたまりに「px の もと」と「しまう」が 両方 ある ところ\n")
  if not hits:
    L.append("★1つも ありません。")
  else:
    L.append("| ファイル | かたまり | px の 行 | しまう 行 |")
    L.append("|---|---|---|---|")
    for h in hits:
      L.append(f"| `{h['file']}` | `{h['block']}` | {', '.join(map(str, h['px'][:6]))} "
               f"| {', '.join(map(str, h['store'][:6]))} |")
    L.append("\n★★ここに 出たから といって、★px を しまって いるとは 限りません。"
             "★**見る ところ** です。")

  L.append("\n## ★二 ★しまう 中身の うち、★大きさ・位置に 見える 名\n")
  if not vals:
    L.append("★1つも ありません。")
  else:
    L.append("| ファイル | 名 | 値の 書きぶり | 見立て |")
    L.append("|---|---|---|---|")
    for v in vals:
      L.append(f"| `{v[0]}` | `{v[1]}` | `{v[2]}` | {v[3]} |")

  L.append("\n## ★三 ★羊の 部屋の 置き場所は 何で しまって いるか（★§2 の ②）\n")
  ps = positions()
  if not ps:
    L.append("★見つかりません。")
  else:
    L.append("| ファイル | 行 | 書きぶり |")
    L.append("|---|---|---|")
    for x in ps:
      L.append(f"| `{x[0]}` | {x[1]} | `{x[2]}` |")

  p = ROOT / "docs/reports/2026-09-20-§8-pxの総ざらい.md"
  p.write_text("\n".join(L) + "\n", encoding="utf-8")
  print(p)
  print(f"hits={len(hits)} named={len(vals)} calib={'ok' if ok else 'ng'}")

if __name__ == "__main__":
  main()
