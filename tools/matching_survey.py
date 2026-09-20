#!/usr/bin/env python3
# ★さがす（マッチング）── ★手を つける 前の 下調べ（★裁定 その94〜96・2026-09-20）。
#
#   ★★★この 紙は 道具が 書きます。★手で 足しません。
#   ★★① 画面は 見本から **たどって** 取ります。★名を 並べて 書きません。
#     ★★★はじめ、★手で 9つ 並べました。★2つ まちがえて いました ──
#       ★「さがす」は **コマンドパレット** でした（★文字でさがす／いろ 24色）。
#       ★「その人」は **運営の 生徒の 中身** でした（★レッスンの 出席／招き直す）。
#     ★★だから `push('…')` を たどります。★入口は「伴奏をさがす」1つ です。
#   ★★② 台帳は `tools/ask_ledger.py` に 尋ねます。★紙の 記憶では 答えません。
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIHON = ROOT / "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"
IRIGUCHI = "伴奏をさがす"

# ★もう 在る もの（★`components/` を 見て 確かめます。★書き写しません）。
SUDENI = {
  "経歴": "components/PortfolioV2.jsx",
  "録画を足す": "components/PortfolioV2.jsx",
  "公開の範囲": "components/PortfolioV2.jsx",
}

# ★台帳に 要る もの（★裁定 その94 の 層ごと）。
HOSHII = [
  ("portfolios", "経歴の 本体（★もう 在ります）"),
  ("portfolio_entries", "学んだところ・師事・賞（★もう 在ります）"),
  ("portfolio_recordings", "録画の リンク（★もう 在ります）"),
  ("postings", "募集（★L1 学校の 中だけ）"),
  ("applications", "応募（★L2 定型文 のみ）"),
  ("application_messages", "定型文の やりとり（★自由文を 持ちません）"),
  ("matching_cuts", "切る（★L3 取り下げ・止める・見せない）"),
  ("matching_reports", "通報（★L4 1件で 即 停止）"),
]

# ★安全の 4層（★裁定 その94 §2）と、★どこに 置くか の 見立て。
MAMORI = [
  ("L1 学校の 中だけ", "台帳（RLS）",
   "★中くらい",
   "★`memberships` で 同じ 学校か を 見ます。★`teacher_student_links` の 形が 使えます。"
   "★卒業生・外の 人は 段2・3 です。★いま 書きません。"),
  ("L2 定型文 のみ", "台帳（列の 形）と 関数",
   "★軽い",
   "★自由文の 列を **持ちません**。★`template_key` と 差し込みの 値 だけ を 持ちます。"
   "★API を 直に 叩いても 通らないのは、★列が 無い から です（★VERIFY Q3）。"),
  ("L3 切る（理由 不要）", "台帳（RLS）と 画面",
   "★重い",
   "★切った 相手から **1行も 見えない** こと（★VERIFY Q1）。"
   "★募集・応募・やりとり・経歴・公開ページ の すべてに かかります。"
   "★`cut` を 見る 式を 1か所に 置き、★そこだけを 通します。"),
  ("L4 通報 1件で 即 停止", "関数（SECURITY DEFINER）",
   "★中くらい",
   "★止めるのは 自分では ありません。★相手を 止めます。★だから 関数 1つ に します。"
   "★通報した 人が、★通報された 人から 見えなく なる こと（★VERIFY Q9）。"),
  ("§7 若いと 判る ものを 出さない", "列の 選び方",
   "★軽い",
   "★`age` / `grade` / `enrollment_year` を、★どの 道にも 載せません（★VERIFY Q7）。"
   "★`lib/shareScope.js` と 同じ 形 ── ★出す 列を 名指しする 表 を 1つ 持ちます。"),
  ("§5 停止しても 記録は 残る", "消さない こと",
   "★軽い",
   "★停止は `postings` と `applications` に かかります。"
   "★記録・ノート・レパートリー・ひつじ には かかりません（★変えない原則）。"),
]

def 本体(s, 名):
  i = s.find(f"SC['{名}']=function")
  if i < 0:
    return None
  j = s.index("{", s.index(")", i))
  ふかさ, k = 0, j
  while k < len(s):
    if s[k] == "{":
      ふかさ += 1
    elif s[k] == "}":
      ふかさ -= 1
      if ふかさ == 0:
        return s[j:k + 1]
    k += 1
  return None

def たどる(s):
  """★入口から `push('…')` を たどって、★画面の 並びを 作ります。"""
  みた, つぎ, 順, 道 = set(), [IRIGUCHI], [], []
  while つぎ:
    名 = つぎ.pop(0)
    if 名 in みた:
      continue
    みた.add(名)
    順.append(名)
    b = 本体(s, 名)
    if b is None:
      道.append((名, None))
      continue
    for m in re.finditer(r"push\(\\?'([^'\\]+)", b):
      道.append((名, m.group(1)))
      つぎ.append(m.group(1))
  return 順, 道

def 数える(本):
  題 = re.findall(r"class=\"(?:h3|sh3|fl)\"[^>]*>([^<]{1,40})", 本)
  題 += re.findall(r"<h2[^>]*>([^<]{1,40})", 本)
  札 = re.findall(r"class=\"[^\"]*\bbtn\b[^\"]*\"[^>]*>([^<]{1,30})", 本)
  入 = re.findall(r"<(?:input|textarea|select)\b", 本)
  注 = re.findall(r"class=\"(?:note|warn|usu|wl)\"", 本)
  行 = re.findall(r"class=\"[^\"]*\bli\b[^\"]*\"", 本)
  丸 = re.findall(r"class=\"pill[^\"]*\"[^>]*>([^<]{1,20})", 本)
  return {"題": len(題), "札": len(札), "入れ口": len(入), "注記": len(注), "行": len(行),
          "丸": len(丸), "字数": len(本),
          "題の字": [x.strip() for x in 題 if "'" not in x][:8],
          "札の字": [x.strip() for x in 札 if "'" not in x][:8]}

def 台帳にきく():
  """★試しの 台帳に、★表が 在るか を 尋ねます（★読むだけ）。"""
  名 = "', '".join(x[0] for x in HOSHII)
  q = ("select table_name, count(*) as 列 from information_schema.columns "
       f"where table_schema='public' and table_name in ('{名}') group by table_name")
  r = subprocess.run(["python3", str(ROOT / "tools/ask_ledger.py"), "--test", q],
                     capture_output=True, text=True, timeout=180)
  在る = {}
  for l in r.stdout.split("\n"):
    m = re.match(r"^(\w+)\s*\|\s*(\d+)\s*$", l.strip())
    if m:
      在る[m.group(1)] = int(m.group(2))
  return 在る, r.stdout.strip().split("\n")[0]

def main():
  s = MIHON.read_text(encoding="utf-8")
  順, 道 = たどる(s)
  なか = {名: (数える(本体(s, 名)) if 本体(s, 名) else None) for 名 in 順}
  欠 = [名 for 名, d in なか.items() if d is None]
  if 欠:
    print("★止まりました ── ★見本に ない 画面:", "／".join(欠))
    raise SystemExit(1)
  if len(順) < 5:
    print("★止まりました ── ★たどれた 画面が 少なすぎます:", len(順))
    raise SystemExit(1)

  在る, 送り先 = 台帳にきく()

  L = ["# ★さがす（マッチング）── ★手を つける 前の 下調べ\n",
       "★この 紙は `tools/matching_survey.py` が 書きました。★手で 足して いません。",
       f"★見本 …… `{MIHON.relative_to(ROOT)}`",
       f"★台帳 …… {送り先}",
       f"★画面は 入口「{IRIGUCHI}」から `push()` を たどって 取りました。\n"]

  L.append("## ★一 ★画面（★たどって 取った もの）\n")
  L.append(f"★たどり着いた 画面 **{len(順)}** ── ★裁定 その94 §4d の「9画面」と 同じ 数 です。\n")
  L.append("| # | 画面 | 題 | 札 | 丸 | 入れ口 | 注記 | 行 | 字数 | いま |")
  L.append("|---|---|---|---|---|---|---|---|---|---|")
  for k, 名 in enumerate(順, 1):
    d = なか[名]
    いま = SUDENI.get(名, "★ありません")
    L.append(f"| {k} | {名} | {d['題']} | {d['札']} | {d['丸']} | {d['入れ口']} | "
             f"{d['注記']} | {d['行']} | {d['字数']} | {いま} |")

  L.append("\n### ★画面の つながり（★`push()`）\n")
  for 元, 先 in 道:
    if 先:
      L.append(f"- {元} → {先}")

  L.append("\n### ★画面ごとの 中身\n")
  for 名 in 順:
    d = なか[名]
    L.append(f"**★{名}**（{d['字数']}字）\n")
    L.append(f"- 題 …… {' ／ '.join(d['題の字']) or '（取れません）'}")
    L.append(f"- 札 …… {' ／ '.join(d['札の字']) or '（ありません）'}")
    L.append(f"- 丸（選ぶ）{d['丸']} ／ 入れ口 {d['入れ口']} ／ 注記 {d['注記']} ／ 行 {d['行']}")
    L.append("")

  L.append("\n## ★二 ★台帳 ── ★在る もの と 無い もの\n")
  L.append("| 表 | いま | 何に 使うか |")
  L.append("|---|---|---|")
  for t, なに in HOSHII:
    L.append(f"| `{t}` | {'★在ります（列 ' + str(在る[t]) + '）' if t in 在る else '★ありません'} | {なに} |")
  たりない = [t for t, _ in HOSHII if t not in 在る]
  L.append(f"\n★作る 表 **{len(たりない)}** ── {'／'.join('`' + t + '`' for t in たりない)}")
  L.append("\n★★★使い回せる もの（★同じ ものを 二度 作りません）")
  L.append("- `portfolios` / `portfolio_entries` / `portfolio_recordings` …… "
           "★経歴は **もう 在ります**。★裁定 その94 §10 の 1番目 は 済んで います。")
  L.append("- `components/PortfolioV2.jsx` / `lib/portfolio.js` …… ★画面も 在ります。")
  L.append("- `lib/shareScope.js` …… ★「出す 列 を 名指しする」形。★§7 に そのまま 使えます。")
  L.append("- `supabase/migration_teacher_student_entries_rpc.sql` …… "
           "★列を 絞って 返す `SECURITY DEFINER` の 手本。★応募者の 詳細に 使えます。")
  L.append("- `memberships` …… ★L1「同じ 学校か」を 見る もと。")

  L.append("\n## ★三 ★安全の 4層 ── ★どこに 置くか と 重さ\n")
  L.append("| 層 | 置き場所 | 重さ | 中身 |")
  L.append("|---|---|---|---|")
  for 名, どこ, 重, なか2 in MAMORI:
    L.append(f"| {名} | {どこ} | {重} | {なか2} |")

  L.append("\n## ★四 ★順（★裁定 その94 §10 に 沿います）\n")
  L.append("★裁定の 順は 5つ です。★画面に 割ると こう なります。\n")
  順序 = [
    ("0", "経歴", "★済み", "`PortfolioV2.jsx` と 3つの 表。★§10 の 1番目。"),
    ("1", "伴奏をさがす", "★台帳 `postings` ＋ L1",
     "★入口。★募集の 一覧 だけ。★応募は まだ 作りません。"),
    ("2", "募集を出す", "★同じ `postings`",
     "★出す 側。★入れ口が いちばん 多い 画面 です。"),
    ("3", "応募する", "★台帳 `applications` ＋ L2",
     "★定型文 のみ。★自由文の 列を 作りません。★経歴の 帯（`pfBand`）も ここ。"),
    ("4", "応募した募集", "★`applications` を 読むだけ", "★出した 側の 控え。"),
    ("5", "応募を選ぶ", "★`applications` を 読むだけ", "★募集を 出した 人が 見ます。"),
    ("6", "応募者の詳細", "★列を 絞る 関数", "★§7 が いちばん 効く 画面。★§4e の 出す・出さない。"),
    ("7", "曲目を答える", "★定型文 1つ", "★たずねる → 答える の 往復（★§4c）。"),
    ("8", "成立後", "★`applications` の 状態", "★切る（L3）と 通報（L4）の 口が ここに 出ます。"),
  ]
  L.append("| 順 | 画面 | 何が 要るか | 覚え |")
  L.append("|---|---|---|---|")
  for a, b, c, d in 順序:
    L.append(f"| {a} | {b} | {c} | {d} |")
  L.append("\n★★★L3（切る）と L4（通報）は、★8 の 後 では ありません。")
  L.append("★★`applications` を 作る **前** に、★切った 人を 外す 式を 1か所に 置きます。")
  L.append("★★後から 足すと、★読む ところ ぜんぶ を 探して 回る ことに なります。")
  L.append("★★★裁定 その94 §10 の 順（3: 切る ／ 4: 通報）は、"
           "★画面を 出す 順で あって、★式を 置く 順では ありません。")

  p = ROOT / "docs/reports/2026-09-20-さがす-下調べ.md"
  p.write_text("\n".join(L) + "\n", encoding="utf-8")
  print("REPORT: " + str(p))
  print(f"  画面 {len(順)} ／ 作る 表 {len(たりない)} ／ 在る 表 {len(在る)}")

if __name__ == "__main__":
  main()
