#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★配備が 届いたかを 確かめる
#   ★出どころ 2026-09-13。★今日 3度 手で やりました。
#     ★★b289f49 の とき、★押し出して いないのに「直りました」と 申しました。
#   使い方  python3 tools/verify_deploy.py <commit> [基点]
# ============================================================================

import json
import subprocess
import sys
import time
import urllib.request

BASE = "https://woolsong.app"


def head():
  return subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                        capture_output=True, text=True).stdout.strip()


def main():
  args = [a for a in sys.argv[1:]]
  want = args[0] if args else head()
  base = args[1] if len(args) > 1 else BASE
  if not want:
    print("使い方: python3 tools/verify_deploy.py <commit> [基点]")
    return 1
  for i in range(24):
    try:
      with urllib.request.urlopen(base + "/api/version", timeout=20) as r:
        d = json.loads(r.read().decode("utf-8"))
      got = d.get("short", "?")
      flags = d.get("flags") or {}
      print("%2d %s%s" % (i + 1, got, "  一致" if got == want else ""))
      if got == want:
        print("commit=%s" % d.get("commit", "?"))
        for k in sorted(flags):
          print("  %s=%s" % (k, flags[k]))
        return 0
    except Exception as e:                                      # noqa: BLE001
      print("%2d ERR %s" % (i + 1, str(e)[:50]))
    time.sleep(30)
  print("不一致の まま。押し出して いないか、組み立て中。")
  return 1


if __name__ == "__main__":
  sys.exit(main())
