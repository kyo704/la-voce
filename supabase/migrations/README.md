# `supabase/migrations` ── 本番の 台帳の 移行

★2026-09-22 に 作りました。★裁定161 §6 ／ 裁定170 WEEK1。

## ここに 何が あるか

| | 数 | 何 |
|---|---|---|
| `2026091x_*` 〜 `20260918132651_*` | **31本** | ★本番の `schema_migrations` から **そのまま 写した** もの |
| `20260921090000_*` 〜 `20260922090000_*` | **4本** | ★本番に 入って いるのに、★記録に **無い** もの |

## ★★2026-09-23 06:50 ── ★ぜんぶ 記録に 入りました

★合言葉を 作り直して いただき、★403 が 解けました。
★★`schema_migrations` は **31本 → 44本** に なりました。

★入れた 順（★坂本さんの お指図の とおり）──

```
s1_close_monka_read_path                  S1
s2_monka_read_log_and_open_monka_thread   S2
ruling160_org_post_perm_log               裁定160
taba2_164w2_164w1_fx2_167a1               束2
taba0_fx1_168_1to3                        束0
taba1_fx3_fx4_fx5_fx6_163_2               束1
taba2b_167a3_part1                        束2b①
opus_01_billing_foundation                Opus 01
opus_02_student_price_consents            Opus 02
opus_03_org_contracts_free_period         Opus 03
opus_05_uniques                           Opus 05
opus_07_ops_alerts                        Opus 07
opus_08_portfolio_performance             Opus 08
```

★★★流し直しても 姿は 変わりません。★もう 入って いる もの だから です。
　★変わったのは **記録 だけ** です。

---

## ★以前の 註（★2026-09-22。★残します）

★★★後ろの 4本は、★**まだ `schema_migrations` に 入って いません**。

```
S1     supabase/migration_monka_read_close.sql        2026-09-21 に 本番へ
S2     supabase/migration_monka_read_log_s2.sql       2026-09-21 に 本番へ
裁定160 supabase/migration_org_post_perm_log.sql       2026-09-21 に 本番へ
束2     supabase/migration_taba2_164w2_164w1_fx2.sql   2026-09-22 に 本番へ
```

★★入れようと して、★403 で 止まりました。
　★`POST /v1/projects/{ref}/database/migrations` に、★合言葉の 資格が ありません。
　★★直し方 …… `docs/reports/2026-09-22-移行の記録が残せません.md`

★★★時刻（ファイル名の 下6桁）は **分かりません**。★順だけ 正しい です。

## ★この 置き場の 決め

- ★`supabase/` の 平らな ところ（294本）は、★**いままでの 置き場** です。★消しません。
- ★ここに 置くのは、★**本番の 台帳に 当たった もの だけ** です。
- ★これから 本番を 変える ときは、★ここに 1本 足してから `apply_migration` を 通します。
- ★★FX7（試しを 本番の 移行から 作り直す）が、★この 置き場を 見ます。

## ★写した やり方

```sql
select version, name, statements from supabase_migrations.schema_migrations order by version
```

★手で 書いた ものでは ありません。★読み出した ものを そのまま 並べて います。
