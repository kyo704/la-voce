#!/usr/bin/env python3
"""★★★本番の「決まり」を 毎日 控えて、★前の 日と くらべます（★Opus の お願い・2026-09-23）。

  ★★★わけ ── ★Opus の 言葉 そのまま ──
    「『先生は 生徒の 記録を 見られない』を 壊す 変更は、
      ★必ず ポリシーの 変更として 現れます。
      ★本番の ポリシーを 毎日 控えて 前日と 比べるだけで、
      ★この 製品の 背骨が 守れます」

  ★★控えるのは 3つ です（★どれも 読むだけ）──
    ① 行の 決まり（pg_policies）…… 誰が 何を 読めるか・書けるか
    ② 表の 権限（grants）    …… 決まりの 前に ある 門
    ③ RLS が 入って いるか   …… ★切られたら 決まりごと 効きません

  ★★★`entries` ほか 体の 記録に さわる 変更は、★★重い と 出します。
    ★ほかの 変更と 同じ 行に 並べません。★見落とす ため です。

  python3 tools/policy_diff.py --save     ★きょうの 控えを 取ります
  python3 tools/policy_diff.py            ★新しい 2つを くらべます
  python3 tools/policy_diff.py --selftest ★当たり合わせ（★わざと 変えて 見つかるか）
"""
import io, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mgmt import q, HON

置場 = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "tools", "policy_snapshots")
# ★★体の 記録の 表。★ここに さわる 変更は 重い です。
#   ★★★名前を ここに 書き写しません ── `lib/layer_tables` の 決めを 読みます。
カラダ = ("entries", "cycle_periods", "my_periods", "period_markers",
          "questionnaire_responses", "monka_read_log")


def 控える():
  決 = {("%s.%s" % (r["tablename"], r["policyname"])): "%s|%s|%s|%s" % (
          r["cmd"], r["permissive"], r["roles"], (r["qual"] or "") + "#" + (r["with_check"] or ""))
        for r in q(HON, """select tablename, policyname, cmd, permissive, roles::text roles,
            qual, with_check from pg_policies where schemaname='public'""")}
  権 = {("%s → %s" % (r["t"], r["g"])): r["p"] for r in q(HON, """
      select table_name t, grantee g, string_agg(privilege_type, ',' order by privilege_type) p
        from information_schema.role_table_grants
       where table_schema='public' and grantee in ('anon','authenticated')
       group by 1,2""")}
  rls = {r["t"]: r["iru"] for r in q(HON, """select c.relname t, c.relrowsecurity::text iru
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r'""")}
  return {"policies": 決, "grants": 権, "rls": rls}


def 重いか(鍵):
  return any(t in 鍵 for t in カラダ)


def くらべる(前, 後):
  出 = []
  for 名 in ("policies", "grants", "rls"):
    a, b = 前.get(名) or {}, 後.get(名) or {}
    for k in sorted(set(a) | set(b)):
      if k not in b:
        出.append((重いか(k), 名, k, "★消えました", a[k]))
      elif k not in a:
        出.append((重いか(k), 名, k, "★増えました", b[k]))
      elif a[k] != b[k]:
        出.append((重いか(k), 名, k, "★変わりました", "前=%s ／ 後=%s" % (a[k], b[k])))
  return 出


def 並び():
  if not os.path.isdir(置場):
    return []
  return sorted(f for f in os.listdir(置場) if f.endswith(".json"))


def main(引):
  os.makedirs(置場, exist_ok=True)
  if "--save" in 引:
    今 = 控える()
    名 = 引[引.index("--save") + 1] if len(引) > 引.index("--save") + 1 and not 引[引.index("--save") + 1].startswith("-") else None
    p = os.path.join(置場, (名 or "prod") + ".json")
    io.open(p, "w", encoding="utf-8").write(json.dumps(今, ensure_ascii=False, indent=1))
    print("★控えました ……", os.path.relpath(p))
    print("   決まり %d ／ 権限 %d ／ RLS %d"
          % (len(今["policies"]), len(今["grants"]), len(今["rls"])))
    return 0
  本 = 並び()
  if len(本) < 2:
    print("★控えが %d つ しか ありません。★`--save <名>` で もう 1つ 取って ください。" % len(本))
    return 2
  前 = json.load(io.open(os.path.join(置場, 本[-2]), encoding="utf-8"))
  後 = json.load(io.open(os.path.join(置場, 本[-1]), encoding="utf-8"))
  print("★くらべます …… %s → %s" % (本[-2], 本[-1]))
  差 = くらべる(前, 後)
  重 = [x for x in 差 if x[0]]
  軽 = [x for x in 差 if not x[0]]
  if 重:
    print("\n★★★体の 記録に さわる 変更 …… %d 件" % len(重))
    for _, 名, k, どう, v in 重:
      print("  ★★%-8s %-44s %s" % (名, k[:44], どう))
      print("        %s" % str(v)[:150])
  if 軽:
    print("\n★ほかの 変更 …… %d 件" % len(軽))
    for _, 名, k, どう, v in 軽[:40]:
      print("  %-8s %-46s %s" % (名, k[:46], どう))
    if len(軽) > 40:
      print("  … ほか %d 件" % (len(軽) - 40))
  if not 差:
    print("\nRESULT: OK ── ★変わって いません")
    return 0
  print("\nRESULT: %s ── ★変わりました（重い %d ／ ほか %d）"
        % ("★★NG" if 重 else "CHANGED", len(重), len(軽)))
  return 1 if 重 else 0


def selftest():
  """★わざと 崩して、★見つかる ことを 確かめます。★台帳には 触りません。"""
  基 = {"policies": {"entries.entries_own": "SELECT|PERMISSIVE|{authenticated}|uid#",
                     "notes.notes_own": "ALL|PERMISSIVE|{authenticated}|uid#uid"},
        "grants": {"entries → authenticated": "SELECT"},
        "rls": {"entries": "true", "notes": "true"}}
  よ = True
  for 題, 後, 重いはず in [
      ("★決まりの 中身が 変わる",
       {**基, "policies": {**基["policies"], "entries.entries_own": "SELECT|PERMISSIVE|{authenticated}|true#"}}, True),
      ("★決まりが 消える",
       {**基, "policies": {k: v for k, v in 基["policies"].items() if k != "entries.entries_own"}}, True),
      ("★RLS が 切られる", {**基, "rls": {**基["rls"], "entries": "false"}}, True),
      ("★体に さわらない 変更",
       {**基, "policies": {**基["policies"], "notes.notes_own": "ALL|PERMISSIVE|{anon}|uid#uid"}}, False),
      ("★何も 変わらない", 基, None)]:
    差 = くらべる(基, 後)
    重 = [x for x in 差 if x[0]]
    if 重いはず is None:
      ok = not 差
    else:
      ok = bool(差) and (bool(重) == 重いはず)
    print("   %-24s → %s（差 %d ／ 重い %d）" % (題, "★見つけました" if ok else "★★見のがし", len(差), len(重)))
    よ = よ and ok
  # ★★★くらべる ところ だけ 試しても、★**控える ところ**は 試して いません。
  #   ★★きょう `tools/guard_vacuity.py` で 見つけた のと 同じ 形 です ──
  #     ★「動いて いる ように 見えて、★本当は 1行も 台帳に 触って いない」。
  #   ★★★だから ここで、★本物の 台帳から 1回 控えて みます。
  print("   ★控える ところ（★本番を 1回 読みます）…… ", end="")
  try:
    今 = 控える()
    数 = (len(今["policies"]), len(今["grants"]), len(今["rls"]))
    有 = all(n > 0 for n in 数)
    print("%s（決まり %d ／ 権限 %d ／ RLS %d）" % ("★読めました" if 有 else "★★空 です", *数))
    よ = よ and 有
  except Exception as e:
    print("★★読めません:", str(e)[:120]); よ = False
  print("RESULT:", "OK" if よ else "NG")
  return 0 if よ else 1


if __name__ == "__main__":
  sys.exit(selftest() if "--selftest" in sys.argv else main(sys.argv[1:]))
