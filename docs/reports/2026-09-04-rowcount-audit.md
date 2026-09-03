# 無音で失敗しうる更新の一覧（2026-09-04・調査のみ）
全107行 / 末尾は「★権限で弾かれる可能性が高いぶん、先に見る価値があります。」

## 結論（先に）

★**`.select()` を付けていない更新が、33件あります。** うち★**28件が `profiles`**。

★これらは、RLS で弾かれても・行が無くても、★**エラーになりません。**
★PostgREST では、0行の更新は `error === null` です。
★呼ぶ側が行数を見ていないので、★**失敗しても、誰も気づけません。**

★**承認された6操作の外です。直していません。** ご判断をいただいてから着手します。

## ★なぜ、これが重いのか

`supabase/check_missing_profiles.sql` に、すでに書いてありました。

> profiles の行が無い人は、アプリを使えます。ログインもできます。
> ですが★保存が、ひとつも効きません。
> ★行が無ければ、UPDATE は0行に当たります。
> PostgREST は0行の更新を★エラーにしません。error は null です。
> つまり画面には★成功したように見えます。

★**そのとおりのことが、28か所で起きうる形になっています。**
★2026-09-03 の調べでは「本物の幽霊（profiles が無くログイン済み）」は0でした。
★**いまは誰も踏んでいません。** ですが、★踏んだ人には何も起きず、何も伝わりません。

★同じ形が、実際に1件起きています ―― ★**#004（招待が使用済みにならない）**。
★生徒が先生の行を更新しようとして0行に当たり、★完全に無音でした。

## 一覧（行番号順・そのまま）

| 行 | 表 | 呼び出し |
|---|---|---|
| 5259 | profiles | `.from("profiles").update({ pwa_installed_at: new Date().toISOString() }).eq("id", userId).then(() => {})` |
| 5277 | profiles | `.from("profiles").update({ pwa_install_prompted_at: new Date().toISOString() }).eq("id", userId).then(() => {})` |
| 5575 | profiles | `.from("profiles").update(adoptedOcc).eq("id", userId)` |
| 5627 | profiles | `.from("profiles").update(adopted).eq("id", userId)` |
| 8845 | profiles | `.from("profiles").update({ garden_theme: themeKey }).eq("id", userId)` |
| 9043 | profiles | `.from("profiles").update(patch).eq("id", userId)` |
| 9071 | profiles | `.from("profiles") .update({ height_cm: draft.height_cm === "" ? null : Number(draft.height_cm), voice_type: draft.voice_` |
| 9098 | profiles | `.from("profiles") .update({ allergies: draft.allergies || [], regular_medications: draft.regular_medications || [] }) .e` |
| 9119 | profiles | `.from("profiles") .update({ voice_occupation: draft.voice_occupation }) .eq("id", userId)` |
| 9131 | profiles | `.from("profiles") .update({ cycle_show_on_home: draft.cycle_show_on_home !== false }) .eq("id", userId)` |
| 9181 | profiles | `.from("profiles").update(finalPatch).eq("id", userId)` |
| 9193 | profiles | `.from("profiles").update(patch).eq("id", userId)` |
| 9203 | profiles | `.from("profiles").update({ practice_reviews: updatedReviews }).eq("id", userId)` |
| 9213 | profiles | `.from("profiles").update({ folded_groups: updated }).eq("id", userId)` |
| 9230 | profiles | `.from("profiles").update({ record_mode: mode }).eq("id", userId)` |
| 9269 | profiles | `.from("profiles").update({ occupation_notice_shown_at: at }).eq("id", userId)` |
| 9304 | profiles | `.from("profiles").update({ folded_groups: updated }).eq("id", userId)` |
| 9315 | profiles | `.from("profiles").update(patch).eq("id", userId)` |
| 9328 | profiles | `.from("profiles").update(patch).eq("id", userId)` |
| 9347 | profiles | `.from("profiles").update(patch).eq("id", userId)` |
| 9358 | profiles | `.from("profiles").update({ survey_day7_response: answer }).eq("id", userId)` |
| 9369 | profiles | `.from("profiles").update({ survey_day7_shown_at: shownAt }).eq("id", userId)` |
| 9378 | profiles | `.from("profiles").update({ day_record_boundary_hour: hour }).eq("id", userId)` |
| 9385 | profiles | `.from("profiles").update({ display_name: name }).eq("id", userId)` |
| 9680 | link_consents | `.from("link_consents") .update(buildUnlinkPatch({ by: asRole })) .eq("student_id", link.student_id).eq("teacher_id", lin` |
| 9941 | article_notes | `.from("article_notes").update({ deleted_at: new Date().toISOString() }).eq("id", noteId)` |
| 10021 | enrollments | `.from("enrollments").update({ status: "left", left_at: new Date().toISOString() }).eq("id", enrollmentId)` |
| 10123 | org_event_participants | `.from("org_event_participants") .update({ dismissed_at: new Date().toISOString() }).eq("id", j.id)` |
| 10294 | memberships | `.from("memberships").update({ role: newRole }).eq("id", membershipId)` |
| 10411 | profiles | `.from("profiles").update({ line_link_code: code }).eq("id", userId)` |
| 10417 | profiles | `.from("profiles").update({ line_notification_enabled: enabled }).eq("id", userId)` |
| 10424 | profiles | `.from("profiles").update({ line_user_id: null, line_linked_at: null }).eq("id", userId)` |
| 16508 | profiles | `.from("profiles").update({ consent_stats_use_at: value }).eq("id", userId)` |
## ★分けて考えるべきもの

| 群 | 件数 | 性質 |
|---|---|---|
| `profiles`（本人の設定・記録） | 28 | ★行が無い人には、何も保存されません。★本人にも分かりません |
| `memberships` / `enrollments` | 2 | ★権限で弾かれうる。役割・在籍の変更 |
| `link_consents` | 1 | ★同意の台帳。落ちても、いまは console だけ |
| `org_event_participants` / `article_notes` | 2 | 本人のもの。影響は小さい |

## ★案（実装していません）

### 案1 一律に `.select()` を足す

- 利点：★抜けが無くなります。検査で見張れます。
- 欠点：33か所に手が入ります。★1回の変更としては大きいです。
- ★`profiles` の28件は、ほとんどが `.eq("id", userId)` の1行更新なので、
  ★足す作業自体は機械的です。

### 案2 `profiles` だけ、共通の関数を1つ作る

`updateOwnProfile(patch)` のような関数を1つ作り、★中で行数を見ます。
- 利点：★28か所が1か所になります。★同じ判断が28か所にある状態を解消できます。
- 利点：今後 `profiles` を更新するとき、自然にその関数を通ります。
- 欠点：28か所の呼び出しを書き換えます。★案1より変更は大きいです。
- ★私の推しは、こちらです。

### 案3 いまは何もせず、記録だけ残す

- ★「本物の幽霊」が0である以上、いま踏む人はいません。
- ★ただし、次に profiles の無い人が生まれたとき、★また無音になります。

## ★私の意見

★**案2を推します。** 理由は、今日いちばん繰り返した教訓と同じです ――
★**同じ判断が何か所にもあると、いつか片方だけが直されます。**
★28か所に「行数を見る」を書き写すのは、その状態を作ることです。

★**ただし、これは今日の穴とは別の話です。** 急ぎません。
★`profiles` の28件より、`memberships` と `enrollments` の2件のほうが、
★権限で弾かれる可能性が高いぶん、先に見る価値があります。
