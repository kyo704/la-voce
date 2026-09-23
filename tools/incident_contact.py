#!/usr/bin/env python3
"""★★★障害の お知らせの 宛先を 入れます（★sql/37 の `org_contacts`）。

  ★★★なぜ 要るか ── ★`docs/様式/障害の連絡_様式_2026-09-23.md` の 末尾 ──
    「★本番の7学校とも いま 宛先が空です → ★出発前に 入れて、★実際に届くか 試すこと
      （通知は メールだけが頼りです。届かなければ、この様式は 使えません）」

  ★★★住所は **書きません**。★坂本さんの お決め です。
    ★`--mail` で 渡すか、★`INCIDENT_MAIL` から 借ります。

  ★★何度 走らせても 同じ です ── ★同じ 学校・同じ 用途・同じ 住所は 作りません
    （★`org_contacts_unique` が 効きます）。

  python3 tools/incident_contact.py                      ★いまを 数えるだけ
  python3 tools/incident_contact.py --mail a@b.jp        ★下見（入れません）
  python3 tools/incident_contact.py --mail a@b.jp --ok   ★試しに 入れます
  python3 tools/incident_contact.py --mail a@b.jp --ok --honban  ★本番に 入れます
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mgmt import q, HON

TAMESHI = "orutyqtfygvzcuhjgsch"


def 数える(ref):
  無 = q(ref, "select org_id, org_name from public.orgs_without_incident_contact() order by 2")
  ぜ = q(ref, "select count(*) c from public.organizations")[0]["c"]
  return 無, ぜ


def main(引):
  本番 = "--honban" in 引
  ref = HON if 本番 else TAMESHI
  mail = next((引[i + 1] for i, x in enumerate(引) if x == "--mail" and i + 1 < len(引)), None) \
      or os.environ.get("INCIDENT_MAIL")
  print("★送り先 ……", "★★本番" if 本番 else "試し")
  無, ぜ = 数える(ref)
  print("★宛先の 無い 学校 …… %d ／ 学校ぜんぶ %d" % (len(無), ぜ))
  for x in 無:
    print("   ・%s  %s" % (x["org_id"][:8], x["org_name"]))
  if not mail:
    print("\n★住所が ありません。★`--mail <住所>` か `INCIDENT_MAIL` で 渡して ください。")
    print("  ★★住所は 坂本さんの お決め です。★私は 書きません。")
    return 0 if not 無 else 2
  if "@" not in mail or " " in mail:
    print("★止まりました ── ★住所の 形が ちがいます。"); return 2
  print("\n★入れる 住所 …… %s" % mail)
  if "--ok" not in 引:
    print("★入れて いません。★入れる なら --ok を 付けて ください。"); return 0
  for x in 無:
    q(ref, """insert into public.org_contacts (org_id, kind, email, name_at, note)
              values ('%s','incident','%s','（訓練の 宛先）','障害の 訓練の ため（2026-09-23）')
              on conflict do nothing""" % (x["org_id"], mail.replace("'", "''")))
    print("   ★入れました …… %s" % x["org_name"])
  無2, _ = 数える(ref)
  print("\n★宛先の 無い 学校 …… %d（★0 が 正）" % len(無2))
  if 無2:
    print("RESULT: NG"); return 1
  print("RESULT: OK ── ★★★このあと、★実際に 届くかを 1度 試して ください。")
  print("  ★★届かない 宛先は、★無い のと 同じ です。")
  return 0


if __name__ == "__main__":
  sys.exit(main(sys.argv[1:]))
