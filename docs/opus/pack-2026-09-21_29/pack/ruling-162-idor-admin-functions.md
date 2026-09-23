# RULING 162 — security definer 関数65本の監査。重大な穴2件

```yaml
ruling: 162
date: 2026-09-21
version: design-v21
severity: ★訂正（2026-09-21 同日）：本番は安全。危ないのは試しの環境だけ（§8）
how: Opus が本番の security definer 関数65本（拡張機能を除く全部）を1本ずつ読んだ
finding_count: 2件（重大）＋1件（軽微）
```

## 1. IDOR（本人確認の抜け） ── 2件

```yaml
共通の型: 関数が「引数で渡された p_user_id が○○か」だけを確かめ、
  「呼んでいる本人（auth.uid()）が○○か」を確かめていない。
  関数の本文に auth.uid() が一度も出てこない

F1_admin_entry_stats(p_user_id uuid):
  いま:
    select case
      when not exists (select 1 from profiles where id = p_user_id and is_admin is true)
      then null
      else jsonb_build_object('total', (select count(*) from entries), 'per_user', …, 'fill', …)
    end;
  問題: 認証さえしていれば、どの利用者でも「管理者のUUID」を p_user_id に渡せば通る。auth.uid() との一致を見ていない
  漏れるもの: 全利用者の記録の総数・利用者ごとの記録数・体重や体脂肪率や食事や運動や投薬タグやメンタルのタグやCPPS値や音声メモの
    「入力があるかどうか」の全体件数（値そのものではない）
  直し:
    CREATE OR REPLACE FUNCTION public.admin_entry_stats(p_user_id uuid)
    ...
      when p_user_id IS DISTINCT FROM auth.uid()
        or not exists (select 1 from profiles where id = p_user_id and is_admin is true)
      then null
    ...
  あわせて: p_user_id という引数自体が要らない（呼ぶ側は常に自分の id を渡すだけ）。
    引数を無しにして中で auth.uid() を使う形に直すほうが、この型の穴を作り直さない設計になる

F2_character_unlock_summary(p_user_id uuid):
  いま: プロフィールが存在するかしか見ていない。auth.uid() を使っていない
  問題: ログインしていれば、他人のUUIDを渡すだけで、その人の「本番の回数」「ピアニッシモの高音を出せたか」「記録した項目の種類数」が見える
  直し: 同上（p_user_id IS DISTINCT FROM auth.uid() で弾くか、引数を無くす）

FIX_SQL（案。Code が検証してから当てる）:
```sql
create or replace function public.admin_entry_stats(p_user_id uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case
    when p_user_id is distinct from auth.uid() then null
    when not exists (select 1 from public.profiles where id = p_user_id and is_admin is true) then null
    else jsonb_build_object( ... 既存のまま ... )
  end;
$$;

create or replace function public.character_unlock_summary(p_user_id uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case
    when p_user_id is distinct from auth.uid() then null
    when not exists (select 1 from public.profiles where id = p_user_id) then null
    else jsonb_build_object( ... 既存のまま ... )
  end;
$$;
```

## 2. 軽微 ── 1件

```yaml
get_timetable_submitted(p_org_id uuid): 他の同種の関数と違い、末尾に STABLE が無い（volatile 扱い）
  実害: 無し（読み取りのみで書き込みをしないので危険ではない）。次に触るときに STABLE を足す
```

## 3. 監査した残り62本

```yaml
結果: すべて auth.uid() で本人・権限を確かめている（has_can／has_can_user／memberships の存在／teacher_id=auth.uid() など）
含む: is_org_member・is_org_owner_or_admin・are_connected・can_view_organization（引数の viewer_id を受け取るが、
  呼び出し元は RLS のポリシーからのみで、利用者が直接は呼べない設計。ただし anon 実行可のため、裁定161 FX5 で対応予定と重複。ここでは対応不要）
```

## 4. VERIFY

```yaml
- 試しの利用者Aで admin_entry_stats(管理者のUUID) を呼ぶ → null が返る（修正後）
- 試しの利用者Aで character_unlock_summary(利用者BのUUID) を呼ぶ → null が返る（修正後）
- 管理者が admin_entry_stats(自分のUUID) を呼ぶ → いままでどおり返る
- 本人が character_unlock_summary(自分のUUID) を呼ぶ → いままでどおり返る
```

## 5. 過去の分

```yaml
STEP: query_logs（24時間分ずつ）で admin_entry_stats・character_unlock_summary の呼び出しのうち、
  引数の UUID が呼んだ本人（auth.uid）と違うものが無いかを Opus が確かめる
  期限: ログの保持期間が短いので、直すより先に
```

## 6. 追記（同日・過去ログの確認＋本番と試しのずれ）

```yaml
過去ログ（保存期間 約1日・2026-09-20 12:00〜2026-09-21 09:53）:
  admin_entry_stats: 呼び出し1件（9/21 9:30・POST 200）。鍵は sb_secret_ で始まる秘密鍵（サーバー側の呼び出し。node クライアント）
    → 利用者による悪用の跡ではない見込み。ただし秘密鍵を使っているのが誰か（Code の試験か）は未確認
  character_unlock_summary: 呼び出し0件
  限界: 保存期間より前は確かめられない。「無かった」の証明ではない

本番と試しのずれ（twin）: 55件
  ★最大の型（40件超）: security definer の関数が、本番は anon 不可・試しは anon 可
    含む: admin_entry_stats・character_unlock_summary（今回のIDOR2件）も、試しでは anon から直接呼べる
    → S1・S2 の証明に使った試しの環境は、本番より緩い状態だった（裁定161 FX7 の裏づけ）
  中身が違う（4件）: accept_teacher_invitation・are_connected・can_view_organization・has_can・get_invitation_teacher
    → 中身の比較は Code が個別に（本番が新しい直しを含む可能性が高いが、逆の場合もあるため要確認）
  試しにだけ・本番にだけ: create_org_event の引数の並びが違う（試しは4引数の古い形と9引数の新しい形の両方が残っている）。can_view_ops は試しにだけ（不要なら消す）
```

## 7. 確認依頼（Sakamoto/Code）

```yaml
Q: 9/21 9:30 の admin_entry_stats への呼び出し（秘密鍵・node）に心当たりがあるか（Code の試験なら問題なし）
FX7（裁定161）に追加: 試しの anon 実行可を本番に合わせて閉じる（40件超）。または「試しは緩くてよい」と決めるなら、
  S1・S2 のような重大な変更の証明だけは、試しではなく本番の複製（migration を当てただけの、まっさらな試し）で行う運用にする
```

## 8. ★訂正（同日・Code の検証で分かった。Opus の誤り）

```yaml
誤り: Opus は「anon が実行できるか」だけを見て、authenticated の実行権を確かめずに「ログインしていれば誰でも呼べる」と書いた
事実（Opus が本番で確かめ直した）:
  admin_entry_stats:        anon=false ／ authenticated=false ／ service_role=true
  character_unlock_summary: anon=false ／ authenticated=false ／ service_role=true
  → 本番では利用者は直接呼べない。サーバ（app/admin/page.js:167・app/api/character/unlock/route.js:87）が
    service_role で、自分で本人を確かめてから呼ぶ設計（No.024：「authenticated に渡して中で弾く」は採らない）
  → Code の実測：本番の3件とも 42501 で拒否
§1 の修正案は撤回: service_role では auth.uid() が null なので、「p_user_id is distinct from auth.uid()」は正当な管理の呼び出しまで塞ぐ
  「引数を無くして auth.uid() を中で使う」も撤回（No.024 と逆・サーバからの呼び出しを壊す）

決定（Code の推奨を採る）:
  - 関数はそのまま（引数を残す）
  - 塞ぐのは試しの環境の権限だけ：anon・authenticated から execute を外し、本番と同じにする（裁定161 FX7 の一部）
  - 任意の二重の守り（Code が判断）: 「auth.uid() is not null and p_user_id is distinct from auth.uid() なら null」
    → service_role（uid が null）は通り、万一 authenticated に権限が広がったときだけ効く。入れなくてもよい

繰り返さないために:
  - 関数の露出を調べるときは anon・authenticated・service_role の3つの実行権と、呼び出し元（サーバか画面か）を必ず見る
  - tools/ledger_inventory.sql・.py に authenticated の実行権を足した（auth の欄）。twin でも比べる
  - 裁定163 は、表の列ごとの権限（authenticated に INSERT・UPDATE がある）と引き金（BEFORE UPDATE だけ・insert の守り無し）まで確かめ直した → 163 は本物
```
