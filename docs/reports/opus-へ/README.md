# Opus へ お渡しするもの（2026-09-21）

## promise_coverage を走らせるために

| もの | どこ |
|---|---|
| 約束の台帳（JSON・484件） | `docs/ledgers/09-約束の台帳.json` |
| 試験のファイルの一覧（454本） | `試験のファイル一覧.txt` |
| いま `@promise` の印が在る所 | `約束の印.md`（2か所） |

走らせ方

```
python3 tools/promise_coverage.py docs/ledgers/09-約束の台帳.json \
  components/tests tools
```

★中身を1つのテキストにまとめて添えていません。合計 3.2MB あり、
`promise_coverage.py` が読むのは `@promise P-####` の印だけだからです。
印の在る所は `約束の印.md` に全部出してあります。
中身が要るときは、一覧のパスで リポジトリから 読んでください。

## policy_diff を走らせるために

★`pg_policies` と `org_posts` は、Opus が直に見られるとのことでした。
こちらの道具（`tools/ask_ledger.py`）は、長い字を切って返します。
決まりの式は1本が 1,000字を超えるので、こちらから写すと欠けます。
**Opus 側で取ってください。** そのほうが正しく揃います。

こちらで数えた数だけ置きます（2026-09-21・本番）。

| 見たこと | 数 |
|---|---|
| `public` の決まり | 151 |
| 役職 | 41 |
| `post` か `master` を持つ人 | 15 |
| `monka_read` を持つ役職 | 0 |

## screen_tables.json（画面 → 表）

まだ作っていません。`policy_diff` が要る形が分かり次第、育てます。
