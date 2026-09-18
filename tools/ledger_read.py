# -*- coding: utf-8 -*-
"""★台帳の 答えを 読む ── ★1か所 だけ。

  ★★★2026-09-19 に つまずきました。
    ★★終わりの「★19件」を 落とす つもりで、★★で 始まる 行を 全部 落として いました。
    ★★★学校の 名が `★50通り-01-学長` です。★その 行が 消えて いました。
    ★★19件 が 8件 に 見えて いました。★誤りは 出ません。★減る だけ です。

  ★★★だから、★終わりの 1行 **だけ** を、★形を 見て 落とします。
    ★★`^★<数>件$` に 当たる ものだけ です。

  ★★★もう 1つ。★表は 1つの 値を 64字で 切ります。
    ★★長い 式（決まりの 本文など）は、★ここでは 読めません。
    ★★★台帳の 中で 真偽を 出して もらって ください。
"""

import os, re, subprocess, sys

KIKU = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ask_ledger.py")
シメ = re.compile(r"^★\d+件$")


def 問う(sql):
  r = subprocess.run([sys.executable, KIKU, sql], capture_output=True, text=True)
  out = r.stdout.strip()
  if r.returncode != 0 or "★止まりました" in out:
    raise SystemExit("★止まりました ── 台帳に 聞けません。\n" + out + r.stderr)
  行 = [l for l in out.splitlines() if l.strip()]
  if not 行 or 行[0] == "（0件）":
    return []
  if len(行) < 2:
    raise SystemExit("★止まりました ── 表の 形で ありません。\n" + out)
  頭 = [c.strip() for c in 行[0].split("|")]
  中 = [l for l in 行[2:] if not シメ.match(l.strip())]
  # ★★★数を 突き合わせます。★落とした 行が あれば、★ここで 止まります。
  数え = [l for l in 行[2:] if シメ.match(l.strip())]
  if 数え:
    言う数 = int(re.sub(r"[^0-9]", "", 数え[-1]))
    if 言う数 != len(中):
      raise SystemExit("★止まりました ── 台帳は %d件 と 言い、★読めたのは %d件 です。"
                       % (言う数, len(中)))
  return [dict(zip(頭, [c.strip() for c in l.split("|")])) for l in 中]


def 真(r, k):
  return str(r.get(k, "")).strip().lower() == "true"


if __name__ == "__main__":
  # ★★★較正 ── ★わざと ★で 始まる 行を 作り、★落ちない ことを 確かめます。
  結 = 問う("select '★ためし' as namae union all select 'ふつう' as namae")
  assert len(結) == 2, "★止まりました ── ★で 始まる 行が 落ちて います"
  assert any(r["namae"] == "★ためし" for r in 結), "★止まりました ── 中身が 違います"
  print("○ 較正 ── ★で 始まる 行も 読めます（2件）")
