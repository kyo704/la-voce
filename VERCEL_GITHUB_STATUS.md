# Vercel × GitHub デプロイ状況（2026-09-12）

## 📊 現在の状態

### ✅ GitHub 側
- コミット: `1c0ee94` にデプロイ
- Actions ワークフロー: **実行中**
  - `Deploy to Vercel #1` → 実行中（8秒経過）
  - `テストとビルド #6` → 実行中

### ⏳ Vercel 側
**確認が必要：**
- Vercel プロジェクト (`la-voce`) が GitHub と連携済みか？
- VERCEL_TOKEN が正しく設定されているか？
- VERCEL_ORG_ID / VERCEL_PROJECT_ID が正しいか？
- Supabase 環境変数が設定されているか？

---

## 🔍 確認方法

### 方法1：GitHub Secrets 確認
```
https://github.com/kyo704/la-voce/settings/secrets/actions
```

以下5つが存在するか確認：
- [ ] VERCEL_TOKEN
- [ ] VERCEL_ORG_ID  
- [ ] VERCEL_PROJECT_ID
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY

### 方法2：Vercel ダッシュボード確認
```
https://vercel.com/dashboard
```

確認項目：
- [ ] `la-voce` プロジェクトが存在するか？
- [ ] GitHub repo と連携されているか？
- [ ] Environment Variables が設定されているか？

### 方法3：ワークフロー実行ログ確認
```
https://github.com/kyo704/la-voce/actions/runs/[RUN_ID]
```

エラーログを確認：
- ログ内に `VERCEL_TOKEN` に関するエラーがないか？
- 環境変数の設定エラーがないか？

---

## 🚨 よくある失敗原因

| エラー | 原因 | 解決策 |
|---|---|---|
| `VERCEL_TOKEN is not set` | GitHub Secrets に VERCEL_TOKEN がない | Settings > Secrets > VERCEL_TOKEN を追加 |
| `Project not found` | VERCEL_PROJECT_ID が違う | Vercel > Settings > Project ID を確認 |
| `Unauthorized` | トークンが期限切れ | Vercel > Settings > Tokens で新規作成 |
| `Build failed` | npm test / npm run build でエラー | ローカルで npm run test を実行 |

---

## ✅ 対処方法（順番に確認）

### Step 1：GitHub Secrets 確認（2分）
```
Settings > Secrets and variables > Actions
```

### Step 2：Vercel プロジェクト確認（3分）
```
https://vercel.com/dashboard > Projects
```

la-voce プロジェクトが存在しない場合：
```
1. Add New > Project
2. Import Git Repository > kyo704/la-voce
3. Deploy
```

### Step 3：Vercel 環境変数設定（5分）
```
Vercel > la-voce > Settings > Environment Variables

追加：
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Step 4：ワークフロー再実行（1分）
```
GitHub Actions > Deploy to Vercel > Re-run jobs
```

---

## 📝 トークン確認チェック

**VERCEL_TOKEN の確認方法：**

1. Vercel にログイン
2. Settings > Tokens > Create
3. Token Name: `GitHub Actions`
4. Scope: `Full Access`
5. コピー → GitHub Secrets の VERCEL_TOKEN に貼り付け

---

**最後に確認：**
このドキュメント内容をもとに、
1. GitHub Secrets 確認
2. Vercel プロジェクト確認
3. 環境変数設定確認
をしてください。

次のコマンドで再度 Actions が実行されます：
```bash
git push origin main
```
