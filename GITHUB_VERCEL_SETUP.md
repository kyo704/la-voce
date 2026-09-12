# GitHub → Vercel 自動デプロイ設定（3ステップ）

## ✅ 現状

- ✅ GitHub リモート設定済み: `https://github.com/kyo704/la-voce.git`
- ✅ GitHub Actions ワークフロー: `.github/workflows/deploy.yml` 作成済み
- ✅ npm test / npm run build: 動作確認済み
- ⏳ Vercel プロジェクト: 要作成
- ⏳ GitHub Secrets: 要設定

---

## 🚀 ステップ1：Vercel でプロジェクト作成（5分）

### 方法A：Web UI（推奨）

1. **Vercel ダッシュボード開く**
   ```
   https://vercel.com/dashboard
   ```

2. **「Add New...」→「Project」をクリック**

3. **GitHub リポジトリ選択**
   ```
   Import Git Repository
   → kyo704/la-voce を選択
   ```

4. **Project settings で以下を確認**
   ```
   Framework Preset: Next.js ✓
   Build Command: npm run build ✓
   Output Directory: .next ✓
   ```

5. **「Deploy」をクリック**
   - プロジェクト ID が表示される
   - ✅ 最初のデプロイ実行

6. **Settings で Project ID / Org ID を確認**
   ```
   Settings > General
   Project ID: xxxxxxxxxx
   Team: your-team-name
   ```

---

## 🔐 ステップ2：GitHub Secrets に環境変数設定（10分）

### GitHub リポジトリ設定

**URL:**
```
https://github.com/kyo704/la-voce/settings/secrets/actions
```

**「New repository secret」を5回クリック**

### 追加する5つの環境変数

#### 1. VERCEL_TOKEN
```
取得場所: Vercel > Settings > Tokens > Create
スコープ: Full Access
保存期間: Unlimited
値: vercel_xxxx...
```

#### 2. VERCEL_ORG_ID
```
取得場所: Vercel > Settings > General > Team ID
値: xxxxxxxxxxxxxxxxxxx
```

#### 3. VERCEL_PROJECT_ID
```
取得場所: Vercel > Project > Settings > General > Project ID
値: xxxxxxxxxxxxxxxxxx
```

#### 4. NEXT_PUBLIC_SUPABASE_URL
```
取得場所: Supabase > Settings > API > Project URL
値: https://xxxx.supabase.co
```

#### 5. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
取得場所: Supabase > Settings > API > anon public
値: eyJhbGc...（長い文字列）
```

---

## 🎯 ステップ3：デプロイ実行（自動）

### トリガー方法

#### 方法1：push で自動実行（推奨）
```bash
cd /Users/sakamotokyou/Desktop/la-voce

git add .
git commit -m "feat: initial deployment setup"
git push origin main

# → GitHub Actions が自動実行
# → Vercel へ本番デプロイ
```

#### 方法2：PR でプレビューデプロイ
```bash
git checkout -b feature/test
git push origin feature/test

# → GitHub > Create Pull Request
# → Preview URL が表示される
```

#### 方法3：手動実行（テスト用）
```
GitHub > Actions > Deploy to Vercel > Run workflow > main ブランチ
```

---

## ✅ 確認方法

### GitHub Actions の実行確認

**URL:**
```
https://github.com/kyo704/la-voce/actions
```

**確認内容：**
```
✅ Workflow が実行されている
✅ test job が PASS
✅ build job が PASS
✅ Deploy to Vercel が PASS
```

### Vercel デプロイの確認

**URL:**
```
https://vercel.com/dashboard/kyo704/la-voce
```

**確認内容：**
```
✅ Deployments に最新の green ✓ がある
✅ Production に deployed と表示
✅ 本番 URL にアクセス可能
```

本番 URL 例：
```
https://la-voce.vercel.app/
```

---

## 🔧 トラブルシューティング

### エラー1：「Deployment failed」

**原因：** npm test または npm run build でエラー

**対処：**
```bash
npm run test
npm run build
# エラー内容を確認し修正
```

### エラー2：「Environment variable not found」

**原因：** GitHub Secrets に環境変数が設定されていない

**対処：**
```
GitHub > Settings > Secrets and variables > Actions
で 5つすべての環境変数が存在するか確認
```

### エラー3：「Cannot connect to Supabase」

**原因：** NEXT_PUBLIC_SUPABASE_URL または NEXT_PUBLIC_SUPABASE_ANON_KEY が正しくない

**対処：**
1. Supabase ダッシュボード > Settings > API で再確認
2. 値をコピー＆ペースト
3. GitHub Secrets を更新
4. 再度 push

---

## 📊 デプロイフロー図

```
git push origin main
    ↓
GitHub Actions トリガー
    ↓
npm ci (依存関係インストール)
    ↓
npm test (テスト実行)
    ↓
npm run build (ビルド)
    ↓
vercel deploy --prod (Vercel へデプロイ)
    ↓
✅ Deployment complete
    ↓
https://la-voce.vercel.app/ で確認
```

---

## 📋 チェックリスト

### セットアップ前
- [x] GitHub リモート設定済み
- [x] GitHub Actions ワークフロー作成済み
- [ ] Vercel プロジェクト作成
- [ ] GitHub Secrets 5つ設定

### セットアップ後
- [ ] git push で Actions 実行確認
- [ ] Vercel Deployments で green ✓ 確認
- [ ] 本番 URL にアクセス確認

---

**更新日：** 2026年9月12日  
**次のステップ：** Versel プロジェクト作成 → GitHub Secrets 設定 → git push
