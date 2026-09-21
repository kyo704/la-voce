# RULING 163 — 監査つづき（RLS 全体・GRANT・バックアップ表）

```yaml
ruling: 163
date: 2026-09-21
version: design-v21
severity: 中（評価データの書き込みに在籍確認が無い／RLS無効の表）
how: Opus が本番を読み取りだけで直接。INSERT ポリシーの with_check 欠落・RLS 無効の表・
     採点関連の write ポリシー・ビュー（無し）・search_path 未設定（無し）を確認
```

## 1. 評価（採点）の書き込みに、学校の確認が無い

```yaml
対象: evaluation_scores_write ／ evaluation_reviews_write（cmd ALL）
いま: USING/WITH CHECK が (judge_id = auth.uid()) だけ
問題: ログインしていれば誰でも、judge_id を自分にして org_id・event_id・student_id・points を自由に指定し、行を作れる。
  その学校の在籍も、審査員としての割り当ても確かめていない
  影響: 無関係な学校の採点表に、身に覚えのない行が混ざる。saiten を持つ職員が誤って確定する可能性
  設計原則との関係: 「画面ではなく台帳で守る」の型が、この2表だけ抜けている
直し（案）:
  create policy evaluation_scores_write on evaluation_scores for all
    using (judge_id = auth.uid())
    with check (
      judge_id = auth.uid()
      and exists (select 1 from evaluation_judge_done d where d.event_id = evaluation_scores.event_id and d.judge_id = auth.uid())
        -- または、審査員として組まれていることを確かめる別の表がすでにあれば、それを使う
    );
  （evaluation_reviews_write も同じ形）
  ★Code に確認: 「審査員として組まれている」ことを表す正しい表・列は何か（evaluation_judge_done は「終えた」印らしく、
    「割り当てられている」印とは違う可能性がある。裁定105 の設計を見て正しい条件に直す）

VERIFY:
  - 試しの利用者A（どの学校にも属さない）が、既存の event_id・student_id を使って evaluation_scores に insert を試みる → 拒否
  - 正規の審査員が、自分に割り当てられた event で insert → 成功（いままでどおり）
```

確かめ直し（同日・裁定162 の誤りを受けて）:
  - authenticated に evaluation_scores・evaluation_reviews の INSERT・UPDATE（列ごと・全列）がある
  - 引き金は evaluation_scores_guard_trg（BEFORE UPDATE）だけ。insert の守りは無い
  → REST から直接 insert できる。この穴は本物

## 2. RLS が無効のまま、authenticated に全権限がある表

```yaml
表: _a13_policy_backup
いま: relrowsecurity = false。authenticated に DELETE・INSERT・SELECT・UPDATE
中身: 9/14 の移行（a13_replace_has_can_policies）で使った、古いポリシー定義の控え12行。利用者の個人データではない
問題: ログインしていれば誰でも、この表を自由に読み書き消しできる。実害は小さいが、同じ型の抜けが他の作業用の表にも
  残っていないかの点検が要る
直し: 移行が完了しているので、表そのものを消す（drop table）。控えが要るなら、docs/ にファイルとして移す
```

## 3. 確認して問題が無かったこと

```yaml
- INSERT のポリシーで with_check が無いもの: 0件（全部ちゃんと絞られている）
- ビュー（v・m）: 0件（無い）
- security definer で search_path が未設定: 0件（全部固定されている）
- memberships・organizations の列ごとの権限: UPDATE できる列は絞られている（memberships は grade_label・role のみ）。
  organizations は列は広いが、そもそも update の RLS ポリシーが無いので authenticated からは通らない（安全）
```

## 4. 次にやるなら

```yaml
- 同じ形（write のポリシーが本人確認だけで、所属・権限の確認が無い）の表を、evaluation_* 以外にも探す
  （org_billing・org_events・lesson_presets などは has_can で絞られていることを個別に確認済み。残りの小さい表を順に）
- ストレージ（storage.objects）のバケットの権限（写真・録音）はまだ見ていない
```
