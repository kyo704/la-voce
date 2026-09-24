# RULING 173 — 「誰が変えたか」を service role の処理でも残す（app.actor_id）

```yaml
ruling: 173
date: 2026-09-23
version: design-v24
from: Code（sql/06 の実装で発見）。役職の変更はサーバ（service role）を通るため、引き金の中の auth.uid() が null になり「誰が」が残らない
decision: ★Code の提案（㋑ set_config 経由）を採る
precedent: 本番に既に同じ形がある（evaluation_scores_guard が current_setting('app.score_edit', true) を見ている）
```

## 1. 決定

```yaml
仕組み（★2026-09-23 修正。Code が実装で見つけた）:
  ★印（app.actor_id）は「取引の中だけ」有効。supabase-js は 1回の呼び出し＝1つの取引なので、
    別々の呼び出しで「印を置く」→「変える」と分けると、変えるころには 印が消えている
  → サーバは ★関数を呼ぶ。関数が ★同じ取引の中で 印を置いてから 変える
    例: set_member_post(p_org_id, p_user_id, p_post_id)
        関数の中で: perform set_config('app.actor_id', <本人の id>, true); → update memberships …
  ★本番に 同じ形の先例がある（正しい形）:
    edit_confirmed_score は、関数の中で set_config('app.score_edit','on',true) を置いてから update している
    （2026-09-23 に Opus が本番の定義を読んで確認。こちらは同じ問題を持っていない）
  台帳の引き金・関数は、次の順で「誰が」を決める:
    ① auth.uid()（画面から直接のとき）
    ② app.actor_id（サーバが service role で代わりに行うとき）
    ③ どちらも無ければ null ＋ 種類を 'system'（台帳の掃除・cron）
呼び名: public.actor_id() という関数にまとめる。引き金は必ずこれを使う（各所で current_setting を書かない）
残す列: 「誰が（id）」と「どんな立場で（person / system）」と「そのときの名前」
★守り:
  - app.actor_id を信じるのは service role の接続だけ。画面（authenticated）からの接続では auth.uid() を優先する
    （画面が app.actor_id を勝手に入れても、auth.uid() が勝つ）
  - 取引の中だけ（set_config の3番目を true）。接続に残さない
  - サーバは「誰の処理か」を必ず入れる。入れ忘れた処理は 'system' として残り、あとで分かる
やらないこと:
  - ★サーバから set_config だけを別に呼び、そのあと別の呼び出しで update する（印が消える）
  - 引き金をやめて、画面から記録の表に直接 insert する（偽の記録が作れる。裁定161 FX8 と逆）
  - 「誰が」を空のままにする（役職の変更は、誰がやったか分からないと意味がない）
```

## 2. VERIFY

```yaml
- 画面から自分の操作 → 記録の「誰が」に その人（種類は person）
- サーバが app.actor_id を入れて代わりに実行 → その人（person）
- サーバが入れ忘れ → null（system）。★エラーにはしない（処理は通す。記録に残す）
- 画面（authenticated）が app.actor_id に他人の id を入れて操作 → 記録は auth.uid() の本人（偽れない）
- 取引が終わったあと、次の取引で app.actor_id が空になっている
```

## 4. 追記（2026-09-23・Code の実装と Opus の確認）

```yaml
Code の直し: set_member_post を新設し、同じ取引の中で 印を置いてから 役職を変える形にした → ★正しい
actor_id() の仕組み自体: ★変更なし（auth.uid() を優先し、無ければ app.actor_id）
evaluation_scores_guard の確認（Opus が本番の定義を読んだ）:
  - 印を置くのも update も、同じ関数（edit_confirmed_score）の中 → ★同じ問題は無い
  - さらに: 点を直したあとに score_log と 学生への連絡を書く。どれかが失敗すれば 取引ごと戻る（直しも取り消される）→ fail closed
  - 1点だけ次に触るとき直す: 例外が起きても 'app.score_edit' を 'off' に戻す処理が無い。
    取引が終われば消えるので害は無いが、同じ取引の中で 別の点を直す処理を足すときは 注意が要る
決まり（これから作る関数すべてに）:
  ★「印（set_config）を置く関数」と「印を見る引き金」は、必ず同じ取引の中に入れる。
    印を置くのは サーバではなく 関数の中
```
