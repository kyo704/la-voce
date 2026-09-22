#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★S3 §5 ── 門下を 開く 道を、★本物の ブラウザで 通します（2026-09-22）。

  ★見る こと（★仕様シート §5 の 7つ）──
    ①`monka_read` を 持つ 人が、★よその 門下を 押す → ★中身が 出ない・理由を 聞かれる
    ②理由を 選ばずに「開く」→ ★何も 起きない・記録が 増えない
    ③「その他」で 空欄の まま「開く」→ ★開かない
    ④「事故・苦情の 調べ」で 開く → ★中身が 出る・記録が 1行 増える（`jiko`）
    ⑤別の 行を 押して 戻る → ★また 理由を 聞かれる。★開くと もう 1行
    ⑥先生 ご本人が 自分の 門下を 押す → ★理由を 聞かれない
    ⑦画面の どこにも「ご本人にも 伝わります」が 無い

  ★★試しの 台帳だけ です。★本番は 触りません。

  ★使い方
    python3 tools/s3_monka_read_shot.py [http://localhost:3001]
"""
import io, os, re, subprocess, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "design", "compare", "renraku")
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3001"

GAKKO = "A13たしかめ学科"
YOSO = "★先生 はなこの 門下"      # ★よその 門下（★理由を 聞かれる）
JIBUN = "★くらべ用 たろうの 門下"  # ★自分の 門下（★聞かれない）

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


def 数える():
  out = subprocess.run(["python3", os.path.join(ROOT, "tools/ask_ledger.py"), "--test",
                        "select count(*) from monka_read_log"],
                       capture_output=True, text=True).stdout
  m = re.search(r"^\s*(\d+)\s*$", out, re.M)
  return int(m.group(1)) if m else -1


def 片づけ():
  subprocess.run(["python3", os.path.join(ROOT, "tools/ask_ledger.py"), "--test", "--write", "--ok",
                  "delete from public.monka_read_log"], capture_output=True, text=True)


def 押札(p, 名, 待ち=2500):
  """★札（button）を、★名前 ちょうど で 押します。

    ★★★`get_by_text("開く")` は、★「門下を 開いた 記録」など
      ★★`開く` を 含む **別の 字** にも 当たります。
    ★★2026-09-22、★それで 1度 空振りしました。★札と 名前で 押します。
  """
  loc = p.get_by_role("button", name=名, exact=True)
  if loc.count() > 0:
    try:
      loc.first.click()
      p.wait_for_timeout(待ち)
      return True
    except Exception:
      return False
  return False


def 戻る(p, 待ち=3000):
  """★「‹ もどる」を 押します。★**いちばん 下の もの** を 押します。

    ★★★「‹ もどる」は 2つ あります ──
      ★上 …… 運営の 殻の 戻る（★運営から 出て しまいます）
      ★下 …… 連絡の 中の 戻る（★門下の 一覧へ 戻ります）
    ★★2026-09-22、★上を 押して いて、★一覧に 戻れて いません でした。
  """
  loc = p.get_by_role("button", name="‹ もどる", exact=True)
  n = loc.count()
  if n == 0:
    return False
  try:
    loc.nth(n - 1).click()
    p.wait_for_timeout(待ち)
    return True
  except Exception:
    return False


def 押行(p, 名, 待ち=3500):
  """★門下の 行（button）を 押します。★名前の 一部で 探します。

    ★★★行の 中の 字は「◯◯の 門下／まだ ありません／1人」です。
      ★★`get_by_text` は 中の `span` に 当たります。★札を 名前で 探す ほうが 確かです。
  """
  loc = p.get_by_role("button", name=re.compile(re.escape(名)))
  if loc.count() > 0:
    try:
      loc.first.click()
      p.wait_for_timeout(待ち)
      return True
    except Exception:
      return False
  return False


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


def main():
  os.makedirs(OUT, exist_ok=True)
  e2e = env(".env.e2e")
  片づけ()
  with sync_playwright() as pw:
    b = pw.chromium.launch()
    try:
      ctx = b.new_context(viewport={"width": 390, "height": 844})
      p = 入る(ctx, e2e)
      みる("★入れた", "dashboard" in p.url, p.url[:60])
      押す(p, "⚙", 2500)
      みる("★運営に 入れた", 押す(p, GAKKO, 5000))
      押す(p, "連絡", 4000)

      前 = 数える()

      print("\n=== ① よその 門下を 押す ===")
      開いた = 押行(p, YOSO)
      みる("★よその 門下の 行が ある", 開いた)
      本文 = p.inner_text("body")
      みる("★理由を 聞かれる", "なぜ 開きますか" in 本文)
      みる("★中身が 出て いない", "★見本" not in 本文 and "楽譜を" not in 本文)
      p.screenshot(path=os.path.join(OUT, "monka-riyuu-390.png"), full_page=False)

      print("\n=== ② 理由を 選ばずに 開く ===")
      押札(p, "開く", 3000)
      本文 = p.inner_text("body")
      みる("★「理由を 選んでください」が 出る", "理由を 選んでください" in 本文)
      みる("★記録が 増えて いない", 数える() == 前, "%d → %d" % (前, 数える()))

      print("\n=== ③ その他・空欄で 開く ===")
      押札(p, "その他", 1500)
      押札(p, "開く", 3000)
      みる("★記録が 増えて いない", 数える() == 前, "%d → %d" % (前, 数える()))

      print("\n=== ④ 事故・苦情の 調べ で 開く ===")
      押札(p, "事故・苦情の 調べ", 1500)
      押札(p, "開く", 6000)
      後 = 数える()
      みる("★記録が 1行 増えた", 後 == 前 + 1, "%d → %d" % (前, 後))
      out = subprocess.run(["python3", os.path.join(ROOT, "tools/ask_ledger.py"), "--test",
                            "select reason_kind from monka_read_log order by viewed_at desc limit 1"],
                           capture_output=True, text=True).stdout
      みる("★理由が jiko で 残った", "jiko" in out)
      本文 = p.inner_text("body")
      みる("★開いた 帯が 出る", "開いた記録に 残りました" in 本文 or "開きました" in 本文)
      p.screenshot(path=os.path.join(OUT, "monka-hiraita-390.png"), full_page=False)

      print("\n=== ⑤ 別の 行を 押して 戻る ===")
      # ★★★開いた あとは 本文の 姿です。★先に「‹ もどる」で 一覧へ 戻ります。
      #   ★★2026-09-22、★戻らずに 押して 空振りしました。★書いて おきます。
      みる("★一覧へ 戻れた", 戻る(p))
      みる("★自分の 門下を 押せた", 押行(p, JIBUN))
      みる("★もう 一度 戻れた", 戻る(p))
      みる("★よその 門下を もう 一度 押せた", 押行(p, YOSO))
      本文 = p.inner_text("body")
      みる("★また 理由を 聞かれる", "なぜ 開きますか" in 本文)
      押札(p, "事故・苦情の 調べ", 1500)
      押札(p, "開く", 6000)
      みる("★もう 1行 増えた", 数える() == 前 + 2, "%d → %d" % (前, 数える()))

      print("\n=== ⑥ 自分の 門下は 聞かれない ===")
      戻る(p)
      押した = 押行(p, JIBUN)
      本文 = p.inner_text("body")
      # ★★★先に「その 行を 押せた か」を 見ます。
      #   ★★押せて いない のに「聞かれない」と 書くと、★**嘘の PASS** に なります。
      #   ★★2026-09-22、★ここが 嘘の PASS に なって いました。★直しました。
      みる("★自分の 門下の 行を 押せた", 押した)
      みる("★理由を 聞かれない", 押した and "なぜ 開きますか" not in 本文)
      みる("★記録が 増えて いない", 数える() == 前 + 2, "%d" % 数える())

      print("\n=== ⑦ 消した 字が 出て いない ===")
      みる("★「ご本人にも 伝わります」が 無い", "ご本人にも 伝わります" not in 本文)
      みる("★「先生と 学生からも 見られます」が 無い", "先生と 学生からも" not in 本文)

      ctx.close()
    finally:
      b.close()
  print("\n  %d / %d" % (数[0] - 落[0], 数[0]))
  print("  ★画像 …… docs/design/compare/renraku/")
  return 1 if 落[0] else 0


if __name__ == "__main__":
  sys.exit(main())
