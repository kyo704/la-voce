#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★記事の 名を、★見本の 書き方に そろえます（★80本）。

  ★★出どころ　坂本さん（★2026-09-16・決め ⑥）──
    「★articles.json 側で 67本 まとめて 修正。
      ★線を ──（U+2500×2）に、★分かち書きを 追加」

  ★★2つ します ──
    ★① 線　`―`（U+2015 が 1つ）→ `──`（U+2500 が 2つ）
    ★② 分かち書き　★見本の 書き方に そろえます

  ★★①は 機械で できます。★②は **できません**。
    ★★見本の 書き方は、★一定の 規則では ありません ──
      「声帯という器官のこと」　　　　　　　★空白 なし
      「劇場の声と マイクの前の声」　　　　 ★1つ
      「声区と パッサッジョ ── 通過点で 何が起きているか」★2つ
    ★★文節ごとに 切って いません。★読みの 切れ目で 切って います。
      ★★だから、★形態素解析では 出せません。★1本ずつ 決めます。
    ★★下の 表は、★私が 1本ずつ 書いた ものです。
      ★★見本に 同じ 名が ある 2本（V-1・V-4）は、★見本の 字を そのまま 使います。
      ★★のこりは 見本の 書き方に 倣って 書きました。★お目通しを お願いします。

  ★★書き換える のは **名前だけ** です。★本文にも id にも 触れません。
"""

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = [
  os.path.join(ROOT, "docs", "learn-content", "articles.json"),
]

# ★★★出どころは 3つ ありました（★2026-09-16・一度 取りこぼしました）。
#
#   ★★`lib/learnContent.js` の 頭に こう 書いて あります ──
#     「docs/learn-content/articles.json（67本）から 生成しています」
#   ★★**そう では ありません。** ★`ARTICLES` は **142本** です。
#     ★① `articles.json`　　　　　　66本
#     ★② `docs/音楽家の商い-第1章.md` / `第2章.md`　14本
#        ★★`shobai.json` は **生成物**です。★直しても 作り直しで 戻ります。
#        ★★実際に 1度 戻りました。★書いた 側の 紙を 直すのが 正しい です。
#     ★③ `lib/learnContent.js` の 中だけ に ある もの　10本
#        ★★どこからも 作られて いません。★ここが 出どころ です。
#   ★★はじめ ①だけ を 見て「UNKNOWN: 0」と 出しました。
#     ★★**嘘の 全部 済み**です。★62本を 見て いません でした。
#   ★★だから 最後に、★**出来上がった もの**を 数え直します（★下の ⑤）。
#     ★★入口を 数えるのでは なく、★出口を 見ます。

# ★② 音楽家の商い ── 見出しの 行を 直します（★`# 01　…`）。
MD = [os.path.join(ROOT, "docs", "音楽家の商い-第1章.md"),
      os.path.join(ROOT, "docs", "音楽家の商い-第2章.md")]
MD_NO = {
  "01": "shobai-01", "02": "shobai-02", "03": "shobai-03", "04": "shobai-04",
  "05": "shobai-05", "06": "shobai-06", "07": "shobai-07", "08": "shobai-08",
  "09": "shobai-09", "10": "shobai-10", "11": "shobai-11", "12": "shobai-12",
  "13": "shobai-13", "14": "shobai-14",
}

# ★③ `lib/learnContent.js` の 中だけ に ある 10本。
LIVE = os.path.join(ROOT, "lib", "learnContent.js")
# ★★★ここで 1度 止められました（★2026-09-16）。
#   ★★はじめ、★この 10本の 名を **思い出しで 書きました**。
#     ★`body-2` を「声に かかわる からだの こと」と 書きました。
#       ★★本当は「逆流性食道炎と声」です。★別の 記事 です。
#     ★`poprock-2-1` を「ライブ後の 声の戻し方」と 書きました。
#       ★★本当は「打ち上げという最大の落とし穴」です。
#   ★★見張り（★言葉が 変わって いないか）が 止めました。
#     ★★止まらなければ、★4本の 記事の 名が 別の ものに 変わって いました。
#   ★★私が 直してよいのは **書き方**だけ です。★言葉は 坂本さんの ものです。
#     ★★だから、★読んでから 書きました。★思い出しで 書きません。
LIVE_TITLES = {
  "announcer-1-1": "話声位（SFF）とは ── あなたが 普段しゃべっている高さ",
  "voiceactor-1-1": "叫びの生理と、そこからの 戻り方",
  "poprock-1-1": "ベルティングの 仕組み",
  "body-2": "逆流性食道炎と 声",
  "announcer-2-1": "長時間しゃべるということ ── 歌より 過酷な理由",
  "voiceactor-2-1": "ささやきと息漏れ ──「楽な芝居」という 誤解",
  "poprock-2-1": "打ち上げという 最大の落とし穴",
  "medicine-and-voice": "薬と 声",
  "when-to-see-a-doctor": "いつ、耳鼻咽喉科に行くか",
  "speaking-voice-load": "歌より、話し声のほうが",
}

# ★★見本に 同じ 名が ある もの（★そのまま 写します）。
FROM_MIHON = {
  "V-1": "声区と パッサッジョ ── 通過点で 何が起きているか",
  "V-4": "衣装と姿勢 ── コルセットが 呼吸に与えるもの",
}

# ★★のこり ── ★見本の 書き方に 倣って 書きました。
TITLES = {
  "C1-1": "声帯という器官のこと",
  "C1-2": "声が 出るしくみ ── 息・振動・共鳴の 三層",
  "C2-1": "逆流性食道炎・咽喉頭逆流症（LPR）と 声",
  "C2-2": "気をつけたい 症状の いろいろ",
  "C2-3": "乾燥と脱水 ── 声帯の粘膜で 起きていること",
  "C2-4": "睡眠不足が 声に出るまで",
  "C2-5": "風邪・アレルギー・鼻づまりと 声",
  "C2-6": "声を削りやすい 飲食物と、薬の話",
  "C3-1": "声の調子スコアは 何を見ているか",
  "C3-2": "コンディション偏差値 ── なぜ 絶対評価にしないのか",
  "C3-3": "音名の記録 ── 国際式の表記と、地声で測る理由",
  "C3-4": "CPPS ── 測れること、測れないこと",
  "C3-5": "ウォームアップ効率と 音域到達マップ",
  "C3-7": "絶対湿度で 環境を見る理由",
  "C3-8": "四つの質問票の 使い分け",
  "C3-9": "声の予報は 何をしているか",
  "C4-1": "声の衛生（ボーカルハイジーン）の 基本",
  "C4-2": "水分の摂り方 ── 何を、いつ",
  "C4-3": "SOVTE ── ストロー発声で 声を軽く戻す",
  "C4-4": "声の休息 ── 完全休息と 相対休息",
  "C4-5": "加湿と 蒸気の吸入",
  "C4-6": "声を使う仕事に役立つ運動 ── 目的別に 整理",
  "C4-7": "筋トレ回数の 一般的な目安",
  "C4-8": "食べることと 声 ── エネルギー可用性という 見方",
  "C5-1": "本番前日と 当日の過ごし方",
  "C5-2": "移動と機内 ── 乾燥への備え",
  "C5-3": "騒がしい場所で 声を守る",
  "C5-4": "ウォームダウンという 習慣",
  "C6-1": "受診を考える 目安",
  "C6-2": "耳鼻咽喉科では 何が行われるか",
  "C6-3": "受診用サマリーの 使い方",
  "C6-4": "名前を知っておく ── 声帯に 起こりうること",
  "C7-1": "用語集",
  "V-2": "クラシックとミュージカルで、声の使い方は どう違うか",
  "V-3": "声種（Fach）という 考え方",
  "V-5": "公演が続く時期に、声に 何が起きるか",
  "V-6": "劇場という環境 ── 空調・ホコリ・スモーク",
  "V-7": "公演期の ウォームアップの組み立て",
  "V-8": "本番当日の 声の配分",
  "V-9": "オーディション期の 声の使い方",
  "A-1": "話し声の仕事は、歌と 何が違うか",
  "A-2": "話声位（habitual pitch）── 自分の基準の高さを 知る",
  "A-3": "長時間の連続発話で、声に 何が起きるか",
  "A-4": "スタジオ・ブースという 環境",
  "A-5": "原稿と息継ぎ ── 読み方が 声を削るとき",
  "A-6": "話し声のための ウォームアップ",
  "A-7": "生放送・長尺収録の日の 組み立て",
  "A-8": "マイクを味方にする ── 声を張らないという 技術",
  "S-1": "声優の声 ── 役の声と、地の声",
  "S-2": "アニメ・ゲーム・吹き替えで、声の負荷は どう違うか",
  "S-3": "叫び・悲鳴の収録が 声に与えるもの",
  "S-4": "一日に 複数の現場を回る日",
  "S-5": "マイク前の 姿勢と距離",
  "S-6": "叫び収録の 前後にやること",
  "S-7": "収録スケジュールと 回復日の設計",
  "S-8": "ゲーム収録の 連続ワードどりに備える",
  "P-1": "ミックスボイスとベルティング ── 何が起きているか",
  "P-2": "モニター環境が 声を決める",
  "P-3": "ライブハウスという環境 ── 音量・煙・空調",
  "P-4": "ツアーの連投で、声に 何が起きるか",
  "P-5": "打ち上げと楽屋 ── 歌う以外で 声を使う時間",
  "P-6": "ライブ後の リカバリー",
  "P-7": "レコーディング期と ライブ期の使い分け",
  "P-8": "リハーサルで 声を温存する",
  "shobai-01": "時期を外すと、何をしても 届かない",
  "shobai-02": "アンケートは、感想を聞く紙では ない",
  "shobai-03": "いま聴く人だけを見ていると、未来が なくなる",
  "shobai-04": "ブランドは、同じ曲を繰り返すことから 始まる",
  "shobai-05": "いちばん強い宣伝は「たまたま 聴いてしまった」",
  "shobai-06": "値段は、あなたではなく 土地が決める",
  "shobai-07": "プログラムは、演出の 一部である",
  "shobai-08": "SNSは、名前のない人には 効かない",
  "shobai-09": "請求書は、あなたの値段を 宣言する紙",
  "shobai-10": "後援・協賛・助成 ── 3つは 別のものです",
  "shobai-11": "共演者への支払い ── 仲間を作りながら、資本主義に乗る",
  "shobai-12": "ホールは、お客さまの生活から 逆算して選ぶ",
  "shobai-13": "当日の運営は、動線と儀式で できている",
  "shobai-14": "確定申告と経費 ── 音楽で食べる人のための 最低限",
}
TITLES.update(FROM_MIHON)

DRY = "--write" not in sys.argv

changed, same, unknown, bad = [], [], [], []
for path in FILES:
  if not os.path.exists(path):
    print("★★ありません: " + os.path.relpath(path, ROOT))
    print("　★書きません。★止まります。")
    sys.exit(1)
  d = json.load(io.open(path, encoding="utf-8"))
  arts = d["articles"] if isinstance(d, dict) and "articles" in d else d
  for a in arts:
    i, old = a["id"], a["title"]
    if i not in TITLES:
      unknown.append((i, old))
      continue
    new = TITLES[i]
    # ★★言葉そのものを 変えて いないか。★空白と 線だけ を 見ます。
    #   ★★これが 無いと、★書き直す ついでに 中身を 変えて しまえます。
    #   ★★私が 直すのは **書き方**だけ です。★言葉は 坂本さんの ものです。
    strip = lambda t: re.sub(r"[\s―─]+", "", t)
    if strip(old) != strip(new):
      bad.append((i, old, new))
      continue
    if old == new:
      same.append((i, old))
    else:
      changed.append((i, old, new))
      a["title"] = new
  if not DRY and not bad:
    io.open(path, "w", encoding="utf-8").write(
      json.dumps(d, ensure_ascii=False, indent=2) + "\n")

# ══════════ ② 音楽家の商い の 見出し ══════════
md_changed = []
for path in MD:
  if not os.path.exists(path):
    print("★★ありません: " + os.path.relpath(path, ROOT))
    sys.exit(1)
  t = io.open(path, encoding="utf-8").read()
  out = []
  for line in t.split("\n"):
    m = re.match(r"^# (\d\d)　(.+)$", line)
    if m and MD_NO.get(m.group(1)) in TITLES:
      new = TITLES[MD_NO[m.group(1)]]
      if m.group(2) != new:
        strip = lambda x: re.sub(r"[\s―─]+", "", x)
        if strip(m.group(2)) != strip(new):
          bad.append((MD_NO[m.group(1)], m.group(2), new))
        else:
          md_changed.append((MD_NO[m.group(1)], m.group(2), new))
          line = "# " + m.group(1) + "　" + new
    out.append(line)
  if not DRY and not bad:
    io.open(path, "w", encoding="utf-8").write("\n".join(out))

# ══════════ ③ lib/learnContent.js の 中だけ に ある もの ══════════
# ★★★`build-learn-content.js` は、★**名前で** 突き合わせます ──
#     const liveByTitle = new Map(live.map((a) => [a.title, a]));
#   ★★だから、★`articles.json` の 名だけ を 変えると **繋がらなく なります**。
#     ★★実際 2度 戻りました。★作り直すたび、★古い 名に 戻って いました。
#   ★★片方だけ 直せない、★という ことです。
#     ★★`articles.json` と `lib/learnContent.js` を **同時に** 直します。
#       ★そうすれば、★次の 作り直しでも 鍵が 合います。
#   ★★「同じ ものが 2か所に ある」の 一種 です。★ここでは 鍵が それ でした。
live_changed = []
lv = io.open(LIVE, encoding="utf-8").read()
ALL_LIVE = dict(TITLES)
ALL_LIVE.update(LIVE_TITLES)
for i, new in ALL_LIVE.items():
  m = re.search(r'(id: "' + re.escape(i) + r'",[\s\S]{0,400}?title: ")([^"]*)(")', lv)
  if not m:
    continue                       # ★`lib` に 無い もの。★`articles.json` 側 だけ です。
  old = m.group(2)
  if old == new:
    same.append((i, old))
    continue
  strip = lambda x: re.sub(r"[\s―─]+", "", x)
  if strip(old) != strip(new):
    bad.append((i, old, new))
    continue
  live_changed.append((i, old, new))
  lv = lv[:m.start(2)] + new + lv[m.end(2):]
if not DRY and not bad:
  io.open(LIVE, "w", encoding="utf-8").write(lv)

if bad:
  print("★★言葉そのものが 変わって います。★書きません。★止まります:")
  for i, o, n in bad:
    print("   %s\n     いま %s\n     新   %s" % (i, o, n))
  sys.exit(1)

print("CHANGED: %d" % len(changed))
print("SAME: %d" % len(same))
print("UNKNOWN: %d" % len(unknown))
for i, o in unknown:
  print("   ★表に ありません: %s  %s" % (i, o))
print("MD_CHANGED: %d" % len(md_changed))
print("LIVE_CHANGED: %d" % len(live_changed))
print("MODE: %s" % ("dry-run（★--write で 書きます）" if DRY else "書きました"))

# ══════════ ⑤ ★出来上がった ものを 数え直します ══════════
#   ★★入口を 数えても、★取りこぼしは 見つかりません。
#     ★★1度 それで「UNKNOWN: 0」と 出しました。★62本 見て いません でした。
#   ★★だから 出口（`lib/learnContent.js`）を 見ます。
#     ★★`―` が 1つでも 残って いたら、★まだ 終わって いません。
if not DRY:
  after = io.open(LIVE, encoding="utf-8").read()
  left = [t for t in re.findall(r'title: "([^"]*)"', after)
          if re.search(r"(?<!─)―(?!─)", t)]
  print("REMAINING_OLD_DASH: %d" % len(left))
  for t in left[:20]:
    print("   ★まだ: " + t)
  if left:
    print("　★★まだ 終わって いません。★作り直しの 順が ちがう かも しれません ──")
    print("　　★1. この 道具（--write）")
    print("　　★2. node scripts/build-shobai-content.js")
    print("　　★3. node scripts/build-learn-content.js")
    sys.exit(1)
for i, o, n in changed[:8]:
  print("   %-9s %s\n   %-9s → %s" % (i, o, "", n))
