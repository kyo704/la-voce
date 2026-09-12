# 接続状況確認（2026年9月12日）

## ✅ GitHub 接続

```
リモート URL: https://github.com/kyo704/la-voce.git
状態: ✅ 接続済み
確認コマンド: git remote -v
出力: origin  https://github.com/kyo704/la-voce.git (fetch)
     origin  https://github.com/kyo704/la-voce.git (push)
```

---

## ⏳ Vercel 接続

### 現在の状態
- **Vercel CLI:** インストールなし（bash: vercel: command not found）
- **プロジェクト作成:** 未確認
- **環境変数:** 未設定

### 確認方法
```
1. Vercelダッシュボード → https://vercel.com/dashboard
2. Projects を確認
3. la-voce プロジェクトが存在するか？
   - YES → プロジェクト ID を確認
   - NO → 新規作成が必要
```

### 必要な情報
```
Vercelダッシュボードから取得：
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID
- VERCEL_TOKEN
```

---

## ⏳ Supabase 接続

### 現在の状態
- **.env.backup.local:** Supabase URL存在
- **.env.local:** なし
- **.env.e2e:** あり

### Supabaseプロジェクト情報
```
From .env.backup.local:
- Project ID: xxjtplvpcneksrofkjmf
- Region: ap-northeast-1
- Host: aws-0-ap-northeast-1.pooler.supabase.com
```

### 必要な情報
```
Supabaseダッシュボード → Settings > API から取得：
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 🔧 セットアップステップ

### Step 1: Vercelプロジェクト確認

**Vercelダッシュボード:**
```
1. https://vercel.com/dashboard にアクセス
2. Projects を確認
3. la-voce が存在するか？
```

**Vercel CLI でも確認可能:**
```bash
npm install -g vercel
vercel login
vercel ls
```

### Step 2: GitHub Actions secrets 設定

**GitHub リポジトリ:**
```
Settings > Secrets and variables > Actions
```

**追加する環境変数：**
```
VERCEL_TOKEN          ← Vercelダッシュボード > Settings > Tokens
VERCEL_ORG_ID         ← Vercel プロジェクト > Settings
VERCEL_PROJECT_ID     ← Vercel プロジェクト > Settings
```

### Step 3: Supabase 認証情報

**Supabaseダッシュボード:**
```
Project > Settings > API > Project URL
Project > Settings > API > anon public key
```

**GitHub Actions secrets に追加:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Step 4: デプロイ実行

```bash
git push origin main
# → GitHub Actions が自動実行
# → .github/workflows/deploy.yml が実行
# → Vercel へデプロイ
```

---

## ✅ 接続確認チェックリスト

### GitHub
- [x] リモート設定済み
- [ ] Secrets 設定済み
- [ ] Actions ワークフロー実行

### Vercel
- [ ] プロジェクト存在確認
- [ ] VERCEL_ORG_ID 取得
- [ ] VERCEL_PROJECT_ID 取得
- [ ] VERCEL_TOKEN 取得
- [ ] GitHub連携確認

### Supabase
- [ ] プロジェクト URL 確認
- [ ] Anon Key 確認
- [ ] 環境変数設定

---

## 📊 3者の関係図

```
┌──────────────┐
│   GitHub     │
│   kyo704/    │
│   la-voce    │
└──────┬───────┘
       │ push (main)
       ↓
┌──────────────────────────────────┐
│   GitHub Actions                 │
│   .github/workflows/deploy.yml   │
│   - npm test                     │
│   - npm run build                │
│   - deploy to Vercel             │
└──────┬──────────────────────────┘
       │ deploys
       ↓
┌──────────────┐        ┌──────────────┐
│   Vercel     │ ←──────│  Supabase    │
│   Hosting    │ uses   │  Database    │
│   API Routes │        │  Auth        │
└──────────────┘        └──────────────┘
```

---

## 🎯 次のアクション

### 緊急（今すぐ）
1. [ ] Vercelダッシュボード確認
2. [ ] VERCEL_ORG_ID / VERCEL_PROJECT_ID 取得
3. [ ] Supabase URL / Anon Key 確認

### 本番前（本日中）
4. [ ] GitHub Secrets にすべて設定
5. [ ] `git push origin main` で自動デプロイ実行
6. [ ] Vercel Deployments で green ✓ 確認

### 実機テスト（明日）
7. [ ] https://la-voce.vercel.app/ にアクセス
8. [ ] ログイン・記録機能動作確認

---

**更新日：** 2026年9月12日  
**次確認：** Vercel ダッシュボード アクセス後
