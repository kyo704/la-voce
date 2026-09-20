#!/usr/bin/env python3
# ★空の とき、★入口まで 消して いないか（★裁定 その120・2026-09-21）。
#
#   ★★★連絡で 起きた こと ──
#     ★★お知らせ 0件 かつ 門下 0件 の とき、★一覧を 丸ごと 出して いません でした。
#     ★★その 一覧の 中に「＋ おしらせを 書く」が ありました。
#     ★★★最初の 1件を 書き始める 口が ありません。★機能が 無いのと 同じ です。
#
#   ★★★見つけ方 ── ★「空か どうか」で 分ける ところ を 探し、
#     ★★**出さない 側** に 入口（押して 何かを 始める 札）が 無いかを 見ます。
#
#   ★★入口と 見なす 字 ── ★＋ ／ 出す ／ 書く ／ 足す ／ 招く ／ 作る ／ 決める。
#     ★★「開く」「見る」「とじる」は 入口では ありません。★在る ものを 見る 札 です。
#
#   ★★較正 ── ★直す 前の `Renraku.jsx` で 当たり、★直した 後で 外れる こと。
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ★「空か どうか」を 言う 字。
KARA = re.compile(r"(空っぽ|isEmpty\w*|\w+\.length\s*===\s*0|\w+\.length\s*<\s*1|"
                  r"!\s*\w+\.length|\(\s*\w+\s*\|\|\s*\[\]\s*\)\.length\s*===\s*0)")
# ★入口の 字（★押して 何かを **始める** もの）。
# ★★★`{tx("門下に 招く")}` の 形も 拾います（★2026-09-21 に 直しました）。
#   ★★はじめ、★`<` `>` `{` を 除く 字 だけ を 見て いました。
#   ★★門下の 入口は `>＋ {tx("門下に 招く")}</button>` です。★拾えて いません でした。
#   ★★「札が 0件」と 出て いたのは、★札が 無い からでは ありません。
IRIGUCHI = re.compile(r">[^<]{0,20}(?:＋|\+)[^<]{0,30}<|"
                      r">[^<]{0,40}(?:出す|書く|足す|招く|作る|決める)[^<]{0,10}<")
FUDA = re.compile(r"<button\b|role=\"button\"")

def 説明をのぞく(s):
  出, 位 = [], []
  i, n = 0, len(s)
  while i < n:
    if s.startswith("/*", i):
      j = s.find("*/", i + 2)
      i = n if j < 0 else j + 2
      continue
    if s.startswith("//", i):
      j = s.find("\n", i)
      i = n if j < 0 else j
      continue
    出.append(s[i]); 位.append(i); i += 1
  return "".join(出), 位

def 消える側(き, at):
  """★三項の `? … : …` の うち、★空の とき **出ない** ほうを 取ります。"""
  q = き.find("?", at)
  if q < 0 or q - at > 160:
    return None
  # ★`空 ? A : B` …… ★空の とき A。★出ないのは B。
  # ★`空 ? null : B` …… ★空の とき null。★出ないのは B。★ここが 危ない。
  ふかさ, k, ころん = 0, q + 1, -1
  while k < len(き):
    c = き[k]
    if c in "({[":
      ふかさ += 1
    elif c in ")}]":
      if ふかさ == 0:
        break
      ふかさ -= 1
    elif c == ":" and ふかさ == 0:
      ころん = k
      break
    k += 1
  if ころん < 0:
    return None
  あたま = き[q + 1:ころん].strip()
  # ★空の とき 何も 出さない（null ／ 空文字）とき だけ、★もう 片方を 見ます。
  if あたま not in ("null", "''", '""', "undefined"):
    return None
  ふかさ, k = 0, ころん + 1
  while k < len(き):
    c = き[k]
    if c in "({[":
      ふかさ += 1
    elif c in ")}]":
      if ふかさ == 0:
        break
      ふかさ -= 1
    k += 1
  return き[ころん + 1:k]

NA = re.compile(r"\{\s*([A-Za-z_\u3040-\u30ff\u4e00-\u9fff][\w\u3040-\u30ff\u4e00-\u9fff]*)\s*\}")

def 名を開く(き, なか, ふかさ=0):
  """★`{list}` の ような 名を、★その 中身に 置き換えます（★2段 まで）。

  ★★★連絡の 一件で 判りました ── ★消える 側に 在ったのは `{list}` の 1語 でした。
    ★★札は その 名の 先に あります。★字だけ 見ても 見つかりません。
  """
  if ふかさ > 1:
    return なか
  for m in NA.finditer(なか):
    名 = m.group(1)
    i = き.find("const " + 名 + " = (")
    if i < 0:
      i = き.find("const " + 名 + " =(")
    if i < 0:
      continue
    j = き.index("(", i + 6)
    d, k = 0, j
    while k < len(き):
      if き[k] == "(":
        d += 1
      elif き[k] == ")":
        d -= 1
        if d == 0:
          break
      k += 1
    なか = なか.replace(m.group(0), 名を開く(き, き[j:k], ふかさ + 1))
  return なか

def 見る(そーす):
  き, 位 = 説明をのぞく(そーす)
  出 = []
  for m in KARA.finditer(き):
    なか = 消える側(き, m.end())
    if not なか or len(なか) > 6000:
      continue
    なか = 名を開く(き, なか)
    if FUDA.search(なか) and IRIGUCHI.search(なか):
      入 = IRIGUCHI.search(なか).group(0)
      出.append((位[m.start()], m.group(1), re.sub(r"[<>]", "", 入).strip()))
  return 出

def calib():
  前 = subprocess.run(["git", "show", "HEAD:components/Renraku.jsx"],
                      cwd=ROOT, capture_output=True, text=True).stdout
  後 = (ROOT / "components/Renraku.jsx").read_text(encoding="utf-8")
  return len(見る(前)) >= 1 and len(見る(後)) == 0

def main():
  if not calib():
    前 = subprocess.run(["git", "show", "HEAD:components/Renraku.jsx"],
                        cwd=ROOT, capture_output=True, text=True).stdout
    後 = (ROOT / "components/Renraku.jsx").read_text(encoding="utf-8")
    print(f"★止まりました ── ★較正に 落ちました（前 {len(見る(前))}件 ／ 後 {len(見る(後))}件）")
    raise SystemExit(1)
  出 = []
  for p in sorted((ROOT / "components").rglob("*.jsx")):
    if "tests" in p.parts:
      continue
    s = p.read_text(encoding="utf-8", errors="replace")
    for もと, 何, 入 in 見る(s):
      出.append((p.name, s.count("\n", 0, もと) + 1, 何, 入))
  print(f"★空の とき 入口まで 消して いる ところ {len(出)}件")
  for x in 出:
    print(f"  {x[0]}:{x[1]}  空の見方={x[2]}  入口={x[3]}")

if __name__ == "__main__":
  main()

# ---------------------------------------------------------------------------
# ★裁定 その120 SCOPE_IN 2 ── ★名ざしの 5画面を、★1枚ずつ 確かめます。
#   ★★0件の 報せが 出る ところ と、★入口の 札 が **別の 段** に 在るか を 見ます。
GOMAI = [
  ("行事", "components/OpsEvents.jsx"),
  ("名簿", "components/OpsRoster.jsx"),
  ("門下", "components/OpsMonka.jsx"),
  ("レパートリー", "components/NotesV2.jsx"),
  # ★★★「さがす」は 2つ あります（★2026-09-21 に 判りました）。
  #   ★★① 運営の コマンドパレット（⌘K）…… `components/OpsSearch.jsx`。
  #     ★★入口の 札は ありません。★打ち込む 欄 だけ です。★空の 報せも ありません。
  #   ★★② マッチングの「さがす」…… ★**まだ ありません**（★裁定 その94〜96）。
  #     ★★見本は `SC['伴奏をさがす']`。★実装は これから です。
  ("さがす（⌘K）", "components/OpsSearch.jsx"),
]

def 五枚():
  print("\n★名ざしの 5画面（★裁定 その120）")
  for 名, み in GOMAI:
    p = ROOT / み
    if not p.exists():
      print(f"  {名} …… ★止まりました。★{み} が ありません")
      raise SystemExit(1)
    s = p.read_text(encoding="utf-8", errors="replace")
    き, _ = 説明をのぞく(s)
    あたり = 見る(s)
    # ★★字の ままの 報せ と、★名で 置いて ある 報せ（`EMPTY_HEAD` など）の 両方。
    空 = re.findall(r"(?:まだ|1件も|ひとつも)[^<>\"']{0,24}(?:ありません|いません)", き)
    空 += re.findall(r"\{(EMPTY_\w+|\w*EMPTY\w*)\}", き)
    入 = [re.sub(r"[<>]", "", x).strip() for x in IRIGUCHI.findall(き)] \
      if IRIGUCHI.findall(き) else []
    入2 = [re.sub(r"[<>]", "", m.group(0)).strip() for m in IRIGUCHI.finditer(き)]
    print(f"  {名}（{み}）")
    print(f"    ★空の 報せ …… {len(空)}件 {('／ '.join(空[:3])) if 空 else '（ありません）'}")
    print(f"    ★入口の 札 …… {len(入2)}件 {('／ '.join(入2[:4])) if 入2 else '（ありません）'}")
    print(f"    ★空で 消える 入口 …… {len(あたり)}件"
          + ("" if not あたり else "  " + "／".join(f"{x[1]}行 {x[3]}" for x in あたり)))

if __name__ == "__main__":
  五枚()
