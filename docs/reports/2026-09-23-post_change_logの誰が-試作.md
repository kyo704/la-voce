# 役職を 変えた「誰が」を 残す ── ★㋑を 試作しました（2026-09-23）

★sql/06 ① の 問い …… ★引き金に 任せると、★`changed_by` が いつも 空に なります。

---

## 一 ── ★試しの 台帳で、★両方を 並べました

```
① ★道を 通さず、★直に update（★いまの sql/06 ① の 形）
   update public.memberships set post_id = '課長' where id = …;
   記録 …… { changed_by: ★null,  to_post_name: '課長' }

② ★道（set_member_post）を 通す（★㋑の 形）
   select public.set_member_post(membership, 課長, actor);
   記録 …… { changed_by: ★'eafa63c2-…',  to_post_name: '課長' }
```

★★★①では「誰が」が **消えます**。★②では **残ります**。

---

## 二 ── ㋑の 形（★試作した もの）

```sql
-- ★引き金 …… auth.uid() が あれば それ。★無ければ サーバが 置いた 印
v_actor := coalesce(auth.uid(), nullif(current_setting('app.actor', true), '')::uuid);

-- ★サーバが 呼ぶ 道 …… ★中で 印を 置いてから 変える
create or replace function public.set_member_post(p_membership_id uuid, p_post_id uuid, p_actor uuid)
  …
  if p_actor is null then raise exception 'ACTOR_REQUIRED'; end if;
  perform set_config('app.actor', p_actor::text, true);   -- ★その 取引の 中だけ
  update public.memberships set post_id = p_post_id where id = p_membership_id;
```

★`current_setting(…, true)` …… ★印が 無くても 落ちません（★第2引数）。
★`set_config(…, true)` …… ★その 取引が 終われば 消えます。★次の 呼びに 残りません。

---

## 三 ── ★★分かった こと ── ㋑は「関数が 両方 する」形に なります

★★★PostgREST は、★1つの 呼びを **1つの 取引** で 走らせます。

★★だから `supabase.from("memberships").update(...)` の **前に** `set_config` を 置く 道が ありません。
　★★2つを **1つの 関数**に 入れる しか ありません。

★★★つまり ㋑は、★「サーバが 印を 置く」では なく
　★「**関数が 印を 置いて、★同じ 関数が 変える**」形 に 行き着きます。

---

## 四 ── ★では 何が 良く なるのか

| | いま（サーバが 記録を 書く） | ㋑（関数が 両方 する） |
|---|---|---|
| 書く 人 | ★2人（サーバ と 引き金） | ★1人（引き金 だけ） |
| 「誰が」 | ★残る | ★残る |
| 忘れたら | ★記録が 増えない | ★`changed_by` が 空に なる |
| 守り | ★サーバの コードを 読む しか ない | ★`ACTOR_REQUIRED` で 断れる |

★★★良く なる ところ …… ★書く 人が **1人** に なります。
　★「呼ばなければ 残らない」が 無く なります（★引き金が 必ず 書きます）。

★★★残る 心配 …… ★サーバが `update` を 直に 書くと、★`changed_by` が **黙って 空** に なります。

---

## 五 ── ★その 心配を 塞ぐ 道（★大事な ところ）

★本番の 権限を 数えました。

```
memberships の UPDATE（authenticated）…… grade_label ／ role の **2列 だけ**
  ★`post_id` は 渡して いません
```

★★★つまり、★`post_id` を 書けるのは **サーバ（`service_role`）だけ** です。
　★画面からは 書けません。

★書いて いる ところ …… ★3か所（★ぜんぶ `app/api/org/posts/route.js`）

```
162行 …… .update({ post_id: top.id })      ★はじめの 1人を 学長に
204行 …… .update({ post_id: null })        ★役職を 外す
292行 …… .update({ post_id: postId })      ★役職を 付ける
```

★★★だから、★**見張りを 1本 置けば 塞がります** ──
　「`app/api/` の 中に `.update({ post_id` が 1つも 無い こと」。

★★これが あれば、★誰かが 直に 書いた 日に 気づけます。

---

## 六 ── ★決めて いただく こと

★★★私は ㋑を **お勧めします**。★ただし 2つ 一緒に、という 条件つき です。

```
㋑-1  set_member_post（関数）を 作る
㋑-2  app/api/org/posts/route.js の 3か所を、★その 関数を 呼ぶ 形に する
㋑-3  ★見張り …… `app/api/` に `.update({ post_id` が 0件
```

★★★㋑-3 が 無い ㋑は、★いまより **弱い** です。
　★いまは「サーバが 書き忘れたら 記録が 増えない」── ★数えれば 分かります。
　★★㋑だけ だと「記録は 増えるが `changed_by` が 空」── ★★気づきにくい です。

★★試作は 試しの 台帳に 入れて あります（`supabase/shisaku_post_change_actor.sql`）。
★★★本番には 当てて いません。
