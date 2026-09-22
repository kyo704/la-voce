#!/usr/bin/env python3
"""★本番の 台帳に「移行」として 記録しながら 当てます（★2026-09-22・裁定161 §6）。

  ★★★わけ ── ★本番に 入って いるのに、★移行の 記録に 無い ものが 3つ あります。
    ★S2（open_monka_thread）／裁定160（org_post_perm_log）／束2。
    ★★`ask_ledger.py --write` は SQL を 流すだけ で、★記録を 残しません。
    ★★FX7（試しを 本番の 移行から 作り直す）が、★この 3つを 落とした 試しに なります。

  ★★★これから 本番を 変える ときは、★**この 道 だけ** を 使います。

  ★使い方
    python3 tools/apply_migration.py <名> <file.sql>            ★下見（当てません）
    python3 tools/apply_migration.py <名> <file.sql> --ok       ★当てます
    python3 tools/apply_migration.py --list                     ★いまの 一覧
"""
import json, os, re, subprocess, sys, urllib.request, urllib.error

REF_HONBAN = "xxjtplvpcneksrofkjmf"
REF_TAMESHI = "smntpurraumeerselvsc"


def 合言葉():
  t = os.environ.get("SUPABASE_ACCESS_TOKEN")
  if t:
    return t
  for p in ("~/.bash_profile", "~/.zshrc", "~/.zprofile", "~/.bashrc"):
    f = os.path.expanduser(p)
    if not os.path.exists(f):
      continue
    out = subprocess.run(
      ["bash", "-lc", 'source "%s" >/dev/null 2>&1; printf %%s "$SUPABASE_ACCESS_TOKEN"' % f],
      capture_output=True, text=True).stdout.strip()
    if out:
      return out
  return None


def 叩く(ref, path, body=None):
  t = 合言葉()
  if not t:
    print("★止まりました ── 合言葉が ありません（SUPABASE_ACCESS_TOKEN）。")
    sys.exit(2)
  data = json.dumps(body).encode() if body is not None else None
  r = urllib.request.Request(
    "https://api.supabase.com/v1/projects/%s%s" % (ref, path), data=data,
    headers={"Authorization": "Bearer " + t, "Content-Type": "application/json"})
  try:
    return json.loads(urllib.request.urlopen(r, timeout=120).read().decode() or "null")
  except urllib.error.HTTPError as e:
    print("★番=%s" % e.code)
    print(e.read().decode()[:900])
    sys.exit(2)


# ★★★何度 流しても 同じ に なる 形 か。★そうで なければ 止まります。
#   ★★わけ …… 本番に **もう 入って いる** ものを、★記録の ために もう 一度 流します。
#     ★★`create table`（`if not exists` 無し）や `create policy`（`drop` 無し）が
#       ★あると、★2度目で 落ちます。★落ちると 記録も 残りません。
ABUNAI = [
  (re.compile(r"create\s+table\s+(?!if\s+not\s+exists)", re.I), "create table に if not exists が ありません"),
  (re.compile(r"create\s+index\s+(?!if\s+not\s+exists|concurrently)", re.I), "create index に if not exists が ありません"),
  (re.compile(r"(?<!drop )create\s+policy", re.I), None),   # ★下で 対に なって いるかを 見ます
]


def 何度でも同じか(sql):
  """★註と 括りを 落としてから 見ます（★説明を 処理と 読まない・台帳 08-10）。

    ★★★`do $$ … if not exists (select 1 from pg_constraint …) … end $$` は、
      ★★すでに あれば 飛ばす 形 です。★何度 流しても 同じに なります。
      ★★2026-09-22、★この 形を「対に なって いない」と 読んで、
        ★★Opus の SQL 2本に 誤った NG を 出しました。★見分けます。
  """
  s = re.sub(r"'[^']*'", "''", sql)
  # ★★★ドル引用（`$$ … $$` / `$f$ … $f$`）も 落とします（2026-09-23）。
  #   ★★落とさないと、★`execute format($f$create policy …$f$)` の 中の 字を
  #     ★**処理**と 数えて しまいます。★対の `drop` は `format('')` の 中で
  #     ★★一重引用として 先に 消えて いる ので、★数が 合わず 空振りの NG を 出しました。
  #   ★★★この 落としで、★**動きで 作る 決まり**（`execute format`）は 見えなく なります。
  #     ★★そこは この 道具の 手の 届かない ところ です。★書いて おきます。
  s = re.sub(r"\$([A-Za-z_]*)\$.*?\$\1\$", " ", s, flags=re.S)
  s = "\n".join(re.sub(r"--.*$", "", 行) for 行 in s.split("\n"))
  s = re.sub(r"/\*.*?\*/", " ", s, flags=re.S)
  わけ = []
  for p, 文 in ABUNAI:
    if 文 is None:
      continue
    if p.search(s):
      わけ.append(文)
  # ★`create policy` の 数 ≦ `drop policy if exists` の 数
  作 = len(re.findall(r"create\s+policy", s, re.I))
  消 = len(re.findall(r"drop\s+policy\s+if\s+exists", s, re.I))
  if 作 > 消:
    わけ.append("create policy が %d、drop policy if exists が %d。★対に して ください" % (作, 消))
  # ★`add constraint` は、★`drop constraint if exists` と 対に なって いれば よい です。
  #   ★★`add constraint if not exists` は PostgreSQL に ありません。★対で 守ります。
  # ★`pg_constraint` を 見て 飛ばす 塊の 中の `add constraint` は、★数えません。
  守られた = 0
  for m in re.finditer(r"if\s+not\s+exists\s*\(\s*select[^;]*?pg_constraint[^;]*?\)\s*then(.*?)end\s+if", s,
                       re.I | re.S):
    守られた += len(re.findall(r"add\s+constraint", m.group(1), re.I))
  足c = len(re.findall(r"add\s+constraint", s, re.I)) - 守られた
  消c = len(re.findall(r"drop\s+constraint\s+if\s+exists", s, re.I))
  if 足c > 消c:
    わけ.append("add constraint が %d、drop constraint if exists が %d。★対に して ください" % (足c, 消c))
  # ★関数は `or replace` か、★`drop function if exists` と 対に なって いれば よい です。
  作f = len(re.findall(r"create\s+function", s, re.I))
  置f = len(re.findall(r"create\s+or\s+replace\s+function", s, re.I))
  消f = len(re.findall(r"drop\s+function\s+if\s+exists", s, re.I))
  if 作f - 置f > 消f:
    わけ.append("create function が %d（or replace %d・drop if exists %d）。★どちらかで 対に して ください"
                % (作f, 置f, 消f))
  # ★引き金も 同じ です。
  作t = len(re.findall(r"create\s+trigger", s, re.I))
  消t = len(re.findall(r"drop\s+trigger\s+if\s+exists", s, re.I))
  if 作t > 消t:
    わけ.append("create trigger が %d、drop trigger if exists が %d。★対に して ください" % (作t, 消t))
  return わけ


def main():
  a = sys.argv[1:]
  ref = REF_TAMESHI if "--test" in a else REF_HONBAN
  a = [x for x in a if x != "--test"]
  print("★送り先 ……", "試しの 台帳" if ref == REF_TAMESHI else "★本番の 台帳")
  if "--list" in a:
    for r in 叩く(ref, "/database/migrations"):
      print("  %s  %s" % (r.get("version"), r.get("name")))
    return 0
  if len(a) < 2:
    print(__doc__)
    return 2
  名, 道 = a[0], a[1]
  sql = open(道, encoding="utf-8").read()
  わけ = 何度でも同じか(sql)
  print("★名 ……", 名)
  print("★ファイル ……", 道, "（%d 文字）" % len(sql))
  for w in わけ:
    print("  NG ", w)
  if わけ:
    print("RESULT: NG ── ★何度 流しても 同じ に なる 形に して ください")
    return 1
  print("RESULT: OK ── ★何度 流しても 同じ 形 です")
  if "--ok" not in a:
    print("★当てて いません。★当てる なら --ok を 付けて ください。")
    return 0
  叩く(ref, "/database/migrations", {"name": 名, "query": sql})
  print("★当てました。★一覧を 読み直します ──")
  一覧 = 叩く(ref, "/database/migrations")
  for r in 一覧[-3:]:
    print("  %s  %s" % (r.get("version"), r.get("name")))
  print("★合計 %d 本" % len(一覧))
  return 0


if __name__ == "__main__":
  sys.exit(main())
