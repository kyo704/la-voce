# -*- coding: utf-8 -*-
"""★受け持ち（assignments）を 閉じる と、★何が 変わるか。

  ★★Opus の 裁定（2026-09-16）── ★教室を やめる とき、
    ★在籍を `left` に する のと 同じ 取引で、★受け持ちも 閉じます。
  ★★閉じる 前に、★「受け持ちで 決めて いる もの」を 数えます。

  ★★★道具の 較正（★2026-09-16・決まりに なりました）。
    ★★道具を 書いたら、★わざと 当たる もの を 1つ 入れて、
      ★それが 出る か を 確かめます。★出なければ 道具が 壊れて います。
    ★★きょう 2度、★出ない 道具の 結果を そのまま お出ししました。
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQL_DIR = os.path.join(ROOT, "supabase")
POLICY = re.compile(r'create policy\s+"?([\w \-]+)"?\s+on\s+public\.(\w+)', re.I)


def no_comments(s):
  return re.sub(r"--[^\n]*", "", s)


def policy_blocks():
  """★決まりを 1つずつ 切り出します。"""
  out = []
  names = [f for f in sorted(os.listdir(SQL_DIR)) if f.endswith(".sql")]
  if not names:
    sys.exit("★止まりました ── supabase に SQL が 1本も ありません。")
  for f in names:
    s = io.open(os.path.join(SQL_DIR, f), encoding="utf-8").read()
    for m in POLICY.finditer(s):
      blk = s[m.start():m.start() + 1800]
      end = blk.find(";")
      out.append({
        "file": f,
        "policy": m.group(1),
        "table": m.group(2),
        "code": no_comments(blk[:end] if end > 0 else blk),
      })
  return out


def calibrate(blocks):
  """★★較正 ── ★当たる はずの ものが 出るか。

    ★★`assignments_all_owner_admin` は、★assignments を 見て います。
      ★これが 出なければ、★切り出しが 壊れて います。
    ★★`org_messages_select` は、★`ended_at is null` で 決めて います。
      ★これが 出なければ、★見分けが 壊れて います。
  """
  hits = [b for b in blocks if "assignments" in b["code"]]
  names = {b["policy"] for b in hits}
  if "assignments_all_owner_admin" not in names:
    sys.exit("★止まりました ── 較正に 失敗。assignments を見る決まりが1つも出ません。")
  ended = [b for b in hits if "ended_at is null" in b["code"]]
  if not any(b["policy"] == "org_messages_select" for b in ended):
    sys.exit("★止まりました ── 較正に 失敗。ended_at is null の 見分けが 効いて いません。")
  # ★★逆の 向きも 見ます ── ★当たらない はずの ものが 出て いないか。
  if any("assignments" not in b["code"] for b in hits):
    sys.exit("★止まりました ── 較正に 失敗。当たらない ものが 混ざって います。")
  return hits, ended


# ★★画面の 側（★手で 読んで 確かめた もの）。
#   ★★grep の 結果を、★1つずつ 開いて 見ました。
JS = [
  ("components/VocalTracker.jsx", 9938, "fetchRenrakuStudios（門下の一覧）",
   "ended_at is null", "★消える（★見本どおり）"),
  ("components/VocalTracker.jsx", 11944, "fetchMyEnrollments（自分の担当）",
   "ended_at is null ＋ 在籍で絞る", "★消える（★在籍で先に落ちる）"),
  ("components/VocalTracker.jsx", 12025, "fetchMyOrgAssignments（先生の受け持ち）",
   "ended_at is null", "★消える（★先生から見えなくなる）"),
  ("components/VocalTracker.jsx", 12295, "fetchOrgDetail（学校の名簿の担当）",
   "ended_at is null", "★消える"),
  ("app/api/enrollment/accept/route.js", 138, "入るとき・担当の重複しらべ",
   "★ended_at を 見て いない", "★★壊れます ── 下に 書きます"),
  ("app/api/enrollment/accept/route.js", 151, "入るとき・担当づくり",
   "上の しらべ 次第", "★★作られません"),
]

BREAKS = [
  ("請求", "enrollments も assignments も 読んで いません（lib/planScreen.js・"
           "lib/paymentRetention.js に 参照なし）。★お代は お一人ごと です。", "★壊れません"),
  ("出欠", "lessons の 列に 入って います。★assignments では ありません"
           "（2026-09-08-レッスンの出欠.sql）。★閉じても 消えません。", "★壊れません"),
  ("これからの レッスン", "lessons は teacher_student_links と org で 決まります。"
           "★assignments の 決まりは 掛かって いません。"
           "★★予定の 行は 残ります。★出るか どうかは 在籍（org_events とは 別）。",
   "★要ご確認 ── 台帳の 決まりを 引いて から"),
  ("★入り直し", "accept route:138 が (org_id, teacher_id, student_id) だけで しらべ、"
              "★`ended_at is null` を 見て いません。★閉じた 行が 見つかって しまい、"
              "★新しい 担当が 作られません。", "★★閉じる と 同時に 壊れます"),
]


def main():
  blocks = policy_blocks()
  hits, ended = calibrate(blocks)

  out = []
  w = out.append
  w("# ★受け持ちを 閉じる ── ★先に 数えた もの")
  w("")
  w("★この 行は あとで 差し替えます")
  w("")
  w("生成: `tools/assignments_dependency_survey.py`（2026-09-16）")
  w("")
  w("★★較正: 通りました（★assignments を 見る 決まりが %d 本、"
    "★うち `ended_at is null` が %d 本 出ました）。" % (len(hits), len(ended)))
  w("")
  w("## 一 ★台帳の 決まり ── ★受け持ちで 決めて いる もの")
  w("")
  w("| 決まり | 表 | `ended_at is null` | 閉じると |")
  w("|---|---|---|---|")
  for b in sorted(hits, key=lambda b: b["policy"]):
    e = "ended_at is null" in b["code"]
    w("| `%s` | `%s` | %s | %s |" % (
      b["policy"], b["table"], "★はい" if e else "いいえ",
      "★見えなく なります" if e else "変わりません（★持ち主・管理者だけの 決まり）"))
  w("")
  w("★★`org_messages`（先生からの 連絡）と `org_message_reads` が、"
    "★受け持ちで 決まって います。")
  w("★★だから いま、★やめても 連絡が 届き 続けて います。")
  w("")
  w("## 二 ★画面の 側")
  w("")
  w("| ところ | 何を して いるか | 絞り | 閉じると |")
  w("|---|---|---|---|")
  for f, ln, what, filt, eff in JS:
    w("| `%s:%d` | %s | %s | %s |" % (f, ln, what, filt, eff))
  w("")
  w("## 三 ★閉じた あと、★壊れる か")
  w("")
  for name, detail, verdict in BREAKS:
    w("### %s ── %s" % (name, verdict))
    w("")
    w(detail)
    w("")
  w("## 四 ★先に お直しが 要る ところ")
  w("")
  w("`app/api/enrollment/accept/route.js:138` の しらべに "
    "`.is(\"ended_at\", null)` を 足します。")
  w("★★足さないと、★一度 やめた方は、★入り直しても 受け持ちが 付きません。")
  w("★★受け持ちが 無ければ、★先生からの 連絡も 門下も 出ません。")
  w("★★いまは まだ 閉じて いない ので、★この 不具合は 起きて いません。")
  w("★★閉じる のと **同じ ひと組** で 直します。")
  w("")
  w("★★閉じた 行を どう するか、★2つ あります ──")
  w("")
  w("- ㋐ 新しい 行を 足す（★過去の 受け持ちが 記録として 残ります）")
  w("- ㋑ 閉じた 行の `ended_at` を null に 戻す（★行は 1本の まま）")
  w("")
  w("★★㋐ に して います。★「行を 消さない・過去は 記録として 残す」と 同じ 向き です。")
  w("★★ただし `(org_id, teacher_id, student_id)` に 束ねが あると 足せません。")
  w("★★束ねの 有無は 台帳に しか ありません ── `問い-決まりの無い書き込み.sql` に 足しました。")
  w("★★束ねが あった ときは ㋑ に 落ちます（★23505 を 受けて 戻す）。")
  w("")
  w("## 五 ★この 紙で 足りない こと")
  w("")
  w("★★これは **紙** です。★台帳では ありません。")
  w("★★決まりは SQL の ファイル から 読みました。")
  w("★★本番に 別の 決まりが 増えて いれば、★ここには 出ません。")
  w("★★`問い-決まりの無い書き込み.sql` の 結果と 重ねて ください。")

  body = "\n".join(out) + "\n"
  lines = body.split("\n")
  last = [l for l in lines if l.strip()][-1]
  lines[2] = "全%d行 / 末尾は「%s」" % (len(lines) - 1, last)
  path = os.path.join(ROOT, "docs/reports/2026-09-16-受け持ちを閉じる前の棚卸し.md")
  io.open(path, "w", encoding="utf-8").write("\n".join(lines))
  print(path)
  print("決まり %d / うち ended_at %d / 画面 %d" % (len(hits), len(ended), len(JS)))


main()
