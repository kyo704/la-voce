#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★見本から 抜き出した JSON を、★実装が 読む 1枚に します。

  ★★出どころ　坂本さん（★2026-09-16）──
    「★実装側を『JSON を 読む』形に 変えられますか」

  ★★お答え ── ★**一部は できます。★全部は できません。**
    ★★できる … ★**数と 並びと 字**（★札の 一覧、段の 数、段ごとの 大きさ）
    ★★できない … ★**鍵**（`small`/`normal`…）と、★その 鍵に ぶら下がる 仕掛け
      ★★見本に 鍵は ありません。★見本は 人が 見る もの だから です。
      ★★鍵は 保存に 使われます（`profiles.display_scale`）。
        ★★字が 変わっても 鍵は 変えられません ── ★変えると 昔の 記録が 読めません。
    ★★だから ここでは「★字と 数は 見本から、★鍵は 実装が 持つ」に します。
      ★★段が 増えた ときは、★鍵を **足す** 必要が あります。
        ★その ことが 分かるよう、★足りなければ **止めます**。
"""

import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs", "design", "mihon-json", "設定.json")
OUT = os.path.join(ROOT, "lib", "mihonSpec.json")

# ★★鍵は 実装の もの です。★見本に ありません。
#   ★★並び順で 結びます。★1段目→small、2段目→normal …
#   ★★段が 増えたら、★ここに 足して ください。★足りなければ 下で 止まります。
KEYS = ["small", "normal", "large", "xlarge", "xxlarge", "xxxlarge"]

if not os.path.exists(SRC):
  print("★★ありません: " + os.path.relpath(SRC, ROOT))
  print("　★先に `node tools/mihon_extract.js 設定` を 走らせて ください。")
  sys.exit(1)

d = json.load(io.open(SRC, encoding="utf-8"))
pills = d.get("pills") or []
eff = {e["step"]: e for e in (d.get("pillEffect") or [])}

if not pills:
  print("★★札が 1つも ありません。★書きません。★止まります。")
  sys.exit(1)
if len(pills) > len(KEYS):
  print("★★段が %d に 増えました。★鍵が %d しか ありません。"
        % (len(pills), len(KEYS)))
  print("　★`tools/mihon_to_spec.py` の KEYS に 鍵を 足して ください。")
  print("　★★鍵は 保存に 使われます。★勝手に 作りません。")
  sys.exit(1)

scales, labels, px = [], {}, {}
for i, p in enumerate(pills):
  k = KEYS[i]
  scales.append(k)
  labels[k] = p["label"]
  e = eff.get(i + 1)
  v = (e or {}).get("samplePx")
  if not v:
    print("★★%d段目の 大きさを 読めません でした。★書きません。★止まります。" % (i + 1))
    sys.exit(1)
  px[k] = float(str(v).replace("px", ""))

# ══════════ ★実装の ファイルに、★そのまま 書き込みます ══════════
#
#   ★★はじめ `lib/mihonSpec.json` を 作って、★`displayPrefs.js` から
#     ★`import … from "@/lib/mihonSpec.json"` で 読ませました。
#   ★★見張りが 落ちました ── ★見張りは モジュールを `data:` で 読み込みます。
#     ★★その 中では `@/` が 解けません（ERR_INVALID_URL）。
#   ★★だから、★読み込ませるのを やめ、★**値を 書き込む** 形に します。
#     ★★この 家に 同じ 形が あります ── `scripts/build-learn-content.js` は
#       ★`lib/learnContent.js` に 記事を 書き込みます。
#     ★★見張りは これまでどおり 動き、★見本が 元 である ことも 変わりません。
DP = os.path.join(ROOT, "lib", "displayPrefs.js")
BEGIN = "// ★★見本から ここまで（自動）ここから"
END = "// ★★見本から ここまで（自動）ここまで"

block = [
  BEGIN,
  "//   ★このあいだは 手で 直さないで ください。★見本から 作られます。",
  "//   ★作り直し …",
  "//     node tools/mihon_extract.js 設定 && python3 tools/mihon_to_spec.py",
  "//   ★出どころ … docs/design/pack-final/00-動く見本（さわれる・全画面）.html",
  "//   ★★鍵（small／normal／…）は 実装の もの です。★見本に ありません。",
  "//     ★保存に 使われるので、★字が 変わっても 鍵は 変えません。",
  "export const SCALES = " + json.dumps(scales) + ";",
  "export const SCALE_LABELS = " + json.dumps(labels, ensure_ascii=False) + ";",
  "export const SCALE_SAMPLE_PX = Object.freeze("
  + json.dumps(px, ensure_ascii=False) + ");",
  END,
]

src = io.open(DP, encoding="utf-8").read()
if BEGIN in src and END in src:
  i = src.index(BEGIN); j = src.index(END) + len(END)
  src = src[:i] + "\n".join(block) + src[j:]
else:
  # ★★はじめての とき ── ★もとの 3つを 1つに まとめます。
  #   ★★★消してから 入れます。★順が 逆だと、★入れた ばかりの 行を
  #     ★そのあとの 消しが 拾って しまいます（★1度 そうなりました）。
  #     ★★`count=1` は「最初の 1つ」── ★入れた ものが 最初に なります。
  import re
  src = re.sub(r'export const SCALE_LABELS = \{[^}]*\};', "", src, count=1)
  src = re.sub(r'export const SCALE_SAMPLE_PX = Object\.freeze\(\{[^}]*\}\);',
               "", src, count=1)
  src = re.sub(r'export const SCALES = \[[^\]]*\];',
               lambda m: "\n".join(block), src, count=1)
io.open(DP, "w", encoding="utf-8").write(src)
print("WROTE: " + os.path.relpath(DP, ROOT))

spec = {
  "_note": [
    "★このファイルは 見本から 作られます。★手で 直さないで ください。",
    "★作り直し … node tools/mihon_extract.js 設定 && python3 tools/mihon_to_spec.py",
    "★出どころ … docs/design/pack-final/00-動く見本（さわれる・全画面）.html",
    "★鍵（small/normal/…）は 実装の ものです。★見本に ありません。",
    "　★保存に 使われるので、★字が 変わっても 鍵は 変えません。"
  ],
  "scaleKeys": scales,
  "scaleLabels": labels,
  "scaleSamplePx": px,
  "sampleLines": [x for x in (d.get("notes") or [])][:0] or None,
}
spec.pop("sampleLines")
io.open(OUT, "w", encoding="utf-8").write(json.dumps(spec, ensure_ascii=False, indent=2) + "\n")
print("OUT: " + os.path.relpath(OUT, ROOT))
print("段: %d  %s" % (len(scales), " / ".join(labels[k] for k in scales)))
print("大きさ: %s" % " / ".join("%s=%g" % (k, px[k]) for k in scales))
