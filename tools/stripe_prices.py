#!/usr/bin/env python3
"""★★★Stripe に「つたえる」の 商品と 値段を 作ります（★裁定180）。

  ★★★この 道具は、★**合言葉（STRIPE_SECRET_KEY）を 環境から 借ります**。
    ★手元に 合言葉は ありません（★Vercel の 側に あります）。
    ★★だから 坂本さん、★または 合言葉の ある ところで 走らせて ください。

  ★★★試し（sk_test_…）が 既定 です。
    ★本物（sk_live_…）に 当てるには `--honban` が 要ります。
    ★★お金の 口 です。★取り消しは できません。★1つずつ 確かめて ください。

  ★★何度 走らせても 同じに なります ── ★`lookup_key` で 先に 探し、
    ★あれば 作りません。★値段は Stripe では 直せない ので、
    ★★値が ちがう ときは **止まります**（★黙って 2つ 作りません）。

  ★作る もの（★`tools/prices.json` から 読みます。★数を 書き写しません）
    ind_tsutaeru_y          … つたえる 年 6,000円（税込）
    ind_tsutaeru_gakusei_y  … つたえる 年 3,000円（税込・★契約校の 名簿の 学生）

  python3 tools/stripe_prices.py              ★下見（作りません）
  python3 tools/stripe_prices.py --ok         ★試しの 口に 作ります
  python3 tools/stripe_prices.py --ok --honban ★本物の 口に 作ります
"""
import io, json, os, sys, urllib.parse, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ★★作る もの。★名（人が 読む）と 鍵（機械が 引く）だけ ここに 書きます。
#   ★★★値段は `tools/prices.json` が 持ちます。★ここには 数を 書きません。
ITEMS = [
  {"lookup": "ind_tsutaeru_y",
   "name": "つたえる（公開ページ・紙の型・英語）　年",
   "why": "裁定180。★月あたり 500円"},
  {"lookup": "ind_tsutaeru_gakusei_y",
   "name": "つたえる　年（学生）",
   "why": "裁定180。★契約して いる 学校の 名簿に 在籍中で、★在籍の 確かめに 同意して いる 方"},
]


def 値段():
  d = json.load(io.open(os.path.join(ROOT, "tools", "prices.json"), encoding="utf-8"))
  return d["stripe_lookup_keys"], d.get("version")


def 叩く(鍵, 道, 体=None):
  data = urllib.parse.urlencode(体, doseq=True).encode() if 体 is not None else None
  r = urllib.request.Request("https://api.stripe.com/v1" + 道, data=data,
                             headers={"Authorization": "Bearer " + 鍵})
  try:
    return json.loads(urllib.request.urlopen(r, timeout=60).read().decode())
  except urllib.error.HTTPError as e:
    raise RuntimeError("%s %s" % (e.code, e.read().decode()[:400]))


def main(引):
  鍵 = os.environ.get("STRIPE_SECRET_KEY", "")
  if not 鍵:
    print("★止まりました ── ★合言葉が ありません（STRIPE_SECRET_KEY）。")
    print("  ★この 道具は 合言葉を 作れません。★Vercel の 側に あります。")
    print("  ★★入れ方 …… `STRIPE_SECRET_KEY=sk_test_… python3 tools/stripe_prices.py`")
    return 2
  本番 = 鍵.startswith("sk_live_")
  if 本番 and "--honban" not in 引:
    print("★止まりました ── ★本物の 口（sk_live_…）です。")
    print("  ★当てる なら `--honban` を 付けて ください。★取り消せません。")
    return 2
  if not 本番 and "--honban" in 引:
    print("★止まりました ── ★`--honban` を 付けましたが、★合言葉は 試しの もの です。")
    return 2
  値, 版 = 値段()
  print("★口 ……", "★★本物（live）" if 本番 else "試し（test）")
  print("★値段の 出どころ …… tools/prices.json（version %s）" % 版)
  作る = "--ok" in 引
  for it in ITEMS:
    円 = 値.get(it["lookup"])
    if 円 is None:
      print("  ★★%s …… prices.json に ありません" % it["lookup"]); return 1
    ある = 叩く(鍵, "/prices?lookup_keys[]=%s&limit=1" % it["lookup"]).get("data") or []
    if ある:
      p = ある[0]
      同 = int(p.get("unit_amount") or -1) == int(円)
      print("  %-24s ★もう あります（%s・%s円）%s"
            % (it["lookup"], p["id"], p.get("unit_amount"), "" if 同 else "　★★値が ちがいます"))
      if not 同:
        print("     ★★止まります。★Stripe の 値段は 直せません。")
        print("     ★★★古い ほうを 使わなく して から、★新しい 鍵の 名で 作って ください。")
        return 1
      continue
    print("  %-24s ★★ありません（★%s円 で 作ります）" % (it["lookup"], 円))
    if not 作る:
      continue
    pr = 叩く(鍵, "/products", {"name": it["name"], "description": it["why"]})
    p = 叩く(鍵, "/prices", {
      "product": pr["id"], "unit_amount": int(円), "currency": "jpy",
      "recurring[interval]": "year", "lookup_key": it["lookup"],
      "tax_behavior": "inclusive",        # ★表示は 税込（裁定155）
    })
    print("     ★作りました …… 商品 %s ／ 値段 %s" % (pr["id"], p["id"]))
    print("     ★★Vercel の 環境変数に この 値段の id を 置いて ください。")
  if not 作る:
    print("★作って いません。★作る なら --ok を 付けて ください。")
  return 0


if __name__ == "__main__":
  sys.exit(main(sys.argv[1:]))
