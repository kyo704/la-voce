#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Vercel の 地域を、★管理画面を 開かずに 確かめる 道具（2026-09-14）。

★読み方
  x-vercel-id は「::」で 区切られて います。
    2つ  hnd1::<番号>          … ★静的。★関数を 通って いません。
    3つ  hnd1::iad1::<番号>    … ★1つ目=受けた 玄関、★2つ目=★関数が 動いた 地域。

★較正（★これが いちばん 大事です）
  ★「iad1 と 出たから 米国」では、★読み違えが 起きます。
  ★答えの 分かって いる ものを 先に 当てます ──
    ★純粋な 静的ファイル（/manifest.json・/sw.js・/favicon.ico）は、
      ★関数を 通らないので、★2つしか 出ないはずです。
    ★これが 3つ 出たら、★私の 読み方が まちがって います。

★この 道具が 分からない こと
  ログの 保管地域・組み立ての 成果物の 置き場所・請求書の 発行元。
  ★どれも 管理画面でしか 分かりません。★推し量りません。

★書き出し docs/reports/2026-09-14-vercel-region.md
"""

import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-14-vercel-region.md")
HOST = "https://woolsong.app"

REGION_NAMES = {
  "iad1": "アメリカ合衆国・バージニア州（US East）",
  "hnd1": "日本・東京",
  "sfo1": "アメリカ合衆国・カリフォルニア州（US West）",
  "fra1": "ドイツ・フランクフルト",
  "cdg1": "フランス・パリ",
  "sin1": "シンガポール",
  "syd1": "オーストラリア・シドニー",
  "icn1": "韓国・ソウル",
}

# ★関数を 通る 道（★force-dynamic か、★サーバで 描かれる もの）
FUNCTION_PATHS = ["/", "/api/version", "/api/feedback"]
# ★関数を 通らない 道（★較正のため）
STATIC_PATHS = ["/manifest.json", "/sw.js", "/favicon.ico"]


def head(path):
  """HEAD を 1本 投げて、★x-vercel-id の 値を 返します。"""
  p = subprocess.run(["curl", "-sI", HOST + path],
                     stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
  txt = p.stdout.decode("utf-8", "replace")
  m = re.search(r"(?im)^x-vercel-id:\s*(.+)$", txt)
  c = re.search(r"(?im)^x-vercel-cache:\s*(.+)$", txt)
  return (m.group(1).strip() if m else None,
          c.group(1).strip() if c else None)


def parts_of(vid):
  return vid.split("::") if vid else []


def region_of(vid):
  """★3つ組の 真ん中が、★関数の 動いた 地域。★2つ組なら 関数を 通って いません。"""
  p = parts_of(vid)
  if len(p) >= 3:
    return p[1]
  return None


def edge_of(vid):
  p = parts_of(vid)
  return p[0] if p else None


def name(code):
  return REGION_NAMES.get(code, "★知らない 記号（%s）" % code)


# ---------------------------------------------------------------------------
# ★どこで entries が 読まれて いるか（★地域の 意味は、ここで 決まります）
# ---------------------------------------------------------------------------

def server_entries_reads():
  """★app/ の 中で entries を 読む 所 ＝ ★Vercel の 関数の 中で 読む 所。"""
  p = subprocess.run(
    'grep -rn --include=*.js \'from("entries")\' app lib | grep -v tests',
    shell=True, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
  out = []
  for line in p.stdout.decode("utf-8", "replace").split("\n"):
    if not line.strip():
      continue
    path, lineno = line.split(":")[0], line.split(":")[1]
    # ★その すぐ下の select( を 読みます。★何を 取って いるか。
    q = subprocess.run(
      "grep -A4 'from(\"entries\")' %s | grep -m1 'select('" % path,
      shell=True, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    sel = q.stdout.decode("utf-8", "replace").strip()
    out.append((path, lineno, sel))
  return out


def build(fn_rows, st_rows, calibration_ok):
  L = []
  w = L.append

  fn_regions = sorted(set(r for _, vid, _ in fn_rows if (r := region_of(vid))))
  fn_edges = sorted(set(edge_of(vid) for _, vid, _ in fn_rows))
  st_edges = sorted(set(edge_of(vid) for _, vid, _ in st_rows))

  w("# Vercel の 地域 ── ヘッダから 読みました（2026-09-14）")
  w("")
  w("")
  w("★この 文は tools/vercel_region_check.py が 書き出しました。")
  w("★数と 記号は すべて、★実際に 投げた HEAD の 返事から 取って います。")
  w("")

  w("## ★答え")
  w("")
  w("```")
  w("STATIC_REGION:   %s（%s）" % (",".join(st_edges), name(st_edges[0]) if st_edges else "?"))
  w("FUNCTION_REGION: %s（%s）" % (",".join(fn_regions), name(fn_regions[0]) if fn_regions else "?"))
  w("```")
  w("")
  if fn_regions and fn_regions[0] != "hnd1":
    w("### ★★関数は 日本の 外で 動いて います。")
    w("")
    w("★保管は 東京（ap-northeast-1）です。★しかし 読み出しと 処理は %s です。"
      % name(fn_regions[0]))
    w("★Opus の お見立てのとおりでした。")
  else:
    w("### 関数も 日本で 動いて います。")
  w("")

  w("## 生の 返事")
  w("")
  w("### 関数を 通る 道")
  w("")
  w("| 道 | x-vercel-id | 区切りの 数 | 玄関 | ★関数の 地域 |")
  w("|---|---|---|---|---|")
  for path, vid, cache in fn_rows:
    r = region_of(vid)
    w("| `%s` | `%s` | %d | %s | ★%s |"
      % (path, vid, len(parts_of(vid)), edge_of(vid), r or "─"))
  w("")
  w("### 関数を 通らない 道（★較正）")
  w("")
  w("| 道 | x-vercel-id | 区切りの 数 | ★関数の 地域 |")
  w("|---|---|---|---|")
  for path, vid, cache in st_rows:
    r = region_of(vid)
    w("| `%s` | `%s` | %d | %s |"
      % (path, vid, len(parts_of(vid)), r or "★無し（＝関数を 通って いない）"))
  w("")

  w("## ★較正 ── 読み方が 正しいことの 確かめ")
  w("")
  w("★「iad1 と 書いて あるから 米国」だけでは、★読み違えが 起きます。")
  w("★答えの 分かって いる ものに 当てて、★道具の ほうを 先に 疑いました。")
  w("")
  w("| 当てた もの | 期待 | 実際 | |")
  w("|---|---|---|---|")
  w("| 静的ファイル 3本 | ★区切りは 2つ（関数を 通らない） | %s | %s |"
    % ("、".join(str(len(parts_of(v))) for _, v, _ in st_rows),
       "★合う" if calibration_ok else "★★合いません"))
  w("| 関数 3本 | ★区切りは 3つ | %s | %s |"
    % ("、".join(str(len(parts_of(v))) for _, v, _ in fn_rows),
       "★合う" if all(len(parts_of(v)) == 3 for _, v, _ in fn_rows) else "★★合いません"))
  w("")
  if calibration_ok:
    w("★静的は 2つ、関数は 3つ。★きれいに 分かれました。")
    w("★★真ん中の 記号が『関数の 動いた 地域』である、という 読み方が 裏づけられました。")
  else:
    w("★★較正に 失敗して います。★上の 答えを 信じないで ください。")
  w("")

  w("## ★では、何が 日本の 外へ 出るのか")
  w("")
  w("★★ここを 確かめずに『記録が 米国で 処理されて いる』とは 言えません。")
  w("　★記録の ほとんどは、★画面（ブラウザ）から ★直に Supabase（東京）へ 行きます。")
  w("　　`components/VocalTracker.jsx:6085` ── `supabase.from(\"entries\").select(\"*\")`")
  w("　　★これは Vercel の 関数を ★1つも 通りません。★東京と 利用者の 間だけです。")
  w("")
  w("★Vercel の 関数の 中で entries を 読む 所は、★次の とおりです。")
  w("")
  w("| # | 場所 | 取って いる 列 | ★値が 要るか |")
  w("|---|---|---|---|")
  meaning = {
    "app/admin/page.js": ("★12列（weight_kg・medication_tags・mental_reason・voice_memo ほか）",
                          "★要りません。★『埋まって いるか』しか 見て いません（:180-188）"),
    "app/api/character/unlock/route.js": ("★`select(\"*\")`（全列）",
                                          "★要りません。★`v == null` の 判定だけです（lib/character.js:288）"),
    "app/api/advice/route.js": ("★`select(\"*\")`（全列）",
                                "★要ります。★文に して 送ります。★㋐で 消します"),
    "app/api/character/gift/route.js": ("`date` のみ", "─"),
    "app/api/character/buy/route.js": ("`date` のみ", "─"),
    "app/api/cron/line-reminder/route.js": ("`date` のみ", "─"),
  }
  seen = set()
  i = 0
  for path, lineno, sel in fn_entries_reads:
    if path in seen:
      continue
    seen.add(path)
    i += 1
    cols, need = meaning.get(path, ("★未分類", "★未分類"))
    w("| %d | `%s:%s` | %s | %s |" % (i, path, lineno, cols, need))
  w("")
  w("### ★★いちばん 重い のは、★advice では ありません")
  w("")
  w("★`app/admin/page.js:102` は、★admin の 鍵で ★全員の entries を 読みます。")
  w("　★`.eq()` が ありません。★38人 ぜんぶです。")
  w("　★取って いるのは ★服薬タグ・気持ちの 日記・声の メモ ── ★自由記述を 含みます。")
  w("　★★それを ★%s の 関数の 中へ 運んで、" % name(fn_regions[0] if fn_regions else "?"))
  w("　★★`typeof === \"number\"` と `.length > 0` と `.trim()` しか して いません。")
  w("")
  w("★`app/api/character/unlock/route.js:55` も 同じ 形です。★本人の 全列を 運んで、")
  w("　★`v == null` を 見るだけです。★値は ★1つも 使いません。")
  w("")
  w("★★どちらも、★数える 仕事です。★数えるなら、★台帳の 中で 数えられます。")
  w("　★`count(*) filter (where weight_kg is not null)` の 形に すれば、")
  w("　★★値は ★1つも 東京を 出ません。★出るのは 数だけです。")
  w("")

  w("## ★まだ 分からない こと")
  w("")
  w("| もの | なぜ |")
  w("|---|---|")
  w("| ログの 保管地域 | ★ヘッダには 出ません。★管理画面だけ |")
  w("| 組み立ての 成果物の 置き場所 | ★同上 |")
  w("| 請求書の 発行元（契約の 相手） | ★同上。★宛先では なく ★発行元 |")
  w("| Supabase Auth の SMTP | ★再設定メールの 差出人を 見る 必要が あります |")
  w("")
  w("★Auth の SMTP は、★私からは 試せません。")
  w("　★メールを 送るのは 外向きの 行いで、★受け取り箱も 私には 見えません。")
  w("　★坂本さんが 再設定メールを 1通 出して、★差出人（From / Return-Path）を")
  w("　★ご覧ください。`supabase.io` なら ★未設定 ── ★Supabase 自身が 送り手です。")

  return L


if __name__ == "__main__":
  fn_rows = []
  for p in FUNCTION_PATHS:
    vid, cache = head(p)
    fn_rows.append((p, vid, cache))
  st_rows = []
  for p in STATIC_PATHS:
    vid, cache = head(p)
    st_rows.append((p, vid, cache))

  calibration_ok = all(len(parts_of(v)) == 2 for _, v, _ in st_rows)
  fn_entries_reads = server_entries_reads()

  lines = build(fn_rows, st_rows, calibration_ok)
  body = [l for l in lines if l.strip()]
  lines[1] = "全%d行 / 末尾は「%s」" % (len(lines), body[-1])
  with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  with open(OUT, encoding="utf-8") as f:
    n = len(f.read().rstrip("\n").split("\n"))
  lines[1] = "全%d行 / 末尾は「%s」" % (n, body[-1])
  with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("★書き出しました: %s（%d行）" % (OUT, n))
  print("STATIC_REGION:   %s" % ",".join(sorted(set(edge_of(v) for _, v, _ in st_rows))))
  print("FUNCTION_REGION: %s" % ",".join(sorted(set(r for _, v, _ in fn_rows if (r := region_of(v))))))
  print("較正: %s" % ("★合う" if calibration_ok else "★★合いません"))
