#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★試しの 台帳の 種（★FX7 の P2・2026-09-23）。

  ★★★1本に まとめます。★あちこちの seed_*.sql を 足して いくと、
    ★どこまで 入れたかが 分からなく なります（★2026-09-22 まで それでした）。

  ★★入れる もの（★FX7 の 手順書 P2 の とおり）──
    ・学校 2つ（★1つは 教室くらいの 大きさ）
    ・学長・事務長・課長・先生2・学生3・保護者1
    ・札の 組み合わせ（★`monka_read` を **切った** ものも）
    ・名簿・担当・レッスン・連絡・行事・公演 を 最小限

  ★★★人は **管理の API** で 作ります。★合言葉は 環境から 借ります。
    ★SQL に 書きません。★記録にも 画面にも 出しません。

  ★★何度 流しても 同じに なります（★`on conflict do nothing` と、★人は 在れば 使い回す）。

  ★使い方
    python3 tools/test_seed.py --dry      ★何を するかだけ 出す（★書きません）
    python3 tools/test_seed.py --ok       ★試しの 台帳に 入れる
    python3 tools/test_seed.py --ok --ref <project-ref>   ★別の 入れ物に 入れる（★FX7 の 新しい 試し）
"""
import json, os, re, subprocess, sys, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_REF = "smntpurraumeerselvsc"
HONBAN_REF = "xxjtplvpcneksrofkjmf"

# ★★人（★合言葉は 環境から。★ここには 書きません）
#   ★★`TEST_SEED_PASSWORD` が 無ければ 止まります。
HITO = [
  ("gakucho",  "★学長 いちろう",   "gakucho"),
  ("jimucho",  "★事務長 じろう",   "jimucho"),
  ("kacho",    "★課長 さぶろう",   "kacho"),
  ("sensei1",  "★先生 はなこ",     None),
  ("sensei2",  "★先生 ゆきこ",     None),
  ("gakusei1", "★学生 あきら",     None),
  ("gakusei2", "★学生 みなみ",     None),
  ("gakusei3", "★学生 かおる",     None),
  ("hogosha1", "★保護者 まもる",   None),
]

# ★★役職と できこと（★`monka_read` を 切った ものを 必ず 1つ 入れます）
YAKU = [
  ("学長",   {"master": True, "post": True, "bill": True, "bill_pay": True, "meibo": True,
              "sched_all": True, "gyoji": True, "renraku_all": True, "shukketsu": True,
              "koma": True, "saiten": True}),
  ("事務長", {"meibo": True, "sched_all": True, "gyoji": True, "renraku_all": True,
              "monka_read": True}),                    # ★門下を 読める 人（★1人だけ）
  ("課長",   {"meibo": True, "renraku_all": True}),    # ★`monka_read` を **切った** 人
  ("教授",   {"sched_mine": True, "monka_write": True, "shukketsu": True, "koma_mine": True}),
]

ORG1 = "aaaa0001-0000-4000-8000-000000000001"   # ★学校（大きい ほう）
ORG2 = "aaaa0002-0000-4000-8000-000000000002"   # ★教室くらい


def 合言葉():
  t = os.environ.get("SUPABASE_ACCESS_TOKEN")
  if t:
    return t
  f = os.path.expanduser("~/.bash_profile")
  return subprocess.run(
    ["bash", "-lc", 'source "%s" >/dev/null 2>&1; printf %%s "$SUPABASE_ACCESS_TOKEN"' % f],
    capture_output=True, text=True).stdout.strip()


def 問う(ref, sql):
  r = urllib.request.Request(
    "https://api.supabase.com/v1/projects/%s/database/query" % ref,
    data=json.dumps({"query": sql}).encode(),
    headers={"Authorization": "Bearer " + 合言葉(), "Content-Type": "application/json"})
  try:
    return json.loads(urllib.request.urlopen(r, timeout=120).read().decode() or "null")
  except urllib.error.HTTPError as e:
    # ★★どの SQL で 断られたかを 出します。★出さないと、★長い 追いかけに なります。
    print("  ★台帳が 断りました ──", e.read().decode()[:220].replace("\n", " "))
    print("  ★その SQL ……", " ".join(sql.split())[:160])
    raise


def 人を作る(ref, key, pw):
  """★管理の API で 作ります。★在れば そのまま 使います。"""
  base = "https://%s.supabase.co" % ref
  mail = "kyo0703opera+seed_%s@gmail.com" % key
  # ★先に 探します（★何度 流しても 同じに する ため）
  r = urllib.request.Request(
    base + "/auth/v1/admin/users?per_page=200",
    headers={"apikey": SERVICE, "Authorization": "Bearer " + SERVICE})
  got = json.loads(urllib.request.urlopen(r, timeout=60).read().decode())
  for u in got.get("users", []):
    if u.get("email") == mail:
      return u["id"], False
  r = urllib.request.Request(
    base + "/auth/v1/admin/users",
    data=json.dumps({"email": mail, "password": pw, "email_confirm": True}).encode(),
    headers={"apikey": SERVICE, "Authorization": "Bearer " + SERVICE,
             "Content-Type": "application/json"})
  u = json.loads(urllib.request.urlopen(r, timeout=60).read().decode())
  return u["id"], True


SERVICE = ""


def main():
  global SERVICE
  a = sys.argv[1:]
  ref = TEST_REF
  if "--ref" in a:
    ref = a[a.index("--ref") + 1]
  if ref == HONBAN_REF:
    print("★止まりました ── ★本番には 入れません。")
    return 2
  dry = "--ok" not in a

  # ★★合言葉は 環境から。★無ければ `.env.e2e`（★git に 入りません）から。
  #   ★★ほかの 試しの 口の 合言葉も、★そこに 置いて あります。★揃えます。
  pw = os.environ.get("TEST_SEED_PASSWORD")
  if not pw:
    try:
      for l in open(os.path.join(ROOT, ".env.e2e"), encoding="utf-8"):
        m = re.match(r"^\s*TEST_SEED_PASSWORD\s*=\s*(.*)$", l)
        if m:
          pw = m.group(1).strip().strip('"').strip("'")
    except OSError:
      pass
  if not pw and not dry:
    print("★止まりました ── ★合言葉が ありません（TEST_SEED_PASSWORD）。")
    print("  ★SQL にも ここにも 書きません。★環境か `.env.e2e` から 借ります。")
    print("  ★入れ方 …… `.env.e2e` に 1行 足して ください ──")
    print("      TEST_SEED_PASSWORD=<長い 文字>")
    return 2

  # ★service role の 鍵（★人を 作る ため）
  for l in open(os.path.join(ROOT, ".env.local"), encoding="utf-8"):
    m = re.match(r"^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)$", l)
    if m:
      SERVICE = m.group(1).strip().strip('"').strip("'")
  if not SERVICE and not dry:
    print("★止まりました ── ★service role の 鍵が ありません。")
    return 2

  print("TEST_SEED  送り先 ……", ref, "／", "★下見（書きません）" if dry else "★入れます")
  print("  人 …… %d人 ／ 役職 …… %d ／ 学校 …… 2" % (len(HITO), len(YAKU)))
  for k, n, y in HITO:
    print("    %-10s %-16s %s" % (k, n, ("役職 " + y) if y else "―"))
  if dry:
    print("RESULT: ★下見だけ です。★入れる なら --ok を 付けて ください。")
    return 0

  ids = {}
  for k, n, _ in HITO:
    uid, 新 = 人を作る(ref, k, pw)
    ids[k] = uid
    print("  %-10s %s %s" % (k, uid, "★作りました" if 新 else "（すでに あります）"))

  def q(sql):
    問う(ref, sql)

  # ★学校
  q("""insert into public.organizations (id, name, kind, created_by) values
       ('%s','★たしかめ学園（大）','studio','%s'),
       ('%s','★たしかめ教室（小）','solo','%s')
       on conflict (id) do nothing""" % (ORG1, ids["gakucho"], ORG2, ids["sensei1"]))

  # ★役職
  for i, (名, perms) in enumerate(YAKU):
    q("""insert into public.org_posts (id, org_id, name, perms) values
         ('bbbb%04d-0000-4000-8000-000000000001','%s','%s','%s'::jsonb)
         on conflict (id) do nothing"""
      % (i + 1, ORG1, 名, json.dumps(perms)))

  # ★名簿（★役職つき）
  対 = [("gakucho", 1), ("jimucho", 2), ("kacho", 3), ("sensei1", 4), ("sensei2", 4)]
  for k, i in 対:
    q("""insert into public.memberships (org_id, user_id, role, post_id) values
         ('%s','%s','admin','bbbb%04d-0000-4000-8000-000000000001')
         on conflict (org_id, user_id) do update set post_id = excluded.post_id"""
      % (ORG1, ids[k], i))

  # ★★年齢の 区分（★`assert_student_is_adult` が 見ます）。
  #   ★★答えて いない 口は 先生と つながれません（★裁定の とおり）。
  #   ★★★`is_under_18` は サーバ専用の 列 です（★束2b①）。★ここは 管理の 口 なので 通ります。
  #     ★★画面からは 書けません。★それで 正しい です。
  #   ★★2026-09-23、★ここを 入れずに 走らせて `MINOR_TEACHER_LINK_BLOCKED` で 止まりました。
  #     ★止まった のは **正しい** 動き です。★種の ほうが 足りて いません でした。
  q("""update public.profiles set is_under_18 = false
        where id in (%s)""" % ",".join("'%s'" % ids[k] for k in
                                       ("gakusei1", "gakusei2", "gakusei3",
                                        "sensei1", "sensei2", "gakucho", "jimucho",
                                        "kacho", "hogosha1")))

  # ★在籍・担当・レッスン
  for k in ("gakusei1", "gakusei2", "gakusei3"):
    q("""insert into public.enrollments (org_id, student_id, status) values ('%s','%s','active')
         on conflict (org_id, student_id) do update set status = 'active'""" % (ORG1, ids[k]))
  # ★★`assignments` には **部分** 索引が あります（★sql/05・`where ended_at is null`）。
  #   ★★`on conflict do nothing` は 部分索引に 効きません。★先に 消して から 入れます。
  #   ★★2026-09-23、★ここで 400 に なりました。
  q("""delete from public.assignments where org_id = '%s'""" % ORG1)
  q("""insert into public.assignments (org_id, teacher_id, student_id) values
       ('%s','%s','%s'), ('%s','%s','%s')"""
    % (ORG1, ids["sensei1"], ids["gakusei1"], ORG1, ids["sensei2"], ids["gakusei2"]))
  q("""delete from public.lessons where org_id = '%s'""" % ORG1)
  q("""insert into public.lessons (org_id, teacher_id, student_id, scheduled_at, duration_minutes, created_by)
       values ('%s','%s','%s', (current_date + 2) + time '15:00', 45, '%s')"""
    % (ORG1, ids["sensei1"], ids["gakusei1"], ids["sensei1"]))

  # ★連絡・行事
  q("""delete from public.org_messages where org_id = '%s'""" % ORG1)
  q("""insert into public.org_messages (org_id, teacher_id, author_id, body, author_name_at) values
       ('%s','%s','%s','★種の 連絡（門下）','★先生 はなこ'),
       ('%s',null,'%s','★種の お知らせ（学校ぜんぶ）','★学長 いちろう')"""
    % (ORG1, ids["sensei1"], ids["sensei1"], ORG1, ids["gakucho"]))
  q("""delete from public.org_events where org_id = '%s'""" % ORG1)
  q("""insert into public.org_events (org_id, event_date, kind, title, created_by) values
       ('%s', current_date + 10, '合わせ', '★種の 行事', '%s')""" % (ORG1, ids["gakucho"]))

  # ★公演（★子ども 1人・保護者つき）
  q("""insert into public.koen (id, org_id, owner_user_id, title, kind, status) values
       ('cccc0001-0000-4000-8000-000000000001','%s','%s','★種の 公演','opera','open')
       on conflict (id) do nothing""" % (ORG1, ids["gakucho"]))
  q("""delete from public.koen_kids where koen_id = 'cccc0001-0000-4000-8000-000000000001'""")
  q("""insert into public.koen_kids (koen_id, guardian_user_id, nickname) values
       ('cccc0001-0000-4000-8000-000000000001','%s','★たねの子')""" % ids["hogosha1"])

  数 = 問う(ref, """select
      (select count(*) from public.organizations) o,
      (select count(*) from public.memberships) m,
      (select count(*) from public.enrollments) e,
      (select count(*) from public.assignments) a,
      (select count(*) from public.lessons) l,
      (select count(*) from public.org_messages) g,
      (select count(*) from public.org_events) v,
      (select count(*) from public.koen) k""")
  print("  数 ……", 数)
  print("RESULT: ★入れました。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
