# -*- coding: utf-8 -*-
"""★日程の表が空の わけを 数える（★2026-09-19・坂本さんの 実機の ご報告）。

  ★★数えるのは 3つ です。
    ①台帳 …… その学校に コマ（lessons）が 何件 あるか
    ②道 …… 表に コマを 入れる 書き口が、どこから 呼ばれて いるか
    ③差分 …… 96464dd5 が 表示の 道に 触れたか（★文字の 大きさ だけ か）

  ★★この 道具は 自分を 確かめます（★較正）。
    ★当たり … handlePlaceLesson は 呼ばれて いる（★1以上）
    ★外れ … ありもしない 名は 0 件
"""
import json
import re
import subprocess
from pathlib import Path

RENPO = Path(__file__).resolve().parent.parent
ASK = RENPO / "tools" / "ask_ledger.py"
NUSHI = "99b695d8-ae90-43a5-9767-a8d073a4003d"


def toi(sql):
  """★1つの 数を 返します。

    ★★★読めなければ 止まります。★0 を 返しません
      （★「無い」と「聞けて いない」を 同じ 顔に しません）。
  """
  r = subprocess.run(["python3", str(ASK), sql, "--raw"],
                     capture_output=True, text=True)
  if r.returncode != 0:
    raise SystemExit("★台帳に 聞けません: " + (r.stdout + r.stderr).strip()[:300])
  # ★`--raw` は「n: 1」の 形で 返します。★1つ目の 値を 取ります。
  atai = [l.split(":", 1)[1].strip() for l in r.stdout.splitlines()
          if ":" in l and not l.startswith("──") and not l.startswith("★")]
  if not atai:
    raise SystemExit("★0行でした（★問いを お確かめ ください）: " + r.stdout[:200])
  return int(atai[0])


def yobareta(namae, *files):
  """★その 名が、★定義の ほかに 何回 出るか。"""
  n = 0
  for f in files:
    t = (RENPO / f).read_text(encoding="utf-8")
    n += len(re.findall(r"\b" + re.escape(namae) + r"\b", t))
  return max(0, n - 1)  # ★定義の 1回を 引きます


def main():
  vt = "components/VocalTracker.jsx"

  # ★較正 ── ★当たりと 外れ。
  atari = yobareta("handlePlaceLesson", vt)
  hazure = yobareta("handleNaiMonoDesu", vt)
  assert atari >= 1, "★較正に 失敗（★当たりが 0）"
  assert hazure == 0, "★較正に 失敗（★外れが 0 でない）"

  shirabe = {
    "呼ばれていない書き口": {
      "handleCreateOrgLesson": yobareta("handleCreateOrgLesson", vt),
      "handlePlaceLesson": atari,
    },
    "台帳": {
      "坂本さんの学校のコマ": toi(
        "select count(*)::text as n from public.lessons where org_id="
        "(select org_id from public.memberships where user_id='%s'"
        " and role='owner' limit 1)" % NUSHI),
      "学校つきのコマ全部": toi(
        "select count(*)::text as n from public.lessons where org_id is not null"),
      "坂本さんの受け持ち": toi(
        "select count(*)::text as n from public.assignments"
        " where teacher_id='%s' and ended_at is null" % NUSHI),
      "坂本さんの学校の人数": toi(
        "select count(*)::text as n from public.memberships where org_id="
        "(select org_id from public.memberships where user_id='%s'"
        " and role='owner' limit 1)" % NUSHI),
      "坂本さんのコマの型": toi(
        "select count(*)::text as n from public.my_periods where user_id='%s'" % NUSHI),
    },
  }

  # ★③ 差分 ── ★文字の 大きさ 以外の 行が あるか。
  d = subprocess.run(
    ["git", "show", "96464dd5", "--", "components/OpsSchedule.jsx"],
    cwd=str(RENPO), capture_output=True, text=True).stdout
  # ★空の 行（★`+` だけ）は 数えません。★中身が ありません。
  kae = [l for l in d.splitlines()
         if l[:1] in "+-" and l[:2] not in ("++", "--") and l[1:].strip()]
  ji = [l for l in kae if "fontSize" in l]
  chu = [l for l in kae if re.match(r"^[+-]\s*(//|\*|/\*)", l)]
  hoka = [l for l in kae if l not in ji and l not in chu]

  ho = RENPO / "docs" / "reports" / "2026-09-19-日程の表が空の件.md"
  ho.parent.mkdir(parents=True, exist_ok=True)
  with ho.open("w", encoding="utf-8") as f:
    f.write("# 日程の表に 何も 出ない わけ（2026-09-19）\n\n")
    f.write("この 覚えは tools/schedule_empty_check.py が 書きました。\n\n")
    f.write("## ① 台帳の 数\n\n")
    for k, v in shirabe["台帳"].items():
      f.write("- %s …… %d 件\n" % (k, v))
    f.write("\n## ② 書き口\n\n")
    for k, v in shirabe["呼ばれていない書き口"].items():
      f.write("- %s …… 呼ばれている数 %d\n" % (k, v))
    f.write("\n## ③ 96464dd5 の 差分（OpsSchedule.jsx）\n\n")
    f.write("- 変えた行 …… %d\n" % len(kae))
    f.write("- うち fontSize …… %d\n" % len(ji))
    f.write("- うち 覚え書き …… %d\n" % len(chu))
    f.write("- それ以外 …… %d\n" % len(hoka))
    for l in hoka:
      f.write("    %s\n" % l[:120])
  print("REPORT: %s" % ho.relative_to(RENPO))
  print("SONOTA: %d" % len(hoka))
  print(json.dumps(shirabe, ensure_ascii=False, indent=1))


if __name__ == "__main__":
  main()
