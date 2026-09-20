#!/usr/bin/env python3
# ★裁定 その71 §5①③ の いまの 姿を 測り、★そのまま 報告を 書きます。
#   ★★読むだけ です。★1行も 直しません。
#   ★★較正 ── ★当たる はずの ものと、★当たらない はずの もので 試します。
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def yomu(p):
  f = ROOT / p
  return f.read_text(encoding="utf-8", errors="replace") if f.exists() else ""

def sh(*a):
  try:
    return subprocess.run(a, cwd=ROOT, capture_output=True, text=True).stdout.strip()
  except Exception:
    return ""

def kensa():
  d = {}
  stage = yomu("lib/roomStage.js")
  ch = yomu("components/CharacterHome.jsx")
  vt = yomu("components/VocalTracker.jsx")

  # ★① 舞台の 式は 1本か。
  d["stage_exports"] = sorted(re.findall(r"export function (\w+)", stage))
  d["stageSize_exists"] = "stageSize" in d["stage_exports"]
  d["stageStyle_uses"] = "stageFit" if re.search(
    r"export function stageStyle[\s\S]{0,900}?const s = stageFit", stage) else "stageSize/不明"
  d["characterhome_stage"] = "stageFit" if re.search(
    r"const stage = stageFit\(", ch) else "分岐あり"

  # ★③ 倍率は どこで 変わるか。
  m = re.search(r"cameraOn=\{([^}]*)\}", vt)
  d["cameraOn_expr"] = m.group(1).strip() if m else "見つかりません"
  d["zoom_compensated"] = bool(re.search(r"ZOOM / \(stage\.w / roomBoxW\)", ch))
  d["viewband"] = bool(re.search(r"visibleBandPct\(lastViewCamRef\.current\)", ch))

  # ★見本（★4本の うち bigRoom を 持つ 2本）。
  mihon = ["docs/design/pack-final/00-動く見本（さわれる・全画面）.html",
           "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"]
  d["mihon"] = []
  for p in mihon:
    s = yomu(p)
    d["mihon"].append({
      "path": p,
      "exists": bool(s),
      "bigRoom_small": bool(re.search(r"function bigRoom\(small\)", s)),
      "viewBoxes": sorted(set(re.findall(r"'0 0 360 (\d+)'", s))),
      "aspect": sorted(set(re.findall(r'preserveAspectRatio="xMid\w+ (\w+)"', s)))
    })

  # ★見張り。
  r = subprocess.run(["node", "components/tests/room-one-stage.test.js"],
                     cwd=ROOT, capture_output=True, text=True)
  d["guard_ng"] = len(re.findall(r"  NG   ", r.stdout))
  d["guard_ok"] = len(re.findall(r"  ok   ", r.stdout))

  # ★いつ 入り、★いつ 戻ったか。
  d["log"] = [l for l in sh("git", "log", "--oneline", "--date=short",
                            "--format=%h %ad %s", "--",
                            mihon[0]).splitlines()[:4]]
  return d

def kousei(d):
  # ★較正 ── ★道具が ほんとうに 見分けられるか。
  atari = bool(re.search(r"function bigRoom\(small\)", yomu(
    "docs/design/pack-final/00-動く見本（さわれる・全画面）.html")))
  hazure = bool(re.search(r"function bigRoom\(small\)", yomu(
    "docs/design/pack-final/_old-2026-09-18/00-動く見本（さわれる・全画面）.html")))
  return atari and not hazure

def main():
  d = kensa()
  ok = kousei(d)
  out = []
  out.append("# ★裁定 その71 §5①③ ── ★いまの 姿（★測った もの）\n")
  out.append(f"★この 紙は `tools/ruling71_status.py` が 書きました。★手で 足して いません。\n")
  out.append(f"★道具の 較正 …… {'○ 見分けられました' if ok else '✗ 見分けられません'}"
             "（★いまの 見本で 当たり、★9月18日の 旧版で 外れる）\n")

  out.append("\n## ★アプリの 側\n")
  out.append("| 見る ところ | いまの 値 |")
  out.append("|---|---|")
  out.append(f"| `lib/roomStage.js` の 出し もの | {', '.join(d['stage_exports'])} |")
  out.append(f"| `stageSize`（覆う）は 残って いるか | {'はい' if d['stageSize_exists'] else 'いいえ（消えました）'} |")
  out.append(f"| `stageStyle` が 使う 式 | {d['stageStyle_uses']} |")
  out.append(f"| `CharacterHome` の 舞台 | {d['characterhome_stage']} |")
  out.append(f"| `cameraOn` に 渡す 式 | `{d['cameraOn_expr']}` |")
  out.append(f"| 寄りの 二重を 打ち消して いるか | {'はい' if d['zoom_compensated'] else 'いいえ'} |")
  out.append(f"| したくに「ながめるで 見える ところ」の 枠 | {'はい' if d['viewband'] else 'いいえ'} |")

  out.append("\n## ★見本の 側（★`bigRoom` を 持つ 2本）\n")
  out.append("| 見本 | `bigRoom(small)` | viewBox の 高さ | 合わせ方 |")
  out.append("|---|---|---|---|")
  for m in d["mihon"]:
    out.append(f"| {Path(m['path']).name} | {'あり（★2部屋）' if m['bigRoom_small'] else 'なし（★1部屋）'} "
               f"| {', '.join(m['viewBoxes']) or '—'} | {', '.join(m['aspect']) or '—'} |")

  out.append("\n## ★見張り `components/tests/room-one-stage.test.js`\n")
  out.append(f"★ok {d['guard_ok']} ／ ★NG {d['guard_ng']}\n")

  out.append("\n## ★この ファイルの 来歴（★新しい 順）\n")
  for l in d["log"]:
    out.append(f"- {l}")

  p = ROOT / "docs/reports/2026-09-20-裁定71-§5の状態.md"
  p.write_text("\n".join(out) + "\n", encoding="utf-8")
  print(p)
  print(f"guard_ng={d['guard_ng']} calib={'ok' if ok else 'ng'}")

if __name__ == "__main__":
  main()
