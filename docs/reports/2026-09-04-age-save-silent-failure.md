# 年齢の答えが保存されない — 調査（2026-09-04・コードのみ）
全166行 / 末尾は「★A・B・C も、同じ機会に。」

## 結論（先に）

★**ご提示の仮説と、症状の形は一致します。** 1つの原因で両方が説明できます。

★**ただし「なぜ0行になるのか」は、コードからは分かりません。**
★`profiles` の権限とポリシーは、今夜の④で★触れていません。
★#003 で落としたのは **SELECT** のポリシーで、UPDATE ではありません。
★**本番の `profiles` のポリシーと権限を、実物で見る必要があります。**

## ★症状が、なぜこの形になるのか（コードで確定）

`components/VocalTracker.jsx:9323-9341`（設定から変える）
```
9328  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
9329  if (error) { console.error("年齢の答えを変えられませんでした:", error); return; }
…
9341  setProfile((p) => ({ ...p, ...patch }));      ← ★行数を見ずに、画面だけ変えています
```

★**`.select()` がありません。** ★0行に当たっても `error` は null です。
★**そして `setProfile` で、画面だけが変わります。**
★次に `profiles` を読み直した時点で、★元の値に戻って見えます。
★**症状(a)「保存したのに成人に戻る」と、正確に一致します。**

`9312-9317`（初回の質問）も、まったく同じ形です。

## ★症状(b) が、同じ原因で説明できる理由

トリガー `assert_student_is_adult`（`migration_block_minor_teacher_link.sql:59-67`）
```
  if not exists (
    select 1 from public.profiles p
     where p.id = new.student_id
       and p.is_under_18 is false
  ) then
    raise exception 'MINOR_TEACHER_LINK_BLOCKED: …';
```

★**`is_under_18 is false` を要求します。**
★`null`（未回答）も、`profiles` の行が無い場合も、★ここで弾かれます。
★コメントにも、そう書いてあります（`58行`）。

★**したがって**：年齢の保存が0行なら → DB は `null` のまま →
★**画面では「成人」に見えていても、つながれません。**
★**症状(a)と(b)は、1つの原因で説明できます。**

## ① 保存の場所と、確かめ方（file:line）

| 場所 | 何を書くか | error を見るか | ★行数を見るか |
|---|---|---|---|
| `VocalTracker.jsx:9315` 初回の質問 | `is_under_18` / `age_question_shown_at` | ★見る | ★**見ない** |
| `VocalTracker.jsx:9328` 設定から変える | 同上 | ★見る | ★**見ない** |
| `VocalTracker.jsx:9347` 答えずに進む | `is_under_18: null` / 同上 | ★見る | ★**見ない** |

書く列は `lib/ageGate.js:126-131`：
```
  return {
    is_under_18: isUnder18 === true ? true : false,
    age_question_shown_at: now || new Date().toISOString()
  };
```

## ② `profiles` の権限とポリシー — ★リポジトリから分かること

| | 状態 |
|---|---|
| リポジトリのポリシー | `schema.sql:21,25` の2本のみ。SELECT / UPDATE とも `auth.uid() = id` |
| #003 で落としたもの | ★`profiles_connected_display_name`（**SELECT**）。UPDATE ではありません |
| 今夜の④ | ★`profiles` に★触れていません（対象は4表：`teacher_student_links` / `assignments` / `org_events` / `lessons`） |

★**つまりリポジトリの範囲では、本人の UPDATE は通るはずです。**

★**本番にしかないものは、私には見えません。** 今日1日で、手で当てられて
リポジトリに無いものが★7件見つかっています。★`profiles` にも同じことがありえます。

★**確かめる照会（読むだけ）**
```sql
-- ★A profiles のポリシー全部
select policyname, cmd, permissive, roles, qual, with_check
  from pg_policies where schemaname='public' and tablename='profiles'
 order by cmd, policyname;

-- ★B 権限（列単位の絞り込みが入っていないか）
select grantee, privilege_type, count(*) as "列の数"
  from information_schema.column_privileges
 where table_schema='public' and table_name='profiles'
   and grantee in ('anon','authenticated')
 group by 1,2 order by 1,2;
-- ★UPDATE の「列の数」が全列より少なければ、★列単位で絞られています。

-- ★C その人に profiles の行があるか（★これがいちばんありそうです）
select count(*) as "行がある人" from public.profiles where id = '<試した口座の uuid>';

-- ★D 実地（★なりすまして。これが本当の答えです）
begin;
select set_config('request.jwt.claims',
  '{"sub":"<試した口座の uuid>","role":"authenticated"}', true);
set local role authenticated;
update public.profiles set is_under_18 = true, age_question_shown_at = now()
 where id = auth.uid()
returning id, is_under_18 as "★書けた行（1行返ることが正しい）";
rollback;
```

★**Dが0行なら、原因が確定します。** ★**Cが0なら、その人には profiles の行がありません。**

## ③ `is_under_18 = null` の扱い（★閉じる側に倒れています）

| 値 | トリガー | 意味 |
|---|---|---|
| `false`（成人と答えた） | ★通す | |
| `true`（未成年と答えた） | ★弾く | |
| `null`（未回答） | ★**弾く** | 設計どおり（`58行` のコメント） |
| `profiles` の行が無い | ★**弾く** | 同上 |

★`accept_teacher_invitation` 自身は、年齢を判定しません。
★トリガーに任せ、★文言だけ `MINOR_NOT_ALLOWED` に言い換えます
（`DRAFT_insert_functions.sql:66-74`）。

## ④ 登録時と、設定からの経路 — ★別々です（★2か所あります）

| いつ | どこ | 書く先 |
|---|---|---|
| 登録のとき | `components/SignupForm.jsx:156` | ★**`auth` の `user_metadata`**（まだログイン前で `profiles` に書けないため） |
| 初回ログイン | `lib/ageGate.js` の `adoptSignupAnswer` 経由 | `profiles` |
| 設定から変える | `VocalTracker.jsx:9328` | `profiles` |

★**答えの置き場所が2つあります。** ★登録時の答えは `user_metadata` に入り、
★初回ログインで `profiles` へ移されます。
★**その移し替えが失敗しても、同じく無音**になります（同じ形です）。

★`app/dashboard/page.js:28-29` が `user_metadata.is_under_18` を読んでいます。
★**つまり、画面が「成人」と見せる根拠が、`profiles` ではない場合があります。**
★**症状(a)の「保存したのに成人に戻る」は、これでも説明できます** ――
★`profiles` は `null` のまま、画面は `user_metadata` を見ている、という形です。

★**これは、私が今日いちばん多く見た欠陥です ―― 同じ事実が2か所にある。**

## ★直しの案（実装していません）

### 案1（★まず、これだけ）行数を見る

`9315` / `9328` / `9347` の3か所に `.select("id")` を足し、0行なら
★**画面を変えず、利用者に伝えます。**
- ★これは「原因を直す」ものではありません。★**気づけるようにする**ものです。
- ★原因が RLS でも、行が無いのでも、どちらでも効きます。
- ★`docs/reports/2026-09-04-rowcount-audit.md` の28件と同じ話です。
  ★**年齢の3か所は、その中でも安全に関わるので、先に直す価値があります。**

### 案2 答えの置き場所を1つにする

`user_metadata` と `profiles` の食い違いを解消します。
- ★どちらを正とするかは、★設計の判断です。私は決めません。
- ★`profiles` を正とし、画面は `profiles` だけを見る形が素直だと考えます。

### ★案1と案2は、順番があります
★**案1が先です。** ★いま何が起きているかを見えるようにしないと、
案2を入れても、直ったかどうかが分かりません。

## ★お願い

★**Dの実地確認を、いちばんにお願いします。** 1分で済み、原因が確定します。
★A・B・C も、同じ機会に。
