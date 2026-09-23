#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★FX7 ── 新しい 試しの 台帳を 作る（★2026-09-23・裁定161 FX7）。

  ★★★順 …… ★取り消せない ことを **いちばん 最後** に 置きます。
    1 新しい 入れ物を 作る          ★取り消せます（消せば よい）
    2 移行を 頭から 当てる          ★取り消せます
    3 種を 流す                     ★取り消せます
    4 証しを 通す・`twin` を 0件に  ★読むだけ
    5 接続先を 差し替える           ★戻せます
    ★★6 古い 試しを 消す           ★★★取り消せません。★**この 道具は しません**

  ★★Free の 組織は プロジェクト 2つ まで です。
    ★★「止めた（paused）」ものは 数に 入りません。
    ★★★だから、★先に 古い ほうを **止めて** から 走らせます（★消しません）。
      ★止めるのは 画面から（★この 道具は しません）。

  ★使い方
    python3 tools/fx7_build.py --dry    ★何を するかだけ 出す
    python3 tools/fx7_build.py --ok     ★作って、移行を 当てて、種を 流す
"""
import json, os, re, subprocess, sys, time, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORG = "ajwrscitducvqhwsxrjg"
HONBAN = "xxjtplvpcneksrofkjmf"
FURUI = "smntpurraumeerselvsc"
NA = "la-voce-test2"


def 合言葉():
  t = os.environ.get("SUPABASE_ACCESS_TOKEN")
  if t:
    return t
  f = os.path.expanduser("~/.bash_profile")
  return subprocess.run(
    ["bash", "-lc", 'source "%s" >/dev/null 2>&1; printf %%s "$SUPABASE_ACCESS_TOKEN"' % f],
    capture_output=True, text=True).stdout.strip()


def 叩く(method, path, body=None, 待ち=180):
  data = json.dumps(body).encode() if body is not None else None
  r = urllib.request.Request("https://api.supabase.com" + path, data=data, method=method,
    headers={"Authorization": "Bearer " + 合言葉(), "Content-Type": "application/json"})
  try:
    return 200, json.loads(urllib.request.urlopen(r, timeout=待ち).read().decode() or "null")
  except urllib.error.HTTPError as e:
    return e.code, e.read().decode()[:300].replace("\n", " ")


def env(名, ファイル=".env.e2e"):
  for l in open(os.path.join(ROOT, ファイル), encoding="utf-8"):
    m = re.match(r"^\s*" + 名 + r"\s*=\s*(.*)$", l)
    if m:
      return m.group(1).strip().strip('"').strip("'")
  return None


def 移行の順():
  """★`supabase/migrations` を 名前の 順に。★README は 除きます。"""
  d = os.path.join(ROOT, "supabase", "migrations")
  return [f for f in sorted(os.listdir(d)) if f.endswith(".sql")]


def main():
  a = sys.argv[1:]
  dry = "--ok" not in a
  print("FX7_BUILD  ", "★下見（作りません）" if dry else "★作ります")

  code, ps = 叩く("GET", "/v1/projects")
  もう = [p for p in ps if p.get("name") == NA] if isinstance(ps, list) else []
  いきて = [p for p in ps if p.get("status") == "ACTIVE_HEALTHY"] if isinstance(ps, list) else []
  print("  いまの プロジェクト ……", [(p.get("name"), p.get("status")) for p in ps]
        if isinstance(ps, list) else ps)
  print("  いきて いる もの ……", len(いきて), "／ Free の 上限 …… 2")
  if len(いきて) >= 2 and not もう:
    print("  ★★★先に 古い 試しを **止めて** ください（★消さないで ください）。")
    print("     Supabase の 画面 → la-voce-test → Settings → General → Pause project")
    print("     ★止めた ものは 上限の 数に 入りません。★あとで 戻せます。")
    if not dry:
      return 2

  print("\n  移行 ……", len(移行の順()), "本")
  for f in 移行の順()[:3]:
    print("     ", f)
  print("      …")
  print("  種 …… tools/test_seed.py")
  if dry:
    print("RESULT: ★下見だけ です。")
    return 0

  if もう:
    ref = もう[0]["id"]
    print("\n  ★すでに あります ……", ref)
  else:
    dbpw = env("TEST2_DB_PASSWORD")
    if not dbpw:
      print("  ★止まりました ── TEST2_DB_PASSWORD が ありません。")
      return 2
    code, got = 叩く("POST", "/v1/projects",
                     {"name": NA, "organization_id": ORG, "region": "ap-northeast-1",
                      "db_pass": dbpw, "plan": "free"})
    if code != 200:
      print("  ★断られました ……", code, got)
      return 2
    ref = got["id"]
    print("\n  ★作りました ……", ref)

  # ★立ち上がるのを 待ちます
  for i in range(40):
    code, p = 叩く("GET", "/v1/projects/%s" % ref)
    st = p.get("status") if isinstance(p, dict) else "?"
    print("   %2d 回目 …… %s" % (i + 1, st))
    if st == "ACTIVE_HEALTHY":
      break
    time.sleep(15)
  else:
    print("  ★まだ 立ち上がりません。★あとで もう 一度。")
    return 1

  print("\n  ★移行を 頭から 当てます")
  for f in 移行の順():
    名 = re.sub(r"^\d+_", "", f)[:-4]
    sql = open(os.path.join(ROOT, "supabase", "migrations", f), encoding="utf-8").read()
    code, got = 叩く("POST", "/v1/projects/%s/database/migrations" % ref,
                     {"name": 名, "query": sql})
    print("   %-58s %s" % (名[:58], "○" if code == 200 else ("★" + str(code))))
    if code != 200:
      print("      ★★これが「移行の 抜け」です。★直さずに Opus に 返します ──")
      print("      ", str(got)[:240])
      return 1

  print("\n  ★種を 流します")
  r = subprocess.run(["python3", os.path.join(ROOT, "tools/test_seed.py"), "--ok", "--ref", ref],
                     capture_output=True, text=True)
  print("   ", r.stdout.strip().split("\n")[-1] if r.stdout else r.stderr[-200:])

  code, keys = 叩く("GET", "/v1/projects/%s/api-keys" % ref)
  print("\n  ★新しい 台帳 ……", ref)
  print("  ★`.env.local` に 入れる もの ──")
  print("     NEXT_PUBLIC_SUPABASE_URL=https://%s.supabase.co" % ref)
  if isinstance(keys, list):
    for k in keys:
      print("     ★%s の 鍵 …… （画面に 出しません）" % k.get("name"))
  print("\nRESULT: ★できました。★古い 試しは **消して いません**。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
