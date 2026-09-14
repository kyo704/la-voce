#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""2つの 層の 表の 一覧 ── ★ここ 1か所だけ（2026-09-15）。

  ★出どころ 裁定 その55 ／ その57（★Opus・坂本さん 承認）

  ★★層は 2つ です。
    ★健康の 層 … ★その 方 ご自身が 書いた もの・ご自身の もの
    ★学務の 層 … ★学校から お預かりした もの・学校の しくみ

  ★★禁じて いるのは「★層を またいで 1つに する」こと **だけ** です。
    ★○ 学務どうし ── ★どの 組み合わせでも 自由
    ★○ 健康どうし ── ★同じく 自由
    ★✕ 健康 × 学務 ── ★1つの 問い・関数・画面の 中で

  ★★表を 名前で 見分けません。★**一覧に 載って いるか** で 見ます。
    ★★別の 名前の 関数が あとから 増えても、★表が 同じなら 捕まえます。

  ★★どちらにも 載って いない 表は、★**報告します**。★当てずっぽうで 決めません。
"""

# ============================================================================
# ★★2026-09-15、★はじめ **広すぎ** ました。★狭めます。
#
#   ★★Opus の 言葉 ── 「read this twice. the guard must not be too wide」
#     「if the guard flags any of these, it is wrong. fix the guard」
#
#   ★★1度目の 一覧では、★`profiles` と `link_consents` を 健康の 層に 入れ、
#     ★7件を ✕ と 数えました。★そのうち **7件 とも** 誤りです ──
#       `get_org_member_names`  memberships × profiles ── ★お名前を 引くだけ
#       `get_invitation_teacher` teacher_invitations × profiles ── ★同じ
#       `accept_teacher_invitation` teacher_student_links × link_consents
#         ★★つながる ことへの 同意 です。★つながりの 仕組み そのもの。
#     ★★どれも「記録の 中身」では ありません。
#
#   ★★Opus の 線引きは こうです ──
#       personal layer (健康)   entries
#                               and anything holding ★記録 content
#     ★★「本人の もの」では なく、★「★記録の 中身を 持つ もの」です。
#
#   ★★だから、★**3つ**に 分けます。
#     ① 記録の 層 … ★危ない 側。★学務と 混ぜて は いけません
#     ② 学務の 層 … ★もう 一方の 危ない 側
#     ③ 本人の その他 … ★本人の ものだが 記録では ない。
#         ★★学務と つないで よい（★お名前を 引く、など。★必要な 仕事です）
# ============================================================================

# ★① 記録の 層 ── ★その 方が 書いた「中身」を 持つ もの
HEALTH = {
  "entries": "★記録そのもの",
  "cycle_periods": "★周期の 開始日（★本人だけ・先生にも 見せません）",
  "import_staging": (
    "★★1年ぶんの 取り込みの 置き場。★列が entries そのものです"
    "（throat_condition・voice_quality・voice_memo・meal_notes・weight_kg ほか）。"
    "★★2026-09-15、★Opus の 一覧は これを 学務に 置いて いました。"
    "　★列を 読むと 記録の 層です。★anon にも authenticated にも 権限が ありません。"),
  "performances": (
    "★★本人が 自分で 登録した 本番。★Opus の 但し書き ──"
    "　★『学生が 自分で 登録した 本番 × entries は ○（同じ 層）』。"
    "　★★`org_events` から 日付を 引いた 時点で、★層を またぎます"),
  "performance_results": "★その 本番の 出来（★本人が 書いた 中身）",
  "period_markers": "★本人が 印を つけた日（★体の こと）",
  "notes": "★本人の ノート（★自由記述の 中身）",
  "article_notes": "★本人の 書き込み（★自由記述の 中身）",
  "questionnaire_responses": "★本人の 答え（★中身）",
}

# ★② 学務の 層 ── ★学校から お預かりした もの／学校の しくみ
ORG = {
  "organizations": "★教室・学校",
  "memberships": "★職員の 在籍",
  "enrollments": "★生徒の 在籍",
  "assignments": "★先生の 受け持ち",
  "org_posts": "★役職と できること",
  "org_events": "★学校の 行事",
  "org_event_participants": "★行事の 出欠",
  "org_messages": "★学校の 連絡",
  "org_message_reads": "★連絡を 読んだ 印",
  "org_invitations": "★教室への 招待",
  "org_master": "★学校の 形（学部・学科・学年）",
  "lessons": "★レッスンの 日程",
  "attendance": "★レッスンの 出欠",
  "teacher_student_links": "★先生と 生徒の つながり",
  "teacher_invitations": "★先生からの 招待",
  "teacher_notes": "★先生が 生徒に ついて 書く もの",
  "notice_targets": "★お知らせの 宛先",
  "notice_batches": "★お知らせの 束",
}

# ★③ 本人の その他 ── ★本人の ものだが、★「記録の 中身」では ない
#   ★★学務と つないで **よい** もの です。★止めません。
#     ★★`memberships` × `profiles` は、★お名前を 出す ために 要ります。
#     ★★`teacher_student_links` × `link_consents` は、★つながりの 仕組み です。
#   ★★ただし、★載せて おきます。★「見て いない」と「見て、よいと した」は 別 です。
PERSONAL_OTHER = {
  "profiles": "★本人の 情報（★お名前・職業ほか）。★学務と つないで よい",
  "link_consents": "★先生と つながる ことへの 同意。★つながりの 仕組みの 一部",
  "consent_records": "★本人の 同意",
  "my_periods": "★本人の コマ割り",
  "my_timetable": "★本人の 時間割",
  "events": "★本人の 行事（★org_events とは 別の 表）",
  "repertoire_tessitura": "★本人の 曲の 音域",
  "role_master": "★本人の 役の 一覧",
  "project_master": "★本人の 舞台の 一覧",
  "article_progress": "★本人の 読んだ ところ",
  "chapter_state": "★本人の 進み",
  "character_inventory": "★本人の 持ちもの（★羊）",
  "item_acquisitions": "★本人が 受け取った もの（★羊）",
  "purchases": "★本人の 買いもの",
  "account_deletions": "★本人の 退会",
  "age_answer_changes": "★本人の 年齢の 答えの 変わり",
  "email_change_log": "★本人の メールの 変わり",
  "cohort_changes": "★本人の 群の 変わり",
  "minor_billing_consents": "★本人（保護者）の 同意",
  "recovery_codes": "★本人の 合いことば",
  "user_notices": "★本人に 出した お知らせの 控え",
  "subscriptions": "★本人の 契約",
  "onboarding_counts": "★数だけ（★人を 指しません）",
}

# ★★どれにも 入れて いない 表（★当てずっぽうで 決めません）。
UNDECIDED = {
  "feedback": "★本人が 送った ご意見。★運営が 読みます。★どちらとも 言えます",
  "system_alerts": "★運営への 知らせ。★人を 指しません",
  "_a13_policy_backup": "★決まりの 控え（★仕事の 跡）",
}


def layer_of(table):
  if table in HEALTH:
    return "health"
  if table in ORG:
    return "org"
  return None


def reason_of(table):
  return (HEALTH.get(table) or ORG.get(table)
          or PERSONAL_OTHER.get(table) or UNDECIDED.get(table) or "")


def known(table):
  """★一覧に 載って いるか（★どの 層でも）。"""
  return (table in HEALTH or table in ORG
          or table in PERSONAL_OTHER or table in UNDECIDED)
