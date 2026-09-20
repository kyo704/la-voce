#!/usr/bin/env python3
# ★裁定を 仕分けます（★裁定 その114 §3・2026-09-20）。
#
#   ★★★分けるのは 4つ ──
#     `skills` …… 座標・数値・しるし・機械で 判じられる 決まり・検査の 手順
#     `docs`   …… 設計の わけ・却下した 案・調べの 出どころ
#     `claude` …… ★「消したら 間違えるか」が はい の 1行 だけ
#     `捨てる` …… 取り消した もの・その日 だけ の 判断（★取り消しの 記録は docs に 残す）
#
#   ★★読むだけ です。★1つも 動かしません（★SCOPE_OUT）。
#   ★★較正 ── ★手で 分かって いる 3つで 試します。
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ★★仕分けの 手がかり（★その114 §3 の 字 を そのまま 使います）。
SKILL = ["座標", "px", "文字サイズ", "TABLE_AT", "しきい", "数値", "トークン",
         "検査", "手順", "見張り", "並び", "寸法", "色の 値", "比"]
DOCS = ["理由", "わけ", "却下", "出典", "調べ", "設計", "見送", "考え方", "背景"]
CLAUDE = ["書かない", "しない", "作らない", "見られない", "出さない", "禁止",
          "必ず", "両方", "消えない", "取り上げない"]
SUTERU = ["取り消", "撤回", "その日", "一時", "暫定"]

def 引用元():
  """★その 番の 裁定が、★どこで 語られて いるか。"""
  out = subprocess.run(
    ["bash", "-lc",
     "grep -rohE '裁定 ?その[0-9]+[^。\\n]{0,60}' lib components app docs "
     "--include=*.js --include=*.jsx --include=*.md 2>/dev/null"],
    cwd=ROOT, capture_output=True, text=True).stdout
  d = {}
  for l in out.split("\n"):
    m = re.search(r"裁定 ?その(\d+)", l)
    if not m:
      continue
    d.setdefault(int(m.group(1)), []).append(l.strip())
  return d

# ★★★人の 目で 決めた もの（★機械の 見立てより 先に 使います）。
#   ★★わけを 添えます。★あとから 見た 人が、★同じ 考えを たどれる ように。
#   ★★その114 §3 の 例（その75・その103・その97・その105・その93）も ここに 入れます。
TEBIKI = {
  55: ("claude", "健康と 学務は 別。★層を またぐ 結合を しない ── ★原則の 1行"),
  57: ("claude", "その55 を 狭めた 線。★原則の 1行に 入って います"),
  75: ("skills", "§3 の 例。★`TABLE_AT=933` ── ★数 その もの"),
  76: ("docs", "門下を 読む 記録の 設計（★誰が・いつ・どの 門下 だけ）"),
  77: ("docs", "合言葉の 断り方の 設計（★総当たりを 防ぐ 言い方）"),
  79: ("docs", "出欠の 入口を 2つに した わけ"),
  81: ("skills", "見た目の 寸法・型（★6段の 字・表の 貼りつけ）"),
  82: ("docs", "生徒を 招く 設計"),
  83: ("docs", "学校に 入る 道の 設計（★受け持ちの 先生は 誰か）"),
  84: ("捨てる", "★取り消し済み（★その97）。★取り消しの 記録は docs に 残します"),
  85: ("docs", "日程の 姿の 設計（★sched_all ／ sched_mine）"),
  86: ("docs", "台帳の 門を できことに 揃えた わけ"),
  87: ("docs", "連絡の 設計（★読んだ 印を 残さない）"),
  89: ("docs", "行事の 設計（★場所・対象）"),
  90: ("docs", "出欠の 数の 設計（★率を 出さない）"),
  91: ("skills", "出欠つけの 並び・戻り道（★手順）"),
  93: ("claude", "§3 の 例。★RLS は 列を 守らない → `select('*')` を 書かない"),
  95: ("claude", "お金で 人間関係の 有利を 買えない ── ★原則"),
  97: ("docs", "§3 の 例。★その84 の 取り消しの わけ"),
  98: ("docs", "学校の 形（org_divisions）の 設計"),
  99: ("docs", "日程を 組む ときに 先生を 選ぶ わけ"),
  100: ("捨てる", "★一部 取り消し（★その111）。★記録は docs に 残します"),
  103: ("skills", "§3 の 例。★文字の 6段（12／12.5／13／13.5／14.5／15.5）"),
  104: ("docs", "門下を 変える・先生が 退く ときの 設計"),
  105: ("docs", "§3 の 例。★採点の 設計"),
  106: ("docs", "約束の 証拠の 立て方（★11の 約束）"),
  107: ("docs", "保護者の 同意の 設計"),
  108: ("docs", "表を 作らない 判断（★P_okeru ／ P_kasaFix）"),
  109: ("docs", "名簿の 下書きの 設計。★ただし `VERIFY` の 5つは skills 向き"),
  110: ("docs", "返金の 根拠（★法務）"),
  111: ("docs", "段3a の 進め方と 完了の 線"),
}


def 仕分け(番, 文たち):
  s = " ".join(文たち)
  点 = {"skills": 0, "docs": 0, "claude": 0, "捨てる": 0}
  for w in SKILL:
    点["skills"] += s.count(w)
  for w in DOCS:
    点["docs"] += s.count(w)
  for w in CLAUDE:
    点["claude"] += s.count(w)
  for w in SUTERU:
    点["捨てる"] += s.count(w)
  先 = max(点, key=lambda k: 点[k])
  return (先 if 点[先] > 0 else "docs"), 点

def calib():
  # ★★手で 分かって いる 3つ。
  a, _ = 仕分け(103, ["裁定その103 文字サイズの 寄せ方（12・12.5・13）"])
  b, _ = 仕分け(97, ["裁定その97 裁定84の 取り消しの 理由"])
  c, _ = 仕分け(93, ["裁定その93 RLS は 列を 守らない。select を 書かない"])
  return a == "skills" and b in ("docs", "捨てる") and c == "claude"

def main():
  if not calib():
    print("★止まりました ── ★較正に 落ちました")
    raise SystemExit(1)
  元 = 引用元()
  # ★★★手元で 1度も 語られて いない 番も、★一覧に 出します（★2026-09-20）。
  #   ★★出さないと、★「無い」のか「見落とした」のか 分かりません。
  #   ★★その114 §3 は 1〜70 と 97〜111 を 挙げて います。★ぜんぶ 並べます。
  全 = list(range(1, 71)) + list(range(97, 112))
  対象 = 全
  L = ["# ★裁定の 仕分け（★裁定 その114 §3）\n",
       "★この 紙は `tools/ruling_classify.py` が 書きました。★手で 足して いません。",
       "★★**動かして いません**。★一覧だけ です（★SCOPE_OUT）。",
       f"★道具の 較正 …… ○（★その103→skills ／ その97→docs ／ その93→claude）\n",
       f"★手元で 語られて いる 裁定 {len(元)}件 ／ ★今回の 対象（1〜70・97〜111） {len(対象)}件\n",
       "\n| 裁定 | 行き先 | わけ | 印 |",
       "|---|---|---|---|"]
  数 = {}
  for n in 対象:
    機, 点 = 仕分け(n, 元.get(n, []))
    if n not in 元 and n not in TEBIKI:
      数["手元に無い"] = 数.get("手元に無い", 0) + 1
      L.append(f"| その{n} | ─ | ★手元に 1度も 出て きません | ★本文が 要ります |")
      continue
    if n in TEBIKI:
      先, わけ = TEBIKI[n]
      印 = ""
    else:
      先, わけ = 機, sorted(set(元[n]), key=len, reverse=True)[0][:52].replace("|", "／")
      印 = "★機械の 見立て（要 確かめ）"
    数[先] = 数.get(先, 0) + 1
    L.append(f"| その{n} | {先} | {わけ} | {印} |")
  L.append("\n## ★数\n")
  for k in ("skills", "docs", "claude", "捨てる", "手元に無い"):
    L.append(f"- {k} …… {数.get(k, 0)}件")
  # ★★★手元に 1度も 出て こない 裁定を、★番で 並べます（★坂本さんの お指図・2026-09-20）。
  #   ★★「無くした」ことを 記録します。★戻しません。
  無い = [n for n in 対象 if n not in 元 and n not in TEBIKI]
  L.append("\n## ★手元に 無い 裁定（★戻しません）\n")
  L.append("```yaml")
  L.append("LOST_RULINGS:")
  L.append(f"  count: {len(無い)}")
  L.append("  numbers: " + "・".join("その%d" % n for n in 無い))
  L.append("  cause: 文書化せず、会話の中だけで決めた")
  L.append("  status: 復元しない")
  L.append("  reason: 記憶からの復元は、実装と食い違う risk がある")
  L.append("  policy: 実装を正とする。同じ提案が出たら、そのとき判断する")
  L.append("  prevention: 裁定その114 §5（版の管理）")
  L.append("```")
  L.append("")
  L.append("★★★なぜ 戻さないか。★覚えから 書くと、★**実装と ちがう 紙**が できます。")
  L.append("　★★紙が 2つ に なると、★どちらが 正か 分からなく なります。")
  L.append("　★★この 蔵で いちばん 多い 壊れ方 です（★同じ 決めが 2か所）。")
  L.append("★★★だから ── ★**実装を 正** と します。")
  L.append("　★★同じ 案が もう一度 出たら、★その ときに 決めます。")
  L.append("　★★決めたら、★版に 入れて 配ります（★その114 §5）。")
  L.append("")
  L.append("★★★二度と 起こさない ため ── ★その114 §5（版の 管理）。")
  L.append("　★★1つの 版に 見本4本・`docs/rulings/`・`.claude/skills/`・")
  L.append("　　`CLAUDE.md`・`tokens.md` を まとめ、★`design-v7` の 札を 付けます。")
  L.append("　★★正誤表で 直しません。★版を 上げて 配ります。")
  L.append("　　★★2026-09-17 に 直した 羊の 部屋が、★09-18 に 戻りました。★版が 無かった ため です。")
  L.append("")

  L.append("\n## ★この 道具が 見て いない こと\n")
  L.append("★★手元の **字** から 当てて います。★裁定の 本文では ありません。")
  L.append("★★★印の ある 行は、★**機械の 見立て** です。★本文が 手元に ありません。")
  L.append("　★★語られ方 だけ で 分けて います。★人の 目で 確かめて ください。")
  L.append("★★印の 無い 行は、★人の 目で 決めた もの です（★わけを 添えて あります）。")
  L.append("★★`捨てる` に 入った ものも、★取り消しの 記録は docs に 残します（★§3）。")
  p = ROOT / "docs/records/2026-09-20-裁定の分類.md"
  p.write_text("\n".join(L) + "\n", encoding="utf-8")
  print("FILE:", p)
  print("対象", len(対象), "件 ／", 数)

if __name__ == "__main__":
  main()
