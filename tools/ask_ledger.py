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

REF = "xxjtplvpcneksrofkjmf"

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


def 見張り(sql, write, ok):
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
  if not isinstance(rows, list) or not rows:
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
  a = [x for x in a if x not in ("--write", "--ok", "--raw")]
  sql = open(a[1], encoding="utf-8").read() if (len(a) > 1 and a[0] == "-f") else (a[0] if a else "")
  if not sql.strip():
    print(__doc__)
    sys.exit(0)
  書き出す(尋ねる(sql, write, ok), raw)
