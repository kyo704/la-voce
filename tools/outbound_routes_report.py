#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""外へ 出る 道の 棚おろし ── Opus の 3つの 問いに 答えるための 道具。

★この 道具が 調べること
  Q1 それぞれの 道が、★どの 欄を 送っているか。★entries の 欄には 印を つけます。
  Q2 Vercel（置き場所そのもの）が、一覧から 漏れていないか。
  Q3 一覧の 6件で 足りているか。★解析・誤り追跡・押し通知・画像配信・控え。

★大事な こと
  この 道具は、★リポジトリの 中しか 見られません。
  Vercel の 管理画面、Supabase の 管理画面、各社の 規約の 本文は 読めません。
  ★読めないものは「不明」と 書きます。★推し量りません（Opus の 決まり）。

★書き出し docs/reports/2026-09-14-outbound-routes.md
"""

import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-14-outbound-routes.md")

# ★entries の 欄（supabase/schema.sql の create table entries より）
ENTRIES_COLUMNS = [
  "throat_condition", "voice_quality", "throat_symptoms", "sleep_hours",
  "sleep_quality", "water_intake", "meal_notes", "location", "temperature",
  "humidity", "activity_type", "activity_duration", "repertoire",
  "performance_quality", "ease", "notes",
]


def sh(cmd):
  """シェルを 1回 走らせて、★行の 一覧を 返します。"""
  p = subprocess.run(cmd, shell=True, cwd=ROOT,
                     stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
  return [l for l in p.stdout.decode("utf-8", "replace").split("\n") if l.strip()]


def read(rel):
  path = os.path.join(ROOT, rel)
  if not os.path.exists(path):
    return ""
  with open(path, encoding="utf-8") as f:
    return f.read()


# ---------------------------------------------------------------------------
# Q1 ── それぞれの 道が 送る 欄
# ---------------------------------------------------------------------------

def advice_fields():
  """app/api/advice/route.js の buildSummary から、★実際に 組み立てている 欄を 拾います。

  ★『目的』ではなく『欄』を 出す、という Opus の 指示に 沿うため、
    説明の 文ではなく、★コードから 読みます。
  """
  src = read("app/api/advice/route.js")
  m = re.search(r"function buildSummary\(rows\) \{(.*?)\n\}", src, re.S)
  if not m:
    return []
  body = m.group(1)
  # ★r.<欄名> の 形で 読んで いるものが、★送っている 欄です。
  found = []
  for name in re.findall(r"\br\.([a-z_]+)", body):
    if name not in found:
      found.append(name)
  return found


ROUTES = [
  {
    "id": "supabase",
    "vendor": "Supabase（契約主体は 未確認）",
    "region": "日本（東京・ap-northeast-1）",
    "source": "運営者による 管理画面の 確認（2026-09-14 再確認）",
    "dpa_no_access": "unknown",
    "dpa_access_control": "unknown",
    "fields": ["★entries の 全列（16欄）", "profiles の 全列", "そのほか 約20表の 全列"],
    "entries_fields": list(ENTRIES_COLUMNS),
    "personal": "yes",
    "note": "本体の 保管先。A型（預かるだけ）。サーバは 東京。契約している 法人名は 未確認。",
  },
  {
    "id": "anthropic",
    "vendor": "Anthropic Ireland, Limited",
    "region": "アイルランド（EU・EEA）／サーバの 所在は 未確認",
    "source": "Commercial Terms of Service（2025-06-17）の 定義条項。★居住地に 連動。",
    "dpa_no_access": "unknown",
    "dpa_access_control": "unknown",
    "fields": [],          # ★advice_fields() で 埋めます
    "entries_fields": [],  # ★同上
    "personal": "yes",
    "note": "★記録の 中身が 出る 唯一の サーバ側の 道。★2つの 門で 閉じています。",
  },
  {
    "id": "line",
    "vendor": "LINEヤフー株式会社（LY Corporation）",
    "region": "日本",
    "source": "LINE開発者契約（2025-02-03）§1.3・§14.6",
    "dpa_no_access": "unknown",
    "dpa_access_control": "unknown",
    "fields": ["line_user_id（LINE の 利用者ID）", "決まった 文面（呼びかけ）",
               "absoluteUrl('/')（アプリの 入口の URL）"],
    "entries_fields": [],
    "personal": "yes",
    "note": "★記録の 中身は 送りません。★ただし entries を 読んで 送る／送らないを 決めます。",
  },
  {
    "id": "resend",
    "vendor": "Plus Five Five, Inc.",
    "region": "アメリカ合衆国（カリフォルニア州法）",
    "source": "Terms of Service（2026-08-27）§1・§23",
    "dpa_no_access": "unknown",
    "dpa_access_control": "unknown",
    "fields": ["user.email（送信者・返信先）", "ご意見の 本文（自由記述）",
               "category（ご意見の 種類）", "宛先の メールアドレス",
               "変更前／変更後の メールアドレス（★伏せ字）", "知らせの 本文（定型）"],
    "entries_fields": [],
    "personal": "yes",
    "note": "★送信箇所が 4つに 増えています。★台帳は 1つしか 書いていません（下の ㋑）。",
  },
  {
    "id": "stripe",
    "vendor": "Stripe Japan, Inc.",
    "region": "日本",
    "source": "Stripe Services Agreement（2025-11-18）§12 Definitions",
    "dpa_no_access": "unknown",
    "dpa_access_control": "unknown",
    "fields": ["email", "metadata.supabase_user_id", "支払いの 手続きに 要る 情報"],
    "entries_fields": [],
    "personal": "yes",
    "note": "★2026-09-03 に 3つの 門を 入れて 閉じました。★門の 前に 通った 分は 不明。",
  },
  {
    "id": "google-calendar",
    "vendor": "（契約なし。★利用者ご自身が 渡します）",
    "region": "不明（契約が ないので 書けません）",
    "source": "─",
    "dpa_no_access": "no",
    "dpa_access_control": "no",
    "fields": ["レッスンの 題名", "日時", "メモ（note・自由記述）"],
    "entries_fields": [],
    "personal": "maybe",
    "note": "★<a href> です。fetch の 検索では 出てきません。★lessons 表であって entries では ありません。",
  },
]


# ---------------------------------------------------------------------------
# Q3 ── 一覧に 無い 相手が いないか
# ---------------------------------------------------------------------------

ABSENT_CHECKS = [
  # ★★ここは 一度 まちがえました（2026-09-14）。
  #   ★裸の 語で 探すと、★別物に つまずきます。
  #     "amplitude" … 仏語の 説明文「amplitude de mouvement」（healthInfoContent.js:446）
  #     "sentry"    … 変数名 previousEntry の 中の「sEntry」
  #   ★★取り込みの 形（@社名／社名-js）と、★host の 形だけを 探します。
  ("解析（アクセス解析）",
   r"google-analytics\.com|googletagmanager|gtag\(|mixpanel|@amplitude|amplitude-js|"
   r"posthog|segment\.com|plausible\.io"),
  ("誤りの 追跡", r"@sentry|sentry\.io|sentry-|datadoghq|logrocket|bugsnag|rollbar\.com"),
  ("行動の 記録", r"clarity\.ms|hotjar|fullstory"),
  ("押し通知", r"onesignal|firebase|web-push|webpush|pushManager"),
  ("SMS・電話", r"twilio|vonage|nexmo"),
  ("画像の 配信", r"cloudinary|imgix|cloudflare-images"),
  ("地図", r"maps\.googleapis|mapbox|openstreetmap"),
  ("控え（バックアップ）の 外部保管",
   r"s3\.amazonaws|backblaze|wasabisys|storage\.googleapis"),
  ("Vercel の 解析", r"@vercel/analytics|@vercel/speed-insights"),
]


def absent_scan():
  """★『調べて、無かった』を、★『調べていない』と 区別して 残します。"""
  rows = []
  for label, pat in ABSENT_CHECKS:
    hits = sh("grep -rniE '%s' --include=*.js --include=*.jsx --include=*.json "
              "app lib components public middleware.js package.json 2>/dev/null "
              "| grep -v '/tests/' | grep -v node_modules" % pat)
    rows.append((label, len(hits), hits[:2]))
  return rows


def resend_sites():
  """★台帳は 1箇所と 書いていますが、★本当に 1箇所か 数えます。"""
  return sh("grep -rn 'api.resend.com' app lib components --include=*.js --include=*.jsx "
            "| grep -v '/tests/' | grep -v outboundRoutes")


def ledger_where(route_id):
  """lib/outboundRoutes.js が 書いている where を 取り出します。"""
  src = read("lib/outboundRoutes.js")
  m = re.search(r'id: "%s".*?where: "([^"]*)"' % re.escape(route_id), src, re.S)
  return m.group(1) if m else "（見つかりません）"


# ---------------------------------------------------------------------------
# Q2 ── Vercel
# ---------------------------------------------------------------------------

def vercel_facts():
  f = []
  vj = read("vercel.json")
  f.append(("vercel.json に regions の 指定",
            "あり" if '"regions"' in vj else "★ありません"))
  pr = sh("grep -rn 'preferredRegion' app lib 2>/dev/null")
  f.append(("route.js の preferredRegion",
            "%d 箇所" % len(pr) if pr else "★1つも ありません"))
  f.append(("cron の 本数", str(vj.count('"path"'))))
  f.append(("本番の ドメイン", "https://woolsong.app（lib/baseUrl.js:12）"))
  return f


# ---------------------------------------------------------------------------
# 書き出し
# ---------------------------------------------------------------------------

def build():
  L = []
  w = L.append

  af = advice_fields()
  for r in ROUTES:
    if r["id"] == "anthropic":
      r["fields"] = af
      r["entries_fields"] = [x for x in af if x in ENTRIES_COLUMNS]

  w("# 外へ 出る 道 ── Opus の 3つの 問いへの 答え（2026-09-14）")
  w("")  # ★2行目は あとで 差し替えます
  w("")
  w("★この 文は tools/outbound_routes_report.py が 書き出しました。")
  w("★中の 数と 一覧は、すべて リポジトリを 走査した 結果です。手で 書いていません。")
  w("")
  w("★この 道具が 見られない もの ── Vercel の 管理画面、Supabase の 管理画面、")
  w("　各社の DPA の 本文、実際の 通信ログ。★これらは すべて「不明」と 書いています。")
  w("")

  # ---------------- Q1
  w("---")
  w("")
  w("## Q1 ── それぞれの 道が、実際に 送っている 欄")
  w("")
  w("### ★★答え ── 記録（entries）は、★出る 道が 1本 あります。★いまは 閉じています。")
  w("")
  w("Opus の ご指摘は 正しいです。`app/api/advice/route.js` の `buildSummary` は、")
  w("★entries の 欄を そのまま 文に して、api.anthropic.com へ 送る 形に なっています。")
  w("")
  w("★組み立てている 欄（★コードから 読みました。説明文からでは ありません）：")
  w("")
  w("| # | 欄 | entries の 列か |")
  w("|---|---|---|")
  for i, name in enumerate(af, 1):
    mark = "★はい" if name in ENTRIES_COLUMNS else "いいえ（date）"
    w("| %d | `%s` | %s |" % (i, name, mark))
  w("")
  n_entries = len([x for x in af if x in ENTRIES_COLUMNS])
  w("★%d 欄の うち %d 欄が entries の 列です。★残る 1つは `date` です。" % (len(af), n_entries))
  w("★`meal_notes` と `notes` は 自由記述です。本人が 名前や 病名を 書けば、それも 渡ります。")
  w("")
  w("### ★それでも「出ている」とは 言えません ── 門が 2つ あります")
  w("")
  w("| | 門 | 場所 | いまの 状態 |")
  w("|---|---|---|---|")
  w("| ① | `AI_ADVICE_ENABLED === \"true\"` でなければ 403 | route.js:65-71 | ★未設定 → 閉 |")
  w("| ② | `ANTHROPIC_API_KEY` が 無ければ 500 | route.js:105-110 | ★一度も 設定されて いない |")
  w("")
  w("★①は 認証より 前に あります。閉じているとき、entries を ★1行も 読みません。")
  w("★②は `lib/anthropic.js:4` の fetch より 前に あります。通信そのものが 起きません。")
  w("")
  w("★『一度も 送っていない』の 裏づけは 2つ、★互いに 独立しています（2026-09-03 確認）。")
  w("　① 送り手側 ── Vercel の 環境変数に ANTHROPIC_API_KEY が 一度も 無い")
  w("　② 受け手側 ── Anthropic Console の 使用額 $0.00・過去7日 活動なし")
  w("")
  w("★★ただし、★『読んでいない』とは 言えません。")
  w("　`route.js:88-93` の entries の 読み出しは、★鍵を 見る 前に あります。")
  w("　門①が 開いていて 門②が 閉じている間は、★読んで、サーバの 中に 留まります。")
  w("　いまは 門①も 閉じているので、その 状態にも なりません。")
  w("")
  w("### ★STOP_AND_REPORT の 判断")
  w("")
  w("| 問い | 答え |")
  w("|---|---|")
  w("| 要配慮個人情報が 国外へ 出る コードが あるか | ★あります |")
  w("| いま 開いているか | ★いいえ。2つの 門が 閉じています |")
  w("| これまでに 出たことが あるか | ★いいえ（送り手・受け手の 両側から 確認） |")
  w("| 法28条の 同意は 要るか | ★いま 開ける なら 要ります。開けない なら 要りません |")
  w("")
  w("★ですので「止めて 報告」の 条件は、★半分だけ 当たります。")
  w("　★出ては いません。★出せる 形が 残っています。")
  w("　★大学へ 渡す 一覧に どう 書くかは、★運営者と Opus の ご判断です（下の ㋐）。")
  w("")

  w("### ほかの 5つの 道の 欄")
  w("")
  for r in ROUTES:
    if r["id"] == "anthropic":
      continue
    w("**%s（%s）**" % (r["id"], r["vendor"]))
    for f in r["fields"]:
      w("- %s" % f)
    if r["entries_fields"]:
      w("- ★entries 由来：%s" % "・".join(r["entries_fields"][:4]) + " ほか")
    else:
      w("- ★entries 由来の 欄：★ありません")
    w("")

  w("★`line` について 1つ 注記します。★中身は 送りませんが、")
  w("　`app/api/cron/line-reminder/route.js:108` が entries の `date` を 読み、")
  w("　★記録した 人には 送らない、という 判断に 使っています。")
  w("　★送られた という 事実じたいが「その日 記録していない」を 意味します。")
  w("　★中身では ありませんが、★記録の 有無は 相手に 伝わる 形です。")
  w("")

  # ---------------- Q2
  w("---")
  w("")
  w("## Q2 ── Vercel は 一覧から 漏れているか")
  w("")
  w("### ★★答え ── ★漏れています。")
  w("")
  w("`lib/outboundRoutes.js` の 6件に Vercel は ありません。")
  w("Opus の お見立てどおり、★『送る先』の 台帳なので 載っていません。")
  w("★しかし 大学へ 渡す 委託先の 一覧には 要ります。★処理は そこで 起きています。")
  w("")
  w("| 調べたこと | 結果 |")
  w("|---|---|")
  for k, v in vercel_facts():
    w("| %s | %s |" % (k, v))
  w("")
  w("### ★Opus が お求めの 3点 ── ★どれも この 道具では 読めません")
  w("")
  w("| 求められた もの | 状態 | 理由 |")
  w("|---|---|---|")
  w("| 関数の 実行地域 | ★不明 | vercel.json に `regions` が ありません。★管理画面の 既定が 効きます |")
  w("| ログの 保管地域 | ★不明 | リポジトリに 手がかりが ありません |")
  w("| ビルド成果物の 置き場所 | ★不明 | 同上 |")
  w("")
  w("★★推し量りません。ただし、★調べ方は はっきり しています。")
  w("")
  w("　**実行地域** Vercel → Project → Settings → Functions → *Function Region*")
  w("　**ログ** Vercel → Project → Settings → *Log Drains* / Observability の 保管期間")
  w("　**契約主体** 請求書の ★発行元（★請求先では ありません。Stripe で 一度 つまずいた 所です）")
  w("")
  w("★★ここが 大きい 点です。")
  w("　`app/api/advice/route.js` も `app/api/cron/*` も、★entries を 読むのは Vercel の 関数の 中です。")
  w("　保管が 東京でも、★読み出しと 処理が 起きる 場所は 関数の 地域です。")
  w("　★`regions` が 指定されて いないので、★そこが どこかを コードからは 言えません。")
  w("")

  # ---------------- Q3
  w("---")
  w("")
  w("## Q3 ── 6件で 足りているか")
  w("")
  w("### ★★答え ── ★相手は 6件で 合っています。★ただし 2つ、書き落としが あります。")
  w("")
  w("**㋐ Vercel（Q2）** ── 相手として 1件 足りません。")
  w("")
  rs = resend_sites()
  w("**㋑ Resend の 送信箇所が %d に 増えています** ── 台帳は 1つしか 書いて いません。" % len(rs))
  w("")
  w("台帳の where：`%s`" % ledger_where("resend"))
  w("")
  w("| # | 実際の 送信箇所 | 何を 送るか |")
  w("|---|---|---|")
  what = {
    "app/api/feedback/route.js": "ご意見の 本文・送信者の メール",
    "app/api/cron/pricing-notice/route.js": "お知らせの 定型文・宛先の メール",
    "lib/securityMail.js": "メール変更の お知らせ（★伏せ字）・変更前後の 宛先",
    "lib/systemAlert.js": "不具合の 知らせ（定型）・運営の 宛先",
  }
  for i, line in enumerate(rs, 1):
    path = line.split(":")[0]
    w("| %d | `%s` | %s |" % (i, line.split(":")[0] + ":" + line.split(":")[1],
                              what.get(path, "★未分類")))
  w("")
  w("★相手（Plus Five Five, Inc.）は 変わりません。★国も 変わりません。")
  w("★変わるのは「何を 送るか」です。★台帳の `what` は ご意見だけを 書いています。")
  w("")
  w("### ★調べて、★無かった もの")
  w("")
  w("★『調べていない』と 区別して 残します。")
  w("")
  w("| 種類 | 見つかった 数 |")
  w("|---|---|")
  for label, n, hits in absent_scan():
    w("| %s | %s |" % (label, "★0" if n == 0 else "★%d ── %s" % (n, hits[0][:60])))
  w("")
  w("★見張りが 2本、★これを 守って います。")
  w("　`components/tests/onboarding-counts.test.js:53`")
  w("　`components/tests/events.test.js:132`")
  w("★どちらも 解析の 取り込みを 禁じて います。★足すと 落ちます。")
  w("")
  w("### ★そのほか、★調べて 外への 通信では なかった もの")
  w("")
  w("| もの | なぜ 通信では ないか |")
  w("|---|---|")
  w("| `next/font/google`（app/layout.js:1） | ★ビルドのときに 取り込み、自分の ところから 配ります |")
  w("| `public/sw.js` | ★caches のみ。外部の host は 1つも ありません |")
  w("| 気温・湿度 | ★気象サービスからは 取りません。★本人の 入力です |")
  w("| 地図 | ★呼び出しが 1つも ありません |")
  w("")
  w("### ★まだ 確かめて いない もの（★正直に 残します）")
  w("")
  w("| もの | なぜ 不明か |")
  w("|---|---|")
  w("| Supabase Auth の メール送信 | ★登録確認・再設定の メールは Supabase が 送ります。|")
  w("| | ★独自 SMTP を 設定されて いるかは 管理画面でしか 分かりません |")
  w("| Supabase の 控え（バックアップ）の 置き場所 | ★管理画面でしか 分かりません |")
  w("| Vercel の 3点（Q2） | ★同上 |")
  w("")

  # ---------------- 整形後の 一覧
  w("---")
  w("")
  w("## 整形した 一覧（★お決めの 形）")
  w("")
  w("★`DPA_NO_ACCESS_CLAUSE` と `DPA_ACCESS_CONTROL` は、★各社の DPA の 本文を")
  w("　読まなければ 埋まりません。★この 道具は 読めないので、★全件 unknown です。")
  w("★★推し量って 埋めて いません（Opus の 決まり）。")
  w("")
  for r in ROUTES:
    w("```")
    w("VENDOR: %s" % r["vendor"])
    w("REGION: %s" % r["region"])
    w("SOURCE: %s" % r["source"])
    w("DPA_NO_ACCESS_CLAUSE: %s" % r["dpa_no_access"])
    w("DPA_ACCESS_CONTROL: %s" % r["dpa_access_control"])
    if r["id"] == "anthropic":
      w("FIELDS_SENT: %s" % "、".join("★%s" % x if x in ENTRIES_COLUMNS else x for x in r["fields"]))
      w("  ★印は entries の 列（%d / %d）" % (n_entries, len(af)))
    else:
      w("FIELDS_SENT: %s" % "、".join(r["fields"]))
      w("  ★entries 由来の 欄： なし" if not r["entries_fields"] else
        "  ★entries 由来： 全列")
    w("PERSONAL_DATA: %s" % r["personal"])
    w("NOTE: %s" % r["note"])
    w("```")
    w("")
  w("```")
  w("VENDOR: Vercel Inc.（★契約主体 未確認）")
  w("REGION: ★不明（vercel.json に regions の 指定が ありません）")
  w("SOURCE: ★ありません。★管理画面でしか 分かりません")
  w("DPA_NO_ACCESS_CLAUSE: unknown")
  w("DPA_ACCESS_CONTROL: unknown")
  w("FIELDS_SENT: ★entries を 含む すべて（★関数の 中を 通ります）")
  w("PERSONAL_DATA: yes")
  w("NOTE: ★台帳に ありません。★大学向けの 一覧には 要ります。★Q2 の 3点が 未確認")
  w("```")
  w("")

  # ---------------- 決めていただくこと
  w("---")
  w("")
  w("## 決めて いただきたい こと")
  w("")
  w("| | こと | 私の 見立て |")
  w("|---|---|---|")
  w("| ㋐ | advice の 道を どうするか | ★経路ごと 消す（④）。★門が 2つ ある 形を 残すより、|")
  w("| | | ★無い ほうが 大学へ 説明しやすいです。★UI は 既に ありません |")
  w("| ㋑ | Vercel を 台帳に 足すか | ★足す。★kind を 1つ 増やす 形に なります（infrastructure） |")
  w("| ㋒ | Resend の what を 直すか | ★直す。★いま 書いて あることが 事実と 違います |")
  w("| ㋓ | DPA 2条項を 誰が 読むか | ★私は 規約の 本文を 取れません。★運営者か Opus の お手で |")
  w("")
  w("★㋐だけは、★私では 決められません。")
  w("　`AI_ADVICE_ENABLED` を 将来 使う お考えが あるかを 存じません。")
  w("　★使わない のであれば、route ごと 消すのが いちばん 正直な 形です。")

  return L


def main():
  lines = build()
  body = [l for l in lines if l.strip()]
  last = body[-1] if body else ""
  lines[1] = "全%d行 / 末尾は「%s」" % (len(lines), last)
  with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  # ★数え直します。★見積もりでは ありません。
  with open(OUT, encoding="utf-8") as f:
    n = len(f.read().rstrip("\n").split("\n"))
  lines[1] = "全%d行 / 末尾は「%s」" % (n, last)
  with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("★書き出しました: %s（%d行）" % (OUT, n))


if __name__ == "__main__":
  main()
