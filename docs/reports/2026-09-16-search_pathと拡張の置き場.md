# ★`search_path` と 拡張の 置き場

全49行 / 末尾は「```」

生成: `tools/search_path_extension_audit.py`（2026-09-16）

★★較正: 通りました（★わざと 壊した もの／直した もの／拡張を 使わない もの／道を 決めて いない もの、★4つ とも 見分けました）。

## ★何を 数えたか

- SQL の ファイル: 205 本
- 書かれて いる 関数（★同じ 名も 1つずつ 数えます）: 44
- ★拡張の 手を 使う もの: 1
- ★★道に `extensions` が 無い もの: **0**
- ★`security definer` なのに 道を 決めて いない もの: 0

## ★★拡張の 手を 使う 関数

| 関数／ファイル | 使う 手 | `search_path` | 見立て |
|---|---|---|---|
| `get_invitation_teacher`<br>`migration_code_pepper.sql` | digest | `public, extensions` | ok |

★出どころ … `get_invitation_teacher` → `migration_code_pepper.sql`

## ★`security definer` で、★道を 決めて いない 関数

★1つも ありません。

## ★この 紙で 足りない こと

★★これは **紙** です。★台帳では ありません。
★★本番の 関数は、★ここに ある ファイルと 違う ことが あります ──
★きょう `get_invitation_teacher` が まさに そうでした（★台帳は 直り、★ファイルは 古い ままでした）。
★★下の 問いで、★台帳の 側を 引いて ください。

```sql
select p.proname as 関数,
       p.prosecdef as 持ち主の力で動くか,
       coalesce(array_to_string(p.proconfig, ' / '), '（決めていない）') as 決めごと
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.prosecdef desc, p.proname;

-- ★拡張が どこに 入って いるか
select e.extname as 拡張, n.nspname as 置き場
from pg_extension e join pg_namespace n on n.oid = e.extnamespace
order by 1;
```
