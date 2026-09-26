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


def 見る(p):
  s = io.open(p, encoding="utf-8", errors="ignore").read()
  素 = re.sub(r"/\*[\s\S]*?\*/", " ", s)
  素 = re.sub(r"(?m)^\s*//.*$", " ", 素)
  m0 = re.search(r"export default function [A-Za-z_][A-Za-z0-9_]*", 素)
  if not m0:
    return []
  体 = 素[m0.end():]
  宣 = {}
  for m in re.finditer(r"^  const (?:\[([A-Za-z0-9_]+)[^\]]*\]|([぀-ヿ一-鿿A-Za-z0-9_]+)) =", 体, re.M):
    宣.setdefault(m.group(1) or m.group(2), m.start())
  関数 = {}
  for m in re.finditer(r"^  function ([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)\s*\{", 体, re.M):
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
  for m in re.finditer(r"^  const ([぀-ヿ一-鿿A-Za-z0-9_]+) = ([^\n]*)$", 体, re.M):
    右 = m.group(2)
    if re.match(r"\s*(\([^)]*\))\s*=>", 右) or re.match(r"\s*function\b", 右):
      continue
    for fn, 中 in 関数.items():
      if not re.search(r"(?<![A-Za-z0-9_])%s\s*\(" % re.escape(fn), 右):
        continue
      for n, at in 宣.items():
        if at <= m.start():
          continue
        if re.search(r"(?<![぀-ヿ一-鿿A-Za-z0-9_])%s(?![぀-ヿ一-鿿A-Za-z0-9_])" % re.escape(n), 中):
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
  for m in re.finditer(r"^  const (?:\[([A-Za-z0-9_]+)[^\]]*\]|([぀-ヿ一-鿿A-Za-z0-9_]+)) =", 体, re.M):
    宣.setdefault(m.group(1) or m.group(2), m.start())
  出 = []
  for m in re.finditer(r"^  \}, \[([^\]]*)\]\);", 体, re.M):
    for 名 in [x.strip() for x in m.group(1).split(",") if x.strip()]:
      if not re.match(r"^[぀-ヿ一-鿿A-Za-z0-9_.]+$", 名):
        continue
      根 = 名.split(".")[0]
      at = 宣.get(根)
      if at is not None and at > m.start():
        出.append((根, m.start()))
  return 出


def main():
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
