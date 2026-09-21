#!/usr/bin/env python3
# ★画面の 門と 台帳の 門が 2つ ある ところ（★台帳 08-1・裁定 その86・2026-09-20）。
#
#   ★★★数えるのは 4つ の 形 ──
#     ①台帳の 読み道・決まりが **役割の 名** で 判じて いる
#     ②画面が **役割の 名** で 出し分けて いる
#     ③できこと の うち、★台帳が 1度も 見て いない もの
#     ④`lib/` の 決めが **役割の 名** で 判じて いる
#
#   ★★読むだけ です。★較正 ── ★当たる 例と、★当たらない 例で 試します。
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NA = ["owner", "admin", "staff", "teacher", "member"]

def 尋ねる(sql):
  out = subprocess.run(["python3", str(ROOT / "tools" / "ask_ledger.py"), "--raw", sql],
                       capture_output=True, text=True).stdout
  行, いま = [], {}
  for l in out.split("\n"):
    if l.startswith("── "):
      if いま:
        行.append(いま)
      いま = {}
      continue
    if ": " in l and not l.startswith("★"):
      k, v = l.split(": ", 1)
      いま[k.strip()] = v
  if いま:
    行.append(いま)
  return 行

def calib():
  a = 'const R = ["teacher", "owner", "admin"];'
  b = 'const R = canOps(gate, "sched_all");'
  みる = lambda s: bool(re.search(r'"(owner|admin|staff|teacher)"', s))
  return みる(a) and not みる(b)

def main():
  if not calib():
    print("★止まりました ── ★較正に 落ちました")
    raise SystemExit(1)
  出 = {"台帳の道": [], "台帳の決まり": [], "画面": [], "見ていないできこと": []}

  # ①読み道
  #   ★★★説明文を 先に 落とします（★裁定 その135・2026-09-21）。
  #     ★★きょう、★この 道具が `create_org_event` を 挙げました。
  #       ★★本番の 中身は `has_can(p_org_id, 'gyoji')` です。★直って います。
  #       ★★挙がったのは、★**もと … `is_org_owner_or_admin`** と 書いた
  #         ★説明の 行 でした。★自分の 説明で 落ちる ── ★4度目 の 形 です。
  #     ★★★行の 終わりを 先に 潰して いた のも 誤り でした。
  #       ★★`chr(10)` を 先に 消すと、★`--` が そこから 後ろ 全部 を
  #         ★飲みます。★**本当の 門も 見えなく なります**（★見落とす 側）。
  #       ★★だから ── ★① 説明を 落とす ★② それから 1行に します。
  for r in 尋ねる("select p.proname, replace(regexp_replace(regexp_replace("
                 "pg_get_functiondef(p.oid), '/\\*.*?\\*/', ' ', 'gs'), "
                 "'--[^' || chr(10) || ']*', ' ', 'g'), chr(10), ' ') as d "
                 "from pg_proc p join pg_namespace n on n.oid=p.pronamespace "
                 "where n.nspname='public'"):
    d = r.get("d", "")
    if "is_org_owner_or_admin" in d and r["proname"] != "is_org_owner_or_admin":
      出["台帳の道"].append((r["proname"], "is_org_owner_or_admin"))
    elif re.search(r"role\s*(=|in)\s*'?(owner|admin)", d):
      出["台帳の道"].append((r["proname"], "role の 名"))

  # ②決まり（policy）
  for r in 尋ねる("select c.relname as t, p.polname, "
                 "replace(coalesce(pg_get_expr(p.polqual,p.polrelid),''), chr(10), ' ') as u "
                 "from pg_policy p join pg_class c on c.oid=p.polrelid"):
    u = r.get("u", "")
    if re.search(r"role\s*=\s*'(owner|admin)'|is_org_owner_or_admin", u):
      出["台帳の決まり"].append((r["t"], r["polname"]))

  # ③画面・lib
  for d in ("components", "lib"):
    for p in sorted((ROOT / d).rglob("*")):
      if p.suffix not in (".js", ".jsx") or "tests" in p.parts:
        continue
      s = p.read_text(encoding="utf-8", errors="replace")
      s = re.sub(r"/\*[\s\S]*?\*/", lambda m: "\n" * m.group(0).count("\n"), s)
      s = "\n".join(re.sub(r"(^|[^:])//.*$", r"\1", l) for l in s.split("\n"))
      for m in re.finditer(r'(role\s*===?\s*"(owner|admin|staff|teacher)"'
                           r'|\[\s*"(teacher|owner|admin)"[^\]]*\]\s*)', s):
        n = s.count("\n", 0, m.start()) + 1
        出["画面"].append((str(p.relative_to(ROOT)), n, m.group(0)[:40]))

  # ④できこと の うち、★台帳が 見て いない もの
  perms = re.findall(r'"(\w+)"', (ROOT / "lib" / "opsPerms.js").read_text(encoding="utf-8")
                     .split("export const PERMS")[1].split("]")[0])
  みた = set()
  for r in 尋ねる("select replace(pg_get_functiondef(p.oid), chr(10), ' ') as d "
                 "from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'"):
    for k in perms:
      if "'" + k + "'" in r.get("d", ""):
        みた.add(k)
  for r in 尋ねる("select replace(coalesce(pg_get_expr(p.polqual,p.polrelid),''), chr(10), ' ') "
                 "|| ' ' || replace(coalesce(pg_get_expr(p.polwithcheck,p.polrelid),''), chr(10), ' ') as d "
                 "from pg_policy p"):
    for k in perms:
      if "'" + k + "'" in r.get("d", ""):
        みた.add(k)
  出["見ていないできこと"] = [k for k in perms if k not in みた]

  print("★できこと", len(perms), "／ ★台帳が 見て いない", len(出["見ていないできこと"]))
  for k, v in 出.items():
    print(f"\n★{k} … {len(v)}件")
    for x in v[:20]:
      print("  ", x)

if __name__ == "__main__":
  main()
