# -*- coding: utf-8 -*-
"""★`search_path` と、★拡張の 置き場が 合って いるか。

  ★★2026-09-16。★`get_invitation_teacher` が、★正しい 合言葉でも
    ★いつも「入れませんでした」と 返して いました。
  ★★わけ ── ★`set search_path = public` と 書いて いた ため、
    ★`digest()` が 見つかりません でした。
    ★★Supabase では、★拡張は `public` では なく **`extensions`** に 入ります。
  ★★例外は `code_attempts` へ 足す 前に 起きて いた ので、
    ★試した 記録すら 残って いません でした。

  ★★同じ 形が ほかに 無いか、★`supabase/*.sql` を 全部 読みます。

  ★★★較正（★2026-09-16 の 決まり）──
    ★★わざと 当たる もの を 作って、★出る ことを 確かめて から 報告します。
    ★★出なければ、★道具の ほうが 壊れて います。
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQL_DIR = os.path.join(ROOT, "supabase")

# ★`extensions` に 入る もの（★Supabase の ふつうの 置き方）。
#   ★★pgcrypto … digest / hmac / crypt / gen_salt / gen_random_bytes / pgp_*
#   ★★uuid-ossp … uuid_generate_v*
#   ★★`gen_random_uuid` は 外します ── ★PG13 から `pg_catalog` に あります。
EXT_FUNCS = {
  "digest": "pgcrypto",
  "hmac": "pgcrypto",
  "crypt": "pgcrypto",
  "gen_salt": "pgcrypto",
  "gen_random_bytes": "pgcrypto",
  "pgp_sym_encrypt": "pgcrypto",
  "pgp_sym_decrypt": "pgcrypto",
  "uuid_generate_v4": "uuid-ossp",
  "uuid_generate_v1": "uuid-ossp",
}

FUNC = re.compile(
  r"create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)\s*\(", re.I)


def no_comments(s):
  return re.sub(r"--[^\n]*", "", s)


def bodies(sql):
  """★1つの 関数を、★頭から `$$;` まで 切り出します。"""
  out = []
  for m in FUNC.finditer(sql):
    tail = sql[m.start():]
    end = tail.find("$$;")
    out.append({"name": m.group(1), "text": tail[:end + 3] if end > 0 else tail[:4000]})
  return out


def examine(name, text):
  code = no_comments(text)
  sp = re.search(r"set\s+search_path\s*=\s*([^\n;]+)", code, re.I)
  # ★★★`as $$` が 同じ 行に 続く ことが あります。★そこで 切ります。
  #   ★★2026-09-16、★較正が これを 捕まえました ── ★直して ある ものを
  #     ★「落ちます」と 数えて いました。★較正が 無ければ、★そのまま
  #     ★坂本さんに お出しして いた ところ です。
  path = None
  if sp:
    raw = re.split(r"\bas\b|\$\$|\blanguage\b", sp.group(1), flags=re.I)[0]
    path = [x.strip().strip('"\'') for x in raw.split(",") if x.strip()]
  definer = bool(re.search(r"security\s+definer", code, re.I))
  used = sorted({f for f in EXT_FUNCS if re.search(r"\b" + f + r"\s*\(", code)})
  needs_ext = bool(used)
  has_ext = bool(path) and "extensions" in path
  return {
    "name": name,
    "definer": definer,
    "search_path": path,
    "uses": used,
    # ★★危ない ── ★拡張を 使うのに、★`extensions` が 道に 無い。
    "broken": needs_ext and path is not None and not has_ext,
    # ★★道を 決めて いない ── ★`security definer` では それ自体が 穴 です。
    "no_path": definer and path is None,
  }


def calibrate():
  """★わざと 当たる もの と、★当たらない ものを 通します。"""
  bad = examine("わざと壊したもの", """
    create or replace function public.わざと(p text) returns text
    language plpgsql security definer set search_path = public as $$
    begin return encode(digest('x', 'sha256'), 'hex'); end $$;""")
  if not bad["broken"]:
    sys.exit("★止まりました ── 較正に 失敗。当たる はずの ものが 出ません。")
  good = examine("直したもの", """
    create or replace function public.なおした(p text) returns text
    language plpgsql security definer set search_path = public, extensions as $$
    begin return encode(digest('x', 'sha256'), 'hex'); end $$;""")
  if good["broken"]:
    sys.exit("★止まりました ── 較正に 失敗。直した ものまで 出ます。")
  plain = examine("拡張を使わないもの", """
    create or replace function public.ふつう(p uuid) returns integer
    language plpgsql security definer set search_path = public as $$
    begin update public.x set y = 1 where id = p; return 1; end $$;""")
  if plain["broken"]:
    sys.exit("★止まりました ── 較正に 失敗。拡張を 使わない ものまで 出ます。")
  missing = examine("道を決めていないもの", """
    create or replace function public.みち(p uuid) returns integer
    language plpgsql security definer as $$ begin return 1; end $$;""")
  if not missing["no_path"]:
    sys.exit("★止まりました ── 較正に 失敗。道を 決めて いない ものが 出ません。")
  return True


def main():
  calibrate()
  names = [f for f in sorted(os.listdir(SQL_DIR)) if f.endswith(".sql")]
  if not names:
    sys.exit("★止まりました ── supabase に SQL が 1本も ありません。")

  rows = []
  for f in names:
    sql = io.open(os.path.join(SQL_DIR, f), encoding="utf-8").read()
    for b in bodies(sql):
      r = examine(b["name"], b["text"])
      r["file"] = f
      rows.append(r)
  if not rows:
    sys.exit("★止まりました ── 関数が 1つも 見つかりません。切り出しが 壊れて います。")

  # ★★★同じ 名の 関数が、★いくつもの ファイルに あります。
  #   ★★はじめ、★ファイル名の 順で 上書きして「最新」と 呼んで いました。
  #     ★★誤り です ── ★ファイル名の 並びは 日付の 並びでは ありません。
  #     ★★`get_invitation_teacher` は 3つの ファイルに あり、
  #       ★塩を 使う 形（`migration_code_pepper.sql`）が、
  #       ★塩を 使わない 形（`migration_no018_…`）に 上書きされ、
  #       ★「拡張を 使う 関数は 0」と 出て いました。
  #   ★★★だから **1つも 捨てません**。★書いて ある もの 全部を 見ます。
  #     ★★どれが 本番に 入って いるかは、★台帳に しか ありません。
  vals = sorted(rows, key=lambda r: (r["name"], r["file"]))

  broken = [r for r in vals if r["broken"]]
  nopath = [r for r in vals if r["no_path"]]
  users = [r for r in vals if r["uses"]]

  out = []
  w = out.append
  w("# ★`search_path` と 拡張の 置き場")
  w("")
  w("★この 行は あとで 差し替えます")
  w("")
  w("生成: `tools/search_path_extension_audit.py`（2026-09-16）")
  w("")
  w("★★較正: 通りました（★わざと 壊した もの／直した もの／拡張を 使わない もの／"
    "道を 決めて いない もの、★4つ とも 見分けました）。")
  w("")
  w("## ★何を 数えたか")
  w("")
  w("- SQL の ファイル: %d 本" % len(names))
  w("- 書かれて いる 関数（★同じ 名も 1つずつ 数えます）: %d" % len(vals))
  w("- ★拡張の 手を 使う もの: %d" % len(users))
  w("- ★★道に `extensions` が 無い もの: **%d**" % len(broken))
  w("- ★`security definer` なのに 道を 決めて いない もの: %d" % len(nopath))
  w("")
  w("## ★★拡張の 手を 使う 関数")
  w("")
  if not users:
    w("★1つも ありません。")
  else:
    w("| 関数／ファイル | 使う 手 | `search_path` | 見立て |")
    w("|---|---|---|---|")
    for r in users:
      w("| `%s`<br>`%s` | %s | `%s` | %s |" % (
        r["name"], r["file"], ", ".join(r["uses"]),
        ", ".join(r["search_path"]) if r["search_path"] else "（決めて いない）",
        "★★`extensions` が ありません ── **落ちます**" if r["broken"] else "ok"))
    w("")
    w("★出どころ … " + "／".join(
      sorted({"`%s` → `%s`" % (r["name"], r["file"]) for r in users})))
  w("")
  w("## ★`security definer` で、★道を 決めて いない 関数")
  w("")
  if not nopath:
    w("★1つも ありません。")
  else:
    w("★★道を 決めない と、★呼ぶ 人の 道で 動きます。")
    w("★★同じ 名の 表を 別の 場所に 作られる と、★そちらを 見に 行きます。")
    w("")
    for r in nopath:
      w("- `%s`（%s）" % (r["name"], r["file"]))
  w("")
  w("## ★この 紙で 足りない こと")
  w("")
  w("★★これは **紙** です。★台帳では ありません。")
  w("★★本番の 関数は、★ここに ある ファイルと 違う ことが あります ──")
  w("★きょう `get_invitation_teacher` が まさに そうでした"
    "（★台帳は 直り、★ファイルは 古い ままでした）。")
  w("★★下の 問いで、★台帳の 側を 引いて ください。")
  w("")
  w("```sql")
  w("select p.proname as 関数,")
  w("       p.prosecdef as 持ち主の力で動くか,")
  w("       coalesce(array_to_string(p.proconfig, ' / '), '（決めていない）') as 決めごと")
  w("from pg_proc p")
  w("join pg_namespace n on n.oid = p.pronamespace")
  w("where n.nspname = 'public'")
  w("order by p.prosecdef desc, p.proname;")
  w("")
  w("-- ★拡張が どこに 入って いるか")
  w("select e.extname as 拡張, n.nspname as 置き場")
  w("from pg_extension e join pg_namespace n on n.oid = e.extnamespace")
  w("order by 1;")
  w("```")

  body = "\n".join(out) + "\n"
  lines = body.split("\n")
  last = [l for l in lines if l.strip()][-1]
  lines[2] = "全%d行 / 末尾は「%s」" % (len(lines) - 1, last)
  path = os.path.join(ROOT, "docs/reports/2026-09-16-search_pathと拡張の置き場.md")
  io.open(path, "w", encoding="utf-8").write("\n".join(lines))
  print(path)
  print("関数 %d / 拡張を使う %d / 落ちるもの %d / 道なし %d"
        % (len(vals), len(users), len(broken), len(nopath)))
  for r in broken:
    print("  ★落ちます: %s（%s）" % (r["name"], r["file"]))


main()
