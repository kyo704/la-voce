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
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMP = os.path.join(ROOT, "components")


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

  # ★★較正 ── ★わざと 1件 該当する ものが あるか。
  #   ★★`OpsRoster` の `onInvite` は、★2026-09-18 の 時点で 渡されて いません。
  #   ★★これが 出なければ、★道具が 壊れて います。
  較正 = None

  見つかった = []
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
        見つかった.append((部品, prop))
        if 部品 == "OpsRoster" and prop == "onInvite":
          較正 = True

  print("★渡して いない もの ── %d件" % len(見つかった))
  for 部品, prop in 見つかった:
    print("  %s … %s" % (部品, prop))
  print("")
  if 較正:
    print("★較正 ── ok（OpsRoster の onInvite を 見つけました）")
  else:
    print("★★較正に 失敗しました。★道具の ほうを 疑って ください。")
    print("　★`OpsRoster` の `onInvite` は、★渡されて いない はず です。")
    sys.exit(1)
