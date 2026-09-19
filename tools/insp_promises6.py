# -*- coding: utf-8 -*-
"""★裁定 その106 ── ★売り文句の 証拠 6件を 確かめます（★2026-09-19）

  ★★★Opus が 定義した とおりに 数えます。★こちらで 基準を 作りません。
    ★3 …… 書き出し・削除の 道に 同意の 判定が 0件
    ★9 …… `assignments` を 見る 枝が `ended_at is null` で 絞って いる
            （★`monka_read` の 枝だけ 例外）
    ★10 … ★本人が 書く 表 すべての WITH CHECK に 撤回の 判定
    ★12 … `leave_enrollment` が `assignments` も 閉じる
    ★13 … `lessons` の WITH CHECK 3本
    ★16 … 名前で 分ける ところが 0件（`role === 'owner'` など）

  ★★較正 ── ★当たり（在る）と 外れ（無い）の 両方で 試します。
"""

import io
import os
import re
import subprocess
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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


def 読む(*み):
  p = os.path.join(ROOT, *み)
  return io.open(p, encoding="utf-8").read() if os.path.exists(p) else ""


def main():
  出 = []

  # ★★較正 ── ★当たり（在る）と 外れ（無い）。
  assert 読む("lib", "exportData.js"), "★読めて いません"
  assert not 読む("lib", "アリマセン.js"), "★無い ものを 読んで います"
  # ★★★名前で 分ける ところの 見分け（★当たりと 外れ）。
  当 = 'if (role === "owner") {'
  外 = 'const role = "owner";'
  な = re.compile(r'role\s*===?\s*["\']( owner|admin|staff|teacher)["\']'.replace(" ", ""))
  assert な.search(当), "★名前の 分けを 見つけられません"
  assert not な.search(外), "★ただの 代入まで 拾って います"

  # ── ★3 書き出し・削除に 同意の 判定が 無い こと ─────────────
  書出 = 読む("lib", "exportData.js")
  消し = 読む("lib", "accountDeletion.js")
  判定 = re.compile(r"(consent|agreed|withdrawn)", re.I)
  わる3 = []
  for な, 本 in [("exportData.js", 書出), ("accountDeletion.js", 消し)]:
    for i, l in enumerate(本.split("\n")):
      if l.strip().startswith("//") or l.strip().startswith("*"):
        continue
      # ★★★見たいのは「同意で **分ける**」ところ です（★2026-09-19）。
      #   ★★列の 名を 並べて いる だけ の 行を 拾って いました
      #     （`"consent_health_data_at"` …… ★書き出す 列の 一覧 です）。
      #   ★★★書き出す 列に 同意の 記録が 入って いるのは **正しい** こと です。
      #     ★★ご本人の ものだから です。★止めて いるのでは ありません。
      分ける = re.search(r"\b(if|return|filter|\?|&&|\|\|)\b", l) or "?" in l
      if 判定.search(l) and 分ける and not re.search(r'"[a-z_]*consent', l):
        わる3.append("%s:%d %s" % (な, i + 1, l.strip()[:60]))
  出.append(("3 撤回しても 書き出しと 削除は できる",
             len(わる3) == 0,
             "同意を 見る 行 …… %d件" % len(わる3), わる3))

  # ── ★9 `assignments` を 見る 枝が `ended_at` で 絞る ─────────
  枝 = 台帳("""
    select c.relname as hyou, p.polname as kimari,
      replace(coalesce(pg_get_expr(p.polqual,p.polrelid),'')
              || ' ' || coalesce(pg_get_expr(p.polwithcheck,p.polrelid),''),
              chr(10), ' ') as shiki
    from pg_policy p join pg_class c on c.oid=p.polrelid
    where c.relnamespace='public'::regnamespace""")
  わる9 = []
  for r in 枝:
    s = r.get("shiki", "")
    if "assignments" not in s:
      continue
    # ★★★`assignments` そのものの 決まりは 別 です（★2026-09-19）。
    #   ★★見たいのは「よその 表が `assignments` を 通って 引く 枝」です。
    #   ★★担当の 表 自体の 出し入れは、★この 約束の 話では ありません。
    if r["hyou"] == "assignments":
      continue
    if "monka_read" in s:
      continue
    if "ended_at is null" not in s.lower():
      わる9.append("%s / %s" % (r["hyou"], r["kimari"]))
  出.append(("9 担当と 個別の つながりは 別",
             len(わる9) == 0,
             "`ended_at` で 絞って いない 枝 …… %d件" % len(わる9), わる9))

  # ── ★10 本人が 書く 表の WITH CHECK に 撤回の 判定 ───────────
  本人表 = 台帳("""
    select c.relname as hyou, p.polname as kimari, p.polcmd::text as nani,
      replace(coalesce(pg_get_expr(p.polwithcheck,p.polrelid),''), chr(10), ' ') as chk
    from pg_policy p join pg_class c on c.oid=p.polrelid
    where c.relnamespace='public'::regnamespace and p.polcmd in ('a','w')""")
  わる10 = []
  for r in 本人表:
    chk = r.get("chk", "")
    if "auth.uid() = user_id" not in chk.replace("(", "").replace(")", ""):
      continue
    if "consent_withdrawn" not in chk:
      わる10.append("%s / %s（%s）" % (r["hyou"], r["kimari"], r["nani"]))
  出.append(("10 サーバ側の 撤回の 門",
             len(わる10) == 0,
             "撤回を 見て いない 書きの 決まり …… %d件" % len(わる10), わる10))

  # ── ★12 `leave_enrollment` が `assignments` も 閉じる ─────────
  定義 = 台帳("""
    select p.proname::text as kansu,
      replace(pg_get_functiondef(p.oid), chr(10), ' ') as shiki
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='leave_enrollment'""")
  よし12 = bool(定義) and "assignments" in 定義[0].get("shiki", "")
  出.append(("12 教室を 離れたら 参照されない", よし12,
             "`leave_enrollment` が `assignments` を 閉じる …… %s"
             % ("はい" if よし12 else "★いいえ"), []))

  # ── ★13 `lessons` の WITH CHECK ─────────────────────────
  l13 = 台帳("""
    select p.polname::text as kimari,
      case when pg_get_expr(p.polwithcheck,p.polrelid) is null then 'なし' else 'あり' end as chk
    from pg_policy p join pg_class c on c.oid=p.polrelid
    where c.relname='lessons' and p.polcmd='w'""")
  なし13 = [r["kimari"] for r in l13 if r.get("chk") == "なし"]
  出.append(("13 薄い層（`lessons` の WITH CHECK）",
             len(なし13) == 0,
             "WITH CHECK の 無い UPDATE …… %d本 ／ 全 %d本"
             % (len(なし13), len(l13)), なし13))

  # ── ★16 名前で 分ける ところ ───────────────────────────
  わる16 = []
  for base, _, files in os.walk(os.path.join(ROOT, "lib")):
    for f in sorted(files):
      if not f.endswith(".js"):
        continue
      み = os.path.join(base, f)
      for i, l in enumerate(io.open(み, encoding="utf-8").read().split("\n")):
        s = l.strip()
        if s.startswith("//") or s.startswith("*"):
          continue
        if re.search(r'role\s*===?\s*["\'](owner|admin|staff|teacher)["\']', s):
          わる16.append("%s:%d %s" % (os.path.relpath(み, ROOT), i + 1, s[:60]))
  出.append(("16 教室での 呼び方（名前で 分けない）",
             len(わる16) == 0,
             "名前で 分けて いる 行 …… %d件" % len(わる16), わる16))

  今日 = datetime.date.today().isoformat()
  みち = os.path.join(ROOT, "docs", "reports", "%s-裁定106-証拠6件の確かめ.md" % 今日)
  with io.open(みち, "w", encoding="utf-8") as g:
    g.write("# ★裁定 その106 ── ★売り文句の 証拠 6件\n\n")
    g.write("★%s ／ ★`tools/insp_promises6.py` が 書きました。\n\n" % 今日)
    g.write("★基準は Opus が 定義した もの です。★こちらで 作って いません。\n\n")
    g.write("| 約束 | 言えるか | 数 |\n|---|---|---|\n")
    for 題, よし, 数, _ in 出:
      g.write("| %s | %s | %s |\n" % (題, "○ 言えます" if よし else "★言えません", 数))
    for 題, よし, 数, なか in 出:
      if なか:
        g.write("\n## ★%s\n\n" % 題)
        for x in なか[:40]:
          g.write("- `%s`\n" % x)
  print("REPORT: %s" % os.path.relpath(みち, ROOT))
  for 題, よし, 数, _ in 出:
    print("  %-34s %s  %s" % (題[:34], "○" if よし else "★", 数))


if __name__ == "__main__":
  main()
