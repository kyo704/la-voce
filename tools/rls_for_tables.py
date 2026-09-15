#!/usr/bin/env python3
# ============================================================================
# ★ある表の 決まり（RLS）が、★紙の うえで どうなって いるか
#
#   ★出どころ [ACTION] Opus → Code（★2026-09-15）
#     「report: current RLS on lessons / org_messages / org_events,
#       and whether a student can already read their own rows (STEP 1)」
#
#   ★★★この 道具が 見て いるのは **紙** です。★台帳では ありません。
#     ★★私は 台帳を 引けません。★SQL を 流すのは 坂本さん です。
#     ★★紙に 書いて ある ことと、★台帳に ある ことは、★同じとは 限りません ──
#       ★ほかの 経路（★SQLエディタで 直に 打った もの）が あるから です。
#     ★★だから 最後に、★台帳へ 直に 尋ねる 問いを 出します。
#       ★★その 答えが 出るまで、★ここの 一覧は「下書き」です。
#
#   ★★読む 紙が 1つでも 無ければ、★数えずに 止まります（★2026-09-14 の 決め）。
#   ★★自分の 抜き取りも 検算します ──
#     ★`create policy` を 数えた 数と、★拾えた 数が 合うこと。
# ============================================================================

import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ★見る 表。★引数で 変えられます。
DEFAULT_TABLES = ["lessons", "org_messages", "org_events"]

POLICY_RE = re.compile(
  r"(create\s+policy|drop\s+policy|alter\s+policy)\s+"
  r"(?:if\s+(?:not\s+)?exists\s+)?"
  r"(\"[^\"]+\"|'[^']+'|[a-zA-Z_][\w]*)"
  r"\s+on\s+(?:public\.)?(\w+)",
  re.I,
)
RLS_RE = re.compile(
  r"alter\s+table\s+(?:public\.)?(\w+)\s+"
  r"(enable|disable|force|no\s+force)\s+row\s+level\s+security",
  re.I,
)
GRANT_RE = re.compile(
  r"\b(grant|revoke)\s+([\w,\s()]+?)\s+on\s+(?:table\s+)?(?:public\.)?(\w+)\s+(?:to|from)\s+([\w,\s]+)",
  re.I,
)


def strip_sql_comments(text):
  """★`--` の 行を 外します。★仕様を 引用した 行を 数えない ため。"""
  out = []
  for line in text.split("\n"):
    if line.lstrip().startswith("--"):
      continue
    out.append(line)
  return "\n".join(out)


def clause_after(body, start, keyword):
  """★`using` / `with check` の 中身を、★括弧の 釣り合いで 取り出します。"""
  m = re.compile(r"\b" + keyword + r"\b\s*\(", re.I).search(body, start)
  if not m:
    return None
  i = m.end() - 1
  depth = 0
  for j in range(i, len(body)):
    if body[j] == "(":
      depth += 1
    elif body[j] == ")":
      depth -= 1
      if depth == 0:
        return " ".join(body[i + 1:j].split())
  return None


def statements_of(path):
  """★1つの 紙を、★`;` で 文に 割ります。"""
  raw = open(path, encoding="utf-8", errors="replace").read()
  return strip_sql_comments(raw).split(";")


def collect(tables):
  files = sorted(glob.glob(os.path.join(ROOT, "supabase", "*.sql")))
  if not files:
    print("★★supabase/*.sql が 1つも ありません。★数えません。★止まります。")
    return None

  found = {t: {"policies": [], "rls": [], "grants": []} for t in tables}
  seen_policy_stmts = 0
  picked_policy_stmts = 0
  # ★★その場で 組み立てて 流す もの（★`execute format('create policy …')`）。
  #   ★★表の 名前が 変数です。★紙からは **読めません**。
  #   ★★これは 取りこぼしでは ありません。★読めない、という 事実です。
  #     ★★だから 別に 数えて、★別に お知らせします。
  #     ★★黙って 落とすと、★一覧が そろって いるように 見えます。
  dynamic = []

  for path in files:
    name = os.path.basename(path)
    for stmt in statements_of(path):
      low = stmt.lower()
      if re.search(r"\bcreate\s+policy\b", low):
        seen_policy_stmts += 1
        if re.search(r"\bexecute\s+(?:format\s*\(|immediate\b|')", low):
          dynamic.append({"file": name, "sql": " ".join(stmt.split())[:200]})
          picked_policy_stmts += 1
          continue
      m = POLICY_RE.search(stmt)
      if m:
        verb, pol, tbl = m.group(1).lower(), m.group(2).strip("\"'"), m.group(3).lower()
        if re.search(r"\bcreate\s+policy\b", low):
          picked_policy_stmts += 1
        if tbl in found:
          cmd = re.search(r"\bfor\s+(all|select|insert|update|delete)\b", stmt, re.I)
          role = re.search(r"\bto\s+([\w,\s]+?)\s+(?:using|with\s+check|$)", stmt, re.I)
          found[tbl]["policies"].append({
            "file": name,
            "verb": " ".join(verb.split()),
            "name": pol,
            "cmd": (cmd.group(1).upper() if cmd else "ALL"),
            "role": (" ".join(role.group(1).split()) if role else "(既定)"),
            "using": clause_after(stmt, 0, "using"),
            "check": clause_after(stmt, 0, "with\\s+check"),
          })
      for m2 in RLS_RE.finditer(stmt):
        if m2.group(1).lower() in found:
          found[m2.group(1).lower()]["rls"].append(
            {"file": name, "what": " ".join(m2.group(2).split()).lower()})
      for m3 in GRANT_RE.finditer(stmt):
        if m3.group(3).lower() in found:
          found[m3.group(3).lower()]["grants"].append({
            "file": name,
            "verb": m3.group(1).lower(),
            "priv": " ".join(m3.group(2).split()),
            "who": " ".join(m3.group(4).split()),
          })

  return found, len(files), seen_policy_stmts, picked_policy_stmts, dynamic


def main():
  tables = sys.argv[1:] or DEFAULT_TABLES
  got = collect(tables)
  if got is None:
    return 1
  found, n_files, seen, picked, dynamic = got

  # ★★頭に 出します。★末尾の 但し書きは 読み飛ばされます。
  #   ★★2026-09-15、★末尾に 但し書きを 置いて いました。
  #     ★★それでも 私は 結びを 書き、★誤った まま 旅を しました。
  print("★" * 33)
  print("★★これは **下書き** です。★答えでは ありません。")
  print("　★紙だけを 見て います。★SQLエディタで 直に 打った 決まりは 写りません。")
  print("　★★2026-09-15、★`lessons` で それを 踏みました ──")
  print("　　★この 道具が 見つけた SELECT の 決まりは 1つ でした。")
  print("　　★本番の pg_policy には、★紙に 無い ものが もう1つ ありました")
  print("　　　（\"Teacher and student can view lessons\"・org_id の 条件 なし）。")
  print("　★★下の 問いで 裏を 取るまで、★ここから 結びを 書かないで ください。")
  print("★" * 33)
  print()
  print("★紙の うえの 決まり（RLS）── ★下書き")
  print("　★見た 紙: supabase/*.sql　%d 枚" % n_files)
  print()

  for t in tables:
    d = found[t]
    print("=" * 66)
    print("■ %s" % t)
    if d["rls"]:
      for r in d["rls"]:
        print("　RLS: %s　（%s）" % (r["what"], r["file"]))
    else:
      print("　RLS: ★この 紙たちには 書いて ありません")

    if not d["policies"]:
      print("　決まり: ★1つも ありません")
    else:
      print("　決まり: %d 件（★紙に 出て くる 順）" % len(d["policies"]))
      for p in d["policies"]:
        print("　　・[%s] %s　%s　to %s　（%s）"
              % (p["cmd"], p["name"], p["verb"], p["role"], p["file"]))
        if p["using"]:
          print("　　　　using: %s" % p["using"])
        if p["check"]:
          print("　　　　with check: %s" % p["check"])

    if d["grants"]:
      print("　権限: %d 件" % len(d["grants"]))
      for g in d["grants"]:
        print("　　・%s %s → %s　（%s）" % (g["verb"], g["priv"], g["who"], g["file"]))
    print()

  print("=" * 66)
  print("★この 数え 自身の 検算")
  if seen == picked:
    print("　✓ `create policy` の 文 %d 件を、★すべて 読み取れました" % seen)
  else:
    print("　★★%d 件 中 %d 件しか 読み取れて いません（★%d 件 取りこぼし）"
          % (seen, picked, seen - picked))
    print("　★★この 一覧は 足りて いません。★正規表現を 直して ください。")
  print()
  print("★★この 道具が 見て いない こと")
  print("　★台帳（Supabase）の 中身は 見て いません。★紙だけ です。")
  print("　★SQLエディタで 直に 打った ものは、★どの 紙にも ありません。")
  print("　★★2026-09-15 の 実例 ── `lessons` に、★紙に 無い SELECT の 決まりが")
  print("　　★1つ ありました（\"Teacher and student can view lessons\"）。")
  print("　　★生徒は はじめから 読めて いました。★紙からの 結びは 逆でした。")
  print("　★★下の 問いを 流して、★台帳に 直に 尋ねて ください。★省けません。")
  print()
  print("-" * 66)
  print("""-- ★台帳に 直に 尋ねる（★読むだけ・書きません）
select
  c.relname                            as "表",
  c.relrowsecurity                     as "RLS",
  c.relforcerowsecurity                as "所有者にも かける",
  coalesce(p.polname, '(決まり なし)') as "決まり",
  case p.polcmd when 'r' then 'SELECT' when 'a' then 'INSERT'
                when 'w' then 'UPDATE' when 'd' then 'DELETE'
                else 'ALL' end        as "何に",
  coalesce(array_to_string(p.polroles::regrole[], ', '), '(既定)') as "誰に",
  pg_get_expr(p.polqual,      c.oid)   as "using",
  pg_get_expr(p.polwithcheck, c.oid)   as "with check"
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relname in ('lessons', 'org_messages', 'org_events')
order by c.relname, p.polname;

-- ★誰が 何を できるか（★表ごとの 権限）
select
  table_name as "表", grantee as "誰が", string_agg(privilege_type, ', ') as "何を"
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('lessons', 'org_messages', 'org_events')
group by table_name, grantee
order by table_name, grantee;""")
  return 0


if __name__ == "__main__":
  sys.exit(main())
