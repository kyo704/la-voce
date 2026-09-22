#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★連絡：★一覧が 空でも「＋」が 出るか（★裁定120 ／ 実行ルート 5-3）。

  ★★見本の HTML では 測れません。★動く アプリで 見ます。
  ★★試しの 台帳の「★からっぽの 学校（5-3の ため）」を 使います
    （★連絡 0件・門下 0件）。

  ★①書ける 役（renraku_all）で 開く → 「＋ おしらせを 書く」が 見えて 押せる
  ★②390px と 1280px の 両方で 見ます（★決まりB）
  ★③書けない 役で 開く → 「＋」が 出ない（★較正）
  ★④連絡が 1件 ある 学校でも 出る
  ★⑤画像を 残します …… docs/design/compare/renraku/

  ★使い方
    python3 tools/renraku_plus_shot.py [http://localhost:3001]
"""
import io, os, re, subprocess, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "design", "compare", "renraku")
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3001"
PLUS = "＋ おしらせを 書く"

数 = [0]
落 = [0]


def みる(名, ok, 註=""):
  数[0] += 1
  if not ok:
    落[0] += 1
  print("  %s  %s%s" % ("PASS" if ok else "FAIL", 名, ("  -- " + str(註)) if 註 else ""))


def env(p):
  o = {}
  for l in io.open(os.path.join(ROOT, p), encoding="utf-8"):
    m = re.match(r"^\s*([A-Z0-9_]+)\s*=\s*(.*)$", l)
    if m:
      o[m.group(1)] = m.group(2).strip().strip('"').strip("'")
  return o


def 入る(ctx, e2e):
  p = ctx.new_page()
  p.goto(BASE + "/login")
  p.wait_for_timeout(4000)
  for _ in range(8):
    p.get_by_role("textbox").first.fill(e2e["E2E_LOCAL_EMAIL"])
    p.locator('input[type="password"]').first.fill(e2e["E2E_LOCAL_PASSWORD"])
    p.wait_for_timeout(600)
    if p.get_by_role("textbox").first.input_value() == e2e["E2E_LOCAL_EMAIL"]:
      break
  p.get_by_role("button", name=re.compile("ログイン|入る|Sign")).first.click()
  try:
    p.wait_for_url(re.compile("dashboard"), timeout=45000)
  except Exception:
    pass
  p.wait_for_timeout(9000)
  return p


def 押す(p, 字, 待ち=2500):
  loc = p.get_by_text(字, exact=False)
  if loc.count() > 0:
    try:
      loc.first.click()
      p.wait_for_timeout(待ち)
      return True
    except Exception:
      return False
  return False


ORG_KARA = "22222222-2222-4222-8222-222222222222"
POST_KAKERU = "33333333-3333-4333-8333-333333333331"   # ★事務長（renraku_all あり）
POST_KAKENAI = "33333333-3333-4333-8333-333333333332"  # ★職員（renraku_all なし）


def 役職を変える(post_id):
  """★試しの 台帳だけ。★較正の ため、★書けない 役に 付け替えます。"""
  subprocess.run(["python3", os.path.join(ROOT, "tools/ask_ledger.py"), "--test", "--write", "--ok",
                  "update public.memberships set post_id = '%s' "
                  "where org_id = '%s' and user_id = "
                  "'eafa63c2-4592-4996-8c7c-18ecbec5a34f'" % (post_id, ORG_KARA)],
                 capture_output=True, text=True)


def 見に行く(b, e2e, 幅, 高, 名, 学校の字, 撮る=None):
  ctx = b.new_context(viewport={"width": 幅, "height": 高})
  p = 入る(ctx, e2e)
  p.wait_for_timeout(6000)
  押す(p, "⚙", 2500)
  開けた = 押す(p, 学校の字, 5000)
  押す(p, "連絡", 4000)
  if 撮る:
    p.screenshot(path=os.path.join(OUT, 撮る), full_page=False)
  n = p.get_by_text(PLUS, exact=False).count()
  見 = p.get_by_text(PLUS, exact=False).first.is_visible() if n > 0 else False
  押 = p.get_by_text(PLUS, exact=False).first.is_enabled() if n > 0 else False
  ctx.close()
  return 開けた, n, 見, 押


def main():
  os.makedirs(OUT, exist_ok=True)
  e2e = env(".env.e2e")
  with sync_playwright() as pw:
    b = pw.chromium.launch()
    try:
      for 幅, 高, 名 in ((390, 844, "390"), (1280, 900, "1280")):
        ctx = b.new_context(viewport={"width": 幅, "height": 高})
        p = 入る(ctx, e2e)
        みる("★%spx …… 入れた" % 名, "dashboard" in p.url, p.url[:64])

        # ★★道 …… 「きょう」の 右上の 歯車 → 「◯◯の運営」 → 「連絡」
        #   ★★見える 字で 押します（★この 倉庫の 決め・2026-09-11）。
        #   ★★字を 変える ときは、★この 道具も grep して ください。
        p.wait_for_timeout(6000)
        みる("★%spx …… 歯車が ある" % 名, 押す(p, "⚙", 2500))
        # ★★★画面に 出る 字は「◯◯ の 運営」です（★`の` と `運営` の あいだに 空き）。
        #   ★★もと の JSX は `{mm.org.name} の運営` です。★出る ときに 空きが 入ります。
        #   ★★2026-09-22、★「の運営」で 探して 見つかりません でした。★書いて おきます。
        みる("★%spx …… 運営の 入口が ある" % 名, 押す(p, "からっぽの 学校", 5000))
        押す(p, "連絡", 4000)

        p.screenshot(path=os.path.join(OUT, "renraku-%s.png" % 名), full_page=False)
        plus = p.get_by_text(PLUS, exact=False)
        n = plus.count()
        みる("★%spx …… 「%s」が ある" % (名, PLUS), n > 0, "%d個" % n)
        if n > 0:
          みる("★%spx …… 見えて いる" % 名, plus.first.is_visible())
          みる("★%spx …… 押せる" % 名, plus.first.is_enabled())
        else:
          # ★何が 出て いるかを 残します。★空の 報告に しません。
          txt = (p.inner_text("body") or "")[:400].replace("\n", " ／ ")
          print("      ★画面の 字 …… " + txt)
        ctx.close()

      print("\n=== 三 較正 …… 書けない 役では 出ない ===")
      役職を変える(POST_KAKENAI)
      開, n, _, _ = 見に行く(b, e2e, 390, 844, "390", "からっぽの 学校", "renraku-390-kakenai.png")
      みる("★書けない 役でも 学校は 開ける", 開)
      みる("★書けない 役には「＋」が 出ない", n == 0, "%d個" % n)
      役職を変える(POST_KAKERU)

      print("\n=== 四 連絡が 1件 ある 学校でも 出る ===")
      開2, n2, 見2, 押2 = 見に行く(b, e2e, 390, 844, "390", "A13たしかめ学科", "renraku-390-aru.png")
      みる("★1件 ある 学校を 開けた", 開2)
      みる("★1件 ある 学校でも「＋」が 出る", n2 > 0 and 見2 and 押2, "%d個" % n2)
    finally:
      b.close()
  print("\n  %d / %d" % (数[0] - 落[0], 数[0]))
  print("  ★画像 …… docs/design/compare/renraku/")
  return 1 if 落[0] else 0


if __name__ == "__main__":
  sys.exit(main())
