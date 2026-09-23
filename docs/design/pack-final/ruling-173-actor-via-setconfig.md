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
仕組み:
  サーバは、利用者の処理を始めるときに 1行入れる:
    select set_config('app.actor_id', <ログインしている人の id>, true);   -- true＝この取引の中だけ
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
