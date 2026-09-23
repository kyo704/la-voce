#!/usr/bin/env python3
"""★段3a B群 ── ★見本の 画面と 実装を 1枚ずつ くらべる（2026-09-23）

  ★出どころ  実行ルート 第13版 §1「★B あとで比べる 92画面」
    「★機能ごとに、その実装が終わった直後に比べる（まとめて最後にやらない）」

  ★くらべるのは **字**（見える 言葉）です。★見た目では ありません。
    ★★見た目は 私には 見えません。★坂本さんに 見て いただきます。

  ★4つに 分けます（★2つでは ありません）──
    ① 見本に あり、実装にも ある
    ② 見本に あるのに、実装に ない          ← ★直す ところ
    ③ 見本に あるが、★わざと 作って いない  ← ★わけを 書いて 残す
       （tools/excluded_by_design.json）
    ④ ★見本の 見せかけの データ（★台帳から 出る 字）  ← ★直す ところでは ない
       ★見本は 作品名も 役の 数も **手で 書いて** います。★実装は 台帳から 引きます。
       ★★だから 字が 合わないのは 当たり前 です。★けれど **隠しません** ──
         ★全部 並べます。★中に 本物の 抜けが 混ざって いたら、★読む人が 気づける ように。

  ★目盛り合わせ …… ★見本の 字を 1つ わざと 変えて、★②に 出る ことを 毎回 見ます。

使い方: python3 tools/screen_b_compare.py <見本の SC の 鍵> <実装の ファイル> [...]
  れい: python3 tools/screen_b_compare.py 作品をさがす components/WorksSearch.jsx lib/worksSearch.js
"""
import asyncio, json, os, re, sys, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "docs", "design", "pack-final")
除外 = os.path.join(ROOT, "tools", "excluded_by_design.json")
MIHON = [
  "00-動く見本-PC・iPad（運営）.html",
  "00-動く見本-iPhoneで開く用.html",
  "00-動く見本（さわれる・全画面）.html",
  "00-動く見本-PC・iPad（個人）.html",
]

JS = """(k) => {
  if (!SC[k]) return null;
  let html = '';
  try { html = String(SC[k](0) ?? ''); } catch (e) { return null; }
  // ★属性の 中の 字（placeholder・value）も 見える 字 です
  const ph = [...html.matchAll(/placeholder="([^"]*)"/g)].map(m => m[1]);
  const body = html.replace(/<[^>]*>/g, '\\u0001');
  return { text: body.split('\\u0001'), ph };
}"""


def 字だけ(s):
  """★くらべる ための 形に します。

     ★★空白を 落とし、★飾りの 記号も 落とします（★‹ › ＋ · … など）。
     ★★★見本は「‹ 公演を作る」、★実装は `‹ {tx("公演を作る")}`。
       ★飾りを 残すと、★中身が 同じでも「無い」と 出ます（★2026-09-23 に 出ました）。
     ★★落としすぎない ように、★かなと 漢字と 数字と 英字は 残します。
       ★（★目盛り合わせ …… ★在りえない 字は いまも ②に 出ます）
  """
  return re.sub(r"[^0-9０-９A-Za-zぁ-んァ-ヶ一-龠々ー「」（）]", "", s or "")


async def 見本の字(key):
  from playwright.async_api import async_playwright
  async with async_playwright() as p:
    b = await p.chromium.launch(); pg = await b.new_page()
    for f in MIHON:
      path = os.path.join(PACK, f)
      if not os.path.exists(path): continue
      await pg.goto("file://" + urllib.parse.quote(os.path.abspath(path)))
      await pg.wait_for_function("typeof SC==='object'")
      await pg.wait_for_timeout(300)
      d = await pg.evaluate(JS, key)
      if d:
        await b.close()
        return d, f
    await b.close()
  return None, None


def 実装の字(paths):
  出 = []
  for p in paths:
    fp = os.path.join(ROOT, p)
    if not os.path.exists(fp):
      print("★止まりました ── ありません:", p); sys.exit(2)
    s = open(fp, encoding="utf-8").read()
    # ★註を 外します。★註に 書いて あるのは「出して いる」ことに なりません
    s = re.sub(r"/\*[\s\S]*?\*/", " ", s)
    s = re.sub(r"^\s*//.*$", " ", s, flags=re.M)
    出.append(s)
  return "\n".join(出)


def 読む除外():
  if not os.path.exists(除外): return {}
  try: return json.load(open(除外, encoding="utf-8"))
  except Exception: return {}


def 見本の中身(key):
  """★見本の 中の「手で 書いた 中身」を 取り出します。

     ★★見分け方 ── ★見本の その 画面の もと（関数の 中）を 読み、
       ★`var X=[{...},{...}]` の 形（★中身の 並び）の **中に ある 字** を 中身と します。
       ★★UI の 言葉（★「8人まで」）は その 外に 書いて あります。

     ★★★はじめは「数字が あれば 中身」と して いました。★まちがいでした ──
       ★「4人まで」「8人まで」も 数字を 持ちます。★消しても ②に 出ませんでした
       （★2026-09-23、★目盛り合わせで 気づきました）。
  """
  for f in MIHON:
    path = os.path.join(PACK, f)
    if not os.path.exists(path): continue
    s = open(path, encoding="utf-8").read()
    # ★★★見本は 2つの 書き方を します ──
    #   ① `SC['作品をさがす']=function(){…}`（★その場に 書く）
    #   ② `SC['配役を決める']=P_haiyaku`     （★別の ところの 関数を 指す）
    #   ★★②の とき、★指した 先を 読まないと **本文が 空** に なります。
    #     ★★そうすると「見本の もとに 無い」＝ ④中身 と 数えて しまい、
    #       ★本物の 抜けが 見えなく なります（★2026-09-23、★目盛りが 合いませんでした）。
    場 = []
    m2 = re.search(r"SC\['" + re.escape(key) + r"'\]\s*=\s*(\w+)", s)
    if m2 and m2.group(1) != "function":
      j2 = s.find("function %s(" % m2.group(1))
      if j2 >= 0: 場.append(j2)
    場 += [s.find("SC['%s']=function" % key), s.find("SC['%s']=" % key)]
    for i in 場:
      if i is None or i < 0: continue
      j = s.find("\nfunction ", i + 5)
      j2 = s.find("\nSC[", i + 5)
      if j < 0 or (0 < j2 < j): j = j2
      if j < 0: j = min(len(s), i + 20000)
      本 = s[i:j]
      中 = set()
      # ★`var なにか=[ { … } ]` の 中の 字
      for m in re.finditer(r"var\s+\w+\s*=\s*\[[\s\S]{0,12000}?\]\s*;", 本):
        blk = m.group(0)
        # ★★`[{…},{…}]` だけで なく、★`[['4月','先生 6',…],[…]]` の 形も 中身 です。
        #   ★見本は 表の 中身を 手で 並べて います。★実装は 台帳から 引きます。
        if "{" not in blk and "[" not in blk[blk.index("[") + 1:]: continue
        for mm in re.finditer(r"'([^']{2,})'", blk):
          中.add(字だけ(mm.group(1)))
      # ★★`<textarea>…</textarea>` の 中の 字は、★その方が 書いた もの です。
      #   ★見本は 例として 1文 入れて います。★実装は 台帳から 読みます。
      for m in re.finditer(r"<textarea[^>]*>([^<]{2,})</textarea>", 本):
        中.add(字だけ(m.group(1)))
      # ★★その場に 書いた 並びも 中身 です ── ★`['井上 かなで','村上 ひかる',…].map(`
      #   ★見本は 人の 名前を 手で 書いて います。★実装は 招いた 方から 引きます。
      for m in re.finditer(r"\[((?:'[^']*'\s*,\s*){2,}'[^']*')\]\s*\.map", 本):
        for mm in re.finditer(r"'([^']{2,})'", m.group(1)):
          中.add(字だけ(mm.group(1)))
      return 中, 本
  return set(), ""


def 数だけちがう(w, 実字):
  """★数 を 外すと、★残りが ぜんぶ 実装に ある か。

     ★★見本「審査員4人」── ★実装は `審査員{judges}人`。
       ★数が ちがう だけ で、★言葉は そろって います。★これは 中身 です。
     ★★見本「2人で 回します」── ★実装は `{n}人で 回します`。★同じ 形 です。
     ★★★「小ホール」の ような **数を 含まない** 名前は ここに 落ちません。
       ★数が 無ければ この 道は 通りません。★②の まま です。
  """
  if not re.search(r"[0-9０-９]", w): return False
  片 = [x for x in re.split(r"[0-9０-９]+", w) if 字だけ(x)]
  if not 片: return False
  return all(字だけ(x) in 実字 for x in 片)


def 中身か(w, 中, 本):
  """★その 字は「手で 書いた 中身」から 出て いるか。

     ★★① 中身の 並びの 中に そのまま ある（★モーツァルト「フィガロの結婚」）
     ★★② 見本の もとに **そのままの 形では 無い**（★`w.r+'役 ／ '` の ように 組み立てて いる）
       ★★★UI の 言葉は 見本の もとに そのまま 書いて あります。★そこが 分かれ目 です。
  """
  k = 字だけ(w)
  if k in 中: return True
  return k not in 字だけ(本)


def くらべる(見, 実, key, 中身, 本文):
  ex = 読む除外().get(key, {})
  # ★★★組み立てた 1行は、★区切りで 割ってからも 見ます。
  #   ★見本 …「オペラ・ミュージカル・演劇　181の 作品から　／　種類を 変えるときは ひとつ 戻ってください」
  #   ★★この 1行 ぜんたいは ④（中身）です。★けれど 後ろ半分は **UI の 言葉** です。
  #     ★割らないと、★その 言葉を 消しても 気づけません（★2026-09-23 の 目盛り合わせで 出ました）。
  素 = []
  for t in list(見["text"]) + list(見["ph"]):
    素.append(t)
    for 片 in re.split(r"[／|]|　{2,}", t):
      if 片.strip() and 片.strip() != t.strip(): 素.append(片)

  語 = []
  for t in 素:
    w = t.strip()
    if len(字だけ(w)) < 4: continue          # ★短すぎる 字は 数えません
    if not re.search(r"[ぁ-んァ-ヶ一-龠]", w): continue
    # ★★★見本の もとの かけら が 混ざる ことが あります。
    #   ★`askShow('…<br>…',false,function(){…})` の ように、★字の 中に `<br>` が あると、
    #     ★札を 外す ところで 切れて、★後ろの JavaScript が くっついて 出ます。
    #   ★★それは「見える 字」では ありません。★落とします。
    if re.search(r"(?:function\s*\(|curP\(\)|\bdraw\(\)|',\s*(?:true|false)\b|\}\)\s*\")", w): continue
    if w not in 語: 語.append(w)
  在, 無, 除, 데 = [], [], [], []
  実字 = 字だけ(実)
  for w in 語:
    if 字だけ(w) in 実字: 在.append(w)
    # ★★全角の あきで つないだ 字は、★実装では 分かれて います
    #   （★見本「役　パミーナ」＝ 実装 `tx("役") + "　" + tx("パミーナ")`）。
    #   ★★片方でも 欠けたら ②に 出ます。★そろって いれば ①です。
    elif "　" in w and all(字だけ(x) in 実字 for x in w.split("　") if 字だけ(x)):
      在.append(w)
    elif w in ex or 字だけ(w) in [字だけ(x) for x in ex]: 除.append((w, ex.get(w, "")))
    elif 数だけちがう(w, 実字): 데.append(w)
    elif 中身か(w, 中身, 本文): 데.append(w)
    else: 無.append(w)
  return 語, 在, 無, 除, 데


def main(key, paths):
  見, もと = asyncio.run(見本の字(key))
  if not 見:
    print("★止まりました ── 見本に SC['%s'] が ありません" % key); return 2
  実 = 実装の字(paths)

  中身, 本文 = 見本の中身(key)

  # ★★★目盛り合わせ ── ★**本物の 言葉を 1つ 実装から 消して**、★②に 出る ことを 見ます。
  #   ★在りえない 字で 試すのは 足りません ── ★それは 見本にも 無いので ④に 落ちます
  #     （★2026-09-23、★その 形で 目盛りが 合いませんでした）。
  #   ★★ここは **通る はずの 道** を 通して 確かめます。
  語0, 在0, _, _, _ = くらべる(見, 実, key, 中身, 本文)
  if not 在0:
    print("★止まりました ── くらべる 字が 1つも ありません"); return 2
  # ★★いちばん 長い 言葉で 試します。★短い 字は ほかの 言葉の 中に 紛れ込みます。
  #   ★★くらべるのは `字だけ()` に した 形 なので、★そちらから 消します
  #     （★実装では `‹ {tx("公演を作る")}` の ように 割れて いる ことが あります）。
  試 = sorted(在0, key=lambda x: -len(字だけ(x)))[0]
  実偽 = 字だけ(実).replace(字だけ(試), "")
  _, _, 無偽, _, _ = くらべる(見, 実偽, key, 中身, 本文)
  if 試 not in 無偽:
    print("★止まりました ── 目盛りが 合いません（「%s」を 消しても ②に 出ない）" % 試[:20])
    return 2

  語, 在, 無, 除, 데 = くらべる(見, 実, key, 中身, 本文)
  print("SCREEN_B_COMPARE  SC[%s]" % key)
  print("  見本 …… %s" % もと)
  print("  実装 …… %s" % "・".join(paths))
  print("  目盛り合わせ …… ○（「%s」を 消すと ②に 出る）" % 試[:16])
  print("  見える 字 …… %d ／ ①ある %d ／ ②ない %d ／ ③わざと %d ／ ④中身 %d"
        % (len(語), len(在), len(無), len(除), len(데)))
  print()
  print("■ ② 見本に あるのに 実装に ない（%d）" % len(無))
  for w in 無: print("   ", w[:70])
  print()
  print("■ ③ わざと 作って いない（%d）" % len(除))
  for w, r in 除: print("   ", w[:40], "──", r)
  print()
  print("■ ④ 見本の 見せかけの データ（★台帳から 出ます・%d）" % len(데))
  for w in 데: print("   ", w[:70])
  print()
  print("RESULT:", "OK" if not 無 else "DIFF（%d件）" % len(無))
  return 0 if not 無 else 1


if __name__ == "__main__":
  if len(sys.argv) < 3: print(__doc__); sys.exit(2)
  sys.exit(main(sys.argv[1], sys.argv[2:]))
