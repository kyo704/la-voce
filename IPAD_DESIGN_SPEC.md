# iPad対応デザイン仕様（design_9.11-5参照）

## 📐 ブレークポイント一覧

| デバイス | 幅 | Tailwind | 対応状況 |
|---|---|---|---|
| iPhone SE / 小型 | 320-375px | - | ✅ sm基準 |
| iPhone 標準 | 390-428px | sm（640px） | ✅ 実装済み |
| iPhone Plus | 440-480px | sm（640px） | ✅ 実装済み |
| **iPad mini** | **768px** | **md（768px）** | ⏳ 確認中 |
| **iPad** | **810px** | **md（768px）** | ⏳ 確認中 |
| **iPad Pro** | **1024px+** | **lg（1024px）** | ⏳ 確認中 |
| Desktop | 1280px+ | xl（1280px） | ✅ 実装済み |

---

## 🎨 design_9.11-5での iPad対応

### PC・iPad版ファイル

```
/Downloads/Woolsong全てのデータ/design_9.11-5/
├── 00-動く見本（さわれる・全画面）.html
├── 00-動く見本-PC・iPad（個人）.html      ← iPad版
└── 00-動く見本-PC・iPad（運営）.html      ← 運営iPad版
```

### iPad版での主要レイアウト変更

#### 1. サイドバー追加（768px以上）

```html
<!-- PC・iPad版の例 -->
<div class="flex gap-4">
  <aside class="w-64 hidden lg:block"><!-- サイドナビ --></aside>
  <main class="flex-1"><!-- メインコンテンツ --></main>
</div>
```

#### 2. グリッド段組変更

```jsx
// 768px以上：2段組
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// 1024px以上：3段組
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

#### 3. タブメニューの配置

```jsx
// 320px: 横スクロール
<div className="flex overflow-x-auto gap-2">

// 768px: 複数行対応
<div className="flex flex-wrap gap-2">

// 1024px: グリッド配置可能
<div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
```

---

## ✅ VocalTracker.jsx iPad対応チェック

### きょう画面

```jsx
// 現在
<div className="space-y-4">
  <div>羊アニメーション</div>
  <div>よてい表</div>
</div>

// iPad対応版
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <div>羊アニメーション（768px以上では左半分）</div>
  <div>よてい表（768px以上では右半分）</div>
</div>
```

### 記録画面

```jsx
// 現在
<div className="space-y-3">
  <input />
  <select />
  <button />
</div>

// iPad対応版
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
  {/* 項目を複数段配置可能 */}
</div>
```

### ふりかえる画面（ReviewPanel.jsx）

```jsx
// 768px以上：グラフを横フル表示
<div className="lg:col-span-2">
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      {/* グラフ */}
    </BarChart>
  </ResponsiveContainer>
</div>

// サイド情報パネル
<div className="lg:col-span-1">
  {/* 統計情報 */}
</div>
```

### ノート画面（NotePanel.jsx）

```jsx
// 768px以上：2段組ノート一覧
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {notes.map(note => (
    <div key={note.id}>{/* ノートカード */}</div>
  ))}
</div>
```

### もっと画面（MorePanel.jsx）

```jsx
// 768px以上：セクションが2段組
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  {sections.map(section => (
    <button key={section.id}>{/* セクション */}</button>
  ))}
</div>
```

---

## 📱 iPad固有のUI対応

### タッチターゲット

- **最小サイズ：** 44×44px（Apple推奨）
- **推奨サイズ：** 48×48px

```jsx
<button className="min-h-[44px] min-w-[44px] px-4 py-2.5">
  ボタン
</button>
```

### ジェスチャー対応

- **ピンチズーム：** meta属性で制御
- **ロングプレス：** 0.5秒以上のタッチ
- **スワイプ：** React Swipe ライブラリ対応

```jsx
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
```

### キーボード対応

iPad Proではキーボードが常に表示される可能性：

```jsx
// テキスト入力時の高さ調整
<input 
  className="w-full py-2.5 text-base" 
  /* iOS自動ズーム防止：font-size≥16px */
/>
```

---

## 🎯 実装チェックリスト

### VocalTracker.jsx更新

- [ ] ブレークポイント追加（md/lg）
- [ ] グリッドレイアウト導入
- [ ] タッチターゲットサイズ確認

### ReviewPanel.jsx iPad対応

- [ ] グラフの高さを動的に
- [ ] タブメニューを複数行対応
- [ ] ボタンサイズ確認（44px最小）

### NotePanel.jsx iPad対応

- [ ] ノート一覧を2段組に
- [ ] テキストエリアの幅最適化
- [ ] 入力フォームのレイアウト

### MorePanel.jsx iPad対応

- [ ] セクション展開時の幅
- [ ] グリッド配置（2段組）
- [ ] ボタン配置最適化

---

## 📊 Vercelでの確認方法

### 1. デプロイ状況確認

```bash
vercel --inspect
# または
https://vercel.com/deployments
```

### 2. iPad Safari での確認

```
URL: https://la-voce.vercel.app/
デバイス: iPad / iPad Pro
向き: 縦・横両対応
```

### 3. DevTools でのレスポンシブ確認

```
Chrome DevTools → Responsive Design Mode
→ iPad / iPad Pro 768px, 1024px で確認
```

---

## 🔗 参考資料

- **design_9.11-5:** `/Downloads/Woolsong全てのデータ/design_9.11-5/00-動く見本-PC・iPad（個人）.html`
- **Tailwind Breakpoints:** https://tailwindcss.com/docs/responsive-design
- **Apple HIG:** https://developer.apple.com/design/human-interface-guidelines/ios

---

**更新日：** 2026年9月12日  
**対応ブレークポイント：** sm / md / lg / xl  
**iPad最小幅：** 768px（Tailwind md）  
**主要デバイス：** iPad mini, iPad, iPad Pro
