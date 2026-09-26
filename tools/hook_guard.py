#!/usr/bin/env python3
"""★直す たびに、★見張りが **ひとりでに** 走ります（★較正③・2026-09-26）。

  ★★★なぜ 作ったか ──
    ★見張りは 506本 あります。★けれど「走らせるのを 忘れる」ことが 何度も ありました。
    ★★忘れられる 見張りは、★無い のと 同じ です。
    ★★★だから git の 手（フック）に 結びます。★commit と push の たびに 走ります。

  ★★どこで 何を 走らせるか（★時間を 測って 分けました・2026-09-26 実測）。

    ★commit の 前（★軽い もの だけ ／ ★合わせて 20 秒ほど）
      ①`tools/tdz_scan.py`（★積んだ 紙 だけ）…… 1.3 秒。★本番を 3度 止めた 落とし穴。
      ②`next lint --file`（★積んだ 紙 だけ）…… 16 秒。★`no-undef` が 落ちを 拾います。
      ③積んだ 見張り そのもの …… ★見張りを 直した ときは、★その 見張りを 走らせます。

    ★push の 前（★重い もの ／ ★合わせて 9 分ほど）
      ①`tools/run_guards.py` …… ★507本 ぜんぶ。★4 分 52 秒（★順に 1本ずつ ／ ★2026-09-26 実測）。
        ★★`node_modules` が 無い 蔵（★worktree）では 8 分 2 秒 でした。★2本が 落ちます
          （★`sheep-shoe-layering`・`wardrobe-ui` ── ★本物を 描かせて 見る 見張り です）。
        ★★★なぜ 並べて 走らせないか ── ★試しました（★-P 8 で 2 分 4 秒）。
          ★けれど 見張りの 幾つかは、★確かめる ために **紙を 書きます**
          （★`lib/_priceBait.js` など ── ★わざと 当たる 1件 を 置く 型）。
          ★★同時に 走らせると、★その 紙を 別の 見張りが 見つけて 赤に なります。
          ★★★実際 `select-star` と `no-star-in-ui` が、★そうして 嘘の 赤を 出しました。
          ★嘘の 赤は、★見張りごと 信じられなく します。★だから 順に 走らせます。
      ②`tools/tdz_scan.py`（★ぜんぶ）
      ③`next lint --file`（★押す ぶんで 変わった 紙 だけ）…… ★`next lint` 丸ごとは
        2 分 49 秒 かかります。★`no-undef` は 紙ごとの 決まり なので、★変わった 紙で 足ります。
      ④`tools/dom_compare_personal.js` ／ `tools/dom_compare.js`
        ★★これは **支度が 整って いる ときだけ** 走ります ── ★`.env.e2e` と、
          ★手元で 動いて いる アプリ が 要ります。★無い ときは 走らせず、★理由を 書きます。
        ★★★止まらない 見張りを 置くと、★人は `--no-verify` を 覚えます。★それが 一番 まずい。

  ★★★中身は ここに 書きません。★既に ある 道具を 呼ぶ だけ です（★台帳 08-1）。
    ★同じ 判じを 2つ 書くと、★片方 だけ 直されて ずれます。

  ★★どうしても 急ぐ とき …… `git commit --no-verify` ／ `git push --no-verify`。
    ★★使った ことは 自分で 覚えて おいてください。★次の push で 出直します。

  ★使い方
    python3 tools/hook_guard.py commit      ★commit の 前に 走る もの
    python3 tools/hook_guard.py push        ★push の 前に 走る もの（★refs を 立ち口から 読みます）
    python3 tools/hook_guard.py --selftest  ★道具の 較正（★わざと 落ちる 1件 を 見つけるか）
"""
import os, re, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ゼロ = "0" * 40
DOM_既定 = ("届いたもの", "区切り", "しらべていること")


def 走る(cmd, cwd=ROOT, 入=None):
  """★呼んで、★出た 字を そのまま 流し、★**終わりの 番号** を 返します。

  ★★字で 判じません（★`tools/run_guards.py` の 頭に ある とおり、
    ★言い方は 見張りごとに ちがいます）。
  """
  r = subprocess.run(cmd, cwd=cwd, input=入, text=True,
                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
  sys.stdout.write(r.stdout or "")
  sys.stdout.flush()
  return r.returncode


def git(*args):
  r = subprocess.run(["git"] + list(args), cwd=ROOT, text=True,
                     stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
  return (r.stdout or "").strip()


def 節(名):
  print("\n────────────────────────────────────────")
  print("★%s" % 名)


def 積んだ紙():
  """★commit に 積んだ 紙（★消した ものは 除きます）。"""
  出 = git("diff", "--cached", "--name-only", "--diff-filter=ACMR")
  return [p for p in 出.split("\n") if p.strip()]


def 押す紙(範囲):
  if not 範囲:
    return []
  出 = git("diff", "--name-only", "--diff-filter=ACMR", 範囲[0], 範囲[1])
  return [p for p in 出.split("\n") if p.strip()]


def 押す範囲(立ち口):
  """★push の 立ち口 から、★「どこから どこまで 押すか」を 読みます。

  ★★1行 …… `<手元の ref> <手元の sha> <あちらの ref> <あちらの sha>`
  ★★あちらが 0 …… ★新しい 枝 です。★`origin/main` との 分かれ目 から 見ます。
  """
  組 = []
  for 行 in 立ち口.split("\n"):
    片 = 行.split()
    if len(片) < 4:
      continue
    手元, あちら = 片[1], 片[3]
    if 手元 == ゼロ:
      continue                      # ★枝を 消す push。★見る ものが ありません
    if あちら == ゼロ:
      分 = git("merge-base", "origin/main", 手元) or git("rev-list", "--max-count=1", 手元 + "~1")
      if 分:
        組.append((分, 手元))
    else:
      組.append((あちら, 手元))
  return 組


def js紙(紙):
  return [p for p in 紙 if p.endswith((".js", ".jsx", ".mjs")) and os.path.exists(os.path.join(ROOT, p))]


def 部品紙(紙):
  return [p for p in 紙 if p.endswith(".jsx") and os.path.exists(os.path.join(ROOT, p))]


def 見張り紙(紙):
  return [p for p in 紙 if p.endswith(".test.js") and p.startswith("components/tests/")
          and os.path.exists(os.path.join(ROOT, p))]


# ───────────────────────────────── ★ひとつずつの 検め ─────────────────────────────


def 検_tdz(紙=None):
  引 = 部品紙(紙) if 紙 is not None else []
  if 紙 is not None and not 引:
    return ("tdz_scan", None, "★部品（.jsx）を 積んで いません")
  節("後ろの 名を 読んで いないか（tdz_scan）")
  rc = 走る(["python3", "tools/tdz_scan.py"] + 引)
  return ("tdz_scan", rc, "%d 枚" % (len(引) if 引 else 0))


def 検_lint(紙):
  対 = js紙(紙)
  if not 対:
    return ("lint", None, "★js／jsx を 変えて いません")
  if not os.path.isdir(os.path.join(ROOT, "node_modules")):
    return ("lint", None, "★node_modules が ありません（`npm install` の あとで 走ります）")
  節("next lint（★変わった 紙 だけ ／ %d 枚）" % len(対))
  引 = []
  for p in 対:
    引 += ["--file", p]
  rc = 走る(["npx", "--no-install", "next", "lint"] + 引)
  return ("lint", rc, "%d 枚" % len(対))


def 検_積んだ見張り(紙):
  対 = 見張り紙(紙)
  if not 対:
    return ("積んだ 見張り", None, "★見張りを 変えて いません")
  節("変えた 見張り を 走らせます（%d 本）" % len(対))
  悪 = 0
  for p in 対:
    rc = 走る(["node", p])
    print("  %s %s" % ("★NG(%d)" % rc if rc else "  ok  ", p))
    悪 += 1 if rc else 0
  return ("積んだ 見張り", 1 if 悪 else 0, "%d 本 中 %d 本 落ち" % (len(対), 悪))


def 検_見張り一式():
  節("見張り ぜんぶ（run_guards.py ／ ★8 分ほど）")
  rc = 走る(["python3", "tools/run_guards.py"])
  return ("見張り 一式", rc, "")


def dom支度():
  """★骨組み くらべ が 走れる か。★走れない 理由を そのまま 返します。"""
  訳 = []
  if not os.path.exists(os.path.join(ROOT, ".env.e2e")):
    訳.append(".env.e2e が ありません")
  if not os.path.isdir(os.path.join(ROOT, "node_modules/playwright")):
    訳.append("playwright が ありません")
  口 = os.environ.get("E2E_LOCAL_URL") or "http://localhost:3000"
  if not 訳:
    try:
      import urllib.request
      urllib.request.urlopen(口, timeout=3).read(1)
    except Exception as e:
      訳.append("%s が 答えません（%s）" % (口, type(e).__name__))
  return 訳


def 検_dom():
  決 = os.environ.get("HOOK_DOM", "auto")
  if 決 == "0":
    return ("骨組み くらべ", None, "★HOOK_DOM=0 で 止めて います")
  訳 = dom支度()
  if 訳 and 決 != "1":
    return ("骨組み くらべ", None, "★支度が 足りません ── " + "／".join(訳))
  if 訳:
    print("★HOOK_DOM=1 ですが 支度が 足りません ── " + "／".join(訳))
    return ("骨組み くらべ", 1, "／".join(訳))
  面 = [x for x in (os.environ.get("HOOK_DOM_SCREENS") or "").split(",") if x.strip()] or list(DOM_既定)
  節("骨組みで くらべます（個人の 画面 %d 枚）" % len(面))
  悪 = 0
  for 名 in 面:
    rc = 走る(["node", "tools/dom_compare_personal.js", 名])
    print("  %s %s" % ("★NG(%d)" % rc if rc else "  ok  ", 名))
    悪 += 1 if rc else 0
  return ("骨組み くらべ", 1 if 悪 else 0, "%d 枚 中 %d 枚 ちがい" % (len(面), 悪))


# ───────────────────────────────── ★段どり ──────────────────────────────────────


def 束ねる(名, 検ら):
  始 = time.time()
  print("═══ ★%s の 前の 見張り ═══" % 名)
  控 = []
  for f in 検ら:
    t = time.time()
    題, rc, 備 = f()
    控.append((題, rc, time.time() - t, 備))
  print("\n════════════ ★まとめ（%s）════════════" % 名)
  悪 = 0
  for 題, rc, 秒, 備 in 控:
    印 = "－ 走らず" if rc is None else ("○ 通り " if rc == 0 else "✗ 落ち ")
    if rc:
      悪 += 1
    print("  %s %-16s %6.1f秒  %s" % (印, 題, 秒, 備))
  print("  ────────────  合わせて %.1f 秒" % (time.time() - 始))
  if 悪:
    print("\n★★★%s を 止めました。★上の 赤を 直して ください。" % 名)
    print("★どうしても 急ぐ とき …… `git %s --no-verify`" % ("commit" if 名 == "commit" else "push"))
    return 1
  print("\n★通りました。★%s を 続けます。" % 名)
  return 0


def commit段():
  紙 = 積んだ紙()
  if not 紙:
    print("★積んだ 紙が ありません")
    return 0
  return 束ねる("commit", [
    lambda: 検_tdz(紙),
    lambda: 検_lint(紙),
    lambda: 検_積んだ見張り(紙),
  ])


def push段(立ち口):
  組 = 押す範囲(立ち口)
  if not 組:
    print("★押す ものが ありません")
    return 0
  紙 = []
  for a, b in 組:
    for p in 押す紙((a, b)):
      if p not in 紙:
        紙.append(p)
  return 束ねる("push", [
    lambda: 検_見張り一式(),
    lambda: 検_tdz(),
    lambda: 検_lint(紙),
    lambda: 検_dom(),
  ])


# ───────────────────────────────── ★較正 ───────────────────────────────────────


def selftest():
  """★わざと 落ちる 1件 を 作り、★この 道具が 見つける か 確かめます。

  ★★見つけられなければ、★「ぜんぶ 通りました」は 嘘 に なります。
  """
  import tempfile
  数 = 落 = 0

  def t(名, ok, 註=""):
    nonlocal 数, 落
    数 += 1
    if not ok:
      落 += 1
    print("  %s %s%s" % ("✓" if ok else "✗", 名, ("  -- " + 註) if 註 else ""))

  仮 = tempfile.mkdtemp(prefix="hook_guard_")
  通 = os.path.join(仮, "aa.test.js")
  落紙 = os.path.join(仮, "bb.test.js")
  open(通, "w").write("console.log('  ok');process.exit(0);\n")
  open(落紙, "w").write("console.log('  わざと の 1件');process.exit(1);\n")

  print("=== 一 呼んだ ものの 終わりの 番号を 見て いるか ===")
  t("★通る ものは 0", 走る(["node", 通], cwd=仮) == 0)
  t("★落ちる ものは 0 以外", 走る(["node", 落紙], cwd=仮) != 0)

  print("\n=== 二 わざと 落ちる 見張りを、★段が 赤に する か ===")
  段 = 束ねる("較正", [lambda: ("わざと", 走る(["node", 落紙], cwd=仮), "★1件 仕込みました")])
  t("★段が 1（赤）を 返す", 段 == 1)
  段2 = 束ねる("較正", [lambda: ("わざと", 走る(["node", 通], cwd=仮), "★仕込み 無し")])
  t("★仕込みが 無ければ 0（緑）", 段2 == 0)

  print("\n=== 三 走らない もの（None）を 緑と 数えて いないか ===")
  段3 = 束ねる("較正", [lambda: ("走らず", None, "★支度が ありません")])
  t("★走らない ものは 段を 赤に しない", 段3 == 0)

  print("\n=== 四 手（フック）が 置いて ある か ===")
  for h in ("pre-commit", "pre-push"):
    p = os.path.join(ROOT, ".githooks", h)
    t("★.githooks/%s が ある" % h, os.path.exists(p))
    t("★.githooks/%s は 走れる" % h, os.path.exists(p) and os.access(p, os.X_OK))

  for p in (通, 落紙):
    os.remove(p)
  os.rmdir(仮)
  print("\n  %d / %d" % (数 - 落, 数))
  print("SELFTEST %s" % ("PASS" if not 落 else "FAIL"))
  return 1 if 落 else 0


def main(引):
  if "--selftest" in 引:
    return selftest()
  段 = (引 or ["commit"])[0]
  if 段 == "commit":
    return commit段()
  if 段 == "push":
    return push段("" if sys.stdin.isatty() else sys.stdin.read())
  print("★commit か push か --selftest を ください")
  return 2


if __name__ == "__main__":
  sys.exit(main(sys.argv[1:]))
