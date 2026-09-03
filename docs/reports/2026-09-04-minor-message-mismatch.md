# 未成年のときの文言が出ない — 調査（2026-09-04・コードのみ）
全136行 / 末尾は「★どちらも今回の症状とは別ですが、同じ機会に直すのが良いと考えます。」

## 結論（先に）

★**リポジトリにある版のとおりなら、この症状は起きないはずです。**
★だから★**本番の関数が、リポジトリの版と違う**可能性がいちばん高いと考えます。

★**確定には、2つの実物が要ります。**
1. 本番の `accept_teacher_invitation` の定義（`pg_get_functiondef`）
2. ★画面が受け取った **error オブジェクトそのもの**（`message` / `code` / `details` / `hint`）

★**推測で直しません。** どちらも無いまま直すと、当てずっぽうになります。

## ① 関数は、未成年をどう扱う設計か

★**関数自身は判定しません。トリガーに任せ、★文言だけ言い換えます。**

`supabase/DRAFT_insert_functions.sql:61-75`

```
  begin
    insert into public.teacher_student_links
      (teacher_id, student_id, status, accepted_at)
    values (v_teacher, auth.uid(), 'active', now())
    returning id into v_link_id;
  exception
    when others then
      if sqlerrm like '%MINOR_TEACHER_LINK_BLOCKED%' then
        raise exception 'MINOR_NOT_ALLOWED';
      elsif sqlstate = '23505' then
        raise exception 'ALREADY_LINKED';
      else
        raise;
      end if;
  end;
```

★書き写さない判断でした（同じ判断が2か所になるため）。
★トリガー `trg_block_minor_teacher_link` は `before insert` で、
★`security definer` の中の insert でも走ります。素通りしません。

トリガーが上げる文（`migration_block_minor_teacher_link.sql:65`）：
```
'MINOR_TEACHER_LINK_BLOCKED: 未成年、または年齢が未回答のアカウントは、先生とつながることができません。'
```

## ② 画面は、何を見ているか

`components/VocalTracker.jsx:9514-9516`
```
  function isMinorLinkBlocked(error) {
    return !!error && /MINOR_TEACHER_LINK_BLOCKED/.test(String(error.message || ""));
  }
```
★**`error.message` だけを見ています。** `code` も `details` も `hint` も見ていません。

`components/VocalTracker.jsx:9588-9597`（要旨）
```
  const m = String(linkError.message || "");
  m.includes("MINOR_NOT_ALLOWED") || isMinorLinkBlocked(linkError)  → 未成年の文
  m.includes("ALREADY_LINKED")                                       → すでにつながっています
  m.includes("INVITATION_NOT_USABLE")                                → このコードは使えません
  それ以外                                                            → 連携に失敗しました
```

## ③ なぜ、どちらも外れたのか（★候補を、確からしい順に）

★**リポジトリの版どおりなら、どちらかが必ず当たります。**
- 例外処理が効けば `message = "MINOR_NOT_ALLOWED"` → 1つ目が当たる
- 例外処理が無ければ `message` にトリガーの文が入る → `isMinorLinkBlocked` が当たる
★**両方外れた**ということは、★**`message` に、そのどちらの文字列も入っていない**ということです。

| # | 候補 | 見分け方 |
|---|---|---|
| 1 | ★**本番の関数が、リポジトリの版と違う**（例外処理が無い、または別の文言） | `pg_get_functiondef` を見る |
| 2 | ★エラーがトリガーより**手前**で起きた（`CANNOT_LINK_TO_SELF` は★画面で扱っていません） | `message` を見る |
| 3 | ★`link_consents` への insert で落ちた（列名・権限） | ★ただし未成年なら、そこまで到達しません |
| 4 | ★関数が見つからない（名前・引数の不一致） | `message` に "Could not find the function" が出ます |
| 5 | ★文言が `message` ではなく `details` / `hint` に入っている | error オブジェクトを見る |

★**2番に注意してください。** `CANNOT_LINK_TO_SELF` を、画面は★**扱っていません。**
★私の実装漏れです。★ただし今回の症状（他人のコードを入れた未成年）とは合いません。

★**3番も、いま気づいた穴です。** 関数は `link_consents` に insert しますが、
★**その失敗を捕まえていません。** 落ちれば `raise` がそのまま上がり、
★**つながりは作られたのに、画面には「失敗しました」と出ます。**
★今回の件とは別ですが、直すべきです。

## ★お願いしたい2つ（どちらも読むだけ）

```sql
-- ★A 本番の関数の中身
select pg_get_functiondef(p.oid)
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'accept_teacher_invitation';
```
★出力は長いので、`docs/inbox/` へ貼るか、ファイルにしてください。

**B error オブジェクトそのもの**
ブラウザの開発者ツール（Console）で、未成年の口座からもう一度試し、
`console.error("解除に失敗…")` ではなく、★**rpc のエラーを丸ごと**出してください。

```js
const { error } = await supabase.rpc("accept_teacher_invitation", { p_code: "<コード>" });
console.log(JSON.stringify(error, null, 2));
```
★`message` / `code` / `details` / `hint` の4つが要ります。
★**これが無いと、③のどれかを当てずっぽうで選ぶことになります。**

## ★直しの案（★実装していません。Aとが出てから確定します）

### 案1（推し）★関数の側で言い換える形を、確実にする

★本番の関数に例外処理が無いなら、★リポジトリの版を入れ直します。
- 利点：★文言の対応づけが、関数の中に1か所だけになります。
- 利点：画面は `MINOR_NOT_ALLOWED` だけを見ればよくなります。
- ★`CANNOT_LINK_TO_SELF` と `link_consents` の失敗も、同じ機会に直せます。

### 案2 画面の側で、受け皿を広げる

`isMinorLinkBlocked` を、`message` 以外（`details` / `hint`）も見るようにします。
- 欠点：★**どこに入るかを、実物で確かめてからでないと書けません。**
- 欠点：★関数と画面の両方が文言を知ることになり、★2か所になります。

### ★案1と案2は、排他ではありません
★案1を本筋にし、★案2は「万一のときに、少なくとも生の文言が出る」保険にできます。
★ただし、★**まず実物を見てからです。**

## ★あわせて報告（今回の調査で見つけた、別の2件）

1. ★`CANNOT_LINK_TO_SELF` を、画面が扱っていません（generic に落ちます）。
2. ★関数が `link_consents` の insert 失敗を捕まえていません。
   ★落ちると「つながりは出来たのに、失敗したと表示される」ことになります。

★どちらも今回の症状とは別ですが、同じ機会に直すのが良いと考えます。
