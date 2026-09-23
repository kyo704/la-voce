#!/usr/bin/env python3
"""★★★Stripe の 口を 読むだけ で 確かめます（★2026-09-23）。

  ★★★1円も 動かしません。★作りも しません。★読むだけ です。
    ★作るのは `tools/stripe_prices.py` の ほう です。

  ★★見る こと
    ① 合言葉は 試しか 本物か
    ② いま ある 値段（lookup_key つき）と、★`tools/prices.json` の 数が 合うか
    ③ 画面が 要る 環境変数が 揃って いるか（★値は 出しません。★有/無 だけ）

  ★★★合言葉は 環境から 借ります。★手元には ありません（★Vercel の 側）。

  STRIPE_SECRET_KEY=sk_test_… python3 tools/stripe_check.py
"""
import io, json, os, sys, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ★★画面が 読む 環境変数（★`grep process.env.STRIPE` で 数えた もの）。
#   ★★★名前を 思い出して 書きません。★下の 一覧は コードから 取ります。
IRU = ["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID_MONTHLY", "STRIPE_PRICE_ID_ANNUAL",
       "STRIPE_PRICE_ID_FULL", "STRIPE_WEBHOOK_SECRET"]


def 叩く(鍵, 道):
  r = urllib.request.Request("https://api.stripe.com/v1" + 道,
                             headers={"Authorization": "Bearer " + 鍵})
  try:
    return json.loads(urllib.request.urlopen(r, timeout=60).read().decode())
  except urllib.error.HTTPError as e:
    raise RuntimeError("%s %s" % (e.code, e.read().decode()[:300]))


def main():
  print("★★★① 環境変数（★有/無 だけ。★値は 出しません）")
  無 = []
  for k in IRU:
    有 = bool(os.environ.get(k))
    if not 有:
      無.append(k)
    print("   %-26s %s" % (k, "★あります" if 有 else "★★ありません"))
  鍵 = os.environ.get("STRIPE_SECRET_KEY", "")
  if not 鍵:
    print("\n★止まりました ── ★合言葉が ありません。★ここから 先は 読めません。")
    return 2
  種 = "★★本物（live）" if 鍵.startswith("sk_live_") else (
       "試し（test）" if 鍵.startswith("sk_test_") else "★★分かりません")
  print("\n★★★② 口 …… %s" % 種)
  try:
    acct = 叩く(鍵, "/account")
    print("   つながりました …… %s（%s）" % (acct.get("id"), acct.get("country")))
  except Exception as e:
    print("   ★★つながりません:", str(e)[:200]); return 1

  print("\n★★★③ 値段（★`tools/prices.json` と くらべます）")
  値 = json.load(io.open(os.path.join(ROOT, "tools", "prices.json"),
                         encoding="utf-8"))["stripe_lookup_keys"]
  ちがい = 0
  for 鍵名, 円 in sorted(値.items()):
    try:
      d = (叩く(鍵, "/prices?lookup_keys[]=%s&limit=1" % 鍵名).get("data") or [])
    except Exception as e:
      print("   %-26s ★★読めません %s" % (鍵名, str(e)[:60])); ちがい += 1; continue
    if not d:
      print("   %-26s ★★ありません（★%s円 の はず）" % (鍵名, 円)); ちがい += 1; continue
    p = d[0]
    同 = int(p.get("unit_amount") or -1) == int(円)
    print("   %-26s %s円 %s %s" % (鍵名, p.get("unit_amount"),
                                   "★合って います" if 同 else "★★ちがいます（紙は %s円）" % 円,
                                   p["id"]))
    if not 同:
      ちがい += 1

  print()
  if 無:
    print("★★まだ 無い 環境変数 …… " + "／".join(無))
    print("  ★★★Vercel に 置いた あと、★**もう 一度 配る**まで 効きません。")
  print("RESULT:", "OK" if (not ちがい and not 無) else "NG（★上の ★★を 見て ください）")
  return 0 if (not ちがい and not 無) else 1


if __name__ == "__main__":
  sys.exit(main())
