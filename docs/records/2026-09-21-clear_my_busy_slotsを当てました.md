# clear_my_busy_slots を試しと本番に当てました（2026-09-21）

紙 `supabase/migration_clear_my_busy_slots.sql`（裁定142「自分の予定だけ 全部外す」）

## なぜ急いだか

裁定142 の画面側は既に本番に出ています（commit 30a90a59）。道が無いあいだ、
「自分の予定だけ 全部外す」を押しても何も起きません。押せる札が動かない
状態を、そのままにしません。

## 当てる前（本番）

| 見たこと | 数 |
|---|---|
| clear_my_busy_slots | 0（ありません） |
| my_timetable の「来られない」印 | 0 |

## 当てたあと

| 見たこと | 本番 | 試し |
|---|---|---|
| security definer | True | True |
| 引数 | 無し | 無し |
| execute の渡し先 | authenticated のみ | authenticated のみ |
| anon / PUBLIC への渡し | 無し | 無し |
| 「来られない」印の数 | 0（触れていません） | 0 |

引数が無いことが守りの要です。人を指せないので、運営の方がよその先生の
予定を消すことはできません。

## 試しの台帳で押して確かめました

道具 `tools/clear_busy_check.js`（本人の鍵で呼びます。管理の鍵は使いません）

| 見たこと | 結果 |
|---|---|
| 道を呼べる（authenticated に execute がある） | PASS（removed=1） |
| 自分の印が外れる | PASS（2 → 1） |
| よその方の印は残る | PASS（はなこ 1件 そのまま） |
| 2度目は 0件（何度呼んでも同じ） | PASS（removed=0） |

仕込みと戻しは `tools/seed/seed_clear_busy_check.sql` ／
`tools/seed/undo_clear_busy_check.sql`。戻したあと、試しの台帳は
my_timetable 0行 ／ my_periods 0行（原状）です。

## まだしていないこと

本番で実際に押した確かめはしていません。本番の「来られない」印は 0件なので、
押しても外れるものがありません。実機の確認は、印のある方が現れてからです。
