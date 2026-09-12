# Vercel デプロイ修正（2026-09-12）

## ✅ 修正内容

### 問題
GitHub Actions の `Deploy to Vercel` ステップが失敗していた。

### 原因
`.github/workflows/deploy.yml` の設定が不完全だった：
- `VERCEL_TOKEN` が `env` セクションに定義されていない
- デプロイステップが `secrets` を直接参照していた

### 修正内容
```yaml
# 修正前
env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
  # VERCEL_TOKEN なし ❌

# 修正後
env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
  VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}  # ✅ 追加
```

デプロイステップ：
```yaml
# 修正前
with:
  vercel-token: ${{ secrets.VERCEL_TOKEN }}
  vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
  vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

# 修正後
with:
  vercel-token: ${{ env.VERCEL_TOKEN }}       # ✅ env から参照
  vercel-org-id: ${{ env.VERCEL_ORG_ID }}
  vercel-project-id: ${{ env.VERCEL_PROJECT_ID }}
```

### コミット
```
ff03d76 fix: github actions vercel deployment config - add VERCEL_TOKEN to env
```

---

## 🔧 次のステップ

### 必須確認：GitHub Secrets の設定

デプロイを成功させるには、以下5つの GitHub Secrets が必要です：

**URL:**
```
https://github.com/kyo704/la-voce/settings/secrets/actions
```

**必須の環境変数：**
- [ ] `VERCEL_TOKEN` - Vercel API トークン
- [ ] `VERCEL_ORG_ID` - Vercel Organization ID
- [ ] `VERCEL_PROJECT_ID` - Vercel Project ID
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase プロジェクト URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key

**取得方法：**

#### VERCEL_TOKEN
1. https://vercel.com/account/tokens
2. Create Token → Full Access
3. コピー

#### VERCEL_ORG_ID
1. https://vercel.com/account/settings
2. Team ID をコピー

#### VERCEL_PROJECT_ID
1. https://vercel.com/dashboard
2. la-voce > Settings > General
3. Project ID をコピー

#### Supabase情報
1. https://app.supabase.com/
2. Settings > API
3. Project URL / anon public をコピー

---

## ✅ 設定後の動作フロー

1. GitHub Secrets すべて設定 ✅
2. `git push origin main` を実行
3. GitHub Actions が自動トリガー
4. テスト実行 → ビルド実行 → Vercel へデプロイ
5. Vercel ダッシュボードで `green ✓` を確認
6. `https://la-voce.vercel.app/` で本番アクセス確認

---

**実行準備：** GitHub Secrets の5つが設定されるまで、再度のデプロイは失敗します。
