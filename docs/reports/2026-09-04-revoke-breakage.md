# 解除（つながりの取り消し）の症状 — 調査（2026-09-04・コードのみ）
全125行 / 末尾は「★**コードだけでは、ここから先は決められません。**」

## 結論（先に）

★**ご提示の仮説（GRANT に弾かれて、画面が握り潰している）は、コード上は成り立ちません。**
理由は2つあります。

1. ★解除が書く3列は、今夜の GRANT で**渡してある列**と完全に一致します。
2. ★呼ぶ側は error を確かめ、あれば `return` します。**握り潰していません。**

★**ただし「エラーが出ない失敗」の可能性は、まだ消えていません。**
★RLS で0行に当たった更新は、★エラーになりません（`error` は null）。
★そして解除は `.select()` を付けていないので、★何行変わったかを見ていません。
→ ★**確かめるべきは GRANT ではなく、`teacher_student_links` の UPDATE ポリシーの有無です。**

## ① 解除の場所と、書く列

`components/VocalTracker.jsx:9651-9670`

```
9654  .from("teacher_student_links")
9655  .update({ status: "revoked", revoked_at: …, revoked_by: asRole }).eq("id", linkId)
9656  if (error) { console.error("解除に失敗しました:", error); return; }   ← ★確かめています
9662  .from("link_consents").update(buildUnlinkPatch({ by: asRole }))       ← 別の表
9669  fetchTeacherLinks();
```

★**触る表は2つだけ**：`teacher_student_links` と `link_consents`。
★`enrollments` にも `assignments` にも、**触れません**。

## ② どの層が弾きうるか

| 層 | 解除は通るか | 根拠 |
|---|---|---|
| GRANT（列単位） | ★**通ります** | 渡してあるのは `status` / `revoked_at` / `revoked_by`。書く列と一致 |
| トリガー | ★**通ります** | `teacher_id` / `student_id` を変えていません |
| ポリシー（RLS） | ★**分かりません** | ★UPDATE のポリシーが本番にあるか、未確認のままです |

★**私は 2026-09-03 から繰り返し、この照会をお願いしています。まだ結果を受け取っていません。**

```sql
select policyname, cmd, permissive, qual, with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'teacher_student_links'
 order by cmd, policyname;
```

★**UPDATE のポリシーが0本なら、更新は0行に当たり、エラーも出ません。**
★これが症状と、いちばん整合します。

## ③ 症状の説明（★別の可能性のほうが有力です）

| 見えたこと | 説明 |
|---|---|
| 先生の生徒一覧から消えた | `fetchTeacherLinks` は `status = 'active'` で絞ります。★消えたなら、行は revoked になっています |
| 教室の在籍一覧に残る | ★**`enrollments` は別の表です**（`10113`）。解除は触れません。★仕様どおりです |
| 生徒側で有効のまま | ★**画面が古いだけの可能性が高いです**。`refreshSharedData` は `visibilitychange` で走ります（`5746`）。★生徒がその画面を開いたままなら、取り直されません |

★**「先生の一覧から消えた」と「更新が弾かれた」は、両立しません。**
★弾かれていたら、取り直したときに戻ってくるはずです。

★**したがって、いちばんありそうなのは「解除は成功した」です。**
★残る2つは、別々の話です。

## ③-2 つながりと在籍は、独立か（★コードが今どうなっているか、だけ）

★**独立です。** 解除は `enrollments` にも `assignments` にも触れません。
在籍を終えるのは、別の操作です（`10003`：`status = 'left'` / `left_at`）。
★**設計としてそれでよいかは、私の判断ではありません。**

## ④ ほかの更新は、今夜の GRANT に収まるか

★**4つとも収まります。** 弾かれるものはありません。

| 操作 | 場所 | 書く列 | 渡してある列 | 判定 |
|---|---|---|---|---|
| つながりの解除 | `9655` | `status` / `revoked_at` / `revoked_by` | 同じ3列 | ★通る |
| 担当を外す | `10300` | `ended_at` | `ended_at` | ★通る |
| 予定の日付変更 | `10060` | `previous_date` / `event_date` / `updated_at` | 4列のうち3つ | ★通る |
| 予定の取り下げ | `10077` | `withdrawn_at` / `updated_at` | 4列のうち2つ | ★通る |
| レッスンの実施記録 | `9734` | `held` | `held` | ★通る |

★**今夜 GRANT を触っていない表**：`enrollments` / `link_consents`。
★表の単位の UPDATE が残っているので、そこは変わっていません。

## ★直しの案（★実装していません）

### 案1（推し）★何行変わったかを見る

```js
const { data, error } = await supabase.from("teacher_student_links")
  .update({ status: "revoked", revoked_at: …, revoked_by: asRole })
  .eq("id", linkId)
  .select("id");                          // ★これを足す
if (error) { …; return; }
if (!data || data.length === 0) {          // ★0行だった＝弾かれた
  setSomeError("解除できませんでした。時間をおいて、もう一度お試しください。");
  return;
}
```

★**理由**：RLS で0行に当たった更新は、エラーになりません。
★`.select()` を付けないと、成功と区別がつきません。
★`handleSetLessonHeld`（`9730`）は、すでにこの形にしてあります。★同じ形にそろえます。

### 案2 生徒側の画面を、取り直す道を増やす

いまは `visibilitychange` だけです（`5746`）。★開いたままだと、古いままです。
★これは「解除が効いていない」ではなく「見えている情報が古い」だけです。
★直すかどうかは、体験の判断です。私からは決めません。

## ★次にお願いしたいこと（1本）

```sql
select policyname, cmd, permissive, qual, with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'teacher_student_links'
 order by cmd, policyname;
```

★**UPDATE のポリシーが何本あるか。** それで、①が「成功していた」のか
「0行に当たっていた」のかが確定します。
★**実地でも確かめられます**（なりすまして解除し、`.select` 相当の returning を見る）。
★**コードだけでは、ここから先は決められません。**
