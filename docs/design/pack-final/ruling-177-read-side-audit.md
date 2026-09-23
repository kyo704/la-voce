# RULING 177 — 読み取りのポリシー115本の監査

```yaml
ruling: 177
date: 2026-09-23
version: design-v24
how: Opus が本番を読み取りだけで。SELECT と ALL のポリシー115本を、次の観点で1本ずつ
  ①本人に縛られているか ②権限（札）に縛られているか ③2本ある表は 緩いほうが勝たないか
  ④未ログイン（anon）から読めないか ⑤select のポリシーが無いのに読める表が無いか
結論: ★重大なものは無い。直すもの2件・記録するもの3件
```

## 1. 良かったこと（そのままでよい）

```yaml
未ログインから読める表: ★0件（anon に select の権限を渡した表が1つも無い）
本人のものだけの表: entries・notes・events・cycle_periods・performances・portfolio*・character_inventory・
  item_acquisitions・matching_*・user_notices・guardian_consents・minor_billing_consents・consent_records・
  email_change_log・subscriptions・purchases・repertoire_tessitura・article_*・chapter_state・my_timetable・my_periods
  → ★すべて auth.uid() = 本人 の1行だけ。ほかの人の行は返らない
profiles: ★本人の行だけ。ほかの人の名前は、security definer の関数（get_org_member_names など）からだけ
健康の記録（entries）: 先生・学校・運営から読む道は ★1本も無い（裁定167 D1 の再確認）
ポリシーの無い表（読めない表）: account_deletions・feedback・notice_batches（★正しい。運営だけ）
```

## 2. 直すもの（2件・急ぎではない）

```yaml
R1_学校を作った人が、抜けたあとも学校を見られる:
  いま: organizations に select のポリシーが2本。片方が created_by = auth.uid()
    → ★契約者を移して学校を抜けたあとも、その人には学校の行（名前・契約者・設定）が見え続ける
  いまの本番: 該当0件（作った人は全員まだ在籍している）
  直し: このポリシーを消し、can_view_organization（在籍か名簿にいること）だけにする
    ただし ★学校を作った直後の一瞬（memberships がまだ無いとき）に見えなくなる場合があるので、
    Code は「作る処理の中で membership も同じ取引で作っているか」を先に確かめる
R2_評価の項目が、審査員でない職員にも見える:
  いま: evaluation_items の select は「その学校の memberships にいる人」なら誰でも
    → 何を採点するか（項目と配点）が、採点に関わらない職員にも見える
  害の大きさ: 小さい（点そのものは見えない）。ただし ★「採点に関わる人だけ」の建前とずれる
  直し: has_can(org_id,'saiten') または その回の審査員（裁定165 の evaluation_judges）に絞る
```

## 3. 記録するもの（直さない。理由つき）

```yaml
N1_memberships を post の札で全部読める: 名簿の画面に要る。役職を渡す相手を選ぶため。妥当
N2_org_divisions・org_events を在籍の学生が読める: 学科の一覧・行事は学生に見せるもの。妥当
N3_lessons に古いポリシーが1本残っている（teacher_student_links 経由）:
  学校のレッスンは link_id が空なので、この枝では読めない（確認済み）。
  ★古いつながりの表を使わなくなったら、このポリシーごと消す
```

## 4. 2本ある表（22表）── 緩いほうが勝たないか

```yaml
確かめた: どの表も、2本目は「本人」か「札」に縛られている。無条件の枝は ★0件
  例: lesson_prefs（本人 ＋ 日程の札／担当の先生）・koen_*（見られる人 ＋ 運営）・
      evaluation_scores（審査員本人 ＋ 採点の札 ＋ その回の審査員）
★ただし evaluation_scores・reviews の3つ目の枝（judge_done にいる担当中の先生）は、
  裁定164 W3 の穴（誰でも judge_done を作れる）と組み合わさると効く
  → 裁定165（審査員の表）を当てると閉じる。★165 を当てるまで、この枝は開いている
```

## 5. VERIFY（試しの環境で）

```yaml
- 学校を作った人が抜ける → その学校が見えなくなる（R1 を直したあと）
- 採点の札を持たない職員が evaluation_items を select → 0行（R2 を直したあと）
- 学生が ほかの学生の entries・notes・events を select → 0行（いまも0行）
- 未ログインで どの表を select しても → 権限エラー（表の権限が無い）
```
