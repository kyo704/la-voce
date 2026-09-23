#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★ホームページの 型の 名前と 説明が、★見本と 台帳で 1文字も ちがわないか（★裁定119 の CHECK）。

  ★★見本 …… `00-動く見本（さわれる・全画面）.html` の `WEB_NAMES` ／ `WEB_NOTE`
  ★★台帳 …… `page_type_catalog`（★sql/21）

  ★★★写しません。★両方から 読み出して 突き合わせます。
    ★★写すと、★片方を 直した 日に ずれます。

  ★使い方
    python3 tools/page_type_names_check.py            ★くらべる
    python3 tools/page_type_names_check.py --selftest ★道具を 較正する
"""
import io, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIHON = os.path.join(ROOT, "docs/design/pack-final/00-動く見本（さわれる・全画面）.html")


def 見本():
  s = io.open(MIHON, encoding="utf-8", errors="replace").read()
  out = {}
  for 鍵, 先 in (("WEB_NAMES", "name"), ("WEB_NOTE", "note")):
    i = s.index(鍵)
    塊 = s[i:s.index("}", i)]
    for m in re.finditer(r"(t\d\d)\s*:\s*'([^']*)'", 塊):
      out.setdefault(m.group(1), {})[先] = m.group(2)
  return out


def 台帳(試し=True):
  """★台帳に 直に 尋ねます。

    ★★★`ask_ledger.py` の 画面は 長い 値を 切ります（★列の 幅）。
      ★★2026-09-23、★切れた JSON を 読もうと して「台帳に ありません」と 15件 出ました。
      ★★★道具の 見た 目 を 読まない こと。★口に 直に 尋ねます。
  """
  import urllib.request
  f = os.path.expanduser("~/.bash_profile")
  tok = subprocess.run(
    ["bash", "-lc", 'source "%s" >/dev/null 2>&1; printf %%s "$SUPABASE_ACCESS_TOKEN"' % f],
    capture_output=True, text=True).stdout.strip()
  # ★★★2026-09-23 ── ★試しの 台帳が 移りました。
  #   ★古い `smntpurraumeerselvsc` は **止まって います**（INACTIVE）。
  #   ★★そこへ 問うと「connection timeout」で 落ちます。★落ちるのは 良い こと ですが、
  #     ★「試しで 通った」と 言える 先は いま `orutyqtfygvzcuhjgsch`（la-voce-test2）だけ です。
  #   ★★FX7 で 建て直した のは こちら で、★表の 数は 本番と 同じ 135 です。
  ref = "orutyqtfygvzcuhjgsch" if 試し else "xxjtplvpcneksrofkjmf"
  req = urllib.request.Request(
    "https://api.supabase.com/v1/projects/%s/database/query" % ref,
    data=json.dumps({"query": "select type_key, name, note from public.page_type_catalog"}).encode(),
    headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"})
  try:
    rows = json.loads(urllib.request.urlopen(req, timeout=60).read().decode())
  except Exception:
    return {}
  return {r["type_key"]: {"name": r["name"], "note": r["note"]} for r in rows}


def main():
  m = 見本()
  d = 台帳()
  print("PAGE_TYPE_NAMES_CHECK")
  print("  見本 …… %d型 ／ 台帳 …… %d型" % (len(m), len(d)))
  落 = []
  for k in sorted(set(m) | set(d)):
    if k not in m:
      落.append("%s …… ★見本に ありません" % k); continue
    if k not in d:
      落.append("%s …… ★台帳に ありません" % k); continue
    for 欄 in ("name", "note"):
      a, b = m[k].get(欄, ""), d[k].get(欄, "")
      if a != b:
        落.append("%s の %s …… 見本『%s』／台帳『%s』" % (k, 欄, a, b))
  for x in 落:
    print("  NG ", x)
  print("RESULT:", "PASS" if not 落 else "NG（%d件）" % len(落))
  return 0 if not 落 else 1


def selftest():
  """★較正 ── ★わざと 1文字 変えたら 見つける こと。"""
  m = 見本()
  if not m:
    print("SELFTEST FAIL: 見本を 読めません"); return 2
  d = 台帳()
  if not d:
    print("SELFTEST FAIL: 台帳を 読めません"); return 2
  ok = True
  if set(m) != set(d):
    print("SELFTEST FAIL: 鍵の 数が ちがいます", len(m), len(d)); ok = False
  # ★1文字 変えた 写しで、★見つけられるか
  k = sorted(d)[0]
  にせ = {kk: dict(vv) for kk, vv in d.items()}
  にせ[k]["name"] = にせ[k]["name"] + "★"
  見つけた = any(m[kk].get("name", "") != にせ[kk].get("name", "") for kk in m if kk in にせ)
  if not 見つけた:
    print("SELFTEST FAIL: 1文字の ちがいを 見つけられません"); ok = False
  print("SELFTEST", "PASS" if ok else "FAIL")
  return 0 if ok else 2


if __name__ == "__main__":
  sys.exit(selftest() if "--selftest" in sys.argv[1:] else main())
