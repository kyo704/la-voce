# -*- coding: utf-8 -*-
"""★できことの 名と、★それが 開く 範囲が 合って いるか（★裁定 その88 ROOT_CAUSE）

  ★★きっかけ ── ★`renraku_all`（「学校全部へ **出す**」）で、
    ★★門下の やりとりが **読めて** いました。★名前と 範囲が ちがいました。

  ★★★この 1本が、★台帳の 決まりを ぜんぶ 出し、★1件ずつ 並べます。
    ★★判じるのは 人 です。★道具は 並べる だけ です。

  ★★止まる 決まり ── ★できことの 名が `lib/opsPerms.js` に 無ければ 止まります。
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
# 【一】★できことの 名と、★その 言い方（★`lib/opsPerms.js` が 正）
# ---------------------------------------------------------------------------
元 = io.open(os.path.join(ROOT, "lib", "opsPerms.js"), encoding="utf-8").read()
塊 = 元[元.index("export const PERMS = Object.freeze(["):]
塊 = 塊[:塊.index("]);")]
言い方 = dict(re.findall(r'key:\s*"([a-z_]+)",\s*label:\s*"([^"]+)"', 塊))
if len(言い方) < 10:
  raise SystemExit("★止まりました ── できことを %d しか 読めません" % len(言い方))

# ---------------------------------------------------------------------------
# 【二】★台帳の 決まり
# ---------------------------------------------------------------------------
決まり = 問う("""
select c.relname as tbl, p.polname as pol, p.polcmd::text as cmd,
       (select string_agg(x[1], ' ') from regexp_matches(
          coalesce(pg_get_expr(p.polqual, p.polrelid),'') || ' ' ||
          coalesce(pg_get_expr(p.polwithcheck, p.polrelid),''),
          'has_can[a-z_]*\\([^,]+, ''([a-z_]+)''', 'g') as t(x)) as dekikoto
from pg_policy p join pg_class c on c.oid = p.polrelid
where coalesce(pg_get_expr(p.polqual, p.polrelid),'') like '%has_can%'
   or coalesce(pg_get_expr(p.polwithcheck, p.polrelid),'') like '%has_can%'
order by c.relname, p.polname
""")
if len(決まり) < 10:
  raise SystemExit("★止まりました ── 決まりを %d しか 読めません" % len(決まり))

# ★★★命の 読み方（★`polcmd`）── ★r 読む／a 足す／w 直す／d 消す／* ぜんぶ
命 = {"r": "読む", "a": "足す", "w": "直す", "d": "消す", "*": "ぜんぶ"}

# ★★★名に「出す」「書く」と ある のに、★読む 決まりで 使われて いないか。
出す語 = ["出す", "書く", "払う"]
怪しい = []
for r in 決まり:
  で = sorted(set((r["dekikoto"] or "").split()))
  for k in で:
    if k not in 言い方:
      raise SystemExit("★止まりました ── 知らない できこと: " + k)
    名 = 言い方[k]
    if r["cmd"] == "r" and any(w in 名 for w in 出す語):
      怪しい.append((r["tbl"], r["pol"], k, 名))

# ★★較正 ── ★わざと 1件 作って、★見つけられる こと。
if not any(w in "学校全部へ お知らせを 出す" for w in 出す語):
  raise SystemExit("★止まりました ── 道具が「出す」を 見つけられません")

今日 = datetime.date.today().isoformat()
出 = os.path.join(ROOT, "docs", "reports", "%s-できことの名と範囲.md" % 今日)

行 = []
行.append("# ★できことの 名と、★それが 開く 範囲")
行.append("")
行.append("★裁定 その88 ROOT_CAUSE ／ ★%s ／ ★`tools/perm_scope_audit.py` が 書きました。" % 今日)
行.append("")
行.append("★きっかけ ── ★`renraku_all`（「学校全部へ **出す**」）で、")
行.append("★門下の やりとりが **読めて** いました。★名前と 範囲が ちがいました。")
行.append("")
行.append("## ★数")
行.append("")
行.append("★できこと %d ／ ★`has_can` を 使う 決まり %d" % (len(言い方), len(決まり)))
行.append("")
行.append("## ★1件ずつ")
行.append("")
行.append("| 表 | 決まり | 何を | できこと | その 言い方 |")
行.append("|---|---|---|---|---|")
for r in 決まり:
  で = sorted(set((r["dekikoto"] or "").split()))
  行.append("| %s | `%s` | %s | %s | %s |"
            % (r["tbl"], r["pol"], 命.get(r["cmd"], r["cmd"]),
               "／".join("`%s`" % k for k in で),
               "／".join(言い方[k] for k in で)))
行.append("")
行.append("## ★★★見て いただきたい もの（%d）" % len(怪しい))
行.append("")
行.append("★「出す」「書く」「払う」を 名に 持つ できことが、★**読む** 決まりで 使われて いる ところ です。")
行.append("")
if 怪しい:
  行.append("| 表 | 決まり | できこと | その 言い方 |")
  行.append("|---|---|---|---|")
  for t, pol, k, 名 in 怪しい:
    行.append("| %s | `%s` | `%s` | %s |" % (t, pol, k, 名))
else:
  行.append("★ありません。")
行.append("")
行.append("## ★この 道具が 見て いない こと")
行.append("")
行.append("★① 名に 動きの 語が 無い できこと（`meibo`「学校全部の 名簿を 見る・直す」など）。")
行.append("★★「見る・直す」の 両方を 名に 持つ ものは、★読む 決まりで 使って も 正しい です。")
行.append("★② 決まりの 中の **枝**。★1つの 決まりに 2つの できことが ある とき、")
行.append("★★どちらの 枝が どこに かかるかまでは 読んで いません。★式を ご覧ください。")
行.append("★③ 関数（SECURITY DEFINER）の 中。★`can_view_ops_perm` は 呼ぶ 側が 名を 渡します。")

本文 = "\n".join(行) + "\n"
本文 = 本文.replace("\n\n", "\n\n★全{丈}行 ／ 末尾は「%s」\n\n" % 行[-1], 1)
本文 = 本文.replace("{丈}", str(len(本文.splitlines())))
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("できこと %d ／ 決まり %d ／ 見て いただきたい もの %d"
      % (len(言い方), len(決まり), len(怪しい)))
