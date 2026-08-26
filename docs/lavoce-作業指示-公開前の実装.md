# 作業指示 ／ 日本公開の前に必要な実装

Claude Sonnet 5 への作業指示書。**この文書の範囲だけを実装してください。**

**いま `memberships` と `enrollments` が 500、`lessons` が 401 を返しています。**
**A-0 を最優先で直してください。他のすべてはそのあとです。**

参照：教室プラン仕様-複数教師と複数生徒.md ／ 作業指示-教室プラン.md

---

## A-0 ｜ ★最優先｜RLS の無限再帰を直す（1日）

### 症状

```
GET /rest/v1/memberships?select=*,org:organizations(*)   → 500
GET /rest/v1/enrollments?select=*,org:organizations(*)   → 500
GET /rest/v1/lessons?...                                 → 401
```

### 原因の見立て

**500 はほぼ確実に RLS の相互参照です**（Postgres `42P17` infinite recursion）。

```
organizations のポリシー → memberships を参照
memberships のポリシー   → organizations を参照
→ 再帰
```

**まず確認してください。** Supabase の Logs → Postgres で、
`infinite recursion detected in policy for relation ...` が出ていないか。

### 直し方

**所属の判定を `SECURITY DEFINER` の関数に切り出し、ポリシーはその関数だけを呼ぶ形にします。**
**ポリシーの中で、別のテーブルのポリシーを踏ませないこと。** これが再帰の唯一の原因です。

```sql
-- 所属しているか
create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from memberships m
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and m.left_at is null
  );
$$;

-- 管理者か
create or replace function public.is_org_admin(p_org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from memberships m
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and m.left_at is null
      and m.role in ('owner','admin')
  );
$$;

-- その生徒の担当か
create or replace function public.is_assigned_teacher(p_org uuid, p_student uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from assignments a
    where a.org_id = p_org
      and a.student_id = p_student
      and a.teacher_id = auth.uid()
      and a.ended_at is null
  );
$$;

revoke execute on function public.is_org_member(uuid)      from public, anon;
revoke execute on function public.is_org_admin(uuid)       from public, anon;
revoke execute on function public.is_assigned_teacher(uuid, uuid) from public, anon;
grant  execute on function public.is_org_member(uuid)      to authenticated;
grant  execute on function public.is_org_admin(uuid)       to authenticated;
grant  execute on function public.is_assigned_teacher(uuid, uuid) to authenticated;
```

**ポリシーは、この関数だけを呼びます。**

```sql
-- 例：organizations
create policy "org_select" on organizations
for select to authenticated
using ( public.is_org_member(id) );

-- 例：memberships（★自分の行は関数を使わずに直接許す。ここが再帰の分かれ目）
create policy "membership_self" on memberships
for select to authenticated
using ( user_id = auth.uid() );

create policy "membership_same_org" on memberships
for select to authenticated
using ( public.is_org_member(org_id) );
```

### 401 のほう

`lessons` の 401 は別の原因です。次の順で確認してください。

```
1. リクエストに Authorization ヘッダ（ユーザーのJWT）が付いているか
   → 付いていなければ、anon キーだけで呼んでいます
2. セッションの期限切れではないか（リフレッシュの実装）
3. teacher_student_links を参照していますが、
   ★教室プランでは assignments に置き換わっているはずです。
     古いテーブルを見に行っていないか確認してください
```

**3 が本命の可能性があります。** 移行の途中で、新旧のテーブルが混在していないか見てください。

### 完了の定義

- 3つのエンドポイントがすべて 200 を返す
- Postgres のログに `infinite recursion` が出ない
- **ポリシーの中で他テーブルを直接参照している箇所が0件**であることを、SQL を並べて示せる

---

## A-1 ｜ 権限のテストに戻る（2日）

**作業指示-教室プラン.md の A-1・A-2 に戻ってください。**

A-0 の事故は、**`canView()` とテスト16件を先に作らずに、機能から作った**ために起きています。

**16件のテストを、いま書いてください。** とくにこの4件です。

```
8   owner は、担当していない生徒の健康データを見られない       → false
9   admin は、担当していない生徒の健康データを見られない       → false
12  mental は、既定で誰にも見えない                            → false
13  担当を外れた先生は、担当していた期間の分も見られない        → false
```

**RLS のポリシーだけに頼らないこと。** サーバー側の `canView()` と、
RLS の**二重**で守ってください。片方が壊れても、もう片方が止めます。

---

## A-2 ｜ 要配慮個人情報の同意画面（2日）

**日本で公開する前に必須です。** 無料でも同じです。

### 出すタイミング

**初回のオンボーディングで、記録を1件も入れる前。**

### 画面

```
┌───────────────────────────────┐
│ 記録する内容について            │
│                               │
│ La Voce では、声の調子・のどの  │
│ 症状・既往症など、健康に関する  │
│ 情報を記録します。              │
│                               │
│ これらは法律上「要配慮個人情報」│
│ にあたり、あなたの同意なしに    │
│ 取得することはできません。      │
│                               │
│ ・記録はあなたのものです        │
│ ・先生に見せるかどうかは、      │
│   あなたが項目ごとに決めます    │
│ ・いつでも書き出し・削除できます│
│                               │
│ ☐ 上記に同意して、健康に関する  │
│    情報を記録することに同意する  │
│                               │
│ ☐ プライバシーポリシーと        │
│    利用規約に同意する           │
│    （それぞれ全文を表示）       │
│                               │
│      [ はじめる ]              │
└───────────────────────────────┘
```

**必須の条件**

| # | |
|---|---|
| 1 | **チェックは既定でオフ。** 事前チェック済みにしないこと |
| 2 | **2つを1つにまとめない。** 要配慮個人情報の同意は独立して取る |
| 3 | **スキップできない。** 同意しない場合は、記録機能を使えない |
| 4 | ポリシーと規約は**全文が読める**こと（リンク先で可） |
| 5 | **同意の記録を残す**（下記） |

```ts
interface PolicyConsent {
  userId: string
  kind: 'sensitiveData' | 'privacyPolicy' | 'terms'
  version: string          // 文書のバージョン
  agreedAt: string
  ipHash?: string          // 生IPは保存しない
}
```

**上書きせず、履歴として積んでください。**

### 改定したとき

**バージョンが上がったら、次回起動時に再同意を求める。**
**ただし、記録の閲覧と書き出しは同意なしでもできること**（自分のデータを人質にしない）。

---

## A-3 ｜ データの書き出し（2日）

**法律上の権利です。有料機能にしないでください。**

```
設定 → データの書き出し
    → JSON（全項目・完全）と CSV（表計算で開ける）の両方
    → 生成してメールで送る、または画面からダウンロード
```

**含めるもの**：記録の全項目・稽古ノート・学ぶのメモ・共有設定の履歴・同意の履歴
**含めないもの**：他のユーザーの情報（先生のメモなど）

**大量になるので、非同期で作って通知する形**にしてください。

---

## A-4 ｜ アカウントの削除（2日）

```
設定 → アカウントを削除

  ・削除すると何が消えるかを、実行前に一覧で見せる
  ・先生・教室との共有は即座に切れる
  ・30日間は復元できる（誤操作の救済）
  ・30日後に物理削除
  ・「今すぐ完全に削除する」も選べるようにする
```

**必須の条件**

- **削除の前に、書き出しを提案する**（A-3 へ導線）
- **教室の側から見えなくなるのは即時**。30日待たない
- **バックアップからの物理削除の手順を、コメントで残しておく**
  （復元したときに削除済みのデータが戻ると事故になります）

---

## A-5 ｜ ★ 監査ログ（2日）

**誰が、誰の健康データを、いつ見たかを記録してください。**

```ts
interface AccessLog {
  id: string
  viewerId: string
  studentId: string
  orgId?: string
  scope: string          // 'voice' | 'symptoms' | ...
  action: 'view' | 'export'
  at: string
}
```

**必須の条件**

- **`canView()` が true を返した瞬間に、必ず1行書く**
- **保存は1年**
- **本人（生徒）が自分の分を見られること** ←「誰が私の記録を見たか」
- **先生からは見えない**

> **これは事故が起きたときのためだけの機能ではありません。**
> 生徒が「誰が見ているか」を確認できることが、共有機能を安心して使える理由になります。
> **指導者プランの価値そのものを支えます。**

---

## A-6 ｜ 文言の監査（1日）

**アプリ内のすべての文言を検査し、次の語が出ないことを確認してください。**

```
疑い / リスク / 早期発見 / 予防 / 改善します / 治ります / 診断 /
正常 / 異常 / 基準値を下回る / 要注意（健康の文脈で）
```

**やること**

1. 全文言を1つのファイル（i18n のキー）に集約する
2. **上記の語を検出するテストを書く**（CI で落ちるように）
3. 引っかかったものを「自分比」の表現に書き換える

```
❌ 「声の不調のリスクがあります」
✅ 「あなたの過去14日と比べて低い日が3日続いています」
```

**「要注意」は、指導者ダッシュボードの生徒一覧で使っています。**
**ここは健康の判定ではなく「記録が途切れている」という運用上の印なので、
文言を「気にかけたい」などに変えてください。**

---

## A-7 ｜ 未成年（2日）

```
・生年月日、または「18歳未満か」を登録時に聞く
・18歳未満の場合
    - 保護者のメールアドレスを登録
    - 先生・教室への共有の同意に、保護者の確認メールを必須にする
    - 共有できる既定の範囲をさらに狭くする（睡眠を既定から外す）
    - 心の余裕・稽古ノート・学ぶのメモは、共有の選択肢に出さない
    - カレンダー連携を表示しない
```

**保護者の確認が取れるまで、共有は始まりません。**

---

## B ｜ 実装の順番

```
A-0  RLS の 500 を直す        1日   ★これが終わるまで他は触らない
A-1  権限のテスト16件         2日
     ↓ ここまでで「壊れていない」状態
A-2  同意画面                 2日
A-3  書き出し                 2日
A-4  アカウント削除           2日
A-6  文言の監査               1日
     ↓ ここまでで「日本で公開できる」状態
A-5  監査ログ                 2日
A-7  未成年                   2日
```

**A-2・A-3・A-4・A-6 が揃うまで、一般公開しないでください。**

---

## C ｜ 禁止事項

- ❌ **A-0 を後回しにしない。** 500 が出ている状態で他の機能を足さない
- ❌ RLS のポリシーの中で、他テーブルを直接参照しない（再帰します）
- ❌ **RLS だけで守らない。** サーバー側の `canView()` と二重にする
- ❌ 同意のチェックボックスを**既定でオンにしない**
- ❌ 要配慮個人情報の同意と、規約の同意を**1つにまとめない**
- ❌ **データの書き出しを有料機能にしない**（法律上の権利です）
- ❌ 同意していないユーザーの、**過去の記録の閲覧と書き出しを止めない**
- ❌ 監査ログを先生に見せない
- ❌ 削除したユーザーのデータを、**バックアップから戻さない**
- ❌ 「疑い」「リスク」「早期発見」「予防」を、アプリのどこにも出さない
- ❌ 文献の基準値と、ユーザーの数値を同じ画面に並べない

---

## D ｜ 完了の報告

**タスクごとに1行で。まとめて報告しないこと。**

```
A-0 完了：RLS の再帰を is_org_member / is_org_admin /
        is_assigned_teacher の SECURITY DEFINER 関数に切り出し。
        3エンドポイントとも 200。Postgres ログに recursion なし。
        ポリシー内の他テーブル直接参照は 0 件（SQL を添付）。
```

**A-0 が終わった時点で一度止まり、確認を受けてから A-1 に進んでください。**

---

## 注意書き

本書は日本国内での公開を前提とした実装項目です。
扱っているのは要配慮個人情報（声の不調・症状・既往症）であり、
**無料公開であっても、取得には本人の事前の同意が必要です。**

プライバシーポリシーと利用規約の**本文**は坂本さんが決めます
（「公開前チェック-坂本さんレーン.md」）。
**実装側は、それを表示し、同意を記録し、いつでも取り消せるようにする部分**を担当してください。

本書は法的助言ではありません。公開前に専門家の確認を受けてください。
