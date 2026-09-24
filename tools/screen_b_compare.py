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

# ★★★2026-09-24 ── ★2つを 分けました。
#   ★前は「無い」も「呼んだら 落ちた」も、★同じ null を 返して いました。
#     ★★道具は どちらも「見本に ありません」と 出して いました。
#     ★★★「無い」と「聞けて いない」を 同じ 顔に しない ── ★この 蔵の 決め です。
#   ★★あわせて、★渡す ものを 4つ 試します。
#     ★見本の 画面は、★番号・鍵の 字・何も 無し・かたまり の どれかを 受け取ります。
#       `SC['授業を入れる'](key)` …… ★'0-0' の ような 鍵の 字
#       `SC['稽古'](i)`          …… ★番号
#     ★★1つ しか 試さない と、★出来て いる 画面が「無い」に 見えます。
JS = """(k) => {
  if (typeof SC[k] !== 'function') return { missing: true };
  // ★★★番号を 1つ しか 試さない と、★前を 振り返る 画面が 落ちます。
  //   ★`SC['前3日'](i)` は `DAY[i-1]`〜`DAY[i-3]` を 読みます。★0 では 落ちます。
  //   ★★小さい 順に しません ── ★真ん中あたりの 番号から 試します。
  const 試し = [3, 5, 1, 0, '0-0', undefined, {}];
  let 最後 = '';
  for (const a of 試し) {
    let html = '';
    try { html = String(SC[k](a) ?? ''); } catch (e) { 最後 = String(e && e.message || e); continue; }
    if (!html) continue;
    const ph = [...html.matchAll(/placeholder="([^"]*)"/g)].map(m => m[1]);
    const body = html.replace(/<[^>]*>/g, '\\u0001');
    return { text: body.split('\\u0001'), ph, arg: String(a) };
  }
  return { threw: 最後 || '（何も 返りません）' };
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
    落ち = {}
    for f in MIHON:
      path = os.path.join(PACK, f)
      if not os.path.exists(path): continue
      await pg.goto("file://" + urllib.parse.quote(os.path.abspath(path)))
      await pg.wait_for_function("typeof SC==='object'")
      await pg.wait_for_timeout(300)
      d = await pg.evaluate(JS, key)
      if d and d.get("text"):
        await b.close()
        return d, f
      if d and d.get("threw"):
        # ★★在るのに 呼べません。★黙って 次の 紙へ 行きません。
        落ち[f] = d["threw"]
    await b.close()
  return (({"threw": 落ち} if 落ち else None), None)


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
  """★『わざと ちがえて いる』の 台帳を 読みます。

     ★★★2026-09-24 ── ★形が **2つ** ある ことに 気づきました。
       ★★古い 形 …… [{"text": …, "why": …, "trigger": …}, …]（★2026-09-16 の もの）
       ★★新しい 形 … {"その 字": "わけ", …}
     ★★★古い 形の 画面は、★くらべる たびに **落ちて** いました。
       ★★`TypeError` です。★止まるので 気づける はず でした ──
         ★けれど まとめて 回すと、★その 1枚だけ 静かに 消えて いました。
       ★★★4枚が、★一度も くらべられて いません でした ──
         ★台帳／書き出す／退会／通っているところ。
       ★★どちらも 読みます。★古い 形を 書き直しません ──
         ★あちらには `why_long`・`ruling`・`do_not` が 入って います。
         ★★字を 減らす 直し方を しません。
  """
  if not os.path.exists(除外): return {}
  try: 生 = json.load(open(除外, encoding="utf-8"))
  except Exception: return {}
  出 = {}
  for k, v in (生 or {}).items():
    if k == "_": continue
    if isinstance(v, dict):
      出[k] = {str(a): str(b) for a, b in v.items()}
    elif isinstance(v, list):
      表 = {}
      for x in v:
        if isinstance(x, dict) and x.get("text"):
          表[str(x["text"])] = str(x.get("why") or x.get("why_long") or "")
        elif isinstance(x, str):
          表[x] = ""
      出[k] = 表
  return 出


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


def 見せかけか(w):
  """★見本が 手で 書いた 中身か（★人の 名前・学年・値段・日・回数）。

     ★★★2026-09-24、★ここに 移しました。
       ★`tools/a_group_review.py` が 同じ 見分けを **もう 1つ** 持って いました。
       ★★同じ 決めが 2か所に ある ── ★この 家の くり返す 不具合 です。
       ★★★くらべる ことを 決めるのは この 紙 です。★あちらは ここに 尋ねます。
  """
  t = (w or "").strip()
  # ★★人の 名 ── ★2語、★あいだに 空き。
  #   ★★★1語目が 助詞で 終わる ものを 外します（★2026-09-24）。
  #     ★★それまで「先生との やりとり」を **人の 名** と 見て いました。
  #     ★★★見せかけと 見なすと、★その 字が 消えても 気づけません。
  #       ★★見のがす 方が まし です ── ★こちらは 手で 読むだけ です。
  if re.fullmatch(r"[一-龠ぁ-んァ-ヶ]{1,4}[ 　][一-龠ぁ-んァ-ヶー]{1,5}", t) \
     and not re.search(r"[のとにはがをへでもやからばど]$", t.split()[0] if t.split() else t):
    return True
  # ★★人の 名に 敬称・役が 付いた 1行（★「高橋 のぞみ 先生の 門下に 入ろうと しています。」）。
  #   ★★★頭に ある ときだけ 見ます。★画面の 言葉が 人の 名で 始まる ことは ありません。
  #   ★★2026-09-24 に 足しました ── ★それまで 名の 部分だけ の 1行しか 見て いません でした。
  if re.match(r"^[一-龠ぁ-んァ-ヶ]{1,4}[ 　][一-龠ぁ-んァ-ヶー]{1,5}[ 　]*(先生|さん)", t): return True
  if re.search(r"[○□△●]{2}", t): return True
  if re.fullmatch(r"[\d０-９]{1,2}年[ 　][一-龠ぁ-んァ-ヶー]{1,6}", t): return True
  if re.fullmatch(r"[\d,０-９]+\s*(円（税込）|円|回目|件|人|日|分)\s*", t): return True
  if re.fullmatch(r"\d{4}年\d{1,2}月\d{1,2}日", t): return True
  if re.fullmatch(r"\d{1,2}月\d{1,2}日（[月火水木金土日]）", t): return True
  return False


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
    elif 見せかけか(w): 데.append(w)
    elif 数だけちがう(w, 実字): 데.append(w)
    elif 中身か(w, 中身, 本文): 데.append(w)
    else: 無.append(w)
  return 語, 在, 無, 除, 데


def main(key, paths):
  見, もと = asyncio.run(見本の字(key))
  if 見 and 見.get("threw"):
    # ★★★「無い」では ありません。★在るのに 呼べません。★別の 字で 言います。
    print("★止まりました ── 見本の SC['%s'] を 呼べません" % key)
    for f, e in 見["threw"].items(): print("    %s …… %s" % (f, e))
    print("★★『無い』では ありません。★渡す ものを 増やすか、見本を 直します。")
    return 2
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
  # ★★いちばん 長い 言葉で 試します。★短い 字は ほかの 言葉の 中に 紛れ込みます。
  #   ★★★ただし、★消しても **ほかの 言葉の 一部として 残る** ことが あります
  #     （★「先生が レッスンを 1件 打刻する」は `ONBOARD_WORDS` の 中に 1度、
  #       ★でも 見本の 側で 2度 出て きます）。
  #     ★★★消して なお 残る ものは 目盛りに なりません。★次に 長い ものを 試します。
  #   ★★★中身（④）に 落ちる 字も 目盛りに なりません ── ★消しても ②に 来ません。
  #     ★見本が 自分の 並びの 中に 持って いる 字 です（★「先生が レッスンを 1件 打刻する」）。
  試 = None
  for 候 in sorted(在0, key=lambda x: -len(字だけ(x))):
    実偽 = 字だけ(実).replace(字だけ(候), "")
    if 字だけ(候) in 実偽: continue
    if 中身か(候, 中身, 本文): continue
    if 数だけちがう(候, 実偽): continue
    試 = 候
    break
  if 試 is None:
    print("★止まりました ── 目盛りに 使える 字が ありません"); return 2
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


def 対応表():
  """★`tools/screen_impl.json`。★`at_risk_screens.py` と 同じ 紙 です。"""
  p = os.path.join(ROOT, "tools", "screen_impl.json")
  if not os.path.exists(p): return {}
  try: d = json.load(open(p, encoding="utf-8"))
  except Exception: return {}
  return {k: v for k, v in d.items() if not k.startswith("_")}


def ぜんぶ():
  """★対応表の 画面を ぜんぶ くらべます。★1つでも ②が あれば 1 で 終わります。"""
  表 = 対応表()
  if not 表:
    print("★止まりました ── 対応表が 読めません"); return 2
  悪 = []
  for k, paths in 表.items():
    有 = [p for p in paths if os.path.exists(os.path.join(ROOT, p))]
    if not 有:
      print("  ★紙が ない  ", k); 悪.append(k); continue
    r = main(k, 有)
    if r != 0: 悪.append(k)
    print()
  print("SCREEN_B_ALL", len(表), "画面 ／ ★差の ある もの", len(悪))
  for k in 悪: print("   ", k)
  print("RESULT:", "OK" if not 悪 else "DIFF（%d画面）" % len(悪))
  return 0 if not 悪 else 1


if __name__ == "__main__":
  if "--all" in sys.argv: sys.exit(ぜんぶ())
  if len(sys.argv) < 3: print(__doc__); sys.exit(2)
  sys.exit(main(sys.argv[1], sys.argv[2:]))
