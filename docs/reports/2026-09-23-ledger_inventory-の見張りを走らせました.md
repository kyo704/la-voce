# `ledger_inventory` の 見張りを 走らせました（2026-09-23・本番）

★控え …… `tools/ledger_snapshots/2026-09-23_prod.json` ／ `_test.json`

---

## ★★★Opus へ お返しする もの ── A7 は **空振り** です

```
A7 | get_public_portfolio(p_slug text) | entries（体調の記録）を読む security definer の関数が許可リストの外
```

★★★この 関数は、★`public.entries` を **引いて いません**。

★関数の 中の `entries` は、★**1か所 だけ** です ──

```sql
16| 'entries', coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, …
```

★★これは **JSON の 鍵の 名前** です。★表の 名前では ありません。
★★引いて いるのは `portfolio_entries`（★別名 `e`）です。

★確かめ方 ──

```
public.entries を 引いて いるか …… False
  （`\bpublic\.entries\b` ／ `\bfrom\s+entries\b` ／ `\bjoin\s+entries\b` の どれにも 当たりません）
```

★★★これは、★この 倉庫で 何度も 出て いる 形 です ──
　★**字だけ 見て、★処理と 読む**（★台帳 08-10「説明を 処理と 読む」の 仲間）。
　★`portfolio_entries` に `entries` が 含まれて います。

★★直し方（★Opus へ）…… ★語の 区切りで 合わせる。

```
いま …… 'entries' in 本文（★たぶん）
案 …… \b(public\.)?entries\b   ★かつ from / join / update / insert into の 後ろ だけ
```

---

## A4 …… ★これは **わざと** です（★空振りでは ありません）

```
A4 | get_public_portfolio(p_slug text) | security definer を anon が 実行できる
A4 | submit_inquiry(p_slug, p_name, p_email, p_body) | 同じ
```

★どちらも 裁定167 B1 と 裁定128 の とおり です ──
　★公開ページは **関数 だけ** で 読む。★問い合わせは 入って いない 人も 送れる。
★★★許可リストに 足す のが 筋 だと 思います。★足して いません（★Opus の 道具 です）。

---

## A5 …… ★名前は 残ります。★データは **消しました**

```
A5 | 20260916125424_seed_visual_demo_3sections
A5 | 20260917112038_place_test_furniture_for_room_drift_measurement
A5 | 20260917112552_place_interior_furniture_for_drift_measurement
A5 | 20260918003739_create_gakucho_post_for_forcode_test_org
A5 | 20260918020628_seed_6_enrollments_for_screenshot
A5 | 20260918061529_reseed_6_enrollments_for_meibo_shot
A5 | 20260918071800_cleanup_test_enrollments_final
A5 | 20260918081249_seed_teacher_assignment_and_lesson_for_shukketsu_test
```

★★きょう FX9 で **中身は 消しました**（★学校12・行 117）。
★★★けれど **移行の 名前は 消えません**。★消しては いけない もの です。
　★「いつ 何を 入れたか」の 記録 だから です。

★★A5 は これから も 出続けます。★Opus の 道具に「★消し込み 済み」の 印が あると よいかも しれません。

---

## A8 …… ★29件（★これから 1つずつ）

★表ごとの INSERT・UPDATE を `authenticated` が 持って いる 表 です。
★★裁定164 W2 で `org_messages` を 直した のと 同じ 形 です。

★★★きょうは 数えた だけ です。★1つずつ、★列を 絞れるかを 見ます。
　★★見る とき の 決め …… ★画面が どの 列を 書くかを 先に 数える。
　　★★数えずに 絞ると、★きょうの `.vercelignore` と 同じ ことに なります。
