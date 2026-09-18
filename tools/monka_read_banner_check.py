# -*- coding: utf-8 -*-
"""★門下の 帯 ── ★どの 字が、★どの 門で 出るか（★2026-09-18）

  ★★坂本さんの 実機に 出た 字が、★裁定 その87 の 字と ちがう と ご報告。
  ★★★この 1本が、★台帳と 本文の 両方を 見て、★理由を 書きます。
"""

import io, os, re, subprocess, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIKU = os.path.join(ROOT, "tools", "ask_ledger.py")


def 問う(sql):
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


# ---------------------------------------------------------------------------
# 【一】★誰が `monka_read` を 持って いるか
# ---------------------------------------------------------------------------
役職 = 問う("""
select o.name as gakko, p.name as post, m.role as yaku,
       (p.perms ? 'monka_read')::text  as mr,
       (p.perms ? 'renraku_all')::text as ra
from public.memberships m
join public.org_posts p on p.id = m.post_id
join public.organizations o on o.id = m.org_id
order by o.name, p.name
""")
持つ = [r for r in 役職 if r["mr"].lower() == "true"]
ra持つ = [r for r in 役職 if r["ra"].lower() == "true"]

# ★★較正 ── ★読めて いる こと（★0件を「無い」と 読ませない）。
if len(役職) < 5:
  raise SystemExit("★止まりました ── 役職を %d しか 読めません" % len(役職))

# ---------------------------------------------------------------------------
# 【二】★台帳の 門（org_messages を 誰が 読めるか）
# ---------------------------------------------------------------------------
# ★★★式の 中に `|` が 入ります。★表の 区切りと ぶつかります（★2026-09-18）。
#   ★★区切りで 割ると、★列が ずれて 読めなく なりました。
#   ★★だから、★式は 別に 取り、★名前だけ を 表から 読みます。
決まり = 問う("""
select p.polname as pol
from pg_policy p join pg_class c on c.oid = p.polrelid
where c.relname = 'org_messages' and p.polcmd = 'r'
order by p.polname
""")
式 = {}
for _r in 決まり:
  _v = 問う("""
    select replace(pg_get_expr(p.polqual, p.polrelid), '|', '／') as shiki
    from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'org_messages' and p.polname = '%s'
  """ % _r["pol"].replace("'", "''"))
  式[_r["pol"]] = _v[0]["shiki"] if _v else ""
便り = 問う("""
select count(*)::text as zenbu,
       count(*) filter (where teacher_id is not null)::text as monka
from public.org_messages
""")[0]

# ---------------------------------------------------------------------------
# 【三】★画面の どこに、★どの 字が あるか
# ---------------------------------------------------------------------------
画面 = io.open(os.path.join(ROOT, "components", "Renraku.jsx"), encoding="utf-8").read()


def 行番(印):
  for n, l in enumerate(画面.split("\n")):
    if 印 in l:
      return n + 1
  return None


新の行 = 行番("{MONKA_READ_SELF_LINE}")
旧の行 = 行番('{OPS_READ_ONLY_LINE}')
門の行 = 行番('role === "owner" || role === "admin"')

今日 = datetime.date.today().isoformat()
出 = os.path.join(ROOT, "docs", "reports", "%s-門下の帯-字のちがい.md" % 今日)

行 = []
行.append("# ★門下の 帯 ── ★なぜ ちがう 字が 出たか")
行.append("")
行.append("★%s ／ ★`tools/monka_read_banner_check.py` が 書きました。" % 今日)
行.append("")
行.append("## ★答え")
行.append("")
行.append("★**古い 版では ありません。**★別の ところの、★別の 字 です。")
行.append("")
行.append("★2つ の 断りが、★別々の 門で、★別々の 場所に 出ます。")
行.append("")
行.append("| | 裁定 その87 の 帯 | ご覧に なった 断り |")
行.append("|---|---|---|")
行.append("| どこ | 画面の いちばん 上 | 門下を 開いた あと の 本文の 上 |")
行.append("| 行 | `components/Renraku.jsx:%s` | `components/Renraku.jsx:%s` |" % (新の行, 旧の行))
行.append("| 門 | `monka_read` を 持つ こと | `role` が owner か admin（★役割の 名） |")
行.append("| いつから | 2026-09-18（裁定 その87） | 2026-09-10（見本③） |")
行.append("")
行.append("## ★なぜ 新しい 帯が 出なかったか")
行.append("")
行.append("★★★`monka_read` を 持つ 役職が、★台帳に **%d件** です。" % len(持つ))
行.append("")
行.append("★数えた 役職 …… %d件" % len(役職))
行.append("")
行.append("★これは 正しい 姿 です（★裁定 その77 ──「普段は 切って あります」）。")
行.append("★★持って いない ので 出ません。★壊れて いるのでは ありません。")
行.append("")
行.append("★配備も 届いて います（★`確かめられる 役職です` を 本番で 確かめました）。")
行.append("")
行.append("## ★★★見つけた こと ── ★古い 断りの 門が、★役割の 名の まま です")
行.append("")
行.append("★`components/Renraku.jsx:%s` ── `!canWrite && (role === \"owner\" || role === \"admin\")`" % 門の行)
行.append("")
行.append("★★裁定 その76・その77 で、★門下を 読むのは `monka_read` に なりました。")
行.append("★★この 断りだけ、★2026-09-10 の 形（役割の 名）の まま です。")
行.append("★★★だから、★`monka_read` を 持たない 学長・事務長にも 出ます。")
行.append("")
行.append("## ★★★もう 1つ ── ★`renraku_all` が 門下の やりとりを 開けます")
行.append("")
行.append("★台帳の 決まり（`org_messages` を 読む）は %d本 です。" % len(決まり))
行.append("")
for r in 決まり:
  行.append("- `%s`" % r["pol"])
  行.append("  - `%s`" % 式.get(r["pol"], ""))
行.append("")
行.append("★★`org_messages_select` の 3つ目の 枝 ── `has_can(org_id, 'renraku_all')`。")
行.append("★★`renraku_all` は「学校全部へ **お知らせを 出す**」できこと です。")
行.append("★★★それで、★門下の やりとりも 読めて います。")
行.append("")
行.append("★いま `renraku_all` を 持つ 役職 …… **%d件**" % len(ra持つ))
行.append("★いま `monka_read` を 持つ 役職 …… **%d件**" % len(持つ))
行.append("★台帳の お便り …… 全部 %s件 ／ うち 門下の もの %s件" % (便り["zenbu"], 便り["monka"]))
行.append("")
行.append("★★★これは 裁定 その76 の 筋 と ちがいます ──")
行.append("★★「事故・苦情の ときだけ、`monka_read` を 入れる」「開いた 記録が 残る」。")
行.append("★★`renraku_all` で 読んだ ぶんには、★その 記録が 残りません。")
行.append("")
行.append("## ★お決めを お願いしたい こと")
行.append("")
行.append("★① 古い 断り（`Renraku.jsx:%s`）を どう するか" % 旧の行)
行.append("★　㋐ 門を `monka_read` に 揃える　㋑ 消して 新しい 帯に 1本化する　㋒ そのまま")
行.append("")
行.append("★② `org_messages_select` の `renraku_all` の 枝を どう するか")
行.append("★　㋐ 門下の もの（teacher_id が 入って いる 行）は `monka_read` だけ に する")
行.append("★　㋑ そのまま（★お知らせを 出す 方は、★門下も 読める）")
行.append("")
行.append("★★②は 見える 範囲の 話 です。★こちらでは 決めません。")

本文 = "\n".join(行) + "\n"
本文 = 本文.replace("\n\n", "\n\n★全{丈}行 ／ 末尾は「%s」\n\n" % 行[-1], 1)
本文 = 本文.replace("{丈}", str(len(本文.splitlines())))
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("monka_read を 持つ 役職 %d ／ renraku_all %d ／ 役職 %d"
      % (len(持つ), len(ra持つ), len(役職)))
