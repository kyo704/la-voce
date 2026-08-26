# La Voce ／ アプリアイコン 実装仕様

新しいアプリアイコン（羊）の設置手順。実装は Claude Sonnet 5 を想定。

---

## 0. 納品物

`lavoce-app-icons.zip` に入っています。**画像は完成しているので、加工しないでください。**

| ファイル | 用途 |
|---|---|
| `icon-1024.png` | マスター。ストア申請・将来の再書き出し用 |
| `icon-512 / 384 / 192 / 96 / 72 / 48.png` | Android・PWA |
| `icon-180 / 167 / 152 / 144 / 120 / 87 / 80 / 76 / 60 / 40.png` | iOS |
| `icon-32.png` | ブラウザタブ |
| **`icon-maskable-512.png`** | **Android アダプティブ用（安全域に縮小済み）** |
| **`icon-maskable-192.png`** | 同上 |
| `favicon.ico` | 旧ブラウザ向け（16/32/48 同梱） |

**通常版と maskable 版は別物です。** 取り違えないこと（§3）。

---

## 1. 触ってはいけないこと

デザイン上の判断が入っているので、以下は変更しないでください。

- ❌ **角を丸めない。** iOS も Android も OS 側が丸めます。丸めた画像を渡すと**角が二重**になります
- ❌ **透過を入れない**（iOS は透過を黒く塗り潰します）。全画像は不透明の正方形です
- ❌ 余白を足さない・トリミングしない
- ❌ 影やグラデーションを追加しない（すでに焼き込み済み）
- ❌ リボンを足さない（60px で埋もれるため、意図的に外しています）

---

## 2. 配置

```
public/
  icons/
    icon-1024.png
    icon-512.png
    icon-384.png
    icon-192.png
    icon-180.png
    icon-167.png
    icon-152.png
    icon-144.png
    icon-120.png
    icon-96.png
    icon-87.png
    icon-80.png
    icon-76.png
    icon-72.png
    icon-60.png
    icon-48.png
    icon-40.png
    icon-32.png
    icon-maskable-512.png
    icon-maskable-192.png
  favicon.ico
```

---

## 3. manifest（PWA）

**`purpose` の指定が要点です。**

```json
{
  "name": "La Voce",
  "short_name": "La Voce",
  "description": "声のプロフェッショナルのための体調管理",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#F6F1E7",
  "background_color": "#F6F1E7",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**`any` と `maskable` を必ず分けてください。**
通常版を `maskable` に指定すると、円形マスクの端末で**羊の耳が切れます。**

**色の指定について**

- `theme_color: #F6F1E7`（クリーム）— アプリのヘッダーと同じ色。
  ワイン（`#7A1F2B`）にすると、クリームのヘッダーの上にワインの帯が乗って段差に見えます
- `background_color: #F6F1E7` — 起動時のスプラッシュ背景。
  クリームの上にワインのアイコンが乗る構図になります

---

## 4. HTML の head

```html
<!-- ブラウザタブ -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/icons/icon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/icons/icon-192.png" type="image/png" sizes="192x192">

<!-- iOS ホーム画面 -->
<link rel="apple-touch-icon" href="/icons/icon-180.png">
<link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png">
<link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167.png">

<!-- PWA -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#F6F1E7">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="La Voce">
```

`apple-mobile-web-app-title` を入れると、**ホーム画面の名前が「La Voce」に固定**されます。
入れないとページタイトル（長い）が使われます。

### Next.js App Router を使っている場合

`app/icon.png` と `app/apple-icon.png` の規約ファイルでも動きますが、
**maskable と多サイズの指定ができないため、上記の明示的な `public/icons/` 方式を推奨します。**
規約ファイルと `<link>` を併用すると重複するので、**どちらか一方に統一**してください。

---

## 5. キャッシュの注意

**アイコンは強くキャッシュされます。** 差し替えたのに変わらない、が普通に起きます。

- manifest 内のパスに `?v=2` を付ける、またはファイル名にハッシュを含める
- `favicon.ico` も同様
- **iOS のホーム画面アイコンは、いったん削除して再追加しないと更新されません。**
  これは仕様なので、テスト時は必ず削除→再追加すること

---

## 6. 確認チェックリスト

実装後、この6項目を通してください。

```
1. Chrome DevTools > Application > Manifest に警告が出ていない
2. Android：ホーム画面に追加 →「円形マスク」の端末で耳が切れていない
3. iOS Safari：共有 > ホーム画面に追加 → 角が二重に丸まっていない
4. iOS：ホーム画面の名前が「La Voce」になっている
5. ブラウザタブに favicon が出ている（32px で羊とわかる）
6. Lighthouse > PWA > Installable が緑
```

**2 と 3 が、いちばん失敗しやすい2つです。** 実機で確認してください。

---

## 7. 補足：デザインの意図（変更提案を防ぐため）

Sonnet が「改善」しようとしないよう、意図を残しておきます。

| 選択 | 理由 |
|---|---|
| 羊の顔 | ホーム画面で**目が合うアイコンは押される。** 波形や音符は他社と見分けがつかない |
| 深いワイン地 | 白いアイコンが並ぶ中で静かに目立つ。彩度の高い色は数日で疲れる |
| リボンなし | 赤いリボンはワイン地に埋もれ、60px で頭上のノイズになる |
| 角丸なし | OS が丸める。§1 参照 |
| 丸のみで構成・やや上向きの視線・頬の赤み・下に落ちる影 | 「触れそう」「生きている」と感じさせるための要素 |

**色や表情を変えたい場合は、坂本さんの指示を待ってください。**
SVGソースがあるので、指示があれば数分で作り直せます。

---

## 注意書き

本書はアイコンの設置手順です。画像は完成品として扱い、コード側で加工しないでください。
差し替え後は §6 のチェックリストを実機で通してください。
