# 修正の記録 No.020 ── 台帳の 関数を 読んで 見つかった 4件
全339行 / 末尾は「★★そうすれば、★私の 側でも 同じ ことを 確かめられます。」

★見つけた日 2026-09-14（★Opus が 台帳を 直に 読んで）
★調べた日 2026-09-14（★私が 倉庫の 紙で 裏を 取りました）
★直した日 2026-09-14（★②のみ。★①③は まだ）

## ★★なぜ 紙だけでは 見つからなかったか

★★`tools/layer_join_guard.py` は 紙（`supabase/**/*.sql`）を 読みます。
★★SQLエディタで 直に 作った 関数は、★紙に ありません。
　★2026-09-14 の 棚おろしで、★倉庫 24件／別名 18件 に 対して
　★台帳は **66件** でした。★差が、そのまま この 4件 です。

---

## ① `is_org_owner_or_admin` ── ★決まりでは 0本。★**関数に 残って います**

★★A13 は「役職の 名前」から「できること（`has_can`）」へ 移しました。
★★移したのは **決まり（policy）の 層** だけ でした。
　★★**関数の 層は、★一度も 触って いません。**

| 関数 | 出どころ |
|---|---|
| `create_org_event(p_org_id, …)` | ★紙に あります（`2026-09-04-rpc-functions.sql:160`） |
| `can_view_ops(viewer_id, p_org_id, p_student_id)` | ★★紙に ありません。★台帳だけ |

★★`can_view_ops` は、★**紙を いくら 読んでも 出て きません**。
　★これが「面②が 要る」ことの、★いちばん はっきりした 例 です。

★A13 の 記録を 直します ── 「★決まりでは 0本。★関数に 2本 残存」。
★台帳 ㉑（A2）に、★この 2本の 移行を 足しました。

---

## ② 招待を 受ける 関数が **2本** あります

| 関数 | 紙に あるか | 画面が 呼ぶか | 行の 錠 |
|---|---|---|---|
| `accept_teacher_invitation(p_code)` | ★あり（2本の 紙） | ★**呼びます**（`VocalTracker.jsx:11281`） | ★**ありません** |
| `accept_invitation(p_code)` | ★★ありません（台帳だけ） | ★呼びません | ★`for update` あり |

★★死んで いるのは `accept_invitation` の ほうです。
　★画面からの 呼び出しは **1か所**、★`accept_teacher_invitation` だけ でした。

### ★片づける 前に ── ★なぜ あったのか（★分かる ぶん だけ）

★★私は これを **書いて いません**。★紙に 1行も ありません。
　★★SQLエディタで 直に 作られた もの です。★いきさつを 見た 者が いません。

★★中身から 読める こと ──

| | `accept_invitation`（★死） | `accept_teacher_invitation`（★生） |
|---|---|---|
| 行の 錠 | ★`for update` あり | ★★ありません |
| 未成年の 判定 | ★関数の 中に 書いて ある | ★引き金（`assert_student_is_adult`）に 任せる |

★★2つは「★同じ 仕事の 2つの 設計」です。★どちらが 先かは 分かりません。

★★★丸ごと 上書きしては いけません（★Opus の ご注意）。
　★★未成年の 判定が **2か所に なります**。
　★★いまの 決めは「★引き金 1つ」です（`migration_block_minor_teacher_link.sql`）──
　　「★RLS では なく 引き金に して いるのは、★service_role も 必ず 通す ため」。
　★★取るのは **錠の 考え方 だけ** です。★それも ②の 形で 済みます。

★★片づける 紙（`drop function public.accept_invitation(text);`）は、
　★上の 直しが **実機で 通って から** に します。★先に 消しません。
　★★2026-09-14、★Opus からも 同じ お指図 ──「★まだ 落とさない」。

### ★★けれど、★生きて いる ほうに 錠が ありません

★Opus の ご指摘の とおりです。★調べました。

★`accept_teacher_invitation` の 中の 順番 ──

```
① select … from teacher_invitations where code = p_code and used_at is null
② insert into teacher_student_links …
③ update teacher_invitations set used_at = now() where code = p_code
```

★★①に `for update` が ありません。★同時に 2人が ①を 通れます。

| 誰と 誰が 競うか | 止まるか |
|---|---|---|
| ★**同じ** 生徒が 2回 | ★止まります（`teacher_student_links_active_pair_idx` の 一意の しばり） |
| ★**別々の** 生徒が 2人 | ★★**止まりません**。★2人とも つながります |

★★1回だけ 使える はずの コードで、★2人が つながり得ます。
　★★`used_at` は 2度 立ちますが、★つながりは 2つ 残ります。

### ★数えました ── ★起きて いません（★2026-09-14）

★★私の 最初の 数え方が **誤って** いました。★2つ 直しました。

| 誤り | 直し |
|---|---|
| `teacher_id` だけで つないで いた | ★`used_by_student_id` でも つなぐ |
| `created_at` を 使って いた | ★★列は `accepted_at` です（`2026-09-04-rpc-functions.sql:70`） |

```sql
-- ★同じ コードから 2つ 以上の つながりが 出て いないか（★見るだけ）
select i.code, count(l.id) as "つながりの数"
  from public.teacher_invitations i
  join public.teacher_student_links l
    on l.teacher_id  = i.teacher_id
   and l.student_id  = i.used_by_student_id
 where i.used_at is not null
 group by i.code having count(l.id) > 1;
```

★★結果 ── **0件**（★Opus・2026-09-14）。★つながりは 全部で 8本、
　★すべて `used_by_student_id` と 合って います。

★★はじめ 1件 出たのは、★`teacher_id` だけで つないだ ため でした ──
```
9BMU5JTE  先生 5f9cf956  07:28:25  使ったのは ef626dc0
3429Y67Z  先生 5f9cf956  07:35:13  使ったのは fe774377
```
★★別々の コード、★7分 違い。★競って いません。

### ★★それでも 穴は 本物 です

★★「★起きて いない」は「★起きない」では ありません。

★`for update` は いまも ありません。★**別々の 生徒が 同時に 押せば、★2人とも 通ります。**
★★起きて いないのは、★**人が 少ない から** です。

### ★直し方 ── ㋑ で お決まり（★2026-09-14）。★順番を ご報告します

★★お指図 ──「★insert が ③より **前** に ある。★先に 取りに 行くか、
　★③が 0行 の とき つながりを 戻すか。★選んだ 順番を 報告してから 当てる こと」。

★★**先に 取りに 行く** 形を 選びます。★理由は 下に 書きます。

#### ★いまの 順番

```
① auth.uid() の 確かめ
② select teacher_id … where code and used_at is null and expires_at > now()   ★錠 なし
③ 自分自身なら CANNOT_LINK_TO_SELF
④ insert teacher_student_links        ★未成年の 引き金が ここで 走る
⑤ insert link_consents                ★落ちても 警告だけ
⑥ update teacher_invitations set used_at = now() where code = p_code
```

#### ★変えた あとの 順番

```
① auth.uid() の 確かめ
② ★update teacher_invitations
     set used_at = now(), used_by_student_id = auth.uid()
   where code = p_code and used_at is null and expires_at > now()
   returning teacher_id into v_teacher        ★取りに 行くのと 読むのを 1文で
③ v_teacher が null なら INVITATION_NOT_USABLE
④ 自分自身なら CANNOT_LINK_TO_SELF
⑤ insert teacher_student_links
⑥ insert link_consents
（★⑥の あとに update は ありません。★②で 済んで います）
```

#### ★★なぜ「戻す」ほうを 選ばないか

★★この 関数は、★**まるごと 1つの 取引（transaction）** です。
　★★②の あとで `raise` すれば、★②の 書き込みも **一緒に 戻ります**。
　★★だから、★手で 戻す 仕掛けは 要りません。

| 心配 | どう なるか |
|---|---|
| 未成年が 弾かれた とき、★コードが 使われた ままに ならないか | ★なりません。⑤の `raise` で ②も 戻ります |
| 自分自身だった とき | ★同じく ④の `raise` で 戻ります |
| 負けた ほうに つながりが 残らないか | ★★残りません。★②で 0行 → ③で 例外 → 何も しません |

#### ★ついでに 直る こと

★★いまの ⑥は `where code = p_code` **だけ** です。★期限を 見て いません。
　★★変えた あとは `expires_at > now()` も 条件に 入ります。★厳しく なります。

#### ★外から 見た ふるまいは 変わりません

★★返す 例外の 名前・順番は、★1つも 変えて いません。
　`NOT_AUTHENTICATED` ／ `INVITATION_NOT_USABLE` ／ `CANNOT_LINK_TO_SELF`
　／ `MINOR_NOT_ALLOWED` ／ `ALREADY_LINKED`
★★「無い」「使用済み」「期限切れ」を 分けない 決めも、★そのまま です。

### ★★当たりました（★2026-09-14・Opus が 本番へ）

★紙の 名前 `no020_accept_teacher_invitation_claim_first`

★★上の 順番の まま、★1文字も 変えずに 入りました。

| 確かめ | |
|---|---|
| `claims_first` | true |
| `checks_expiry` | true |
| `single_update` | ★true（★うしろの update は ありません） |
| `for update` | ★使って いません（★UPDATE 自身が 錠を 取ります） |

### ★私の 側で 確かめた こと（★外から 1つ だけ）

```
POST /rest/v1/rpc/accept_teacher_invitation  {"p_code":"ZZZZNOPE"}
→ HTTP 400  P0001  INVITATION_NOT_USABLE
```

★★2026-09-14、★使い捨ての 口座で。★ありもしない コード なので、
　★★0行 しか 当たりません。★台帳は 1行も 変わって いません。

★★これで 分かる こと ── ★関数は 在り、★呼べて、★返す 名前が 変わって いない。

★★★これで **分からない** こと（★正直に 書きます）──
　★先に 取りに 行って いるか
　★期限を 見て いるか
　★2人が 同時に 押した ときに 1人だけ 通るか

★★どれも、★台帳の 中を 読むか、★本当に 2人で 同時に 押すか しか ありません。
　★私は SQL を 流せません。★上の 3つは、★Opus の 確かめ（左の 表）に 拠ります。

### ★実機での 確かめが まだ です

★★先生が コードを 出し、★生徒が 入れて つながる ところ。
　★★それが 通って から、★`accept_invitation` を 片づけます。

---

## ③ 中身が 同じ 関数が、★別の 名前で 2組

| 組 | 紙に あるか | いまの お裁き |
|---|---|---|
| `assignments_get_old_row` ／ `assignments_old_identity` | ★★どちらも ありません（台帳だけ） | ★呼び手 待ち |
| `guard_enrollment_grade_label` ／ `guard_grade_label` | ★どちらも あります | ★★**両方 残す**（★重複では ない） |

### ★★2組目は、★重複では ありません（★2026-09-14・裁定 取り消し）

★★引き金を 見たら、★**別々の 表**に 付いて いました。

| 関数 | 付いて いる 表 | いつ |
|---|---|---|
| `guard_grade_label` | ★`public.memberships` | before insert or update of grade_label |
| `guard_enrollment_grade_label` | ★`public.enrollments` | 同じ |

★★倉庫の 紙でも 裏が 取れました ──
　`2026-09-11-No004-学年の札は学校が決める.sql:105-108`（★memberships）
　`2026-09-13-名簿②-enrollmentsに学年の列を足す.sql:67-70`（★enrollments）

★★中身が 同じ なのは、★**同じ 決まりを 2つの 表に 当てて いる** から です。
　★1つの 関数を 2度 写した もの では ありません。

★★★どちらを 落としても、★その 表の 見張りが 外れます。★**両方 残します。**

### ★★この ひっくり返りから 学ぶ こと

★★Opus の お言葉 ──
> ★中身を くらべて、★**何に 付いて いるかを 見なかった**。
> ★「引き金が どちらを 指して いるか 先に 見る」── ★その 順番が 正しく、
> ★見張りを 1つ 救った。

★★同じ 中身＝同じ もの、では ありません。
　★★**何に 付いて いるか**まで 見て、★はじめて 同じ もの と 言えます。

### ★1組目は まだ 開いて います

`assignments_get_old_row` ／ `assignments_old_identity`

★★どちらも 引き金に **付いて いません**。
　★★つまり、★決まり（policy）か、★別の 関数から 呼ばれて います。

★★落とす 前に、★呼び手を 探します ──

```sql
-- ★① ほかの 関数の 中から 呼ばれて いないか
select p.proname as "呼ぶ 関数", p.prosecdef as "definer"
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname not in ('assignments_get_old_row','assignments_old_identity')
   and (p.prosrc like '%assignments_get_old_row%'
     or p.prosrc like '%assignments_old_identity%');

-- ★② 決まりの 中から 呼ばれて いないか
select tablename as "表", policyname as "決まり", cmd as "何に"
  from pg_policies
 where schemaname = 'public'
   and (coalesce(qual,'') || ' ' || coalesce(with_check,''))
       like any (array['%assignments_get_old_row%','%assignments_old_identity%']);

-- ★③ 引き金に 付いて いないか（★念のため）
select t.tgname as "引き金", c.relname as "表", p.proname as "呼ぶ 関数"
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_proc  p on p.oid = t.tgfoid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and not t.tgisinternal
   and p.proname in ('assignments_get_old_row','assignments_old_identity');
```

★★①②③の どれにも 出て こない ほうが、★死んで います。
　★★両方 出て こなければ、★**両方** 死んで います。
　★★どちらも 倉庫の 紙に ありません。★SQLエディタ製 です。

---

## ④ `can_view_organization` は、★生きて いる 招待を いまも 読みます

```sql
OR EXISTS (select 1 from org_invitations
           where org_id = p_org_id and used_at is null
             and expires_at > now())
```

★★`SECURITY DEFINER` なので、★No.017 で 締めた 決まりは **効きません**。

★★★これは **わざと** です。★関数の 中に、そう 書いて あります ──
　「★招待コードを 確認中の 人にも、★教室名 だけは 見せる」

★★お裁き（★Opus・2026-09-14）── **このまま 残します。**
　★漏れるのは 教室の **名前 だけ**、★しかも 生きて いる 招待の ある 教室 だけ。

★★★1行 書き残します ──

> ★No.017 で 決まりは 閉じたが、★`can_view_organization` **だけは 意図的に 通す**。

★★あとから 読んだ 方が「★見落とし だ」と 思わない ため です。

---

## ★私が できなかった こと

★★台帳の 書き出し（`docs/reports/_catalog-functions.json`）を、★私は 作れません。
　★★**SQL を 流す 手立てが ありません。**
　★`.env.backup.local` に 台帳へ 直に つなぐ 鍵が ありますが、
　★★本番の 資格情報は 扱わない、という 決まり です。★触って いません。

★★だから `tools/layer_join_guard.py` の 面②は、★いまも
　「★見て いません」と 言い続けます。★それで 正しい、と お認め いただきました。

★手順 ── `supabase/check_layer_join_catalog.sql` を 流し、
★出た JSON を `docs/reports/_catalog-functions.json` に 貼って ください。
★★そうすれば、★私の 側でも 同じ ことを 確かめられます。
