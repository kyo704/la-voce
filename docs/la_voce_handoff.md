# La Voce 開発 引き継ぎ資料

これは、前のチャットで進めていた「La Voce」というアプリ開発の続きを、新しいチャットでスムーズに再開するための要約です。この内容をチャットの最初に貼り付けてください。

## プロジェクト概要

- **アプリ名**: La Voce(声のプロフェッショナルのための体調管理アプリ)
- **対象**: 声楽家・アナウンサー・声優・ポップス/ミュージカル歌手
- **技術構成**: Next.js(App Router)+ Supabase(DB・認証)+ Vercel(ホスティング)
- **リポジトリ**: GitHub `kyo704/la-voce`、デプロイ先は `la-voce.vercel.app`
- **開発フロー**: Claudeがファイルを生成 → ユーザーがGitHub上で該当ファイルを完全に貼り替え → Vercelが自動デプロイ

## 主なファイル構成

```
app/
  page.js                    ← ランディングページ（8言語対応）
  layout.js                  ← 全ページ共通の土台（タイトル・フォント設定）
  login/page.js, signup/page.js  ← ログイン・登録（8言語対応）
  dashboard/page.js, dashboard/layout.js  ← ダッシュボードの入口（認証チェック）
  vocal-theory/page.js       ← 声楽家向け発声理論（8言語、9項目の身体力学セクション含む）
  announcer-theory/page.js   ← アナウンサー向け専用ページ（8言語）
  voice-actor-theory/page.js ← 声優向け専用ページ（8言語）
  performer-theory/page.js   ← ポップス/ミュージカル歌手向け専用ページ（8言語）
components/
  VocalTracker.jsx           ← ダッシュボード本体（最大のファイル、3200行超）
  CharacterHome.jsx          ← 羊のキャラクター育成機能
  HealthInfo.jsx             ← 健康情報ページ
lib/
  translations.js            ← 全アプリ共通の翻訳データ（531キー×8言語）
  foodPresets.js             ← 食品データベース（1852品、原語検索対応）
  tokens.js                  ← 配色などのデザイントークン
```

## これまでに実装した主な機能

1. **基本の体調記録**: 喉の状態・声の質・睡眠・食事・水分・運動・メンタルなど
2. **羊のキャラクター育成**: 記録を続けるとポイントが貯まり、羊の見た目をカスタマイズできる
3. **食品データベース**: 1852品、料理ジャンル検索（パスタ・和食・イタリアンなど）、原語検索（中国語簡体字・イタリア語など）に対応
4. **職業別の切り替え**: プロフィールで「声楽家/アナウンサー/声優/ポップス・ミュージカル歌手」を選ぶと、右上の「発声理論」タブのリンク先が専用ページに切り替わる
5. **職業別の負荷記録**(今日の記録タブ、現在UIカードは一旦非表示中。データ計算・保存自体は生きている):
   - 声楽家: 音域・強弱・パッサッジョを跨いだ回数
   - アナウンサー: オンエア時間・生放送か収録か
   - 声優: セッション長・演じたキャラ数・特殊発声の有無
   - ポップス/ミュージカル歌手: 会場音量・モニター音量・連続公演日数
6. **メンタル記録の拡張**: 「心の余裕」の値(1〜5)に応じて、表示されるタグが3段階(緊張寄り10種／ふつう7種／落ち着き寄り8種、計25種)で自動的に切り替わる。自由記述欄も併用可能
7. **分析タブ**:
   - 期間指定分析（週/月/年/全期間/カスタム）
   - 声の状態の予測（前日の記録から理論的な予測を表示）
   - こころの落ち着き度の推移グラフ＋低調だった日の振り返り
   - **声の調子スコア**（過去2週間の平均、100点満点、喉25%・声質20%・睡眠20%・メンタル15%・症状の少なさ10%・水分10%の重み付け合成指標）
8. **多言語対応**: 主要ページはほぼ全て8言語（日本語・英語・中国語・イタリア語・ドイツ語・フランス語・スペイン語・韓国語）対応済み

## データベース（Supabase）で実行が必要なSQL

以下のSQLは、まだ実行していない場合は必ず実行してください（何度実行しても安全な作りです）。

```sql
-- profiles テーブル
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS garden_theme text DEFAULT 'rose';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vocal_range_low text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vocal_range_high text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS technical_goal text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS health_notes text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS character_points_spent integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS character_equipped jsonb DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height_cm numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_type text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nutrition_phase text DEFAULT '維持';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS protein_coefficient numeric DEFAULT 1.6;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vocal_profession text DEFAULT 'singer';

-- entries テーブル
ALTER TABLE entries ADD COLUMN IF NOT EXISTS mental_tags text[] DEFAULT '{}';
ALTER TABLE entries ADD COLUMN IF NOT EXISTS load_detail jsonb DEFAULT '{}'::jsonb;
```

## 今回の会話で得た、非常に重要な教訓

新しいチャットでも同じ問題が起きうるので、必ず共有してください。

1. **列が足りないと、保存や読み込みが「静かに失敗」する**: 新しい列を追加する提案をした時は、**必ず対応するSQLを一緒に提示し、コード反映前に実行してもらう**こと。これを怠ると「保存に失敗する」「羊の装備が消える」等、原因不明に見える不具合を引き起こす。
2. **ファイルの貼り替えが不完全だと、原因不明のエラーになる**: 大きなファイル(`VocalTracker.jsx`など)を貼り替える時は、「中身を全部消して一度保存 → もう一度開いて貼り付けて保存」という2段階を徹底してもらう。
3. **Vercelのデプロイが、正しいコミットを反映しないことがある**: 何度貼り替えても直らない場合、Vercelの「Deployments」で最新デプロイが正しいコミットハッシュを指しているか確認し、必要なら「Redeploy」（Build Cacheのチェックを外す）や「Promote to Production」を試す。
4. **確実な確認方法は「Sourcesタブでのユニークな文字列検索」**: ブラウザの開発者ツール→Sourcesタブ→全ファイル検索（Cmd+Option+F）で、そのファイルにしか無い特徴的な文字列を検索すると、「反映されているか」を確実に判定できる。
5. **サーバーとブラウザのタイムゾーンの違いが、ハイドレーションエラー（React error #418など）を引き起こすことがある**: `new Date()`を`useState`の初期値に直接使うと、日本時間の深夜0時〜朝9時ごろにサーバー（UTC）とズレて画面がクラッシュする。`todayISOUTC()`という、UTC基準で計算する専用関数を用意し、初期値はこちらを使い、マウント後の`useEffect`で現地時間の正しい値に補正する、という対策を導入済み。
6. **`useMemo`の宣言順序に注意**: ある`useMemo`が、別の`useMemo`の結果を使う場合、依存配列だけでなく定義の「順序」も、使う側が後に来るようにする必要がある（先に書くと "Cannot access before initialization" エラーになる）。

## 保留中・未着手の項目

1. 既存の食品データベース(約1852品中、約1300品程度)にまだ多言語名(i18n)が付いていない
2. 声楽家向けの倍音測定機能（ブラウザでのリアルタイム音声解析、Web Audio API等を使う大掛かりな機能。まだ未着手）
3. 経費・サブスク価格設定の相談（Vercel/Supabase/Anthropic APIの費用試算は一度行ったが、具体的な価格決定はまだ）
4. 「今日の負荷」機能のUIカードは、トラブルシューティングの過程で一旦非表示にしたまま（データ計算自体は生きている）。必要なら再度表示するUIを追加できる

## 引き継いでほしいこと

上記を踏まえて、続きの作業をお願いします。具体的に何から始めるかは、この資料を渡した直後に教えてください。
