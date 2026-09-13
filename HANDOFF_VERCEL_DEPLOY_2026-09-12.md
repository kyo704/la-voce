# 引き継ぎ資料：Vercelデプロイ対応（2026年9月12日）

**次のチャットセッション向け・Vercelデプロイのエラー対応記録**

---

## 📊 現在の状態

### リポジトリ
```
URL: https://github.com/kyo704/la-voce
ブランチ: main
最新コミット: b6ecd86（origin/main と同期済み）
作業ツリー: クリーン
```

### 最新コミット履歴
```
b6ecd86 fix: restore docs/ to deployment (JSON assets required at build time),
         move tailwindcss/postcss/autoprefixer to dependencies
c23f85d fix: remove invalid nodeVersion and env secret refs from vercel.json
dbe1c6a fix: remove nonexistent vercel/action workflow, convert lib/email* to
         ESM, fix test format
31119ab docs: add handoff, deployment fix, and github status resources
ff03d76 fix: github actions vercel deployment config - add VERCEL_TOKEN to env
1c0ee94 feat: add vercel deployment, UI components, security layer
```

### ローカル確認済み
```
npm test  → 失敗0件（全291+テスト成功）
npm run build → 正常終了（既存の警告のみ、新規エラーなし）
```

---

## 🔴 Vercelデプロイで発生した問題と対応の経緯

### 経緯①：GitHub Actions経由のデプロイをやめた
- 当初 `.github/workflows/deploy.yml` を作成し、`vercel/action@v5` という
  GitHub Actionでデプロイしようとしたが、**このActionはGitHub上に存在しない**
  （`github.com/vercel/action` は404）。
- Vercel公式ドキュメントの結論：Vercelは GitHubリポジトリをインポートするだけで
  push毎に自動デプロイする「ビルトインGit連携」を持っており、
  ほとんどの場合パイプラインは不要。
- → `.github/workflows/deploy.yml` を削除。Vercelのビルトイン連携（Import Git
  Repository）を使う方式に統一した。

### 経緯②：新規追加テストがCIで落ちていた
- 新規追加した `components/tests/email-restrictions.test.js` を Jest形式
  （`describe`/`it`/`expect`）で書いていたが、**このリポジトリの `npm test` は
  Jestではなく素のNode.jsで `components/tests/*.test.js` を1本ずつ実行する
  自作の仕組み**（`package.json` の scripts.test 参照）。
  → `describe is not defined` でクラッシュしていた。
- 併せて、参照先の `lib/emailRestrictions.js` / `lib/emailAuthGuard.js` を
  `module.exports`（CommonJS）で書いていたが、**このリポジトリの lib/ は
  すべて `export function`（ESM）形式**。テストは `data:text/javascript` 経由の
  動的importでソースを読むため、ESM以外は動かない。
- → 両libファイルをESMに書き直し、テストも他のテスト
  （`consent-gate.test.js` 等）と同じ「readFileSync + 動的import + ok()」の
  自作アサーション形式に書き直した。ローカルで20件全通過確認済み。

### 経緯③：`vercel.json` のスキーマエラー
```
Build Failed: The `vercel.json` schema validation failed with the following
message: should NOT have additional property `nodeVersion`
```
- `vercel.json` に **存在しないプロパティ `nodeVersion`** を書いていた。
  Node.jsバージョンは `vercel.json` ではなく、**Vercelダッシュボードの
  Project Settings > Node.js Version**で設定するもの（現在ダッシュボード側は
  `24.x` に設定済みと確認）。
- 併せて `env` セクションに `"NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url"`
  という**古いVercel CLI Secrets参照記法**を書いていたが、実際にSecretsを
  登録していなかったため、これも別のビルドエラー要因になり得た。
- → `nodeVersion` と `env` セクションを `vercel.json` から削除。
  環境変数は Vercelダッシュボードの Environment Variables で直接設定する
  運用に統一した。

### 経緯④：`docs/` 配下のJSONアセットが見つからない（★最重要・修正済み）
```
Module not found: Can't resolve 'docs/opus/items.json'
Module not found: Can't resolve 'docs/assets/second-color-table.json'
Error: Cannot find module 'tailwindcss'
```
- **原因1**：以前作成した `.vercelignore` に `docs/` を丸ごと除外する設定を
  入れていた。しかし以下のコアファイルが `@/docs/...` からJSONを
  直接importしており、**これらのJSONアセットはビルドに必須**：
  ```
  lib/secondColorChoice.js  → @/docs/assets/second-color-table.json
  lib/sheepInterior.js      → @/docs/assets/sheep-tiles-index.json
  lib/sheepInteriorV2.js    → @/docs/assets/sheep-interior-index.json
  lib/sheepItems.js         → @/docs/assets/sheep-items-index.json
  lib/sheepSpeech.js        → @/docs/assets/serifu-add-70.json
  components/WardrobePanel.jsx → @/docs/opus/items.json
  ```
  → `.vercelignore` から `docs/` と `*.md` の除外を削除。
    ローカルのdocsファイル自体は削除・変更していない（存在確認済み）。

- **原因2**：`tailwindcss` / `postcss` / `autoprefixer` が `package.json` の
  `devDependencies` に入っていたため、Vercel本番ビルド時に
  インストールされずビルドが失敗していた（`next/font` 経由のエラーとして
  表面化していた）。
  → 3パッケージを `dependencies` に移動。

- **ローカルで `npm install` → `npm run build` を実行し、
  tailwindcssエラー・docs/JSONエラーともに解消したことを確認済み。**

---

## ✅ 今回の一連の修正のコミット

```
dbe1c6a fix: remove nonexistent vercel/action workflow, convert lib/email*
        to ESM, fix test format
c23f85d fix: remove invalid nodeVersion and env secret refs from vercel.json
b6ecd86 fix: restore docs/ to deployment (JSON assets required at build
        time), move tailwindcss/postcss/autoprefixer to dependencies
```

すべて `git push origin main` 済み。origin/main と同期済み。

---

## 📋 次にやるべきこと（優先順位順）

### 1. Vercelダッシュボードで再デプロイを確認する
```
https://vercel.com/dashboard → la-voce プロジェクト → Deployments
```
- 最新コミット `b6ecd86` を検知して自動デプロイが走っているか確認
- ビルドログにエラーが出ていないか確認
  （tailwindcssエラー・docs JSONエラーはもう出ないはず）

### 2. まだデプロイが失敗する場合の確認ポイント
- **Environment Variables**（Project Settings > Environment Variables）に
  以下が設定されているか確認：
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - その他アプリが参照する環境変数（`.env.e2e` や `.env.backup.local` を
    参考に、本番用の値をSupabaseダッシュボードから取得して設定する）
- **Node.js Version**（Project Settings > General）が `20.x` 系になっているか
  確認（現状 `24.x` でも今回のエラーとは無関係だが、`package.json` に
  Node 20系依存の記述がないか念のため確認）

### 3. デプロイ成功後に確認すること
- 本番URL（`https://la-voce-xxxx.vercel.app/` 等、Deploymentsに表示される
  ドメイン）にアクセスし、ログイン・記録画面が動くか確認
- Supabase接続が正しく機能しているか確認

### 4. 未着手（前回引き継ぎ資料から持ち越し）
- ReviewPanel.jsx / NotePanel.jsx / MorePanel.jsx を VocalTracker.jsx に統合
- design_9.11-5（PC・iPad個人版）とのレイアウト同期
- iPad対応の @media クエリ追加

---

## 🚫 やってはいけないこと

- `.vercelignore` に `docs/` を再度追加しない（JSONアセットが壊れる）
- `tailwindcss`/`postcss`/`autoprefixer` を `devDependencies` に戻さない
  （本番ビルドで見つからなくなる）
- `vercel.json` に `nodeVersion` を追加しない（スキーマ違反）
- `vercel.json` の `env` に `@secret名` 形式を書かない（Secrets未登録なら
  別エラーになる。環境変数はダッシュボードで直接設定する）
- 新規テストファイルを Jest形式（describe/it/expect）で書かない。
  必ず `components/tests/` 内の既存テスト（例：`consent-gate.test.js`）と
  同じ「fs.readFileSync + 動的import + 自作 ok() アサーション」の形式に
  合わせること
- `lib/` 配下の新規ファイルを CommonJS（`module.exports`）で書かない。
  必ず ESM（`export function` / `export const`）で書くこと

---

**作成日：** 2026年9月12日  
**対象：** 次のチャットセッション  
**状態：** ローカルのテスト・ビルドは成功確認済み。Vercel側の再デプロイ結果待ち。
