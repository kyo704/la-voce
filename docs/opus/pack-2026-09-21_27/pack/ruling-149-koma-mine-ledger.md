# 裁定その149 — koma_mine を台帳の門に足す

2026-09-21 ／ Opus ／ design-v10
きっかけ：Code 報告「できこと14のうち、台帳（RLS）が一度も参照していないのが koma_mine」

```yaml
decision: 台帳の門に足す。画面だけの門にしない

reason:
  - 画面の門は門ではない。Supabase へ直接書けば通る
  - 台帳08-1 の33件（画面の門と台帳の門の不一致）と同じ型。1件増やさない
  - CLAUDE.md「RLS は USING と WITH CHECK の両方」

scope_in:
  table: 「自分のコマ」（見本の KOMA_MY）を保存している表。Code が特定する
  insert: with check  user_id = auth.uid() AND has_can(org_id,'koma_mine')
  update: using / with check  user_id = auth.uid() AND has_can(org_id,'koma_mine')
  delete: using  user_id = auth.uid() AND has_can(org_id,'koma_mine')

scope_out:
  select: いまの経路を変えない
    - 本人以外（事務の koma・レッスン割 裁定139・生徒の空きコマ 裁定73）が読む経路があれば
      EVIDENCE に書く。変えるかどうかは別の裁定で決める
  他のできこと13: 触らない

when_permission_removed:
  - 自分のコマの行は消さない（取り上げない）
  - 効き続ける。以後なおせないだけ

check:
  - 札なしの先生で insert / update / delete を故意に試し、拒否されるログを EVIDENCE に
  - 札ありの先生で自分の行が書けること
  - 札ありの先生で他人の行が書けないこと

permanent:
  - 「できこと × 台帳が参照しているか」を perm-matrix の行に足す
  - 0件の列が出たら検査が落ちる形にする（今回の見つけ方を仕組みにする）

env: test で当ててから本番。本番に手で当てたら、その日のうちにリポジトリへ写す
```
