#!/usr/bin/env python3
# ★本番の 姿を、★試しの 台帳へ 写す SQL を 作ります（★2026-09-20・D115）。
#
#   ★★★人の 記録は 1行も 運びません。★**形 だけ** です。
#     ★表の 作り・決まり（RLS）・渡し（grant）・読み道（function）の 4つ。
#   ★★★読むのは 本番、★書くのは 試し だけ です。
#     ★★この 道具は **流しません**。★紙に 書き出すだけ です。
#       ★★★流すのは 人が 見てから ── `ask_ledger.py -f … --test --write --ok`。
#
#   ★★較正 ── ★本番にしか 無い ものだけ を 拾えて いるか、★数で 確かめます。
#
#   ★使い方  python3 tools/sync_schema.py
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASK = ROOT / "tools" / "ask_ledger.py"

def 尋ねる(sql, test=False):
  a = ["python3", str(ASK), "--raw", sql]
  if test:
    a.insert(3, "--test")
  out = subprocess.run(a, capture_output=True, text=True).stdout
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

def 名前(rows, key):
  return sorted({r[key] for r in rows if key in r})

def main():
  本表 = 名前(尋ねる("select table_name from information_schema.tables "
                   "where table_schema='public' and table_type='BASE TABLE' order by 1"), "table_name")
  試表 = 名前(尋ねる("select table_name from information_schema.tables "
                   "where table_schema='public' and table_type='BASE TABLE' order by 1", True), "table_name")
  足す表 = [t for t in 本表 if t not in 試表 and not t.startswith("_")]

  本関 = 名前(尋ねる("select p.oid::text as oid, p.proname from pg_proc p "
                   "join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'"), "proname")
  試関 = 名前(尋ねる("select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace "
                   "where n.nspname='public'", True), "proname")
  足す関 = [f for f in 本関 if f not in 試関]

  if not 足す表 and not 足す関:
    print("★差は ありません。")
    return

  あと = []
  L = ["-- ★本番の 形を、★試しの 台帳へ 写します（★2026-09-20・D115）。",
       "-- ★★人の 記録は 1行も ありません。★形 だけ です。",
       f"-- ★足す 表 {len(足す表)} ／ ★足す 読み道 {len(足す関)}", ""]

  for t in 足す表:
    cols = 尋ねる(
      # ★★★`data_type` は 並び を `ARRAY` と しか 言いません（★2026-09-20）。
      #   ★★そのままでは 作れません。★`format_type` が 本当の 名を 返します
      #     （★`uuid[]` ／ `text[]` ／ `numeric(5,2)` など）。
      "select a.attname as column_name, "
      "format_type(a.atttypid, a.atttypmod) as data_type, "
      "case when a.attnotnull then 'NO' else 'YES' end as is_nullable, "
      "coalesce(replace(pg_get_expr(d.adbin, d.adrelid), chr(10), ' '), '') as def "
      "from pg_attribute a "
      "left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum "
      f"where a.attrelid = 'public.{t}'::regclass and a.attnum > 0 and not a.attisdropped "
      "order by a.attnum")
    if not cols:
      continue
    L.append(f"-- ── {t} ──")
    片 = []
    for c in cols:
      d = c.get("def", "")
      片.append("  " + c["column_name"] + " " + c["data_type"]
                + ("" if c.get("is_nullable") == "YES" else " not null")
                + (" default " + d if d else ""))
    L.append(f"create table if not exists public.{t} (")
    L.append(",\n".join(片))
    L.append(");")
    L.append(f"alter table public.{t} enable row level security;")
    L.append(f"revoke all on table public.{t} from public, anon, authenticated;")
    # ★★★決まり（PK・一意・外つなぎ・check）も 写します。
    #   ★★無いと `upsert` の `onConflict` が 通りません。★画面が 動きません。
    con = 尋ねる(
      "select conname, replace(pg_get_constraintdef(oid), chr(10), ' ') as def from pg_constraint "
      f"where conrelid='public.{t}'::regclass order by contype desc, conname")
    for c in con:
      d = c.get("def", "")
      if not d:
        continue
      # ★★外つなぎは、★相手の 表が まだ 無い ことが あります。★あとで まとめて。
      if d.lower().startswith("foreign key"):
        あと.append(f"alter table public.{t} add constraint {c['conname']} {d};")
        continue
      L.append(f"alter table public.{t} add constraint {c['conname']} {d};")
    # ★★渡し（grant）── ★本番と 同じ ものだけ。
    gr = 尋ねる("select grantee, string_agg(distinct privilege_type, ', ') as p "
                "from information_schema.role_table_grants "
                f"where table_schema='public' and table_name='{t}' "
                "and grantee in ('authenticated','anon') group by grantee")
    for g in gr:
      if g.get("p"):
        L.append(f"grant {g['p'].lower()} on table public.{t} to {g['grantee']};")
    # ★★決まり（RLS の policy）。★無いと 1行も 見えません。
    pol = 尋ねる("select p.polname, p.polcmd::text as cmd, "
                 "replace(coalesce(pg_get_expr(p.polqual,p.polrelid),''), chr(10), ' ') as u, "
                 "replace(coalesce(pg_get_expr(p.polwithcheck,p.polrelid),''), chr(10), ' ') as w "
                 "from pg_policy p join pg_class c on c.oid=p.polrelid "
                 f"where c.relname='{t}'")
    for x in pol:
      cmd = {"r": "select", "a": "insert", "w": "update", "d": "delete", "*": "all"}.get(x.get("cmd"), "all")
      s = f"create policy {x['polname']} on public.{t} for {cmd}"
      if x.get("u"):
        s += f" using ({x['u']})"
      if x.get("w"):
        s += f" with check ({x['w']})"
      L.append(s + ";")
    L.append("")

  # ★★★両方に ある 表でも、★列が 足りない ことが あります（★2026-09-20）。
  #   ★★`teacher_invitations` は 両方に ありますが、★試しの ほうには
  #     ★★`monka_teacher_id` が ありません。★読み道が そこで 止まりました。
  #   ★★足す だけ です。★消しません・変えません。
  両方 = [x for x in 本表 if x in 試表 and not x.startswith("_")]
  足した列 = 0
  for x in 両方:
    ほ = 尋ねる("select a.attname as c, format_type(a.atttypid, a.atttypmod) as ty, "
               "coalesce(replace(pg_get_expr(d.adbin, d.adrelid), chr(10), ' '), '') as def "
               "from pg_attribute a left join pg_attrdef d "
               "on d.adrelid=a.attrelid and d.adnum=a.attnum "
               f"where a.attrelid='public.{x}'::regclass and a.attnum>0 and not a.attisdropped")
    た = 尋ねる("select a.attname as c from pg_attribute a "
               f"where a.attrelid='public.{x}'::regclass and a.attnum>0 and not a.attisdropped", True)
    ある = {r["c"] for r in た if "c" in r}
    ない = [r for r in ほ if r.get("c") and r["c"] not in ある]
    if not ない:
      continue
    L.append(f"-- ── ★列を 足す … {x} ──")
    for r in ない:
      s = f"alter table public.{x} add column if not exists {r['c']} {r['ty']}"
      if r.get("def"):
        s += " default " + r["def"]
      L.append(s + ";")
      足した列 += 1
    L.append("")

  # ★★★読み道は、★互いを 呼び合います（★2026-09-20 に 落ちました）。
  #   ★★`can_view_ops_perm` は `has_can_user` を 呼びます。
  #   ★★名の 順に 流すと、★呼ばれる ほうが あと に なり、★止まります。
  #   ★★★だから 先に 中身を 集め、★「よそから 呼ばれて いる 数」の 多い 順に します。
  本体たち = {}
  for f in 足す関:
    defs = 尋ねる("select to_json(pg_get_functiondef(p.oid))::text as d from pg_proc p "
                 "join pg_namespace n on n.oid=p.pronamespace "
                 f"where n.nspname='public' and p.proname='{f}'")
    for d in defs:
      s = d.get("d") or ""
      if not s:
        continue
      try:
        本体たち.setdefault(f, []).append(json.loads(s))
      except Exception:
        print("★飛ばしました（読めません）:", f)

  def 呼ばれた数(name):
    """★よそから 何回 呼ばれて いるか。

      ★★★自分の 中身は 数えません（★自分の 名は 必ず 出ます）。
      ★★★`has_can` と `has_can_user` の ように、★名が 名を 含む ものが あります。
        ★★`has_can_user` を 数える とき、★`has_can` の 数に 混ざります。
        ★★だから 後ろに 括弧の 付いた 形（`名(`）だけ を 数えます。
    """
    n = 0
    for k, v in 本体たち.items():
      if k == name:
        continue
      for b in v:
        n += b.count(name + "(")
    return n

  # ★★★数の 順では 足りません（★2026-09-20）。
  #   ★★呼ぶ ほうが 先に 出る ことが あります。
  #   ★★★確かな やり方 ── ★**2回** 並べます。
  #     ★★1回目で 足りない ものは 止まりますが、★`create or replace` は
  #       ★★何度 流しても 同じ です。★2回目で 埋まります。
  #     ★★★けれど 1回目で 止まると、★その場で 終わります。
  #       ★★だから「呼ばれない もの から 先」に 並べ、★そのうえで 2回 出します。
  def 深さ(name, みち=()):
    """★その 読み道が、★いくつ 深く よそを 呼んで いるか。★浅い ものから 作ります。"""
    if name in みち:
      return 0
    本 = "".join(本体たち.get(name, []))
    子 = [k for k in 本体たち if k != name and (k + "(") in 本]
    return 0 if not 子 else 1 + max(深さ(k, みち + (name,)) for k in 子)

  順 = sorted(本体たち, key=lambda x: (深さ(x), x))
  for 回 in (1, 2):
    L.append(f"-- ── ★読み道（{回}回目）──")
    for f in 順:
      for 本体 in 本体たち[f]:
        L.append(本体 + ";")
        L.append("")

  for f in []:
    # ★★★読み道の 中身は、★改行を 潰しては いけません（★2026-09-20）。
    #   ★★`--` の 註が ある と、★以降 ぜんぶ が 註に なります。
    #   ★★★だから JSON の 字 に して 受け取り、★こちらで 戻します。
    #     ★★JSON なら 改行は `\n` の 2文字 です。★1行の まま 運べます。
    defs = 尋ねる("select to_json(pg_get_functiondef(p.oid))::text as d from pg_proc p "
                 "join pg_namespace n on n.oid=p.pronamespace "
                 f"where n.nspname='public' and p.proname='{f}'")
    for d in defs:
      s = d.get("d") or ""
      if not s:
        continue
      try:
        本体 = json.loads(s)
      except Exception:
        print("★飛ばしました（読めません）:", f)
        continue
      L.append(本体 + ";")
      L.append("")

  if あと:
    L.append("-- ── ★外つなぎ（★表が そろって から）──")
    L.extend(あと)
    L.append("")

  p = ROOT / "supabase" / "sync_to_test.sql"
  p.write_text("\n".join(L) + "\n", encoding="utf-8")
  print(f"★足す 表 {len(足す表)} ／ ★足す 列 {足した列} ／ ★足す 読み道 {len(足す関)}")
  print("FILE:", p)

if __name__ == "__main__":
  main()
