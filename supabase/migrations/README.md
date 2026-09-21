# `supabase/migrations` ── 本番の 台帳の 移行

★2026-09-22 に 作りました。★裁定161 §6 ／ 裁定170 WEEK1。

## ここに 何が あるか

| | 数 | 何 |
|---|---|---|
| `2026091x_*` 〜 `20260918132651_*` | **31本** | ★本番の `schema_migrations` から **そのまま 写した** もの |
| `20260921090000_*` 〜 `20260922090000_*` | **4本** | ★本番に 入って いるのに、★記録に **無い** もの |

## ★★大事な こと

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
