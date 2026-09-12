# Vercelセットアップ手順（2026-09-12）

## 🚀 Vercelデプロイ前にやること

### 1. GitHub連携

```bash
# 1. GitHub でリポジトリを作成
gh repo create la-voce --public --source=. --push

# 2. または既存リポジトリの場合
git remote add origin https://github.com/YOUR_USERNAME/la-voce.git
git branch -M main
git push -u origin main
```

### 2. Vercelでプロジェクト作成

```bash
# ① Vercel CLIインストール
npm install -g vercel

# ② Vercel にログイン
vercel login

# ③ プロジェクト初期化
vercel --prod

# ★ 以下の値をメモ：
# VERCEL_ORG_ID
# VERCEL_PROJECT_ID
```

### 3. GitHub Secrets 設定

Vercelダッシュボード or CLI から取得：

```
Settings > Integrations > Vercel
或は
vercel env list
```

**設定する環境変数：**

```bash
# GitHub Secrets に設定
VERCEL_TOKEN              # Vercel API Token
VERCEL_ORG_ID             # Organization ID
VERCEL_PROJECT_ID         # Project ID
NEXT_PUBLIC_SUPABASE_URL  # Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase Anon Key
```

**GitHub側での設定方法：**

```
Settings > Secrets and variables > Actions > New repository secret
```

### 4. デプロイ方法3パターン

#### パターン1：GitHub Actions（自動）

```yaml
# .github/workflows/deploy.yml に設定済み
# 条件：
# - main ブランチへの push で自動デプロイ
# - pull_request でプレビューデプロイ
```

#### パターン2：Vercel CLI（手動）

```bash
# 本番環境へデプロイ
vercel --prod

# プレビューデプロイ
vercel
```

#### パターン3：Vercel Web Dashboard

```
1. vercel.com にログイン
2. Projects > la-voce > Import Git Repository
3. Deployments タブで自動デプロイ確認
```

---

## ✅ デプロイ確認チェックリスト

### ビルド前確認

- [ ] `npm run test` 全通過
- [ ] `npm run build` 成功
- [ ] `git status` クリーン
- [ ] `.env.local` ファイルは含まない

### Vercel 設定確認

- [ ] VERCEL_TOKEN 設定済み
- [ ] VERCEL_ORG_ID 設定済み
- [ ] VERCEL_PROJECT_ID 設定済み
- [ ] Supabase 環境変数設定済み

### GitHub Actions 確認

- [ ] `.github/workflows/deploy.yml` 存在
- [ ] GitHub Secrets に環境変数設定済み
- [ ] Actions タブで workflow visible

### デプロイ後確認

- [ ] Vercel Deployments に green ✓
- [ ] vercel.com で本番URL確認可能
- [ ] 実機でアクセス確認

---

## 🔧 よくあるトラブル＆対処

### エラー1：「Build failed」

```
原因：npm test または npm run build でエラー

対処：
1. ローカルで再実行
   npm run test
   npm run build

2. エラー内容を確認
   tail -50 deployment-logs
```

### エラー2：「Environment variables missing」

```
原因：Vercel 環境変数が設定されていない

対処：
1. Vercel ダッシュボード
   Settings > Environment Variables > Add

2. または vercel.json に追加
   "env": { "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url" }
```

### エラー3：「Cannot find module」

```
原因：npm ci が実行されていない（dependencies がない）

対処：
vercel.json に追加：
{
  "buildCommand": "npm ci && npm run build",
  "devCommand": "npm run dev"
}
```

### エラー4：「Database connection error」

```
原因：Supabase 認証情報が正しくない

対処：
1. NEXT_PUBLIC_SUPABASE_URL を確認
2. NEXT_PUBLIC_SUPABASE_ANON_KEY を確認
3. Supabase ダッシュボード > Settings > API
```

---

## 📊 デプロイ後の確認

### 1. 本番URL アクセス

```
https://la-voce.vercel.app/
or
https://la-voce-yourname.vercel.app/
```

### 2. 本番環境での動作確認

- [ ] ログイン可能
- [ ] 記録画面表示
- [ ] データベース接続
- [ ] API エンドポイント応答

### 3. Vercel ダッシュボード

```
https://vercel.com/deployments
Projects > la-voce > Deployments
```

---

## 🔄 デプロイフロー図

```
git push (main)
    ↓
GitHub Actions trigger
    ↓
npm ci
    ↓
npm test
    ↓
npm run build
    ↓
vercel deploy --prod
    ↓
Deployment complete
    ↓
https://la-voce.vercel.app/
```

---

## 📝 Vercel設定ファイル

### vercel.json（既存）

```json
{
  "crons": [
    {
      "path": "/api/cron/line-reminder",
      "schedule": "0 22 * * *"
    },
    {
      "path": "/api/cron/purge-deleted",
      "schedule": "30 3 * * *"
    },
    {
      "path": "/api/cron/keep-alive",
      "schedule": "0 12 * * *"
    },
    {
      "path": "/api/cron/purge-events",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/pricing-notice",
      "schedule": "0 1 * * *"
    }
  ]
}
```

### .env.example（作成推奨）

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...（省略）
```

---

## 🎯 本番環境での推奨設定

### 1. ドメイン設定（オプション）

```
Vercel Dashboard > Settings > Domains
Add: la-voce.yourcompany.jp
```

### 2. デプロイ検証

```
Settings > Git > Production Branch = main
```

### 3. ロールバック方法

```
Deployments タブから、前のビルドをクリック
> Promote to Production
```

---

**作成日：** 2026年9月12日  
**対応状況：** ✅ GitHub Actions ワークフロー準備完了  
**次のステップ：** 環境変数を GitHub Secrets に設定 → Push でデプロイ開始
