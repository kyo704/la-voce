#!/usr/bin/env python3
"""★部品の 体の 中で、★後ろの 名を 読む 関数を その場で 呼んで いないか（★2026-09-26）。

  ★★★2度 本番を 止めました ──
    ★1度目 `const 束の行き先 = { … 運営できる教室 … }`（★物の 形）
    ★2度目 `const 運営できる教室 = myOrgs.filter((mm) => mayEnterOpsHere(mm))`
      ★★`mayEnterOpsHere` は 巻き上がる `function` です が、
        ★中で `myOrgPosts`（★後ろの `useState`）を 読みます。
      ★★★つまり **呼んだ ところ** で 落ちます（★TDZ）。

  ★★見る もの ── ★`export default function` の 後（★体）で、
    ★`const X = …`（★`() =>` で 始まらない もの）が
    ★★同じ 体の `function` を 呼び、★その `function` が
    ★★★`X` より **後ろ** の `const`／`useState` を 読んで いないか。

  ★★「呼べる もの に する」（`() => …`）で 直ります。★並び替えでは 直りません
    （★1度目の 直しが それ でした）。

  ★★★3度目（★2026-09-26）── ★**頼りの 一覧**（`useEffect` の `[…]`）でした。
    ★`}, [layoutV2, moreSection, userId, featureClient, myOrgs, myOrgPosts]);`
    ★★あの 一覧は **描く たびに その場で** 組まれます。★体の 中の 式 です。
    ★★★だから 後ろの `useState` を 並べると、★その 行で 落ちます ──
      ★`ReferenceError: Cannot access 'k3' before initialization`。
    ★★直しは 1つ ── ★その `useEffect` を 宣言より **後ろ** へ 置きます。
      ★★`() => …` に する 手は 使えません（★一覧は 値 です）。

  ★使い方  python3 tools/tdz_scan.py [紙 …]
"""
import io, os, re, sys, glob

# ★★★名に 使える 字を、★1つ だけ 決めます（★2026-09-26 ── ★見落としの 直し）。
#   ★★ここまで、★`function` の 名を `[A-Za-z_]` でしか 探して いません でした。
#     ★★この 蔵には 日本語の 名の `function` が **17 個** あります ──
#       ★`紙に出す` `教室の運営を開く` `束を開く` `請求の中身` `決める` …
#     ★★★つまり その 17 個 が 呼ばれる かぎり、★この 道具は **何も 見て いません** でした。
#   ★★`const [開く, 開くを設定] = useState()` の **2つめ** も 拾って いません でした。
#     ★★`開くを設定` も `const` です。★前で 読めば 同じ ように 落ちます。
#   ★★★2つの 決めを 2か所に 書くと、★片方 だけ 直されて ずれます。★だから 定数に します。
字 = "぀-ヿ一-鿿々〆ヶA-Za-z0-9_$"
頭 = "぀-ヿ一-鿿々〆ヶA-Za-z_$"


def 名を拾う(中):
  """★`[a, setA]` の 中の 名を ぜんぶ 拾います（★数字 だけ の ものは 除きます）。"""
  return [n for n in re.findall("[%s]+" % 字, 中) if not n[0].isdigit()]


def 見る(p):
  s = io.open(p, encoding="utf-8", errors="ignore").read()
  素 = re.sub(r"/\*[\s\S]*?\*/", " ", s)
  素 = re.sub(r"(?m)^\s*//.*$", " ", 素)
  m0 = re.search(r"export default function [A-Za-z_][A-Za-z0-9_]*", 素)
  if not m0:
    return []
  体 = 素[m0.end():]
  宣 = {}
  for m in re.finditer(r"^  const (?:\[([^\]]*)\]|([%s]+)) =" % 字, 体, re.M):
    for 名 in (名を拾う(m.group(1)) if m.group(1) is not None else [m.group(2)]):
      宣.setdefault(名, m.start())
  関数 = {}
  for m in re.finditer(r"^  (?:async )?function \*?([%s][%s]*)\s*\([^)]*\)\s*\{" % (頭, 字), 体, re.M):
    i = m.end() - 1
    深 = 0
    k = i
    for k in range(i, len(体)):
      if 体[k] == "{":
        深 += 1
      elif 体[k] == "}":
        深 -= 1
        if 深 == 0:
          break
    関数[m.group(1)] = 体[i:k]
  出 = []
  for m in re.finditer(r"^  const ([%s]+) = ([^\n]*)$" % 字, 体, re.M):
    右 = m.group(2)
    if re.match(r"\s*(\([^)]*\))\s*=>", 右) or re.match(r"\s*function\b", 右):
      continue
    for fn, 中 in 関数.items():
      if not re.search(r"(?<![%s])%s\s*\(" % (字, re.escape(fn)), 右):
        continue
      for n, at in 宣.items():
        if at <= m.start():
          continue
        if re.search(r"(?<![%s])%s(?![%s])" % (字, re.escape(n), 字), 中):
          出.append((m.group(1), fn, n))
          break
  return 出


def 頼り(p):
  """★`useEffect`／`useMemo`／`useCallback` の 頼りの 一覧が、★後ろの 宣言を 並べて いないか。

  ★★見つけられる もの ── ★一覧の 中の 名が、★その 行より 後ろ の
    ★`const` ／ `const [a, b] = useState(...)` だった とき。
  ★★見つけられない もの ── ★一覧の 中の **関数を 通した** 読み
    （★それは `見る()` が 受け持ちます）。★入れ子の 部品の 中。
  """
  s = io.open(p, encoding="utf-8", errors="ignore").read()
  素 = re.sub(r"/\*[\s\S]*?\*/", " ", s)
  素 = re.sub(r"(?m)^\s*//.*$", " ", 素)
  m0 = re.search(r"export default function [A-Za-z_][A-Za-z0-9_]*", 素)
  if not m0:
    return []
  体 = 素[m0.end():]
  宣 = {}
  for m in re.finditer(r"^  const (?:\[([^\]]*)\]|([%s]+)) =" % 字, 体, re.M):
    for 名 in (名を拾う(m.group(1)) if m.group(1) is not None else [m.group(2)]):
      宣.setdefault(名, m.start())
  出 = []
  for m in re.finditer(r"^  \}, \[([^\]]*)\]\);", 体, re.M):
    for 名 in [x.strip() for x in m.group(1).split(",") if x.strip()]:
      if not re.match(r"^[%s.]+$" % 字, 名):
        continue
      根 = 名.split(".")[0]
      at = 宣.get(根)
      if at is not None and at > m.start():
        出.append((根, m.start()))
  return 出


# ★★★較正 ── ★わざと 当たる ものを 自分で 作り、★見つける か 確かめます。
#   ★★2026-09-26 まで、★この 道具は 日本語の 名の `function` を **1つも** 見て いません
#     でした。★それでも `RESULT: OK` と 出ます。★見て いない ことと、★無い ことは 別 です。
#   ★★だから 当たる ものを 置いて、★出る ところまで 見ます（★`components/tests/tdz-order`
#     が これを 呼びます ── ★通らなければ その 見張りが 赤に なります）。
較正 = [
  ("英字の function", """export default function Bait() {
  const ok = read();
  function read() { return later; }
  const later = 1;
  return ok + later;
}
"""),
  ("日本語の function", """export default function Bait() {
  const 束 = 読む();
  function 読む() { return あと; }
  const あと = 1;
  return 束 + あと;
}
"""),
  ("async と useState の 2つめ", """export default function Bait() {
  const 行き先 = 決める();
  async function 決める() { return 開くを設定; }
  const [開く, 開くを設定] = useState(false);
  return 行き先 + 開く;
}
"""),
  ("頼りの 一覧が 後ろを 並べる", """export default function Bait() {
  useEffect(() => {
    hello();
  }, [あと]);
  const あと = 1;
  return あと;
}
"""),
]

無事 = """export default function Bait() {
  const あと = 1;
  const 束 = () => 読む();
  function 読む() { return あと; }
  return 束() + あと;
}
"""


def selftest():
  import tempfile
  仮 = tempfile.mkdtemp(prefix="tdz_scan_")
  数 = 落 = 0

  def 見て(名, 中身, 当たる):
    nonlocal 数, 落
    数 += 1
    q = os.path.join(仮, "b.jsx")
    io.open(q, "w", encoding="utf-8").write(中身)
    件 = len(見る(q)) + len(頼り(q))
    ok = (件 > 0) if 当たる else (件 == 0)
    if not ok:
      落 += 1
    print("  %s %-26s %d 件" % ("✓" if ok else "✗", 名, 件))
    os.remove(q)

  print("=== 一 わざと 当たる ものを 見つける か ===")
  for 名, 中身 in 較正:
    見て(名, 中身, True)
  print("\n=== 二 当たらない ものを 当てて いないか ===")
  見て("直して ある もの", 無事, False)
  os.rmdir(仮)
  print("\n  %d / %d" % (数 - 落, 数))
  print("SELFTEST %s" % ("PASS" if not 落 else "FAIL"))
  return 1 if 落 else 0


def main():
  if "--selftest" in sys.argv[1:]:
    return selftest()
  紙 = sys.argv[1:] or sorted(glob.glob("components/*.jsx"))
  悪 = 0
  print("TDZ_SCAN  ★%d 枚" % len(紙))
  for p in 紙:
    for c, fn, n in 見る(p):
      悪 += 1
      print("  DIFF %s ── %s が %s() を その場で 呼び、★%s() は 後ろの %s を 読む"
            % (os.path.basename(p), c, fn, fn, n))
    for 根, at in 頼り(p):
      悪 += 1
      print("  DIFF %s ── 頼りの 一覧が 後ろの %s を 並べて いる（★その `useEffect` を "
            "宣言より 後ろ へ 置いてください）" % (os.path.basename(p), 根))
  print("★呼べる もの に する（`() => …`）で 直ります。★並び替えでは 直りません")
  print("RESULT: %s" % ("OK" if not 悪 else "NG（%d 件）" % 悪))
  return 1 if 悪 else 0


if __name__ == "__main__":
  sys.exit(main())
