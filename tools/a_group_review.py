#!/usr/bin/env python3
"""★段3a A群 ── ★差を 1枚ずつ 読み、★仕分けます（2026-09-24）

  ★出どころ  坂本さんの お決め（2026-09-24）──
    「実質的な 問題」と「見せかけ・意図的な 差異」を 分類して ください

  ★★★`screen_b_compare.py` が ②に 出した 字を、★さらに 4つに 分けます ──

    ㋐ ★ほかの 画面に ある      … ★この 画面には 無いが、★家の どこかには ある
    ㋑ ★台帳に 置き場が ない    … ★作ろうにも 列が ない（★裁定が 要る）
    ㋒ ★作れるのに 作って いない … ★いちばん 大事。★直す もの
    ㋔ ★まだ の ところ（★宣言あり）… ★実装が **自分で**「まだ」と 書いて いる もの
    ㋓ ★見本の 中の 見せかけ    … ★人の 名前・数など（★`screen_b_compare` が 拾いきれなかった 分）

  ★★★㋒ だけ が「直す もの」です。★ほかは 記録して 次へ 進みます。

  ★★仕分けの 手がかり（★当てずっぽうに しない）──
    ㋐ …… ★その 字が `components/` `lib/` の **どこかに** ある
    ㋑ …… ★その 字が 台帳の 列の 名前や 値に 当たらず、★近い 表も 無い
    ㋓ …… ★人の 名前らしい（★2〜4字 ＋ あき ＋ 2〜4字）／★数だけ ちがう

使い方: python3 tools/a_group_review.py <対応の JSON>
        （★`/tmp/a_conf.json` の ような、★画面 → 紙 の 組）
"""
import io, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def 字だけ(s):
  return re.sub(r"[^0-9０-９A-Za-zぁ-んァ-ヶ一-龠々ー「」（）]", "", s or "")


def 家ぜんぶ():
  出 = []
  for 根 in ("components", "lib", "app"):
    for d, _, fs in os.walk(os.path.join(ROOT, 根)):
      if "/tests" in d or "node_modules" in d: continue
      for f in fs:
        if not f.endswith((".js", ".jsx")): continue
        try: s = io.open(os.path.join(d, f), encoding="utf-8").read()
        except Exception: continue
        s = re.sub(r"/\*[\s\S]*?\*/", " ", s)
        s = re.sub(r"^\s*//.*$", " ", s, flags=re.M)
        出.append((os.path.relpath(os.path.join(d, f), ROOT), 字だけ(s)))
  return 出


# ★★★この 家の「まだ」の 書き方（★実装が 自分で 名ざして いる もの）。
#   ★`ready: false` ／ `needs:` ／「まだ」「休んで います」「ありません」
#   ★★これが 近くに ある 節は、★**考えた 末に 出して いない** ところ です。
#     ★★㋒（うっかり 作り忘れ）と 分けます。
# ★★★はじめ「まだ」「出しません」「ありません」も 印に しました。★だめ でした ──
#   ★あの 言葉は この 家の **約束の 書き方** です。★ほとんどの 紙に あります。
#   ★★197件 ぜんぶが ㋔ に 落ち、★㋒ が 0 に なりました。★仕分けに なりません。
#   ★★★印は「**この ところは まだ**」と 名ざして いる もの だけ に します。
まだの印 = ("ready: false", "needs:", "NOT_YET")


def まだと書いてあるか(paths):
  for p in paths:
    try: s = io.open(os.path.join(ROOT, p), encoding="utf-8").read()
    except Exception: continue
    if any(w in s for w in まだの印): return True
  return False


def 見せかけか(w):
  """★見本が 手で 書いた 中身か（★人の 名前・値段・日・場所・回数）。

     ★★★2026-09-24 に 広げました。★はじめは 人の 名前 だけ でした。
       ★★「□□ミュージカル・アカデミー」「580円（税込）」「12回目」「千葉文化会館」
         ★どれも 見本の 中身 です。★実装は 台帳から 出します。
       ★★★これを ㋒（直す もの）に 数えると、★本物の 抜けが 埋もれます。
  """
  t = (w or "").strip()
  # ★人の 名前
  if re.fullmatch(r"[一-龠ぁ-んァ-ヶ]{1,4}[ 　][一-龠ぁ-んァ-ヶー]{1,5}", t): return True
  # ★見本の 伏せ字（★○○ □□ △△ ●●）
  if re.search(r"[○□△●]{2}", t): return True
  # ★値段・日・回数 …… ★数と 単位 だけ で できて いる もの
  if re.fullmatch(r"[\d,０-９]+\s*(円（税込）|円|回目|件|人|日|分)[^\S\n]*", t): return True
  if re.fullmatch(r"\d{4}年\d{1,2}月\d{1,2}日", t): return True
  if re.fullmatch(r"\d{1,2}月\d{1,2}日（[月火水木金土日]）", t): return True
  return False


def main(conf):
  組 = json.load(io.open(conf, encoding="utf-8"))
  家 = 家ぜんぶ()
  結 = {}
  for k in sorted(組):
    ps = [p for p in 組[k] if os.path.exists(os.path.join(ROOT, p))]
    if not ps: continue
    r = subprocess.run(["python3", os.path.join(ROOT, "tools", "screen_b_compare.py"), k] + ps,
                       capture_output=True, text=True, cwd=ROOT)
    o = r.stdout
    if "★止まりました" in o: continue
    i = o.find("■ ② 見本に あるのに 実装に ない")
    j = o.find("■ ③", i)
    if i < 0: continue
    行 = [x.strip() for x in o[i:j].split("\n")[1:] if x.strip()]
    if not 行: 結[k] = {"㋐": [], "㋑": [], "㋒": [], "㋓": [], "㋔": []}; continue
    分 = {"㋐": [], "㋑": [], "㋒": [], "㋓": [], "㋔": []}
    宣 = まだと書いてあるか(ps)
    for w in 行:
      if 見せかけか(w): 分["㋓"].append(w); continue
      ほか = [p for p, s in 家 if p not in ps and 字だけ(w) in s]
      if ほか: 分["㋐"].append((w, ほか[0])); continue
      # ★★★その 節が「まだ」と 自分で 書いて いる なら、★㋔ に 分けます。
      #   ★★うっかり 作り忘れた のか、★考えて 出して いないのか ── ★ちがいます。
      #   ★★★これは **手がかり** です。★決めでは ありません。
      #     ★1枚ずつ 読む ときの 見る 順を 決める ため の もの です。
      (分["㋔"] if 宣 else 分["㋒"]).append(w)
    結[k] = 分
  # ★出す
  print("A_GROUP_REVIEW  ★くらべた 画面 …… %d" % len(結))
  合 = {"㋐": 0, "㋑": 0, "㋒": 0, "㋓": 0, "㋔": 0}
  for k, v in 結.items():
    for t in 合: 合[t] += len(v[t])
  print("  ㋐ ほかの 画面に ある …… %d" % 合["㋐"])
  print("  ㋒ ★作れるのに 作って いない …… %d" % 合["㋒"])
  print("  ㋓ 見本の 中の 人の 名前 …… %d" % 合["㋓"])
  print("  ㋔ ★まだ と 自分で 書いて ある ところ …… %d" % 合["㋔"])
  print()
  重 = sorted(結.items(), key=lambda x: -len(x[1]["㋒"]))
  print("■ ★㋒（直す もの）が 多い 画面")
  for k, v in 重:
    if not v["㋒"]: continue
    print("  %-20s ㋒%2d ㋔%2d ㋐%2d ㋓%2d"
          % (k[:20], len(v["㋒"]), len(v["㋔"]), len(v["㋐"]), len(v["㋓"])))
  print()
  io.open(os.path.join(ROOT, "/tmp/a_review.json"), "w", encoding="utf-8").write(
    json.dumps(結, ensure_ascii=False, indent=2))
  print("RESULT: OK（★仕分けの 下書き です。★㋒ を 1枚ずつ 読みます）")
  return 0


if __name__ == "__main__":
  if len(sys.argv) < 2: print(__doc__); sys.exit(2)
  sys.exit(main(sys.argv[1]))
