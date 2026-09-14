# 消した ものを 拾い直して いる ところ
全58行 / 末尾は「- 手もとの しぼりは、★`notes` `rows` `list` と 名の 付く ものだけです。」

★出どころ 2026-09-14、★坂本さん「一覧を 作る ところ すべてを 調べよ」

## まとめ

- 論理削除の 表 … `article_notes`、`notes`
- 台帳に 尋ねる ところ … 1件。★しぼりが 無い もの **0件**
- 手もとで しぼる ところ … 5件。★`deleted_at` を 見て いない もの **2件**

## 台帳に 尋ねる ところ

| | 置き場所 | 表 |
|---|---|---|
| ✓ | `components/VocalTracker.jsx:11571` | `article_notes` |

## 手もとで しぼる ところ

| | 置き場所 | 字 |
|---|---|---|
| ✗ | `components/NotePanel.jsx:65` | `notes.map(note => (` |
| ✓ | `components/VocalTracker.jsx:17560` | `...myNotes.filter((n) => n.kind === "repertoire" && n.body && !n` |
| ✓ | `components/VocalTracker.jsx:17566` | `...myNotes.filter((n) => n.kind === "repertoire" && n.body && !n` |
| ✓ | `components/VocalTracker.jsx:17569` | `const note = myNotes.find((n) => n.kind === "repertoire" && n.bo` |
| ✗ | `components/VocalTracker.jsx:21481` | `{notes.filter((n) => n.kind !== REFLECT_NOTE_KIND).map((n) => (` |

## ★2026-09-14 の 訂正

★★前の 便で「一覧の しぼりに `!n.deleted_at` が 欠けて いる」と
　★申し上げました。★**それは 誤りでした。**

★★`components/VocalTracker.jsx:9931` の `fetchNotes` は、
　★① `.is("deleted_at", null)` で すでに しぼって います。
　★② `deleted_at` を **読み出して すら いません**（★select の 並びに 無い）。

★★だから 手もとの `myNotes` の 行に `deleted_at` は 付いて いません。
　★`!n.deleted_at` は **いつも 真** です。★足しても 何も 変わりません。

★★曲が 戻る 本当の 理由は、★まだ 分かって いません。
　★残る 筋は 次の 2つです ──

- `repertoire`（`lib/repertoireLog.js`）は **`entries` から 作られます**。
  ★消す ときは `entries.activities` から 名前を 外して 書き戻します。
  ★★外し そこねた 日が あれば、★読み直すと 戻ります。
  ★`findAffectedDatesForRepertoire` は、★手もとに 読み込んだ 日しか 見ません。
- 旧い 列 `entries.repertoire` から、★読むとき 1件 作り直す 道が あります
  （★`migrateLegacyToActivities`・`components/VocalTracker.jsx:7926` の 注記）。

★★どちらも、★動かして 確かめないと 決められません。
　★いまの 手もとでは アプリを 動かせません（★`.env.local` が ありません）。

## この 数えが 見て いない こと

- 字の 並びだけ を 見ます。★動かして いません。
- 台帳の しぼりは、★`.select(` から 次の `;` までを 見ます。
  ★行を またいで 組み立てる 問い合わせは 取りこぼします。
- 手もとの しぼりは、★`notes` `rows` `list` と 名の 付く ものだけです。
