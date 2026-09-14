#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""2つの 層を 混ぜて いないか ── ★3つの 面を 見る（2026-09-15）。

  ★出どころ 裁定 その55 ／ その57（★Opus・坂本さん 承認）

  ★★なぜ 要るか。
    ★★弁護士の 確認を **取らない** と お決めに なりました（★その55）。
    ★★これは、その 代わりの 守り です。
      ★もし 突合の 読み方が 誤って いても、
      ★「★同じ 鍵の 下に 置いて いた」までで 留まります。
      ★★「★混ぜて いた」には なりません。
      ★直せる 指摘と、★形が 壊れて いる ことの ちがいです。

  ★★線の 引き方（★その57 が その55 を **狭めました**）。
    ★✕ 健康の 層 × 学務の 層 ── ★1つの まとまりの 中で 読む こと
    ★○ 学務どうし ── ★自由。★学年別の 出席率・請求人数・空きコマ すべて ○
    ★○ 健康どうし ── ★自由。★本人が 登録した 本番 × entries も ○
    ★★`org_events` × `entries` は ✕ です。★拡張④は 日付を そこから 引きません。

  ★★見る 面は 3つ です。
    ① 倉庫の SQL       supabase/**/*.sql
    ② ★台帳の 関数     ★紙には 無い 関数が あります（★SQLエディタで 作った もの）
                        ★`supabase/check_layer_join_catalog.sql` を 流して、
                        ★出た JSON を `docs/reports/_catalog-functions.json` へ
    ③ 画面・サーバ      components / lib / app

  ★★表の 一覧は `tools/layer_tables.py` が **1つだけ** 持ちます。
    ★名前では なく 表で 見ます。★別名の 関数が 増えても 捕まえます。
    ★★どちらにも 無い 表は **報告します**。★当てずっぽうで 決めません。

  ★★台帳の 書き出しが 無い ときは「★見て いません」と 言います。
    ★★「通った」とは 言いません。★黙って 通すのが いちばん 危ない。

  ★★この 道具は **直しません**。★見つけて 並べるだけ です（★Opus の お指図）。
"""

import io
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from layer_tables import (HEALTH, ORG, PERSONAL_OTHER, UNDECIDED,  # noqa: E402
                          layer_of, reason_of, known)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, "docs", "reports", "_catalog-functions.json")

# ★★1人の 方が ご自分の ものを 集める ところ。★ここは 並ぶだけ です。
#   ★★書き出し・退会・控えは、★つなぎ合わせでは ありません。
#     ★同じ 人の ものを **並べる** だけ です。★数を 作りません。
ALLOWED_FILES = [
  "lib/exportData.js",
  "lib/accountDeletion.js",
  "lib/backupTables.js",
  "lib/authUserReferences.js",
  "lib/orgClosure.js",
  "tools/layer_join_guard.py",
  "tools/layer_tables.py",
]


def word(t):
  return r"\b" + re.escape(t) + r"\b"


def split_layers(text):
  """★その 文の 中に 出る 表を、★層ごとに 分けます。"""
  h = sorted({t for t in HEALTH if re.search(word(t), text)})
  o = sorted({t for t in ORG if re.search(word(t), text)})
  return h, o


# ---------------------------------------------------------------------------
# ① 倉庫の SQL
# ---------------------------------------------------------------------------

def scan_sql():
  out = []
  base = os.path.join(ROOT, "supabase")
  for root, dirs, files in os.walk(base):
    for f in sorted(files):
      if not f.endswith(".sql"):
        continue
      rel = os.path.relpath(os.path.join(root, f), ROOT)
      retired = "/retired/" in rel.replace("\\", "/")
      s = io.open(os.path.join(root, f), encoding="utf-8").read()
      for m in re.finditer(
          r"create\s+(?:or\s+replace\s+)?(function|view)\s+(?:public\.)?([a-z_0-9]+)",
          s, re.I):
        kind, name = m.group(1).lower(), m.group(2)
        body = s[m.start():m.start() + 8000]
        end = body.find("$$;")
        if end > 0:
          body = body[:end]
        elif kind == "view":
          end = body.find(";")
          body = body[:end] if end > 0 else body
        h, o = split_layers(body)
        if h and o:
          out.append({"where": rel, "kind": kind, "name": name,
                      "health": h, "org": o, "retired": retired})
  return out


# ---------------------------------------------------------------------------
# ② ★台帳の 関数（★紙では 見えません）
# ---------------------------------------------------------------------------

def scan_catalog():
  """★書き出しが 無ければ `None` を 返します。★「見て いない」の 印 です。"""
  if not os.path.exists(CATALOG):
    return None
  try:
    raw = io.open(CATALOG, encoding="utf-8").read().strip()
    data = json.loads(raw) if raw else []
  except ValueError as e:
    return {"error": str(e)[:120]}
  if not isinstance(data, list):
    return {"error": "★一覧（配列）では ありません"}
  out = []
  for fn in data:
    body = str(fn.get("body") or "")
    h, o = split_layers(body)
    if h and o:
      out.append({"where": "★台帳", "kind": fn.get("kind") or "function",
                  "name": fn.get("name"), "secdef": bool(fn.get("secdef")),
                  "health": h, "org": o, "retired": False})
  return {"hits": out, "total": len(data)}


# ---------------------------------------------------------------------------
# ③ 画面・サーバ
# ---------------------------------------------------------------------------

def js_files():
  for d in ("components", "lib", "app"):
    base = os.path.join(ROOT, d)
    if not os.path.isdir(base):
      continue
    for root, dirs, files in os.walk(base):
      dirs[:] = [x for x in dirs if x not in ("node_modules", "tests")]
      for f in sorted(files):
        if f.endswith((".js", ".jsx")):
          rel = os.path.relpath(os.path.join(root, f), ROOT)
          if rel.replace("\\", "/") in ALLOWED_FILES:
            continue
          yield rel, io.open(os.path.join(root, f), encoding="utf-8").read()


def scan_js_one_query():
  """★1つの 問いの 中に、★ほかの 層の 表が 埋めこまれて いないか。

    ★★PostgREST は `select("*, org:organizations(*)")` で つなげます。
      ★★これが「★1つの 問いで つなぐ」形 です。★いちばん はっきりした ✕。
  """
  out = []
  for rel, s in js_files():
    for m in re.finditer(r'\.from\("([a-z_0-9]+)"\)', s):
      tbl = m.group(1)
      fam = layer_of(tbl)
      if fam is None:
        continue
      seg = s[m.end():m.end() + 500]
      cut = seg.find(";")
      nxt = seg.find('.from("')
      if nxt >= 0 and (cut < 0 or nxt < cut):
        cut = nxt
      seg = seg[:cut] if cut > 0 else seg
      h, o = split_layers(seg)
      other = o if fam == "health" else h
      if other:
        out.append({"where": rel, "table": tbl, "layer": fam,
                    "with": other, "line": s[:m.start()].count("\n") + 1})
  return out


def scan_js_same_function():
  """★1つの 関数の 中で、★2つの 層を 読んで いないか。

    ★★これは **候補** です。★そのまま ✕ では ありません。
      ★★1つの 大きな 部品（★VocalTracker）は、★画面ぜんぶを 持ちます。
        ★読んで いる だけ なら、★つなぎ合わせでは ありません。
      ★★✕に なるのは、★2つの 結果を **同じ 鍵で 結ぶ** ときです。
        ★★それは 字では 見分けられません。★目で 見て いただきます。
  """
  out = []
  # ★★2026-09-15、★境目の 見つけ方が 甘く、★2件の 誤りを 出しました。
  #   ★★`const fetchNotes = useCallback(async () => {` を 境目と 見ず、
  #     ★前の 関数の 範囲が **次の 関数まで 伸びて** いました。
  #   ★★だから「handleTellTeacher が notes も 読んで いる」と 出ました。
  #     ★実際は、★次の `fetchNotes` の ものです。
  #   ★★`const NAME =` を、★形に かかわらず 境目に します。
  head = re.compile(
    r"(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)"
    r"|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=")
  for rel, s in js_files():
    marks = [(m.start(), m.group(1) or m.group(2)) for m in head.finditer(s)]
    for i, (pos, name) in enumerate(marks):
      end = marks[i + 1][0] if i + 1 < len(marks) else len(s)
      body = s[pos:end]
      tables = {m.group(1) for m in re.finditer(r'\.from\("([a-z_0-9]+)"\)', body)}
      h = sorted(t for t in tables if t in HEALTH)
      o = sorted(t for t in tables if t in ORG)
      if h and o:
        out.append({"where": rel, "func": name, "health": h, "org": o,
                    "line": s[:pos].count("\n") + 1})
  return out


# ---------------------------------------------------------------------------
# ★一覧に 無い 表
# ---------------------------------------------------------------------------

def unassigned():
  seen = {}
  for rel, s in js_files():
    for m in re.finditer(r'\.from\("([a-z_0-9]+)"\)', s):
      t = m.group(1)
      if not known(t):
        seen.setdefault(t, []).append(rel)
  base = os.path.join(ROOT, "supabase")
  for root, dirs, files in os.walk(base):
    for f in sorted(files):
      if not f.endswith(".sql"):
        continue
      rel = os.path.relpath(os.path.join(root, f), ROOT)
      s = io.open(os.path.join(root, f), encoding="utf-8").read()
      for m in re.finditer(
          r"create table\s+(?:if not exists\s+)?(?:public\.)?([a-z_0-9]+)", s, re.I):
        t = m.group(1)
        if t in ("if",):
          continue
        if not known(t):
          seen.setdefault(t, []).append(rel)
  return {k: sorted(set(v)) for k, v in sorted(seen.items())}


# ---------------------------------------------------------------------------

def main():
  sql = scan_sql()
  cat = scan_catalog()
  emb = scan_js_one_query()
  same = scan_js_same_function()
  un = unassigned()

  print("★記録の 層 %d表 ／ ★学務の 層 %d表 ／ ★本人の その他 %d表 ／ ★未決 %d表"
        % (len(HEALTH), len(ORG), len(PERSONAL_OTHER), len(UNDECIDED)))
  print("　★★「本人の その他」は、★学務と つないで **よい** ものです。")
  print("　　★お名前を 引く（memberships × profiles）などに 要ります。")
  print()

  print("① 倉庫の SQL（関数・ビュー）")
  live = [x for x in sql if not x["retired"]]
  print("　★生きて いる 紙で 混ざって いる: %d" % len(live))
  for x in live:
    print("    ✗ %s  %s  健康 %s × 学務 %s"
          % (x["name"], x["where"], "/".join(x["health"]), "/".join(x["org"])))
  if not live:
    print("  ✓ ありません")
  for x in [x for x in sql if x["retired"]]:
    print("　（片づけた 紙: %s  %s）" % (x["name"], x["where"]))
  print()

  print("② ★台帳の 関数・ビュー")
  if cat is None:
    print("　★★見て いません。★書き出しが ありません。")
    print("　　★`supabase/check_layer_join_catalog.sql` を 流し、")
    print("　　★出た JSON を `docs/reports/_catalog-functions.json` へ。")
    print("　★★「通った」では ありません。★「見て いない」です。")
  elif "error" in cat:
    print("　★★読めません: %s" % cat["error"])
  else:
    print("　★読んだ 関数・ビュー: %d" % cat["total"])
    print("　★混ざって いる: %d" % len(cat["hits"]))
    for x in cat["hits"]:
      print("    ✗ %s%s  健康 %s × 学務 %s"
            % (x["name"], "（definer）" if x.get("secdef") else "",
               "/".join(x["health"]), "/".join(x["org"])))
    if not cat["hits"]:
      print("  ✓ ありません")
  print()

  print("③ 画面・サーバ ── ★1つの 問いの 中")
  print("　★混ざって いる: %d" % len(emb))
  for x in emb:
    print("    ✗ %s:%d  %s(%s) に %s を 埋めて いる"
          % (x["where"], x["line"], x["table"], x["layer"], "/".join(x["with"])))
  if not emb:
    print("  ✓ ありません")
  print()

  print("③-2 ★1つの 関数の 中で、★2つの 層を 読んで いる（★候補）")
  print("　★★これは ✕ では ありません。★目で 見る ための 一覧 です。")
  print("　★★✕に なるのは、★2つを **同じ 鍵で 結ぶ** ときです。")
  print("　★候補: %d" % len(same))
  for x in same[:20]:
    print("    ・%s:%d  %s()  健康 %s × 学務 %s"
          % (x["where"], x["line"], x["func"],
             "/".join(x["health"]), "/".join(x["org"])))
  if len(same) > 20:
    print("    …ほか %d 件" % (len(same) - 20))
  print()

  print("★どの 層にも 載って いない 表: %d" % len(un))
  for t, where in un.items():
    note = UNDECIDED.get(t, "")
    print("　・%s%s" % (t, ("　── " + note) if note else "　── ★未決。お裁きを"))
  print()

  bad = len(live) + len(emb) + (len(cat["hits"]) if isinstance(cat, dict) and "hits" in cat else 0)
  print("★★★混ざって いる（★✕）: %d" % bad)
  print()
  print("★★この 道具が 見て いない こと")
  print("　★2つの 問いの 結果を、★あとで JavaScript で 結ぶ ことは 見えません。")
  print("　★★③-2 は その 候補です。★目で 見て ください。")
  print("　★台帳の 書き出しが 無ければ、★②は 見て いません。")
  print("　★組み立てて 作る 問い（動的SQL）は 見えません。")
  return 1 if bad else 0


if __name__ == "__main__":
  sys.exit(main())


# ===========================================================================
# ★報告 ── ★測った ものから 書き出します（★手で 書きません）
# ===========================================================================

def report():
  out = os.path.join(ROOT, "docs", "reports", "2026-09-15-layer-join-guard.md")
  sql = scan_sql()
  cat = scan_catalog()
  emb = scan_js_one_query()
  same = scan_js_same_function()
  un = unassigned()
  live = [x for x in sql if not x["retired"]]
  L = []
  w = L.append
  w("# 2つの 層を 混ぜない ための 見張り（★3つの 面）")
  w("")
  w("")
  w("★2026-09-15 ／ ★裁定 その55・その57（★Opus・坂本さん 承認）")
  w("★この 文は tools/layer_join_guard.py が 書き出しました。")
  w("")
  w("## なぜ 要るか")
  w("")
  w("★★弁護士の 確認を **取らない** と お決めに なりました（★その55）。")
  w("★★これは、その **代わりの 守り** です。")
  w("　★もし 突合（Q&A A7-41）の 読み方が 誤って いても、")
  w("　★「★同じ 鍵の 下に 置いて いた」までで 留まります。")
  w("　★★「★混ぜて いた」には なりません。")
  w("　★直せる 指摘と、★形が 壊れて いる ことの ちがい です。")
  w("")
  w("## ★線 ── ★広すぎては いけません")
  w("")
  w("| | |")
  w("|---|---|")
  w("| ✕ | ★記録の 層 × 学務の 層 ── ★1つの まとまりの 中で 読む |")
  w("| ○ | ★学務どうし ── ★自由。学年別の 出席率・請求人数・空きコマ すべて |")
  w("| ○ | ★記録どうし ── ★自由。本人が 登録した 本番 × entries も |")
  w("| ○ | ★本人の その他 × 学務 ── ★自由。お名前を 引く など |")
  w("")
  w("★★`org_events` × `entries` は ✕ です。")
  w("　★拡張④は、★**学生が 自分で 登録した 本番**だけを 使います。")
  w("")
  w("### ★★1度 広すぎました（★2026-09-15・同日）")
  w("")
  w("★はじめ `profiles` と `link_consents` を 記録の 層に 入れ、★**7件**を ✕ と 数えました。")
  w("★★7件 とも 誤り です ──")
  w("")
  w("| 関数 | 何を つないで いたか | なぜ ○ か |")
  w("|---|---|---|")
  w("| `get_org_member_names` | memberships × profiles | ★お名前を 引くだけ |")
  w("| `get_invitation_teacher` | teacher_invitations × profiles | ★同じ |")
  w("| `get_my_teacher_names` | teacher_student_links × profiles | ★同じ |")
  w("| `accept_teacher_invitation` | teacher_student_links × link_consents | ★つながりの 仕組み そのもの |")
  w("")
  w("★★Opus の 線引きは「★本人の もの」では なく、★「★**記録の 中身**を 持つ もの」です。")
  w("　★だから 層を **3つ**に 分けました ── 記録／学務／★本人の その他。")
  w("")
  w("## 表の 一覧（★`tools/layer_tables.py` が 1つだけ 持ちます）")
  w("")
  for title, d in (("① 記録の 層（★危ない 側）", HEALTH),
                   ("② 学務の 層（★もう 一方）", ORG),
                   ("③ 本人の その他（★学務と つないで よい）", PERSONAL_OTHER),
                   ("★未決（★お裁きを お願いします）", UNDECIDED)):
    w("### %s ── %d 表" % (title, len(d)))
    w("")
    w("| 表 | わけ |")
    w("|---|---|")
    for k in sorted(d):
      w("| `%s` | %s |" % (k, d[k].replace("\n", " ")))
    w("")
  w("## 見た 結果")
  w("")
  w("| 面 | 見た もの | 混ざって いる |")
  w("|---|---|---|")
  w("| ① 倉庫の SQL | `supabase/**/*.sql` の 関数・ビュー | **%d** |" % len(live))
  if cat is None:
    w("| ② 台帳の 関数 | ★**見て いません** | ─ |")
  elif "error" in cat:
    w("| ② 台帳の 関数 | ★読めません（%s） | ─ |" % cat["error"][:40])
  else:
    w("| ② 台帳の 関数 | %d 件 | **%d** |" % (cat["total"], len(cat["hits"])))
  w("| ③ 画面・サーバ（1つの 問い） | `components` `lib` `app` | **%d** |" % len(emb))
  w("| ③-2 目で 見る 候補 | 1つの 関数の 中で 2つの 層 | %d |" % len(same))
  w("| ★どの 層にも 無い 表 | | %d |" % len(un))
  w("")
  if live:
    for x in live:
      w("- ✗ `%s`（%s）── 記録 %s × 学務 %s"
        % (x["name"], x["where"], "/".join(x["health"]), "/".join(x["org"])))
    w("")
  if un:
    w("### ★どの 層にも 載って いない 表")
    w("")
    for t2, where in un.items():
      w("- `%s` ── %s" % (t2, ", ".join(where[:3])))
    w("")
  w("## ② 台帳の 関数 ── ★いまの 状態")
  w("")
  if cat is None:
    w("★★**見て いません。**★書き出しが ありません。")
    w("")
    w("★★「通った」では ありません。★「★見て いない」です。")
    w("　★黙って 通すのが、★いちばん 危ない から です。")
    w("")
    w("★手順 ── `supabase/check_layer_join_catalog.sql` を 流し、")
    w("★出た JSON を `docs/reports/_catalog-functions.json` へ 貼って ください。")
    w("")
    w("### ★★2026-09-15、★Opus から 結果だけ 届いて います")
    w("")
    w("| | |")
    w("|---|---|")
    w("| 台帳の 関数 | 66本 |")
    w("| entries と 学務を 1つに して いる 関数 | **0本** |")
    w("| entries を 読む 関数 | 2本 ── `admin_entry_stats()` ／ `character_unlock_summary(uuid)` |")
    w("| どちらも | ★entries だけ。★つないで いません |")
    w("")
    w("★★これは **私が 見た もの では ありません**。★受け取った 結果 です。")
    w("　★★道具の ②が「見て いない」と 言い続けるのは、★そのため です。")
    w("　★★JSON を 置けば、★私の 側でも 同じ ことを 確かめられます。")
    w("")
    w("★★あわせて 1件、★別の 話として 挙がって います（★層の 話では ありません）──")
    w("　★`admin_entry_stats()` は SECURITY DEFINER で、★呼ぶ人の 確かめが 中に ありません。")
    w("　★全員ぶんの 数を 返します。★いまは `is_admin` が 48人中 0人 で 届きません。")
    w("　★`get_student_entries` と 同じ 形 ですが、★片づけて は いません。")
    w("　★★お裁きを お願いします。")
  else:
    w("★読んだ 関数・ビュー **%d 件**。★混ざって いる **%d 件**。"
      % (cat["total"], len(cat["hits"])))
  w("")
  w("## ★この 見張りが 見て いない こと")
  w("")
  w("| | |")
  w("|---|---|")
  w("| 2つの 問いの 結果を、あとで JavaScript で 結ぶ | ★見えません（★③-2 が 候補） |")
  w("| 組み立てて 作る 問い（動的SQL） | ★見えません |")
  w("| 台帳の 書き出しが 無い とき | ★②は 見て いません |")
  w("")
  w("## ★校正（★1度も 落ちた ことの ない 見張りは 信じられません）")
  w("")
  w("★`components/tests/layer-join.test.js` が、★毎回 確かめます ──")
  w("")
  w("| | |")
  w("|---|---|")
  w("| ★わざと 混ぜた SQL を 置く | ★名指しで 出て、★落ちる |")
  w("| ★わざと 混ぜた 画面を 置く | ★同じ |")
  w("| ★学務どうし・お名前引きを 置く | ★**止めない**（★広すぎない こと） |")
  w("")
  w("★★④が いちばん 大事 です。★Opus の 言葉 ──")
  w("　「if the guard flags any of these, it is wrong. fix the guard」")

  body = [x for x in L if x.strip()]
  L[1] = "全%d行 / 末尾は「%s」" % (len(L), body[-1])
  io.open(out, "w", encoding="utf-8").write("\n".join(L) + "\n")
  n = len(io.open(out, encoding="utf-8").read().rstrip("\n").split("\n"))
  L[1] = "全%d行 / 末尾は「%s」" % (n, body[-1])
  io.open(out, "w", encoding="utf-8").write("\n".join(L) + "\n")
  print("★報告:", out, n, "行")
