#!/usr/bin/env python3
"""★台帳に 直に お尋ねする（★2026-09-18）。

  ★★Supabase の 管理の 口（Management API）を 使います。
    ★★MCP の 道具が この 話に 降りて くる のは **次に 起こした とき** です。
    ★★それまでの あいだ、★同じ 口を 自分で 叩きます。

  ★★★決めごと（★2026-09-18・坂本さんの 7つの 決まり）──
    ・★読むのが 本筋 です。★書く ときは `--write` を 明として 付けます。
    ・★書く 前に、★同じ ところを 読む 問いを 先に 走らせます（★決まり1・2）。
    ・★`BEGIN/ROLLBACK` は 使いません（★9月15日の 一件・決まり3）。
    ・★危ない もの（delete / 広い update / 権限）は **止まります**。
      ★★坂本さんの お許しを この 話で いただいて から、★`--ok` を 付けます（★決まり4）。
    ・★人の 記録（entries / notes …）は そのまま 引きません。★count だけ（★決まり7）。
    ・★合言葉は 環境から 借ります。★画面にも 記録にも 出しません。

  ★使い方
    python3 tools/ask_ledger.py "select relname from pg_class limit 3"
    python3 tools/ask_ledger.py -f 問い.sql
    python3 tools/ask_ledger.py --write --ok "update … where …"
"""
import json, os, re, subprocess, sys, urllib.request, urllib.error

# ★★★台帳は 2つ あります（★2026-09-20 に 分かりました）。
#   ★本番 …… `xxjtplvpcneksrofkjmf`（★38人の 記録）
#   ★試し …… `smntpurraumeerselvsc`（`la-voce-test`・★手元の 画面が 見る 先）
#   ★★★既定は **本番** の まま です。★`--test` を 付けた ときだけ 試しの ほうへ。
#     ★★取り違えると、★試すつもりで 本番を 触ります。★既定を 変えません。
REF_HONBAN = "xxjtplvpcneksrofkjmf"
REF_TAMESHI = "smntpurraumeerselvsc"
REF = REF_HONBAN

# ★★書く 言葉。★`--write` が 無ければ 弾きます。
KAKU = re.compile(r"\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|comment\s+on)\b", re.I)
# ★★とりわけ 危ない もの。★`--ok`（★坂本さんの お許し）が 要ります。
ABUNAI = re.compile(r"\b(delete|drop|truncate|grant|revoke|alter\s+table|alter\s+policy|alter\s+role)\b", re.I)
# ★★人の 記録。★count 以外では 引きません。
NAMAMI = re.compile(r"\bfrom\s+(public\.)?(entries|notes|article_notes|teacher_notes|entry_comments|questionnaire_responses)\b", re.I)


def 合言葉():
  t = os.environ.get("SUPABASE_ACCESS_TOKEN")
  if t:
    return t
  # ★★この 場の shell は 玄関を 読んで いない ことが あります。
  #   ★★そこだけ 読み直します。★返しますが、★どこにも 書きません。
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


def 括りを外す(sql):
  """★引用符の 中を 落とします。

    ★★★2026-09-18、★読むだけの 問いが 止められました ──
      ★`where privilege_type='UPDATE'` の **値** の `UPDATE` に 当たりました。
    ★★書く 言葉では ありません。★探して いる 字 です。
    ★★★見張りが 厳しい のは 良い ことです。★けれど 読めなく なるのは 別 です。
      ★★括りの 中は 落として から 見ます。★外だけ 見ます。
  """
  # ★★★2026-09-22、★また 止められました ──
  #   ★`-- ★表ごとの GRANT で 台無しに …` という **註** の `GRANT` に 当たりました。
  #   ★★同じ 形の 6度目 です（★台帳 08-10）。★「説明を 処理と 読む」。
  #   ★★★順が 決め手 です（★2026-09-21 に 分かった こと）──
  #     ★改行を 先に 潰すと、★`--` が 後ろ 全部を 飲みます。★見落とす 側に 倒れます。
  #     ★だから **行ごと** に `--` を 落とし、★そのあと `/* */` を 落とします。
  #   ★★括りの 中を 先に 落とします。★`'--'` という **値** を 註と 読まない ため です。
  sql = re.sub(r"'[^']*'", "''", sql)
  sql = "\n".join(re.sub(r"--.*$", "", 行) for 行 in sql.split("\n"))
  sql = re.sub(r"/\*.*?\*/", " ", sql, flags=re.S)
  return sql


def 見張り(sql, write, ok):
  sql = 括りを外す(sql)
  if KAKU.search(sql) and not write:
    return "★書く 言葉が 混じって います。★読むだけの 道具 です。★要る なら --write を 付けて ください。"
  if ABUNAI.search(sql) and not ok:
    return "★とりわけ 危ない 言葉 です。★坂本さんの お許しを いただいて から、★--ok を 付けて ください。"
  if NAMAMI.search(sql) and not re.search(r"count\s*\(", sql, re.I):
    return "★人の 記録を そのまま 引こうと して います。★count だけに して ください。"
  return None


def 尋ねる(sql, write=False, ok=False):
  わけ = 見張り(sql, write, ok)
  if わけ:
    print("★止まりました ── " + わけ)
    sys.exit(2)
  t = 合言葉()
  if not t:
    print("★止まりました ── 合言葉が ありません（SUPABASE_ACCESS_TOKEN）。")
    sys.exit(2)
  req = urllib.request.Request(
    "https://api.supabase.com/v1/projects/%s/database/query" % REF,
    data=json.dumps({"query": sql}).encode("utf-8"),
    headers={"Authorization": "Bearer " + t, "Content-Type": "application/json"},
    method="POST")
  try:
    with urllib.request.urlopen(req, timeout=90) as r:
      return json.loads(r.read().decode("utf-8"))
  except urllib.error.HTTPError as e:
    print("★番=%d" % e.code)
    print(e.read().decode("utf-8")[:700])
    sys.exit(1)


def 書き出す(rows, raw=False):
  # ★★★「（0件）」は、★2つの ちがう こと を 同じ 顔で 出して いました
  #   （★2026-09-18・実機で 気づきました）。
  #     ★★㋐ 台帳に 本当に 無い
  #     ★★㋑ 台帳が 答えて いない（★形が ちがう ／ 返事が 表で ない）
  #   ★★★`select 1` が「（0件）」と 出ました。★そんな ことは 起きません。
  #     ★★道具が 壊れて いる のに、★「無い」と 言って いました。
  #   ★★★見つからない 道具は、★見つからない と 言っては いけません。★止まります。
  if not isinstance(rows, list):
    print("★止まりました ── 台帳の 返事が 表の 形で は ありません。")
    print("★返事の 形: %s" % type(rows).__name__)
    print("★返事（はじめの 700字）:")
    print(str(rows)[:700])
    sys.exit(1)
  if not rows:
    print("（0件）")
    return
  if raw:
    # ★★丸ごと 出します。★切り詰めると、★決まりの 中ほどが 消えます。
    #   ★★2026-09-18、★64字で 切って 読み違えかけました。
    for i, r in enumerate(rows):
      print("── %d ──" % (i + 1))
      for k, v in r.items():
        print("%s: %s" % (k, v))
    print("★%d件" % len(rows))
    return
  keys = list(rows[0].keys())
  print(" | ".join(keys))
  print("-+-".join("-" * len(k) for k in keys))
  for r in rows:
    print(" | ".join("" if r.get(k) is None else str(r.get(k))[:64] for k in keys))
  print("★%d件" % len(rows))


if __name__ == "__main__":
  a = list(sys.argv[1:])
  write = "--write" in a
  ok = "--ok" in a
  raw = "--raw" in a
  # ★★★`--test` …… ★試しの 台帳（`la-voce-test`）へ。★既定は 本番 です。
  #   ★★どちらへ 送ったかを、★必ず 1行 出します。★取り違えない ため です。
  if "--test" in a:
    globals()["REF"] = REF_TAMESHI
    print("★送り先 …… 試しの 台帳（la-voce-test）")
  else:
    print("★送り先 …… 本番の 台帳")
  a = [x for x in a if x not in ("--write", "--ok", "--raw", "--test")]
  # ★★★知らない 札を、★問いの 字 と して 台帳へ 送って いました
  #   （★2026-09-18・`--sql "…"` と 書いて しまい、★`--sql` を 送って いました）。
  #   ★★台帳は 何も 返さず、★道具は「（0件）」と 出しました。
  #   ★★★「無い」と「聞けて いない」を、★同じ 顔で 出して いました。★止めます。
  知らない札 = [x for x in a if x.startswith("--")]
  if 知らない札:
    print("★止まりました ── 知らない 札 です: " + " ".join(知らない札))
    print("★問いの 字は、★札では なく そのまま 書いて ください。")
    print('★例: python3 tools/ask_ledger.py "select 1 as t"')
    sys.exit(2)
  sql = open(a[1], encoding="utf-8").read() if (len(a) > 1 and a[0] == "-f") else (a[0] if a else "")
  if not sql.strip():
    print(__doc__)
    sys.exit(0)
  書き出す(尋ねる(sql, write, ok), raw)
