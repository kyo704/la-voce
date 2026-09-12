# Vercel デプロイ修正（2026-09-12 第2版・根本対応）

## 🔴 実際に起きていた2つの障害

### 障害1：`vercel/action@v5` は存在しない
```
GitHub上に `vercel/action` というActionは存在しない（404）
→ .github/workflows/deploy.yml の全runが「Set up job」の時点で失敗
```

**Vercel公式ドキュメントの結論：**
> Vercelは GitHubリポジトリをインポートするだけで、push毎に自動デプロイする
> 「ビルトインGit連携」を持っている。ほとんどのチームにパイプラインは不要。

→ **`.github/workflows/deploy.yml` を削除**し、Vercelのビルトイン連携を使う方式に変更。

### 障害2：`テストとビルド`（ci.yml）が新規テストで失敗
```
components/tests/email-restrictions.test.js を Jest形式（describe/it/expect）
で書いていた。
このリポジトリの test は Jest ではなく、素の Node.js で
components/tests/*.test.js を1本ずつ実行する自作の仕組み
→ describe is not defined でクラッシュ
```

さらに、参照先の `lib/emailRestrictions.js` / `lib/emailAuthGuard.js` を
`module.exports`（CommonJS）で書いていたが、このリポジトリの lib/ は
すべて `export function`（ESM）形式。テストは動的importでソースを読むため、
ESM以外は動かない。

**修正：**
- `lib/emailRestrictions.js` を ESM に書き直し
- `lib/emailAuthGuard.js` も ESM に書き直し
- `email-restrictions.test.js` を、他のテストと同じ自作アサーション形式に書き直し

---

## ✅ 修正後の確認結果（ローカル）

```
node components/tests/email-restrictions.test.js → 20件 通過 / 0件 不合格
npm test（全291+テスト）→ 失敗0件
npm run build → 正常終了（既存の警告のみ、新規エラーなし）
```

---

## 🚀 Vercel デプロイの正しい手順（GitHub Actions不要）

### ステップ1：Vercelにプロジェクトをインポート
```
1. https://vercel.com/new
2. Import Git Repository → kyo704/la-voce を選択
3. Framework Preset: Next.js（自動検出）
4. Environment Variables に設定：
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
5. Deploy をクリック
```

以後は push するたびに Vercel が自動でビルド・デプロイします。
GitHub Actions は不要（既存の ci.yml・backup.yml はテスト・控え用として残す）。

### ステップ2：以後の運用
```bash
git push origin main
# → Vercel が自動検知して本番デプロイ
```

---

## 📋 今回の変更ファイル

| ファイル | 変更内容 |
|---|---|
| `.github/workflows/deploy.yml` | 削除（存在しないActionを参照していたため） |
| `lib/emailRestrictions.js` | CommonJS → ESM に書き直し |
| `lib/emailAuthGuard.js` | CommonJS → ESM に書き直し |
| `components/tests/email-restrictions.test.js` | 自作アサーション形式に書き直し |

---

**更新日：** 2026年9月12日  
**状態：** ローカルでテスト・ビルド確認済み。Vercelインポート待ち。
