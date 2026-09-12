# 全画面実装計画（design_9.11-5参照）

## 実装順序

### Phase 1: 基本構造
1. **TopBar.jsx** - 上部バー（赤背景・白文字）
2. **SideNav.jsx** - 左サイドナビ
3. **WallBar.jsx** - 健康線

### Phase 2: コンテンツ画面
4. **HomeScreen.jsx** - きょう画面
5. **RecordScreen.jsx** - 記録画面

### Phase 3: パネル統合
6. **ReviewPanel.jsx統合** - ふりかえる（作成済み）
7. **NotePanel.jsx統合** - ノート（作成済み）

### Phase 4: 対応
8. **iPad対応** - @media クエリ追加
9. **Vercel デプロイ** - GitHub Actions 実行

## レイアウト構成（design_9.11-5）

```
PC版 (1400×880px)
┌─────────────────────────────────┐
│ Top Bar (52px)                  │
├────────┬─────────────────────────┤
│ Side   │ Body                    │
│ Nav    │ Content Area            │
│(190px) │                         │
└────────┴─────────────────────────┘

iPad横版 (1180×830px)
iPad縦版 (830×1120px)
```

## 新規コンポーネント

すでに作成済み：
- ✅ ReviewPanel.jsx
- ✅ NotePanel.jsx  
- ✅ MorePanel.jsx
- ✅ ResponsiveLayoutCheck.jsx

今から作成：
- TopBar.jsx
- SideNav.jsx
- WallBar.jsx
- HomeScreen.jsx（既存から抽出）
- RecordScreen.jsx（既存から抽出）

## Vercelデプロイ

### セットアップ必要な項目
1. GitHub: リポジトリ公開
2. Vercel: プロジェクト作成
3. GitHub Secrets: 環境変数設定
   - VERCEL_TOKEN
   - VERCEL_ORG_ID
   - VERCEL_PROJECT_ID
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

### デプロイフロー
- `.github/workflows/deploy.yml` 作成済み
- main ブランチへの push で自動デプロイ
- PR でプレビューデプロイ

**詳細:** VERCEL_SETUP.md 参照

---

**作成日：** 2026年9月12日  
**参照：** design_9.11-5 PC・iPad個人版
