# ★memberships に、★いま 何が 通るか

★この 紙は tools/membership_live.py が 書き出します。★手で 書いて いません。

★使い捨ての アカウント `f7520dc1-9154-4524-a350-ba0bcddbf0b2`

★学校 `1f682aa2-bd95-4220-a129-737fd5dc9dc0`

### ① 自分の 行が 読めるか

```
状態　200
中身　[{"id":"6fb826d9-56a3-44f5-8872-0a8317c23f59","role":"teacher","post_id":"069fde3d-38fe-46a5-bf96-b6475522efe3"}]
```

★★決まりが 1本も 無ければ、★RLS は すべてを 拒みます。
　★★読みは 誤りに ならず、★**0行** に なります。
　★★1行 返って きたなら、★**読みを 許す 決まりが 立って います**。

★いま 入って いる 値　`role=teacher`　`post_id=069fde3d-38fe-46a5-bf96-b6475522efe3`

### ② いまと 同じ 値を 書き戻す（★値は 変えません）

```
状態　200
中身　[{"id":"6fb826d9-56a3-44f5-8872-0a8317c23f59","role":"teacher"}]
```

★★決まりが 1本も 無ければ、★書きは 2つの どちらかに なります ──
　★① `new row violates row-level security policy`（★誤り）
　★② 0行（★どの 行にも 当たらない）
★★**1行 返って きたなら、★書きを 許す 決まりが 立って います。**

### ③ 自分を owner に 上げようと する

```
状態　403
中身　{"code":"42501","details":null,"hint":null,"message":"new row violates row-level security policy for table \"memberships\""}
番号　42501
文面　new row violates row-level security policy for table \"memberships\"
```

### ④ post_id を 同じ 値で 書き戻す

```
状態　403
中身　{"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT UPDATE ON public.memberships TO authenticated;","message":"permission denied for table memberships"}
番号　42501
文面　permission denied for table memberships
```

★★`permission denied for table` なら、★**許し（GRANT）**の 話です。
　★★決まり（RLS）まで 届いて いません。★決まりの 有る 無しと 別です。

### ⑤ 入れられるか（★もう 居るので 重なる はず）

```
状態　403
中身　{"code":"42501","details":null,"hint":null,"message":"new row violates row-level security policy for table \"memberships\""}
番号　42501
文面　new row violates row-level security policy for table \"memberships\"
```

★★`23505`（重なり）なら、★決まりを 通り抜けて 台帳まで 届いて います。
　★★`42501` なら、★許しか 決まりで 止まって います。

## ★§7-3 の 止める 決まりに ついて

★★`memberships_update_needs_can_post` は、★`post_id` を 変える ときに
　★★`has_can(org_id, 'post')` を 求める、★止める（restrictive）決まりです。

★★けれど ④で 見た とおり、★`post_id` への 書きは
　★★**決まりに 届く 前に、★許し（GRANT）で 止まって います。**
　★★ヒントも そう 言って います ──
　★`GRANT UPDATE ON public.memberships TO authenticated;`

★★つまり この 道からは、★その 決まりが 効いて いるか どうかを
　★★**見る ことが できません**。★手前で 止まる ためです。
　★★有ることの 証明にも、★無いことの 証明にも なりません。
　★★台帳を 直に 見る ほか ありません。

## ★読み取り

★★①で 行が 読め、★②で 1行 返って きたなら、
　★★**memberships には 決まりが 立って います。**
　★★`pg_policies` が 0行 を 返したのは、★別の 理由です ──
　★・`schemaname` の 絞り込みが 抜けて いた
　★・ちがう 書き方（schema）か、ちがう 台帳を 見て いた
　★・打ちまちがい

★★今日の §3 の ② では、★同じ `pg_policies` が
　★★memberships に **5本**（★うち has_can 1本）を 返して います。
　★★同じ 日に 0本と 5本は、★両方 本当では あり得ません。

★★確かめ直す なら、★絞り込みを 外して ください ──

```sql
select schemaname, tablename, policyname, permissive, cmd
from pg_policies where tablename = 'memberships';

-- ★それでも 0行 なら、★別の 見方で ──
select polname, polpermissive, polcmd
from pg_policy where polrelid = 'public.memberships'::regclass;
```

