# 修正の記録 No.020 ── 台帳の 関数を 読んで 見つかった 4件
全148行 / 末尾は「★★そうすれば、★私の 側でも 同じ ことを 確かめられます。」

★見つけた日 2026-09-14（★Opus が 台帳を 直に 読んで）
★調べた日 2026-09-14（★私が 倉庫の 紙で 裏を 取りました）
★直した日 ────（★まだ 直して いません）

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

★★これまでに 起きたか は、★分かりません。★台帳を 数えないと 言えません ──

```sql
-- ★同じ コードから 2つ 以上の つながりが 出て いないか（★見るだけ）
select i.code, count(l.id) as "つながりの数"
  from public.teacher_invitations i
  join public.teacher_student_links l
    on l.teacher_id = i.teacher_id
   and l.created_at >= i.used_at
 where i.used_at is not null
 group by i.code having count(l.id) > 1;
```

★★直し方は 2つ あります。★どちらも 私は 流せません。
　★㋐ ①に `for update` を 足す（★`accept_invitation` が そう して います）
　★㋑ ③を `where code = p_code and used_at is null` に して、
　　★0行 なら 例外を 上げる（★取れた 人だけ 通す）
★★私の 見立ては **㋑** です。★錠を 取る 時間が 短く、★結果も はっきりします。

---

## ③ 中身が 同じ 関数が、★別の 名前で 2組

| 組 | 紙に あるか |
|---|---|
| `assignments_get_old_row` ／ `assignments_old_identity` | ★★どちらも ありません（台帳だけ） |
| `guard_enrollment_grade_label` ／ `guard_grade_label` | ★どちらも あります |

★★2組目は、★紙の 上では **中身が ちがい** ます ──

| 関数 | 紙 | 中身 |
|---|---|---|
| `guard_grade_label` | `2026-09-11-No004-学年の札は学校が決める.sql:61` | ★`auth.uid()` を 見る |
| `guard_enrollment_grade_label` | `2026-09-13-名簿②-enrollmentsに学年の列を足す.sql:37` | ★★`tg_op = 'INSERT'` と null の 扱いが 足して あります |

★★Opus は「台帳では 中身が **同じ**」と 仰って います。
　★★つまり、★あとから どちらかが もう一方に 上書きされた 形 です。
　★★紙と 台帳が ずれて います。★台帳が 事実 です。

★★片づける ときは、★**どちらを 引き金が 指して いるか**を 先に 見ます。
　★名前だけ 消すと、★引き金が 宙に 浮きます。

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
