#!/usr/bin/env python3
"""★渡し忘れを 探す（★N-1 の 決まり・2026-09-18）。

  ★★「受け取る と 書いて ある のに、★呼ぶ 側が 渡して いない」── ★きょう 2件 見つかりました。
    ★★`onInvite`（名簿の ＋招く）── ★1度も 出て いません。
    ★★`rename`（役職の 名）── ★サーバに あり、★画面から 呼べません でした。

  ★★★画面は 黙って 死にます。★誤りも 出ません。★見た方は「無い」と 思います。

  ★★較正 ── ★わざと 1件 作って 確かめます。
    ★★`onInvite` が 出なければ、★この 道具は 壊れて います。

  ★使い方  python3 tools/prop_not_passed.py
"""
import io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMP = os.path.join(ROOT, "components")
除きの道 = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prop_not_passed_excluded.json")


def 除くもの():
  """★渡して いない のが 正しい もの を 読みます。

    ★★★3つめの 分け（★2026-09-16 の 覚え）です ──
      ★①足りない（直す）★②余分（わけを 書く）★③**わざと 渡して いない**（除く）
    ★★③を 紙に 残さないと、★毎回 同じ ものが 上がって きます。
      ★★本物の 抜けが、★その 中に 埋もれます。
    ★★★わけ と 引き金 の 両方が 無い 行は 受け取りません。
      ★★引き金の 無い 除きは、★二度と 見直されません。
  """
  if not os.path.exists(除きの道):
    return set()
  d = json.load(io.open(除きの道, encoding="utf-8"))
  out = set()
  for x in d.get("除く", []):
    if not x.get("why") or not x.get("trigger"):
      print("★止まりました ── わけか 引き金の 無い 除きが あります: %s.%s"
            % (x.get("部品"), x.get("prop")))
      sys.exit(1)
    out.add((x["部品"], x["prop"]))
  return out


def 受け取るもの(src):
  """★`export default function Xxx({ a, b, onC })` の 中の 名を 拾います。"""
  m = re.search(r"export default function \w+\(\s*\{([^}]*)\}", src, re.S)
  if not m:
    return []
  out = []
  for part in m.group(1).split(","):
    name = part.split("=")[0].strip()
    if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name or ""):
      out.append(name)
  return out


def 使っているか(src, name):
  """★受け取った だけ で 使って いない もの は、★別の 話 です。★除きます。"""
  本体 = src[src.find("{", src.find("export default function")):]
  return len(re.findall(r"\b%s\b" % re.escape(name), 本体)) > 1


def 渡す側(全部, 部品名, prop):
  """★`<部品名 …>` を 描く 紙の 中に、★`prop=` が ある か。

    ★★★はじめ、★札の 開きから 閉じ まで を 切り出して 見て いました。
      ★★閉じを `>` で 探して いました。★`=>`（矢印）の `>` に 当たります。
      ★★だから 途中で 切れ、★29件 出ました。★本当は もっと 少ない はず です。
      ★★★出しすぎる 道具は、★出さない 道具と 同じくらい 使えません。
        ★★29件 のうち どれが 本物か、★読む 方が 選ぶ ことに なります。
    ★★★紙ぜんぶ を 見ます。★粗い ですが、★嘘を 言いません。
      ★★同じ 名の 渡しが 別の 部品に ある 紙では、★見落とします。
      ★★★見落とす ほうを 選びます。★出しすぎるより 害が 小さい です。
        ★★（★見落としは、★べつの 道 ── 実機と 見本 ── でも 見つかります）
  """
  for 道, src in 全部.items():
    if not re.search(r"<%s\b" % re.escape(部品名), src):
      continue
    if re.search(r"\b%s\s*=" % re.escape(prop), src):
      return True
  return False


def 呼ばれているか(全部, 部品名):
  return any(re.search(r"<%s\b" % re.escape(部品名), s) for s in 全部.values())


if __name__ == "__main__":
  全部 = {}
  for 名 in sorted(os.listdir(COMP)):
    if not 名.endswith(".jsx"):
      continue
    全部[名] = io.open(os.path.join(COMP, 名), encoding="utf-8").read()

  # ★★★較正 ── ★わざと 1件 作って 確かめます（★2026-09-18・2度目の 直し）。
  #
  #   ★★はじめ、★`OpsRoster` の `onInvite` が 出る ことを 較正に して いました。
  #   ★★★直した その日に、★較正が 落ちました。
  #     ★★本物の 欠けを 目印に すると、★直した 日に 道具が 止まります。
  #     ★★（★2026-09-16 の 覚え ── ★見張りは 覚えず、★その場で 測る）
  #   ★★★だから、★**ここで 作った にせもの** で 測ります。
  #     ★★蔵の 中の どれが 直っても、★較正は 生きて います。
  にせ = {
    "ニセ部品.jsx": "export default function ニセ部品({ onナントカ }) {\n"
                   "  return onナントカ ? 1 : null;\n}\n",
    "ニセ呼び.jsx": "<ニセ部品 これは={1} />\n"
  }
  if 渡す側(にせ, "ニセ部品", "onナントカ"):
    print("★★較正に 失敗しました ── 渡して いないのに『渡して いる』と 出ます。")
    sys.exit(1)
  にせ2 = dict(にせ)
  にせ2["ニセ呼び.jsx"] = "<ニセ部品 onナントカ={()=>1} />\n"
  if not 渡す側(にせ2, "ニセ部品", "onナントカ"):
    print("★★較正に 失敗しました ── 渡して いるのに『渡して いない』と 出ます。")
    sys.exit(1)

  除く = 除くもの()
  見つかった = []
  除いた = []
  for 名, src in 全部.items():
    部品 = 名[:-4]
    if not 呼ばれているか(全部, 部品):
      continue
    for prop in 受け取るもの(src):
      if not prop.startswith("on"):
        continue
      if not 使っているか(src, prop):
        continue
      if not 渡す側(全部, 部品, prop):
        if (部品, prop) in 除く:
          除いた.append((部品, prop))
        else:
          見つかった.append((部品, prop))

  print("★渡して いない もの ── %d件" % len(見つかった))
  for 部品, prop in 見つかった:
    print("  %s … %s" % (部品, prop))
  print("")
  # ★★★除いた ものも 数えて 出します。★黙って 引かない ため です。
  #   ★★「0件でした」と だけ 出すと、★何を 見て いないかが 消えます。
  print("★わざと 渡して いない もの ── %d件" % len(除いた))
  for 部品, prop in 除いた:
    print("  %s … %s" % (部品, prop))
  # ★★★除きが、★もう 直って いないか。
  #   ★★直った のに 除きに 残ると、★次に 見る 方が 迷います。
  戻った = [(部品, prop) for (部品, prop) in 除く if 渡す側(全部, 部品, prop)]
  if 戻った:
    print("")
    print("★★除きに ある のに、★いまは 渡されて います ── 紙から 外して ください:")
    for 部品, prop in 戻った:
      print("  %s … %s" % (部品, prop))

  print("")
  print("★較正 ── ok（にせの 1件で、★出る ／ 出ない の 両方を 確かめました）")
