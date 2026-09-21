# -*- coding: utf-8 -*-
"""★検査 その1 ── ★権限の 総当たり（★2026-09-19・お決め D84）

  ★★★役職 10 × できこと 14 を、★2つの 側で 突き合わせます。
    ★①画面の 側 …… `lib/opsPerms.js` の `TEMPLATE_POSTS`（★役職に 付く できこと）
    ★②台帳の 側 …… `pg_policy` と 関数の 中の `has_can(…, 'できこと')`

  ★★★見るのは「食い違い」です ──
    ★画面は 通すのに 台帳が 止める（★空の 表が 出ます）
    ★台帳は 通すのに 画面が 出さない（★使えない 機能が あります）

  ★★★役職の 名で 見て いる 決まりも 数えます（★A2／台帳 08-1 の 形）。
    ★★`is_org_owner_or_admin` で 見て いる ものは、★できこと に 揃って いません。

  ★★較正 ── ★必ず 在る できこと と、★無い できこと の 両方で 試します。
"""

import io
import json
import os
import re
import subprocess
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ============================================================================
# ★台帳が まだ 見て いない できこと（★裁定149 permanent・2026-09-21）
#
#   ★★★裁定149 は「0件の 列が 出たら 検査が 落ちる 形に する」と 決めました。
#     ★★見つけ方を 仕組みに します。★次に 同じ ことが 起きたら、
#       ★★誰かが 数えるのを 待たずに、★ここで 止まります。
#
#   ★★★一覧は 2つの 側から 見ます（★覚えさせません。★数えさせます）──
#     ★① 一覧に 無いのに 台帳が 見て いない → ★新しい 欠陥 です。落とします
#     ★② 一覧に 在るのに 台帳が 見て いる → ★直った のに 一覧が 古い。落とします
#   ★★どちらも 落とすのは、★古い 一覧が「通って いる」と 嘘を つくからです。
#
#   ★★★足す ときは、★わけ と 外す 条件（`when`）を 必ず 添えます
#     （★CLAUDE.md「`NOT_YET` には 必ず `when` を 添える」と 同じ 形）。
# ============================================================================
マダ見テイナイ = {
  "sched_mine": {
    "わけ": "ご自分の コマの 予定を 見る できこと。いまは 読む だけで、"
            "この できことで 守る 書き込みが ありません",
    "when": "`sched_mine` で 守る 書き込みを 作る 日。"
            "その とき、台帳の 決まりにも 同じ できことを 置きます",
  },
}

ASK = os.path.join(ROOT, "tools", "ask_ledger.py")


def 台帳(sql):
  r = subprocess.run(["python3", ASK, sql, "--raw"], capture_output=True, text=True)
  if r.returncode != 0:
    raise SystemExit("★台帳に 聞けません: " + (r.stdout + r.stderr)[:300])
  行, 今 = [], {}
  for l in r.stdout.splitlines():
    if l.startswith("──"):
      if 今:
        行.append(今)
      今 = {}
    elif ":" in l and not l.startswith("★"):
      k, v = l.split(":", 1)
      今[k.strip()] = v.strip()
  if 今:
    行.append(今)
  return 行


def 画面側():
  """★`lib/opsPerms.js` から、★役職 → できこと を 読みます。"""
  本 = io.open(os.path.join(ROOT, "lib", "opsPerms.js"), encoding="utf-8").read()
  # ★★★`PERMS` の 節 だけ を 読みます（★2026-09-19）。
  #   ★★はじめ ファイル ぜんぶ から `key:` を 拾い、★21 と 数えました。
  #     ★★帯の 一覧（`TAB_RULES`）まで 混ざって いました。★できことは 14 です。
  m = re.search(r"export const PERMS = Object\.freeze\(\[(.*?)\]\);", 本, re.S)
  if not m:
    raise SystemExit("★止まりました ── できことの 一覧を 読めません")
  できこと = re.findall(r'\{ key: "([a-z_]+)"', m.group(1))
  役 = {}
  for m in re.finditer(r'\{ name: "([^"]+)", perms: \[([^\]]*)\]', 本):
    役[m.group(1)] = re.findall(r'"([a-z_]+)"', m.group(2))
  return できこと, 役


def main():
  できこと, 役 = 画面側()

  # ★★較正 ── ★在る ものと 無い もの。
  assert "meibo" in できこと, "★できことを 読めて いません"
  assert "アリマセン" not in できこと, "★無い ものを 読んで います"
  assert "home" not in できこと, "★帯の 一覧まで 混ざって います"
  assert len(できこと) == 14, "★できことの 数が ちがいます: %d" % len(できこと)
  assert "学長" in 役 and len(役) == 10, "★役職 10 を 読めて いません: %d" % len(役)

  # ★★台帳の 側 ── ★決まりと 関数の 中の `has_can`。
  決まり = 台帳("""
    select c.relname as hyou, p.polname as kimari, p.polcmd::text as nani,
      replace(coalesce(pg_get_expr(p.polqual,p.polrelid), ''), chr(10), ' ') as shiki,
      case when pg_get_expr(p.polqual,p.polrelid) like '%is_org_owner_or_admin%'
           then 'yes' else 'no' end as yakumei
    from pg_policy p join pg_class c on c.oid=p.polrelid
    where c.relnamespace='public'::regnamespace
    order by 1,2""")
  関数 = 台帳("""
    select p.proname as kansu,
      -- ★★★改行を 外します（★2026-09-19）。
      -- ★★読み道の 中身は 何十行も あります。★行ごとに 読む 仕掛けが
      --   ★★1行目 だけ を 拾って いました。★`sched_all` を 見落としました。
      replace(coalesce(pg_get_functiondef(p.oid), ''), chr(10), ' ') as shiki
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef
    order by 1""")

  # ★★★`has_can(…, 'なんとか')` は、★こちらで 切り出します。
  #   ★★台帳の 中で 正規の 字を 組み立てると、★括弧の 数えで 落ちました（★2026-09-19）。
  # ★★★1つの 決まり・1つの 読み道が、★できことを **いくつも** 見ます。
  #   ★★はじめ 1つ目 だけ を 拾い、★`sched_all` を「台帳に 無い」と 出しました。
  #     ★★実は `get_student_free_slots` が 見て います。★道具の 誤り でした。
  切 = re.compile(r"has_can[^,]*,\s*'([a-z_]+)'")
  for r in 決まり + 関数:
    r["dekiru"] = sorted(set(切.findall(r.get("shiki", "") or "")))
  台帳で使う = sorted({k for r in 決まり + 関数 for k in r["dekiru"]})
  # ★★★切り出しの 較正 ── ★1つも 拾えない なら 道具が 壊れて います。
  #   ★★`assignments_select` は `has_can` で 見て いる はず です（★裁定 その86）。
  if not 台帳で使う:
    raise SystemExit("★止まりました ── できことを 1つも 拾えません（道具の 誤り）")
  # ★★当たりの 較正 ── ★`sched_all` は 読み道が 見て います（★裁定 その98）。
  if "sched_all" not in 台帳で使う:
    raise SystemExit("★止まりました ── `sched_all` を 拾えません（★1つ目 だけ 見て いませんか）")
  役名で見る = [r for r in 決まり if r.get("yakumei") == "yes"]

  # ★★★食い違い ──
  #   ★画面に 在る のに 台帳の どこでも 使われて いない できこと
  #   ★台帳に 在る のに 画面の 一覧に 無い できこと
  画面だけ = [k for k in できこと if k not in 台帳で使う]
  台帳だけ = [k for k in 台帳で使う if k not in できこと]

  今日 = datetime.date.today().isoformat()
  みち = os.path.join(ROOT, "docs", "reports", "%s-検査1-権限の総当たり.md" % 今日)
  with io.open(みち, "w", encoding="utf-8") as f:
    f.write("# ★検査 その1 ── ★権限の 総当たり\n\n")
    f.write("★%s ／ ★`tools/insp_perm_matrix.py` が 書きました。\n\n" % 今日)
    f.write("★役職 **%d** ／ できこと **%d** ／ 台帳の 決まり **%d** ／ 読み道 **%d**\n\n"
            % (len(役), len(できこと), len(決まり), len(関数)))

    f.write("## ★① 役職 × できこと\n\n")
    f.write("| 役職 | " + " | ".join(できこと) + " |\n")
    f.write("|---" * (len(できこと) + 1) + "|\n")
    for な, ps in 役.items():
      f.write("| %s | " % な + " | ".join("○" if k in ps else "" for k in できこと) + " |\n")

    f.write("\n## ★② 食い違い\n\n")
    f.write("★画面に 在る のに、★台帳の どこでも 見て いない できこと …… **%d**\n\n"
            % len(画面だけ))
    for k in 画面だけ:
      f.write("- `%s`\n" % k)
    f.write("\n★台帳が 見て いる のに、★画面の 一覧に 無い できこと …… **%d**\n\n"
            % len(台帳だけ))
    for k in 台帳だけ:
      f.write("- `%s`\n" % k)

    f.write("\n## ★③ 役職の 名で 見て いる 決まり（★A2 の 形）\n\n")
    f.write("★**%d**件。%s\n\n" % (
      len(役名で見る),
      "★ありません。★できこと に 揃って います。" if not 役名で見る
      else "★できこと に 揃って いません。"))
    for r in 役名で見る:
      f.write("- `%s` …… `%s`（%s）\n" % (r["hyou"], r["kimari"], r["nani"]))

    f.write("\n## ★④ 画面だけで 守って いる できこと\n\n")
    f.write("★★★台帳が 1度も 見て いない できこと です。\n")
    f.write("★★画面を 通さずに 台帳を 直に 叩く 方には、★効きません。\n\n")
    for k in 画面だけ:
      使い = []
      # ★★★役職の 型（`TEMPLATE_POSTS`）の 並びは 除きます（★2026-09-19）。
      #   ★★あそこは「誰が 持つか」の 一覧 です。★使って いる ところでは ありません。
      #   ★★見たいのは「どこで 門に して いるか」です。
      for base, _, files in os.walk(os.path.join(ROOT, "lib")):
        for fn in files:
          if not fn.endswith(".js"):
            continue
          み = os.path.join(base, fn)
          for i, l in enumerate(io.open(み, encoding="utf-8").read().split("\n")):
            if "name:" in l or "perms: [" in l or "key: \"%s\"" % k in l:
              continue
            if ("'%s'" % k) in l or ('"%s"' % k) in l:
              使い.append("%s:%d" % (os.path.relpath(み, ROOT), i + 1))
      f.write("- `%s` …… %s\n" % (k, "／".join(使い[:4]) or "（画面でも 使って いません）"))

    f.write("\n## ★この 検査が 見て いない こと\n\n")
    f.write("★★実際に 通るか どうかは、★ここでは 試して いません。\n")
    f.write("★★見て いるのは「どの できことで 門を 作って いるか」だけ です。\n")
    f.write("★★★通るか どうかの 総当たりは、★台帳に 入って 試す 必要が あります。\n")
  print("REPORT: %s" % os.path.relpath(みち, ROOT))
  print("役職 %d ／ できこと %d ／ 画面だけ %d ／ 台帳だけ %d ／ 役職の名 %d"
        % (len(役), len(できこと), len(画面だけ), len(台帳だけ), len(役名で見る)))

  # ★★★裁定149 permanent ── ★0件の 列が 出たら 落とします。
  いま = set(画面だけ)
  宣言 = set(マダ見テイナイ)
  新しい = sorted(いま - 宣言)
  古い = sorted(宣言 - いま)
  for k in 新しい:
    print("★落ちました ── `%s` を 台帳が 1度も 見て いません。" % k)
    print("　★画面の 門は 門では ありません。★台帳を 直に 叩けば 通ります。")
    print("　★直すか、★わけと 外す 条件を 添えて "
          "tools/insp_perm_matrix.py の `マダ見テイナイ` に 名指しして ください。")
  for k in 古い:
    print("★落ちました ── `%s` は 台帳が 見る ように なりました。" % k)
    print("　★`マダ見テイナイ` から 外して ください。★古い 一覧は 嘘を つきます。")
  if 新しい or 古い:
    raise SystemExit(1)
  for k in sorted(宣言):
    print("　（承知）`%s` …… %s" % (k, マダ見テイナイ[k]["when"]))


if __name__ == "__main__":
  main()
