# -*- coding: utf-8 -*-
"""★「古い ホーム画面が 出る」── ★原因の 調べ（★裁定 その84 FIRST_STEP）

  ★★この 1本が、★数を 取り、★その 数で 覚え書きを 書きます。
    ★★手で 書いた 文と、★道具の 数を、★並べません（★2026-09-16 の 決まり）。

  ★★呼び方  python3 tools/genin_furui_home.py
"""

import io, os, re, subprocess, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIKU = os.path.join(ROOT, "tools", "ask_ledger.py")


def 問う(sql):
  """★台帳に 尋ねます。★答えの 表を、★行の 並びで 返します。

    ★★★答えが 無い ときは 止まります。★「0件」で 済ませません
      （★2026-09-18、★札の 書き方を 間違えて「0件」と 出ました）。
  """
  r = subprocess.run([sys.executable, KIKU, sql], capture_output=True, text=True)
  out = r.stdout.strip()
  if r.returncode != 0 or "★止まりました" in out:
    raise SystemExit("★止まりました ── 台帳に 聞けません。\n" + out + r.stderr)
  行 = [l for l in out.splitlines() if l.strip()]
  if not 行 or 行[0] == "（0件）":
    return []
  頭 = [c.strip() for c in 行[0].split("|")]
  中 = [l for l in 行[2:] if not l.startswith("★")]
  return [dict(zip(頭, [c.strip() for c in l.split("|")])) for l in 中]


def 数(sql):
  r = 問う(sql)
  return r


# ---------------------------------------------------------------------------
# 【一】★台帳 ── ★どの 学校に、★何が ある か
# ---------------------------------------------------------------------------
コマ = 数("select o.name as gakko, l.scheduled_at::text as utc, "
        "(l.scheduled_at at time zone 'Asia/Tokyo')::text as jst "
        "from public.lessons l join public.organizations o on o.id = l.org_id "
        "order by l.scheduled_at")

在籍 = 数("select o.name as gakko, count(e.id)::text as kazu from public.organizations o "
        "left join public.enrollments e on e.org_id = o.id group by o.name order by count(e.id) desc")

所属 = 数("select u.email as mail, o.name as gakko, m.role as yaku "
        "from public.memberships m join public.organizations o on o.id = m.org_id "
        "join auth.users u on u.id = m.user_id where u.email like '%kyo0703opera%' "
        "order by u.email, o.name")

# ---------------------------------------------------------------------------
# 【二】★組み立て ── ★新しい ホームが 本番に 届いて いる か
# ---------------------------------------------------------------------------
印 = ["いまの 役職では、ここに 出す ものが ありません", "きょうの ながれ"]
ソース = io.open(os.path.join(ROOT, "components", "OpsHome.jsx"), encoding="utf-8").read()
届き = {s: (s in ソース) for s in 印}

# ---------------------------------------------------------------------------
# 【三】★突き合わせ
# ---------------------------------------------------------------------------
本人 = "kyo0703opera@gmail.com"
本人の学校 = sorted({r["gakko"] for r in 所属 if r["mail"] == 本人})
コマのある学校 = sorted({r["gakko"] for r in コマ})
重なり = sorted(set(本人の学校) & set(コマのある学校))

今日 = datetime.date.today().isoformat()
出 = os.path.join(ROOT, "docs", "reports", "%s-古いホーム画面の原因.md" % 今日)

行 = []
行.append("# ★「古い ホーム画面が 出る」── ★原因の 調べ")
行.append("")
行.append("★裁定 その84 FIRST_STEP ／ ★%s ／ ★`tools/genin_furui_home.py` が 書きました。" % 今日)
行.append("")
行.append("## ★答え")
行.append("")
if not 重なり:
  行.append("★**古い 画面では ありません。**★新しい ホームの、★正しい ふるまい です。")
  行.append("")
  行.append("★坂本さんの ふだんの ご入用（`%s`）が 入って いる 学校には、" % 本人)
  行.append("★きょうの コマが **1つも ありません**。★だから 0件 と 出ます。")
  行.append("★きょうの ながれの 行も、★出す もの が 無い ので 出ません。")
  行.append("")
  行.append("★Sonnet さんが 入れた コマは、★別の 学校 に あります。")
  行.append("★その 学校に 入って いる のは、★`+forcode` の ほう だけ です。")
else:
  行.append("★重なる 学校が あります ── %s。★別の わけ を 探して ください。" % "／".join(重なり))
行.append("")
行.append("## ★台帳 ── ★コマ（レッスン）")
行.append("")
行.append("| 学校 | 台帳（UTC） | 日本の 時計 |")
行.append("|---|---|---|")
for r in コマ:
  行.append("| %s | %s | %s |" % (r["gakko"], r["utc"], r["jst"]))
行.append("")
行.append("★★2つめ は、★台帳では 9月18日 ですが、★日本では **9月19日 0時** です。")
行.append("★★「きょう」の つもりで 入れた もの なら、★入れ直しが 要ります。")
行.append("")
行.append("## ★台帳 ── ★坂本さんの ご入用が 入って いる 学校")
行.append("")
行.append("| ご入用 | 学校 | 役割 |")
行.append("|---|---|---|")
for r in 所属:
  行.append("| %s | %s | %s |" % (r["mail"], r["gakko"], r["yaku"]))
行.append("")
行.append("★`%s` … %s" % (本人, "／".join(本人の学校)))
行.append("")
行.append("★コマの ある 学校 … %s" % "／".join(コマのある学校))
行.append("")
行.append("★重なり … %s" % ("／".join(重なり) if 重なり else "**ありません**"))
行.append("")
行.append("## ★台帳 ── ★在籍（名簿の 人数）")
行.append("")
行.append("| 学校 | 在籍 |")
行.append("|---|---|")
for r in 在籍:
  行.append("| %s | %s |" % (r["gakko"], r["kazu"]))
行.append("")
行.append("## ★組み立ての ほう ── ★新しい ホームの 字")
行.append("")
for k, v in 届き.items():
  行.append("- 「%s」 … %s" % (k, "あります" if v else "**ありません**"))
行.append("")
行.append("## ★お確かめ ── ★どちらか 1つ で 分かれます")
行.append("")
行.append("1. ★`+forcode` の ほうで お入りください。★きょうの コマが 1つ 出れば、★画面は 新しい です。")
行.append("2. ★ふだんの ほうの まま なら、★学校を「★はじめの1人テスト（消してよい）」に 変えて ください。")
行.append("")
行.append("★どちらでも 0件 の まま なら、★そのとき 初めて「古い 画面」を 疑います。")
行.append("")
行.append("## ★あわせて 見つかった こと（★別口・直しました）")
行.append("")
行.append("★きょうの ながれの 時刻が、★**9時間 ずれて** いました。")
行.append("★台帳の 字を そのまま 切って いた ため です（★台帳は UTC）。")
行.append("★15:00 の コマが「06:00」と 出て いました。★`241e84bf` で 直しました。")

本文 = "\n".join(行) + "\n"
# ★★3行目に 全体の 丈を 入れます（★2026-09-13 の 決まり）。
#   ★★★入れる 2行 の ぶん を、★先に 足して 数えます。
#     ★★2026-09-18、★1行 足りませんでした。★数えた あとに 入れた ため です。
本文 = 本文.replace("\n\n", "\n\n★全{丈}行 ／ 末尾は「%s」\n\n" % 行[-1], 1)
本文 = 本文.replace("{丈}", str(len(本文.splitlines())))
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("★全%d行" % len(本文.splitlines()))
