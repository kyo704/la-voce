#!/usr/bin/env python3
"""★`.vercelignore` が、★ビルドに 要る ファイルを 除いて いないか（★2026-09-23）。

  ★★★作った わけ ── ★2026-09-23、★`assets` と 書いて `docs/assets/` まで 除き、
    ★Vercel の ビルドを 壊しました。
    ★★`.gitignore` と 同じ 決め です …… ★斜線の 無い 形は **どの 深さ にも** 当たります。
    ★★私の はじめの 確かめは「頭から 合わせる」形で 書いて いて、★同じ 誤りを して いました。

  ★★だから、★決めを 自分で 書きません。★`git check-ignore` に 聞きます。
    ★★`.vercelignore` を そのまま 除外の 決めとして 渡します。

  ★使い方
    python3 tools/vercelignore_check.py            ★確かめる
    python3 tools/vercelignore_check.py --selftest ★道具を 較正する
"""
import os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ★★ビルドが 読む ファイル。★`@/` で 入って いる ものを 数えて 並べます。
def ビルドが要る():
  要る = set()
  for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in (".git", "node_modules", ".next", "docs", "assets", "ios")]
    for f in files:
      if not f.endswith((".js", ".jsx")):
        continue
      p = os.path.join(root, f)
      if "/tests/" in p:
        continue
      try:
        s = open(p, encoding="utf-8").read()
      except Exception:
        continue
      for m in re.finditer(r"""from\s+["']@/([^"']+)["']|require\(\s*["']@/([^"']+)["']""", s):
        要る.add(m.group(1) or m.group(2))
  return sorted(要る)


def 除かれるか(みち):
  """★`git check-ignore` に 聞きます。★自分で 合わせません。"""
  with tempfile.NamedTemporaryFile("w", suffix=".ignore", delete=False, encoding="utf-8") as fp:
    fp.write(open(os.path.join(ROOT, ".vercelignore"), encoding="utf-8").read())
    名 = fp.name
  try:
    r = subprocess.run(["git", "--git-dir", os.path.join(ROOT, ".git"),
                        "-c", "core.excludesFile=" + 名,
                        "check-ignore", "--no-index", "-q", みち],
                       cwd=ROOT, capture_output=True)
    return r.returncode == 0
  finally:
    os.unlink(名)


def main():
  要る = ビルドが要る()
  落 = []
  print("VERCELIGNORE_CHECK")
  print("  ★ビルドが 読む ファイル", len(要る))
  for m in 要る:
    if not os.path.exists(os.path.join(ROOT, m)):
      continue
    if 除かれるか(m):
      落.append(m)
      print("  NG  ★除かれて います ──", m)
  print("RESULT:", "PASS" if not 落 else "NG（%d件）" % len(落))
  return 0 if not 落 else 1


def selftest():
  """★較正 ── ★除かれる はずの ものと、★残る はずの もの の 両方。"""
  ok = True
  for みち, 要る in (("docs/design/README.md", True),
                     ("docs/reports", True),
                     ("assets/README.md", True),
                     ("docs/assets/sheep-items-index.json", False),
                     ("docs/opus/items.json", False),
                     ("lib/sheepItems.js", False),
                     ("public/sheep", False)):
    if not os.path.exists(os.path.join(ROOT, みち)):
      continue
    でた = 除かれるか(みち)
    if でた != 要る:
      print("SELFTEST FAIL:", みち, "→", "除かれた" if でた else "残った"); ok = False
    else:
      print("ok  %-42s %s" % (みち, "除かれる" if でた else "残る"))
  print("SELFTEST", "PASS" if ok else "FAIL")
  return 0 if ok else 2


if __name__ == "__main__":
  sys.exit(selftest() if "--selftest" in sys.argv[1:] else main())
