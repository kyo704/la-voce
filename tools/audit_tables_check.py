# -*- coding: utf-8 -*-
"""★消せない 記録の 確かめ（★裁定 その100 CONFIRM_NEEDED・2026-09-19）

  ★★★記録が 書き換えられると、★見張る 意味が なく なります。
    ★★見るのは 4つ ── ★誰が 何を できるか。

  ★★較正 ── ★必ず 在る 表と、★必ず 無い 表 で 試します。
"""

import io, os, sys, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ledger_read import 問う

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

記録の表 = ["monka_read_log", "org_billing_log", "post_change_log", "org_message_reads"]

権 = 問う("""
select table_name as hyo, grantee as dare,
       string_agg(privilege_type, ' ' order by privilege_type) as ken
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('monka_read_log', 'org_billing_log', 'post_change_log',
                     'org_message_reads')
group by table_name, grantee
order by table_name, grantee
""")
if not 権:
  raise SystemExit("★止まりました ── 権を 読めません")
# ★★較正 ── ★必ず 在る はずの 組み合わせ。
if not any(r["hyo"] == "monka_read_log" and r["dare"] == "authenticated" for r in 権):
  raise SystemExit("★止まりました ── 較正が 合いません")

決まり = 問う("""
select c.relname as hyo, c.relrowsecurity::text as rls,
       count(p.polname) filter (where p.polcmd = 'a')::text as insert_kimari,
       count(p.polname) filter (where p.polcmd = 'r')::text as select_kimari,
       count(p.polname) filter (where p.polcmd in ('w', 'd', '*'))::text as kakikae_kimari
from pg_class c join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relname in ('monka_read_log', 'org_billing_log', 'post_change_log',
                    'org_message_reads')
group by c.relname, c.relrowsecurity
order by c.relname
""")

引き金 = 問う("""
select c.relname as hyo, count(t.tgname)::text as kazu
from pg_class c join pg_namespace n on n.oid = c.relnamespace
left join pg_trigger t on t.tgrelid = c.oid and not t.tgisinternal
where n.nspname = 'public'
  and c.relname in ('monka_read_log', 'org_billing_log', 'post_change_log',
                    'org_message_reads')
group by c.relname order by c.relname
""")

悪い = []
for r in 権:
  if r["dare"] != "authenticated":
    continue
  for k in ("UPDATE", "DELETE", "TRUNCATE"):
    if k in r["ken"]:
      悪い.append((r["hyo"], k))

今日 = datetime.date.today().isoformat()
行 = []
行.append("# ★消せない 記録の 確かめ")
行.append("")
行.append("★%s ／ ★`tools/audit_tables_check.py` が 書きました。" % 今日)
行.append("★（★丈は 下に あります）")
行.append("")
行.append("★★★記録が 書き換えられると、★見張る 意味が なく なります。")
行.append("")
行.append("## ★使う 方（`authenticated`）に 渡して いる もの")
行.append("")
行.append("| 表 | 渡して いる |")
行.append("|---|---|")
for r in 権:
  if r["dare"] == "authenticated":
    行.append("| `%s` | %s |" % (r["hyo"], r["ken"]))
行.append("")
if 悪い:
  行.append("★★★直す ところ …… **%d**" % len(悪い))
  for h, k in 悪い:
    行.append("- `%s` に `%s` を 渡して います" % (h, k))
else:
  行.append("★★★4つ とも `INSERT` と `SELECT` だけ です。")
  行.append("★★直す・消す・まるごと 消す は、★1つも 渡して いません。")
行.append("")
行.append("## ★決まり（RLS）")
行.append("")
行.append("| 表 | 決まり | 足す | 読む | 書き換え |")
行.append("|---|---|---|---|---|")
for r in 決まり:
  行.append("| `%s` | %s | %s | %s | %s |" % (
    r["hyo"], "入" if r["rls"].lower() == "true" else "★切",
    r["insert_kimari"], r["select_kimari"],
    r["kakikae_kimari"] if r["kakikae_kimari"] != "0" else "0（★正しい）"))
行.append("")
行.append("## ★引き金（trigger）")
行.append("")
for r in 引き金:
  行.append("- `%s` …… %s" % (r["hyo"], r["kazu"]))
行.append("")
行.append("★★引き金が 0なら、★裏から 書き換える 道も ありません。")
行.append("")
行.append("## ★お伝えして おく こと ── `service_role`")
行.append("")
行.append("★`postgres` と `service_role` は、★4つ とも 何でも できます。")
行.append("★★★これは 直せません。★台帳を 作る 鍵 そのもの だからです。")
行.append("★★この 鍵を 使うのは、★私たちが 書いた サーバの 道 だけ です。")
行.append("★★（`app/api/…` ／ `lib/supabase/admin.js`）。★画面には 渡して いません。")
行.append("")
行.append("★★★見張り `components/tests/audit-tables.test.js` が、")
行.append("★★この 4つの 表に `update` / `delete` を 渡して いない ことを 見ます。")

本文 = "\n".join(行) + "\n"
丈 = len(本文.splitlines())
本文 = 本文.replace("★（★丈は 下に あります）",
                   "★全%d行 ／ 末尾は「%s」" % (丈, 行[-1]), 1)
出 = os.path.join(ROOT, "docs", "reports", "%s-消せない記録の確かめ.md" % 今日)
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("表 %d ／ 直す ところ %d" % (len(決まり), len(悪い)))
